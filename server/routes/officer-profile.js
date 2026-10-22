const express = require("express");
const { isValidEmail } = require("../security/validation");
const bcrypt = require("bcryptjs");

const db = require("../database/database");
const { authenticateToken, validatePasswordPolicy } = require("./auth");
const { logActivity } = require("../database/activity-log");
const passwordTries = require("../security/password-tries");

const router = express.Router();

// ==========================================
// AUTHENTICATION
// ==========================================
//
// Identify the officer from the verified
// authentication token, never from a user ID
// submitted by the client.
// ==========================================

router.use(authenticateToken);

router.use((req, res, next) => {
  try {
    const userId = Number(req.authUser?.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Your session is invalid. Please log in again.",
      });
    }

    const user = db
      .prepare(
        `
        SELECT
          id,
          role,
          account_status

        FROM users

        WHERE id = ?
        `,
      )
      .get(userId);

    if (
      !user ||
      user.role !== "FINES_OFFICER" ||
      user.account_status !== "ACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message: "An active Fines Officer account is required.",
      });
    }

    req.officerUserId = userId;

    next();
  } catch (error) {
    console.error("Officer authorization failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify your account.",
    });
  }
});
// Password rules: see validatePasswordPolicy in routes/auth.js.

// ==========================================
// GET OFFICER PROFILE
// ==========================================

function getProfile(userId) {
  const user = db
    .prepare(
      `
      SELECT
        u.id,
        u.username,
        u.first_name,
        u.middle_name,
        u.last_name,
        u.email,
        u.contact_number,
        u.profile_picture_uri,
        fo.employee_number,
        fo.assigned_area

      FROM users u

      INNER JOIN fines_officers fo
        ON fo.user_id = u.id

      WHERE
        u.id = ?
        AND u.role = 'FINES_OFFICER'
      `,
    )
    .get(userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,

    username: user.username,

    firstName: user.first_name || "",

    middleName: user.middle_name || "",

    lastName: user.last_name || "",

    fullName: [user.first_name, user.middle_name, user.last_name]
      .filter(Boolean)
      .join(" "),

    email: user.email || "",

    contactNumber: user.contact_number || "",

    profilePictureUri: user.profile_picture_uri || null,

    employeeNumber: user.employee_number || "",

    assignedArea: user.assigned_area || "",

    role: "FINES_OFFICER",
  };
}

// ==========================================
// GET /api/officer-profile/me
// ==========================================

router.get("/me", (req, res) => {
  try {
    const user = getProfile(req.officerUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Officer profile not found.",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Load officer profile failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your profile.",
    });
  }
});

// ==========================================
// PUT /api/officer-profile/me
// ==========================================

router.put("/me", (req, res) => {
  try {
    const current = getProfile(req.officerUserId);

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Officer profile not found.",
      });
    }

    const body = req.body || {};

    // ======================================
    // KEEP NAMES SEPARATE IN STORAGE
    // ======================================

    const firstName = String(body.firstName ?? current.firstName).trim();

    const middleName = String(body.middleName ?? current.middleName).trim();

    const lastName = String(body.lastName ?? current.lastName).trim();

    const username = String(body.username ?? current.username).trim();

    const requestedEmail = String(body.email ?? current.email)
      .trim()
      .toLowerCase();

    // Your own email address changes only through Change Email, which sends a
    // code to the new address first.
    if (
      requestedEmail !== String(current.email || "").trim().toLowerCase()
    ) {
      return res.status(400).json({
        success: false,
        code: "EMAIL_CHANGE_REQUIRES_VERIFICATION",
        message:
          "Use Change Email to change your email address. We send a code to the new address to confirm it.",
      });
    }

    const email = String(current.email ?? "")
      .trim()
      .toLowerCase();

    const contactNumber = String(
      body.contactNumber ?? current.contactNumber,
    ).trim();

    // ======================================
    // REQUIRED FIELDS
    // ======================================

    if (!firstName || !lastName || !username || !email) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, username, and email are required.",
      });
    }

    // ======================================
    // LENGTH VALIDATION
    // ======================================

    if (
      firstName.length > 100 ||
      middleName.length > 100 ||
      lastName.length > 100 ||
      username.length > 100 ||
      email.length > 254 ||
      contactNumber.length > 30
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more fields are too long.",
      });
    }

    // ======================================
    // EMAIL VALIDATION
    // ======================================

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // ======================================
    // USERNAME VALIDATION
    // ======================================

    if (/\s/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Username cannot contain spaces.",
      });
    }

    // ======================================
    // CONTACT NUMBER VALIDATION
    // ======================================

    if (contactNumber && !/^\+?[0-9 ()-]{7,30}$/.test(contactNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid contact number.",
      });
    }

    // ======================================
    // DUPLICATE USERNAME / EMAIL
    // ======================================

    const duplicate = db
      .prepare(
        `
        SELECT id

        FROM users

        WHERE
          id != ?
          AND (
            LOWER(username) = LOWER(?)
            OR LOWER(email) = LOWER(?)
          )

        LIMIT 1
        `,
      )
      .get(req.officerUserId, username, email);

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "That username or email is already used by another account.",
      });
    }

    // ======================================
    // UPDATE PERSONAL INFORMATION
    // ======================================
    //
    // Role, account status, assigned area,
    // and employee number cannot be changed
    // through the officer's mobile profile.
    // ======================================

    db.prepare(
      `
      UPDATE users

      SET
        first_name = ?,
        middle_name = ?,
        last_name = ?,
        username = ?,
        email = ?,
        contact_number = ?,
        updated_at = CURRENT_TIMESTAMP

      WHERE
        id = ?
        AND role = 'FINES_OFFICER'
      `,
    ).run(
      firstName,
      middleName || null,
      lastName,
      username,
      email,
      contactNumber || null,
      req.officerUserId,
    );

    return res.json({
      success: true,

      message: "Profile updated successfully.",

      user: getProfile(req.officerUserId),
    });
  } catch (error) {
    console.error("Update officer profile failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save your profile.",
    });
  }
});

