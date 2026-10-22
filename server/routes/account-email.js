// Changing your own email address. Mounted at /api/account/email.
//
// The new address is only saved after its owner types the code sent to it.
//   POST /request  { newEmail, currentPassword }   -> code emailed to newEmail
//   POST /resend   { challengeId }
//   POST /verify   { challengeId, code }           -> email saved
const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../database/database");
const otp = require("../security/otp");
const { logActivity } = require("../database/activity-log");
const { requireActive } = require("../middleware/access");

const router = express.Router();

const PURPOSE = "EMAIL_CHANGE";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Wrong current passwords: 5 in 15 minutes, then a pause. Kept in memory.
const PASSWORD_TRIES = 5;
const PASSWORD_WINDOW_MS = 15 * 60 * 1000;
const passwordFailures = new Map();

function recentFailures(userId) {
  const now = Date.now();
  const list = (passwordFailures.get(userId) || []).filter((time) => now - time < PASSWORD_WINDOW_MS);

  passwordFailures.set(userId, list);

  return list;
}

router.use(requireActive("ADMIN", "FINES_OFFICER", "STUDENT"));

function account(userId) {
  return db
    .prepare(
      `SELECT id, username, first_name, middle_name, last_name, email, password_hash
       FROM users WHERE id = ?`,
    )
    .get(userId);
}

function nameOf(user) {
  return (
    [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ") ||
    user.username
  );
}

function emailTaken(email, exceptUserId) {
  return db
    .prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?")
    .get(email, exceptUserId);
}

router.post("/request", async (req, res) => {
  try {
    const user = account(req.account.id);
    const newEmail = String(req.body?.newEmail || "").trim().toLowerCase();
    const currentPassword = req.body?.currentPassword;

    if (typeof currentPassword !== "string" || !currentPassword) {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_REQUIRED",
        message: "Please enter your current password.",
      });
    }

    if (!newEmail || newEmail.length > 254 || !EMAIL_PATTERN.test(newEmail)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_EMAIL",
        message: "Please enter a valid email address.",
      });
    }

    if (newEmail === String(user.email || "").toLowerCase()) {
      return res.status(400).json({
        success: false,
        code: "SAME_EMAIL",
        message: "That is already your email address.",
      });
    }

    if (recentFailures(user.id).length >= PASSWORD_TRIES) {
      return res.status(429).json({
        success: false,
        code: "TOO_MANY_PASSWORD_TRIES",
        message: "Too many incorrect passwords. Please try again in a few minutes.",
      });
    }

    if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
      passwordFailures.get(user.id).push(Date.now());

      return res.status(401).json({
        success: false,
        code: "INVALID_PASSWORD",
        message: "Your current password is not correct.",
      });
    }

    if (emailTaken(newEmail, user.id)) {
      return res.status(409).json({
        success: false,
        code: "EMAIL_EXISTS",
        message: "That email address is already being used by another account.",
      });
    }

    const challenge = await otp.issue({
      userId: user.id,
      purpose: PURPOSE,
      targetEmail: newEmail,
      name: nameOf(user),
    });

    return res.json({
      success: true,
      message: `We sent a code to ${challenge.maskedEmail}. Enter it to confirm your new email.`,
      ...challenge,
    });
  } catch (error) {
    return fail(res, error, "Could not start the email change.");
  }
});

router.post("/resend", async (req, res) => {
  try {
    const user = account(req.account.id);

    const next = await otp.resend({
      challengeId: req.body?.challengeId,
      purpose: PURPOSE,
      userId: user.id,
      name: nameOf(user),
    });

    return res.json({ success: true, message: "A new code was sent.", ...next });
  } catch (error) {
    return fail(res, error, "Could not send a new code.");
  }
});

router.post("/verify", (req, res) => {
  try {
    const user = account(req.account.id);

    const challenge = otp.checkCode({
      challengeId: req.body?.challengeId,
      code: req.body?.code,
      purpose: PURPOSE,
      userId: user.id,
    });

    db.exec("BEGIN IMMEDIATE");

    try {
      // Someone may have taken the address while the code was in the mail.
      if (emailTaken(challenge.target_email, user.id)) {
        throw new otp.OtpError(
          409,
          "EMAIL_EXISTS",
          "That email address is now used by another account. Please choose another.",
        );
      }

      if (!otp.markUsed(challenge.id)) {
        throw new otp.OtpError(
          400,
          "INVALID_CHALLENGE",
          "This verification request is no longer valid. Please start again.",
        );
      }

      db.prepare(
        "UPDATE users SET email = ?, is_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      ).run(challenge.target_email, user.id);

      logActivity({
        actorId: user.id,
        action: "ACCOUNT_EMAIL_CHANGED",
        entityType: "USER",
        entityId: user.id,
        description: `${nameOf(user)} changed their email from ${user.email || "(none)"} to ${challenge.target_email} after verifying it.`,
      });

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return res.json({
      success: true,
      message: "Your email address was changed.",
      email: challenge.target_email,
    });
  } catch (error) {
    return fail(res, error, "Could not change the email address.");
  }
});

function fail(res, error, fallback) {
  if (error instanceof otp.OtpError) {
    return otp.sendOtpError(res, error);
  }

  console.error("Email change error:", error);

  return res.status(500).json({ success: false, message: fallback });
}

module.exports = router;
