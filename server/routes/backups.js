// Backup and recovery for Administrators. Mounted at /api/backups.
//
//   GET  /api/backups                  the backups (newest first) and the schedule
//   POST /api/backups                  make a backup now
//   POST /api/backups/:id/verify       open it and check it is intact
//   POST /api/backups/:id/restore      replace the data with it (password + phrase)
//   POST /api/backups/download/:id     the encrypted file itself (password), so
//                                      it can be saved outside the server
//
// Backups are encrypted files in server/backups (see database/backup.js).
// They are only described, except through the password-protected download,
// which sends the encrypted .sfbak (useless without the server's backup key).
const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../database/database");
const backups = require("../database/backup");
const { logActivity } = require("../database/activity-log");
const { requireActive } = require("../middleware/access");
const passwordTries = require("../security/password-tries");
const { rateLimit } = require("../security/rate-limit");
const sessions = require("../security/sessions");

const router = express.Router();

const CONFIRM_PHRASE = "RESTORE SMARTFINE";

router.use(requireActive("ADMIN"));

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

const manualLimit = rateLimit({ max: 10, windowMs: 10 * 60 * 1000, name: "manual backups" });
const restoreLimit = rateLimit({ max: 10, windowMs: 10 * 60 * 1000, name: "restoring backups" });
const downloadLimit = rateLimit({ max: 10, windowMs: 10 * 60 * 1000, name: "backup downloads" });

function sendError(res, error, fallback) {
  if (error instanceof backups.BackupError) {
    return res.status(error.status).json({ success: false, code: error.code, message: error.message });
  }

  console.error(fallback, error);

  return res.status(500).json({ success: false, message: fallback });
}

router.get("/", (req, res) => {
  try {
    return res.json({
      success: true,
      backups: backups.listBackups().map(backups.publicMeta),
      schedule: backups.scheduleInfo(),
      confirmPhrase: CONFIRM_PHRASE,
    });
  } catch (error) {
    return sendError(res, error, "Could not load the backups.");
  }
});

router.post("/", manualLimit, (req, res) => {
  try {
    const meta = backups.createBackup({ type: "MANUAL", adminId: req.account.id });

    return res.status(201).json({
      success: true,
      message: "Backup saved.",
      backup: backups.publicMeta(meta),
    });
  } catch (error) {
    return sendError(res, error, "Could not save the backup.");
  }
});

router.post("/:id/verify", (req, res) => {
  try {
    const outcome = backups.verifyBackup(String(req.params.id), req.account.id);

    return res.json({
      success: true,
      verified: outcome.ok,
      message: outcome.ok ? "The backup opens and is intact." : outcome.message,
    });
  } catch (error) {
    return sendError(res, error, "Could not check the backup.");
  }
});

// The encrypted backup file, for saving a copy on the administrator's own
// computer or phone. The current password is needed, like a restore.
router.post("/download/:id", downloadLimit, async (req, res) => {
  const adminId = req.account.id;

  try {
    const id = String(req.params.id);

    if (!backups.idPattern(id)) {
      return res.status(400).json({ success: false, code: "INVALID_BACKUP", message: "That is not a valid backup." });
    }

    const { currentPassword } = req.body || {};

    if (typeof currentPassword !== "string" || currentPassword === "") {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_REQUIRED",
        message: "Enter your current password to download the backup.",
      });
    }

    if (passwordTries.blocked(adminId)) {
      logActivity({
        actorId: adminId,
        action: "BACKUP_DOWNLOAD_FAILED",
        result: "DENIED",
        description: "Backup download refused: too many wrong passwords in a row.",
        onceEvery: { key: String(adminId), seconds: 60 },
      });

      return res.status(429).json(passwordTries.TOO_MANY);
    }

    const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(adminId);

    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      passwordTries.fail(adminId);

      logActivity({
        actorId: adminId,
        action: "BACKUP_DOWNLOAD_FAILED",
        result: "FAILED",
        description: "Backup download refused: the current password was wrong.",
      });

      return res.status(401).json({
        success: false,
        code: "CURRENT_PASSWORD_INCORRECT",
        message: "Current password is incorrect. Nothing was downloaded.",
      });
    }

    passwordTries.clear(adminId);

    const info = backups.downloadInfo(id);

    logActivity({
      actorId: adminId,
      action: "BACKUP_DOWNLOADED",
      entityType: "BACKUP",
      description: `Downloaded the encrypted backup made ${info.meta.createdAt} (${info.meta.type.toLowerCase().replace("_", " ")}, ${Math.max(1, Math.round(info.sizeBytes / 1024))} KB).`,
      details: { backupId: id, type: info.meta.type, sizeBytes: info.sizeBytes },
    });

    res.set("Content-Type", "application/octet-stream");

    return res.download(info.file, info.name, (error) => {
      if (error && !res.headersSent) {
        res.status(500).json({ success: false, message: "The backup could not be sent." });
      }
    });
  } catch (error) {
    return sendError(res, error, "The backup could not be downloaded.");
  }
});

router.post("/:id/restore", restoreLimit, async (req, res) => {
  const adminId = req.account.id;

  try {
    const id = String(req.params.id);

    if (!backups.idPattern(id)) {
      return res.status(400).json({ success: false, code: "INVALID_BACKUP", message: "That is not a valid backup." });
    }

    const { currentPassword, confirmation } = req.body || {};

    if (String(confirmation || "").trim().toUpperCase() !== CONFIRM_PHRASE) {
      return res.status(400).json({
        success: false,
        code: "CONFIRMATION_MISMATCH",
        message: `Type ${CONFIRM_PHRASE} exactly to confirm the restore.`,
      });
    }

    if (typeof currentPassword !== "string" || currentPassword === "") {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_REQUIRED",
        message: "Enter your current password to confirm the restore.",
      });
    }

    if (passwordTries.blocked(adminId)) {
      logActivity({
        actorId: adminId,
        action: "BACKUP_RESTORE_FAILED",
        result: "DENIED",
        description: "Restore refused: too many wrong passwords in a row.",
        onceEvery: { key: String(adminId), seconds: 60 },
      });

      return res.status(429).json(passwordTries.TOO_MANY);
    }

    const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(adminId);

    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      passwordTries.fail(adminId);

      logActivity({
        actorId: adminId,
        action: "BACKUP_RESTORE_FAILED",
        result: "FAILED",
        description: "Restore refused: the current password was wrong.",
      });

      return res.status(401).json({
        success: false,
        code: "CURRENT_PASSWORD_INCORRECT",
        message: "Current password is incorrect. Nothing was changed.",
      });
    }

    passwordTries.clear(adminId);

    const result = backups.restoreBackup({
      id,
      adminId,
      endSessions: () => sessions.endEverySession("RESTORE"),
    });

    return res.json({
      success: true,
      message: "The data was restored from the backup. Everyone, including you, must sign in again.",
      signedOut: true,
      ...result,
    });
  } catch (error) {
    return sendError(res, error, "The backup could not be restored. Nothing was changed.");
  }
});

module.exports = router;
