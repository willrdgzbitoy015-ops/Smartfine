// First sign-in of a new account. Mounted at /api/auth/first-login.
//
// The sign-in itself answers "requiresVerification" with a request ID and
// emails a code. Then:
//   POST /verify    { challengeId, code }                  -> { stepToken }
//   POST /resend    { challengeId }                        -> a new code
//   POST /complete  { challengeId, stepToken, newPassword, confirmPassword }
//                                                          -> signed in
const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../database/database");
require("../database/auth-schema");
const otp = require("../security/otp");
const { logActivity } = require("../database/activity-log");
const { buildLoginSuccess, validatePasswordPolicy } = require("./auth");

const router = express.Router();

const PURPOSE = "FIRST_LOGIN";

function fullName(user) {
  return (
    [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ") ||
    user.username
  );
}

// The account behind a request, which must still be active and still waiting
// for its first sign-in.
function waitingAccount(userId) {
  const user = db
    .prepare(
      `SELECT id, username, first_name, middle_name, last_name, email, contact_number,
              profile_picture_uri, password_hash, role, account_status, needs_first_login
       FROM users WHERE id = ?`,
    )
    .get(userId);

  if (
    !user ||
    String(user.account_status).toUpperCase() !== "ACTIVE" ||
    Number(user.needs_first_login) !== 1
  ) {
    throw new otp.OtpError(
      400,
      "INVALID_CHALLENGE",
      "This verification request is no longer valid. Please sign in again.",
    );
  }

  return user;
}

router.post("/verify", (req, res) => {
  try {
    const challenge = otp.checkCode({
      challengeId: req.body?.challengeId,
      code: req.body?.code,
      purpose: PURPOSE,
    });

    waitingAccount(challenge.user_id);

    const step = otp.markVerified(challenge.id);

    return res.json({
      success: true,
      message: "Email verified. Now choose your own password.",
      ...step,
    });
  } catch (error) {
    return fail(res, error, "Could not verify the code.");
  }
});

router.post("/resend", async (req, res) => {
  try {
    const challenge = db
      .prepare("SELECT user_id FROM otp_challenges WHERE id = ? AND purpose = ?")
      .get(String(req.body?.challengeId || ""), PURPOSE);

    if (!challenge) {
      throw new otp.OtpError(
        400,
        "INVALID_CHALLENGE",
        "This verification request is no longer valid. Please sign in again.",
      );
    }

    const user = waitingAccount(challenge.user_id);

    const next = await otp.resend({
      challengeId: req.body.challengeId,
      purpose: PURPOSE,
      name: fullName(user),
    });

    return res.json({ success: true, message: "A new code was sent.", ...next });
  } catch (error) {
    return fail(res, error, "Could not send a new code.");
  }
});

router.post("/complete", async (req, res) => {
  try {
    const { challengeId, stepToken, newPassword, confirmPassword } = req.body || {};

    const challenge = otp.checkStep({ challengeId, stepToken, purpose: PURPOSE });
    const user = waitingAccount(challenge.user_id);

    if (typeof newPassword !== "string" || typeof confirmPassword !== "string") {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_REQUIRED",
        message: "Please enter and confirm your new password.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_MISMATCH",
        message: "New password and confirmation do not match.",
      });
    }

    const policy = validatePasswordPolicy(newPassword);

    if (!policy.valid) {
      return res.status(400).json({
        success: false,
        code: policy.code,
        message: policy.message,
      });
    }

    // The password an administrator set is only temporary.
    if (await bcrypt.compare(newPassword, user.password_hash)) {
      return res.status(400).json({
        success: false,
        code: "SAME_PASSWORD",
        message: "Choose a password different from the temporary one you were given.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    db.exec("BEGIN IMMEDIATE");

    try {
      // Spent first, so two requests cannot both finish.
      if (!otp.markUsed(challenge.id)) {
        throw new otp.OtpError(
          400,
          "INVALID_CHALLENGE",
          "This verification request is no longer valid. Please sign in again.",
        );
      }

      db.prepare(
        `UPDATE users
         SET password_hash = ?, needs_first_login = 0, is_verified = 1,
             failed_login_attempts = 0, locked_until = NULL, lockout_count = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      ).run(passwordHash, user.id);

      logActivity({
        actorId: user.id,
        action: "ACCOUNT_FIRST_LOGIN",
        entityType: "USER",
        entityId: user.id,
        description: `${fullName(user)} verified their email and set their own password.`,
      });

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return res.json({
      ...buildLoginSuccess(user),
      message: "Your account is ready. You are signed in.",
    });
  } catch (error) {
    return fail(res, error, "Could not finish setting up your account.");
  }
});

function fail(res, error, fallback) {
  if (error instanceof otp.OtpError) {
    return otp.sendOtpError(res, error);
  }

  console.error("First sign-in error:", error);

  return res.status(500).json({ success: false, message: fallback });
}

module.exports = router;
