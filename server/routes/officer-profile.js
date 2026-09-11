const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../database/database");
const { authenticateToken } = require("./auth");

const router = express.Router();

// Identify the officer from the verified token, not a submitted user ID.
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
        SELECT id, role, account_status
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
      INNER JOIN fines_officers fo ON fo.user_id = u.id
      WHERE u.id = ?
        AND u.role = 'FINES_OFFICER'
    `,
    )
    .get(userId);

  if (!user) return null;

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

// GET /api/officer-profile/me
router.get("/me", (req, res) => {
  try {
    const user = getProfile(req.officerUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Officer profile not found.",
      });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error("Load officer profile failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your profile.",
    });
  }
});

// PUT /api/officer-profile/me
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

    // Keep names separate in storage to preserve compound names.
    const firstName = String(body.firstName ?? current.firstName).trim();

    const middleName = String(body.middleName ?? current.middleName).trim();

    const lastName = String(body.lastName ?? current.lastName).trim();

    const username = String(body.username ?? current.username).trim();

    const email = String(body.email ?? current.email).trim();

    const contactNumber = String(
      body.contactNumber ?? current.contactNumber,
    ).trim();

    if (!firstName || !lastName || !username || !email) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, username, and email are required.",
      });
    }

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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (/\s/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Username cannot contain spaces.",
      });
    }

    if (contactNumber && !/^\+?[0-9 ()-]{7,30}$/.test(contactNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid contact number.",
      });
    }

    const duplicate = db
      .prepare(
        `
        SELECT id
        FROM users
        WHERE id != ?
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

    // Only personal fields are editable.
    // Role, account status, and employee number are not accepted.
    db.prepare(
      `
      UPDATE users
      SET
        first_name = ?,
        middle_name = ?,
        last_name = ?,
        username = ?,
        email = ?,
        contact_number = ?
      WHERE id = ?
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

// PUT /api/officer-profile/me/password
router.put("/me/password", async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

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
        message: "Please complete all password fields.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters.",
      });
    }

    // bcrypt only processes the first 72 bytes.
    if (
      Buffer.byteLength(currentPassword, "utf8") > 72 ||
      Buffer.byteLength(newPassword, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must not exceed 72 bytes.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match.",
      });
    }

    const user = db
      .prepare(
        `
        SELECT password_hash
        FROM users
        WHERE id = ?
          AND role = 'FINES_OFFICER'
          AND account_status = 'ACTIVE'
      `,
      )
      .get(req.officerUserId);

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Your account is no longer available.",
      });
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    if (await bcrypt.compare(newPassword, user.password_hash)) {
      return res.status(400).json({
        success: false,
        message: "Choose a password different from your current password.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Prevent an overlapping password change from being overwritten.
    const result = db
      .prepare(
        `
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
          AND password_hash = ?
          AND role = 'FINES_OFFICER'
          AND account_status = 'ACTIVE'
      `,
      )
      .run(passwordHash, req.officerUserId, user.password_hash);

    if (Number(result.changes) !== 1) {
      return res.status(409).json({
        success: false,
        message: "Your account changed. Please log in again and retry.",
      });
    }

    return res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change officer password failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change your password.",
    });
  }
});

module.exports = router;