// ==========================================
// PUT /api/officer-profile/me/password
// ==========================================

router.put("/me/password", async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    // ======================================
    // REQUIRED FIELDS
    // ======================================

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string" ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_FIELDS_REQUIRED",
        message: "Please complete all password fields.",
      });
    }

    // ======================================
    // CURRENT PASSWORD BCRYPT LIMIT
    // ======================================

    if (Buffer.byteLength(currentPassword, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        code: "CURRENT_PASSWORD_TOO_LONG",
        message: "Current password is invalid.",
      });
    }

    // ======================================
    // PASSWORD POLICY
    // ======================================

    const passwordValidation = validatePasswordPolicy(newPassword);

    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        code: passwordValidation.code,
        message: passwordValidation.message,
      });
    }

    // ======================================
    // CONFIRM PASSWORD
    // ======================================

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_MISMATCH",
        message: "New password and confirmation do not match.",
      });
    }

    // ======================================
    // FIND CURRENT PASSWORD HASH
    // ======================================

    const user = db
      .prepare(
        `
        SELECT
          password_hash

        FROM users

        WHERE
          id = ?
          AND role = 'FINES_OFFICER'
          AND account_status = 'ACTIVE'
        `,
      )
      .get(req.officerUserId);

    if (!user) {
      return res.status(403).json({
        success: false,
        code: "OFFICER_ACCOUNT_UNAVAILABLE",
        message: "Your account is no longer available.",
      });
    }

    // ======================================
    // VERIFY CURRENT PASSWORD
    // ======================================

    if (passwordTries.blocked(req.officerUserId)) {
      return res.status(429).json(passwordTries.TOO_MANY);
    }

    const currentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash,
    );

    if (!currentPasswordValid) {
      passwordTries.fail(req.officerUserId);

      logActivity({
        actorId: req.officerUserId,
        action: "PASSWORD_CHANGE_FAILED",
        result: "FAILED",
        description: "Password change refused: the current password was wrong.",
      });

      return res.status(400).json({
        success: false,
        code: "CURRENT_PASSWORD_INCORRECT",
        message: "Current password is incorrect.",
      });
    }

    // ======================================
    // PREVENT PASSWORD REUSE
    // ======================================

    const sameAsCurrent = await bcrypt.compare(newPassword, user.password_hash);

    if (sameAsCurrent) {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_REUSED",
        message: "Choose a password different from your current password.",
      });
    }

    // ======================================
    // HASH NEW PASSWORD
    // ======================================

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // ======================================
    // UPDATE PASSWORD
    // ======================================
    //
    // password_hash comparison protects
    // against two overlapping password-change
    // requests overwriting each other.
    // ======================================

    const result = db
      .prepare(
        `
        UPDATE users

        SET
          password_hash = ?,
          failed_login_attempts = 0,
          locked_until = NULL,
          lockout_count = 0,
          updated_at = CURRENT_TIMESTAMP

        WHERE
          id = ?
          AND password_hash = ?
          AND role = 'FINES_OFFICER'
          AND account_status = 'ACTIVE'
        `,
      )
      .run(passwordHash, req.officerUserId, user.password_hash);

    if (Number(result.changes) !== 1) {
      return res.status(409).json({
        success: false,
        code: "PASSWORD_UPDATE_CONFLICT",
        message: "Your account changed. Please log in again and retry.",
      });
    }

    // Every other session of this account is signed out; this one stays.
    require("../security/sessions").endAllForUser(
      req.officerUserId,
      "PASSWORD_CHANGED",
      req.authUser.sid,
    );

    passwordTries.clear(req.officerUserId);

    logActivity({
      actorId: req.officerUserId,
      action: "PASSWORD_CHANGED",
      description: "Password changed. Other signed-in devices were signed out.",
    });

    // ======================================
    // SUCCESS
    // ======================================

    return res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change officer password failed:", error);

    return res.status(500).json({
      success: false,
      code: "PASSWORD_UPDATE_ERROR",
      message: "Unable to change your password.",
    });
  }
});

module.exports = router;
