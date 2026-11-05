// Backup and recovery for Administrators. Mounted at /api/backups.
//
//   GET  /api/backups                  the backups (newest first) and the schedule
//   POST /api/backups                  make a backup now
//   POST /api/backups/:id/verify       open it and check it is intact
//   POST /api/backups/:id/restore      replace the data with it (password + phrase)
//   POST /api/backups/download/:id     the encrypted file itself (password), so
//                                      it can be saved outside the server
//   POST /api/backups/import           a downloaded .sfbak file back into
//                                      SmartFine (multipart, password). With
//                                      restore=true it is stored and restored
//                                      in one go (safety backup first, everyone
//                                      signed out); without it, only stored.
//   DELETE /api/backups/:id            remove a backup from the server for good
//                                      (password + typed phrase)
//
// Backups are encrypted files in server/backups (see database/backup.js).
// They are only described, except through the password-protected download,
// which sends the encrypted .sfbak (useless without the server's backup key).
const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");

const db = require("../database/database");
const backups = require("../database/backup");
const { logActivity } = require("../database/activity-log");
const { requireActive } = require("../middleware/access");
const passwordTries = require("../security/password-tries");
const { rateLimit } = require("../security/rate-limit");
const sessions = require("../security/sessions");

const router = express.Router();

const CONFIRM_PHRASE = "RESTORE SMARTFINE";
const DELETE_PHRASE = "DELETE BACKUP";

router.use(requireActive("ADMIN"));

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

const manualLimit = rateLimit({ max: 10, windowMs: 10 * 60 * 1000, name: "manual backups" });
const restoreLimit = rateLimit({ max: 10, windowMs: 10 * 60 * 1000, name: "restoring backups" });
const downloadLimit = rateLimit({ max: 10, windowMs: 10 * 60 * 1000, name: "backup downloads" });
const importLimit = rateLimit({ max: 10, windowMs: 10 * 60 * 1000, name: "backup imports" });
const deleteLimit = rateLimit({ max: 20, windowMs: 10 * 60 * 1000, name: "deleting backups" });

// The uploaded file is held in memory (a backup is a few MB; 100 MB at most).
// Only an active Administrator reaches this far (router.use above).
const uploadBackupFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: backups.MAX_IMPORT_BYTES, files: 1, fields: 2, fieldSize: 1024 },
}).single("file");

function sendError(res, error, fallback) {
  if (error instanceof backups.BackupError) {
    return res
      .status(error.status)
      .json({ success: false, code: error.code, message: error.message, ...(error.extra || {}) });
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
      deletePhrase: DELETE_PHRASE,
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

// Brings a downloaded backup file back. The current password is needed, like
// a download or a restore. The file is opened with the server's key and checked
// first, then stored as a new "Imported" backup. With restore=true the data is
// restored from it straight away, with the usual safety backup first and
// everyone signed out afterwards (the app asks "Replace the current data?" and
// for the password before it sends this). A file that is already in the list is
// restored from the copy that is there.
router.post("/import", importLimit, (req, res) => {
  uploadBackupFile(req, res, async (uploadError) => {
    const adminId = req.account.id;

    try {
      if (uploadError) {
        return res.status(uploadError.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
          success: false,
          code: uploadError.code === "LIMIT_FILE_SIZE" ? "FILE_TOO_LARGE" : "INVALID_UPLOAD",
          message:
            uploadError.code === "LIMIT_FILE_SIZE"
              ? "That file is too large to be a SmartFine backup (the limit is 100 MB)."
              : "Please attach one backup file.",
        });
      }

      const { currentPassword } = req.body || {};

      if (typeof currentPassword !== "string" || currentPassword === "") {
        return res.status(400).json({
          success: false,
          code: "PASSWORD_REQUIRED",
          message: "Enter your current password to import a backup.",
        });
      }

      if (passwordTries.blocked(adminId)) {
        logActivity({
          actorId: adminId,
          action: "BACKUP_IMPORT_FAILED",
          result: "DENIED",
          description: "Backup import refused: too many wrong passwords in a row.",
          onceEvery: { key: String(adminId), seconds: 60 },
        });

        return res.status(429).json(passwordTries.TOO_MANY);
      }

      const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(adminId);

      if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
        passwordTries.fail(adminId);

        logActivity({
          actorId: adminId,
          action: "BACKUP_IMPORT_FAILED",
          result: "FAILED",
          description: "Backup import refused: the current password was wrong.",
        });

        return res.status(401).json({
          success: false,
          code: "CURRENT_PASSWORD_INCORRECT",
          message: "Current password is incorrect. Nothing was imported.",
        });
      }

      passwordTries.clear(adminId);

      const restore = String(req.body?.restore || "").toLowerCase() === "true";

      const meta = backups.importBackup({
        buffer: req.file?.buffer,
        fileName: req.file?.originalname,
        adminId,
        reuseExisting: restore,
      });

      if (!restore) {
        return res.status(201).json({
          success: true,
          message: "Backup imported. It is in the list now; nothing was restored.",
          backup: backups.publicMeta(meta),
        });
      }

      const result = backups.restoreBackup({
        id: meta.id,
        adminId,
        endSessions: () => sessions.endEverySession("RESTORE"),
      });

      return res.json({
        success: true,
        message: "The data was restored from the backup. Everyone, including you, must sign in again.",
        signedOut: true,
        alreadyListed: Boolean(meta.alreadyListed),
        ...result,
      });
    } catch (error) {
      return sendError(res, error, "The backup file could not be imported. Nothing was changed.");
    }
  });
});

// Removes a backup from the server for good. Like a restore, it needs the
// current password and a typed phrase, so it cannot happen by accident or from
// a stolen, unattended session alone. A downloaded copy is not affected.
router.delete("/:id", deleteLimit, async (req, res) => {
  const adminId = req.account.id;

  try {
    const id = String(req.params.id);

    if (!backups.idPattern(id)) {
      return res.status(400).json({ success: false, code: "INVALID_BACKUP", message: "That is not a valid backup." });
    }

    const { currentPassword, confirmation } = req.body || {};

    if (String(confirmation || "").trim().toUpperCase() !== DELETE_PHRASE) {
      return res.status(400).json({
        success: false,
        code: "CONFIRMATION_MISMATCH",
        message: `Type ${DELETE_PHRASE} exactly to confirm.`,
      });
    }

    if (typeof currentPassword !== "string" || currentPassword === "") {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_REQUIRED",
        message: "Enter your current password to delete the backup.",
      });
    }

    if (passwordTries.blocked(adminId)) {
      logActivity({
        actorId: adminId,
        action: "BACKUP_DELETE_FAILED",
        result: "DENIED",
        description: "Backup delete refused: too many wrong passwords in a row.",
        onceEvery: { key: String(adminId), seconds: 60 },
      });

      return res.status(429).json(passwordTries.TOO_MANY);
    }

    const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(adminId);

    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      passwordTries.fail(adminId);

      logActivity({
        actorId: adminId,
        action: "BACKUP_DELETE_FAILED",
        result: "FAILED",
        description: "Backup delete refused: the current password was wrong.",
      });

      return res.status(401).json({
        success: false,
        code: "CURRENT_PASSWORD_INCORRECT",
        message: "Current password is incorrect. Nothing was deleted.",
      });
    }

    passwordTries.clear(adminId);

    const deleted = backups.deleteBackup({ id, adminId });

    return res.json({
      success: true,
      message: "The backup was deleted from the server.",
      backup: deleted,
    });
  } catch (error) {
    return sendError(res, error, "The backup could not be deleted.");
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
