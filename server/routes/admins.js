const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../database/database");
// Creates the refunds table, which the history count below reads.
require("../payments/refunds");

const {
  authenticateToken,
  requireAdmin,
  validatePasswordPolicy,
  validatePersonName,
  formatUser,
  removeAdminProfileFile,
} = require("./auth");

const router = express.Router();

// Every route here needs a signed-in administrator whose account is active.
router.use(authenticateToken, requireAdmin);

const USERNAME_PATTERN = /^[A-Za-z0-9]{3,30}$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CONTACT_PATTERN = /^\+?[0-9]{7,15}$/;

// ==========================================
// HELPERS
// ==========================================

function runTransaction(work) {
  db.exec("BEGIN IMMEDIATE");

  try {
    const result = work();

    db.exec("COMMIT");

    return result;
  } catch (error) {
    db.exec("ROLLBACK");

    throw error;
  }
}

// Records that would lose who did them if the account were deleted.
const HISTORY_COUNT_SQL = `
  (SELECT COUNT(*) FROM fines f
     WHERE f.recorded_by = u.id OR f.cancelled_by = u.id)
  + (SELECT COUNT(*) FROM payments p WHERE p.confirmed_by = u.id)
  + (SELECT COUNT(*) FROM payment_events e WHERE e.actor_user_id = u.id)
  + (SELECT COUNT(*) FROM violation_types v WHERE v.created_by = u.id)
  + (SELECT COUNT(*) FROM audit_logs a WHERE a.user_id = u.id)
  + (SELECT COUNT(*) FROM refunds r WHERE r.reviewed_by = u.id OR r.requested_by = u.id)
`;

function getAdmin(adminId) {
  return db
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
        u.role,
        u.account_status,
        u.is_verified,
        u.profile_picture_uri,
        u.created_at,
        u.updated_at,
        ${HISTORY_COUNT_SQL} AS history_count

      FROM users u

      WHERE u.id = ? AND u.role = 'ADMIN'
      `,
    )
    .get(adminId);
}

function formatAdmin(admin, currentUserId) {
  const isCurrentUser = Number(admin.id) === Number(currentUserId);

  return {
    ...formatUser(admin),

    isCurrentUser,

    hasHistory: Number(admin.history_count) > 0,

    canDelete: !isCurrentUser && Number(admin.history_count) === 0,
  };
}

// The next free ADM### username, e.g. ADM002.
function nextAdminUsername() {
  const rows = db
    .prepare("SELECT username FROM users WHERE UPPER(username) LIKE 'ADM%'")
    .all();

  let highest = 0;

  for (const row of rows) {
    const match = String(row.username).toUpperCase().match(/^ADM(\d+)$/);

    if (match && Number(match[1]) > highest) {
      highest = Number(match[1]);
    }
  }

  return `ADM${String(highest + 1).padStart(3, "0")}`;
}

function parseAdminId(value) {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function activeAdminCount() {
  return db
    .prepare(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'ADMIN' AND account_status = 'ACTIVE'",
    )
    .get().count;
}

// ==========================================
// LIST ADMINISTRATORS
// GET /api/admins
// ==========================================

router.get("/", (req, res) => {
  try {
    const currentUserId = Number(req.authUser.userId);

    const admins = db
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
          u.role,
          u.account_status,
          u.is_verified,
          u.profile_picture_uri,
          u.created_at,
          u.updated_at,
          ${HISTORY_COUNT_SQL} AS history_count

        FROM users u

        WHERE u.role = 'ADMIN'

        ORDER BY
          u.id = ? DESC,
          u.account_status = 'ACTIVE' DESC,
          LOWER(u.first_name),
          LOWER(u.last_name)
        `,
      )
      .all(currentUserId);

    return res.json({
      success: true,
      admins: admins.map((admin) => formatAdmin(admin, currentUserId)),
      activeCount: activeAdminCount(),
      nextUsername: nextAdminUsername(),
    });
  } catch (error) {
    console.error("List administrators error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to load administrators.",
    });
  }
});

// ==========================================
// ADD ADMINISTRATOR
// POST /api/admins
// ==========================================

router.post("/", async (req, res) => {
  try {
    const firstName = String(req.body.firstName ?? "").trim();
    const middleName = String(req.body.middleName ?? "").trim();
    const lastName = String(req.body.lastName ?? "").trim();
    const username = String(req.body.username ?? "").trim() || nextAdminUsername();
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const contactNumber = String(req.body.contactNumber ?? "").trim();
    const password = String(req.body.password ?? "");
    const confirmPassword = String(req.body.confirmPassword ?? "");

    const nameError = validatePersonName({ firstName, middleName, lastName });

    if (nameError) {
      return res.status(400).json({ success: false, ...nameError });
    }

    if (!USERNAME_PATTERN.test(username)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_USERNAME",
        message: "Username must be 3 to 30 letters or numbers, with no spaces.",
      });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_EMAIL",
        message: "Please enter a valid email address.",
      });
    }

    if (contactNumber && !CONTACT_PATTERN.test(contactNumber)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_CONTACT_NUMBER",
        message: "Please enter a valid contact number.",
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_FIELDS_REQUIRED",
        message: "Password and password confirmation are required.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_MISMATCH",
        message: "Password and confirmation do not match.",
      });
    }

    const passwordValidation = validatePasswordPolicy(password);

    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        code: passwordValidation.code,
        message: passwordValidation.message,
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const outcome = runTransaction(() => {
      const usernameOwner = db
        .prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?)")
        .get(username);

      if (usernameOwner) {
        return { error: "USERNAME_EXISTS" };
      }

      const emailOwner = db
        .prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)")
        .get(email);

      if (emailOwner) {
        return { error: "EMAIL_EXISTS" };
      }

      const result = db
        .prepare(
          `
          INSERT INTO users (
            username,
            first_name,
            middle_name,
            last_name,
            email,
            contact_number,
            password_hash,
            role,
            account_status,
            is_verified
          )

          VALUES (?, ?, ?, ?, ?, ?, ?, 'ADMIN', 'ACTIVE', 1)
          `,
        )
        .run(
          username,
          firstName,
          middleName || null,
          lastName,
          email,
          contactNumber || null,
          passwordHash,
        );

      return { id: Number(result.lastInsertRowid) };
    });

    if (outcome.error === "USERNAME_EXISTS") {
      return res.status(409).json({
        success: false,
        code: "USERNAME_EXISTS",
        message: "That username is already being used.",
      });
    }

    if (outcome.error === "EMAIL_EXISTS") {
      return res.status(409).json({
        success: false,
        code: "EMAIL_EXISTS",
        message: "That email address is already being used.",
      });
    }

    return res.status(201).json({
      success: true,
      message: `${firstName} ${lastName} can now sign in as an administrator.`,
      admin: formatAdmin(getAdmin(outcome.id), req.authUser.userId),
    });
  } catch (error) {
    console.error("Add administrator error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to add the administrator.",
    });
  }
});

// ==========================================
// ACTIVATE / DEACTIVATE ADMINISTRATOR
// PATCH /api/admins/:id/status
// ==========================================

router.patch("/:id/status", (req, res) => {
  try {
    const adminId = parseAdminId(req.params.id);

    const status = String(req.body.status ?? "").trim().toUpperCase();

    if (!adminId) {
      return res.status(400).json({
        success: false,
        code: "INVALID_ADMIN_ID",
        message: "Invalid administrator.",
      });
    }

    if (status !== "ACTIVE" && status !== "INACTIVE") {
      return res.status(400).json({
        success: false,
        code: "INVALID_ACCOUNT_STATUS",
        message: "Status must be ACTIVE or INACTIVE.",
      });
    }

    if (adminId === Number(req.authUser.userId)) {
      return res.status(400).json({
        success: false,
        code: "CANNOT_CHANGE_OWN_STATUS",
        message: "You can't deactivate your own account.",
      });
    }

    const outcome = runTransaction(() => {
      const admin = getAdmin(adminId);

      if (!admin) {
        return { error: "NOT_FOUND" };
      }

      if (
        status === "INACTIVE" &&
        admin.account_status === "ACTIVE" &&
        activeAdminCount() <= 1
      ) {
        return { error: "LAST_ACTIVE_ADMIN" };
      }

      // Reactivating also clears any sign-in lockout.
      db.prepare(
        `
        UPDATE users

        SET
          account_status = ?,
          failed_login_attempts = CASE WHEN ? = 'ACTIVE' THEN 0 ELSE failed_login_attempts END,
          locked_until = CASE WHEN ? = 'ACTIVE' THEN NULL ELSE locked_until END,
          lockout_count = CASE WHEN ? = 'ACTIVE' THEN 0 ELSE lockout_count END,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = ? AND role = 'ADMIN'
        `,
      ).run(status, status, status, status, adminId);

      return { admin: getAdmin(adminId) };
    });

    if (outcome.error === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        code: "ADMIN_NOT_FOUND",
        message: "Administrator not found.",
      });
    }

    if (outcome.error === "LAST_ACTIVE_ADMIN") {
      return res.status(409).json({
        success: false,
        code: "LAST_ACTIVE_ADMIN",
        message: "SmartFine needs at least one active administrator.",
      });
    }

    const name = [outcome.admin.first_name, outcome.admin.last_name].join(" ");

    return res.json({
      success: true,
      message:
        status === "ACTIVE"
          ? `${name} can sign in again.`
          : `${name} has been deactivated and can no longer sign in.`,
      admin: formatAdmin(outcome.admin, req.authUser.userId),
    });
  } catch (error) {
    console.error("Change administrator status error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update the administrator.",
    });
  }
});

// ==========================================
// DELETE ADMINISTRATOR
// DELETE /api/admins/:id
// ==========================================

router.delete("/:id", (req, res) => {
  try {
    const adminId = parseAdminId(req.params.id);

    if (!adminId) {
      return res.status(400).json({
        success: false,
        code: "INVALID_ADMIN_ID",
        message: "Invalid administrator.",
      });
    }

    if (adminId === Number(req.authUser.userId)) {
      return res.status(400).json({
        success: false,
        code: "CANNOT_DELETE_SELF",
        message: "You can't delete your own account.",
      });
    }

    const outcome = runTransaction(() => {
      const admin = getAdmin(adminId);

      if (!admin) {
        return { error: "NOT_FOUND" };
      }

      // Fines, payments and fine types keep who handled them, so an account
      // with any of that history is deactivated instead of deleted.
      if (Number(admin.history_count) > 0) {
        return { error: "HAS_HISTORY" };
      }

      if (admin.account_status === "ACTIVE" && activeAdminCount() <= 1) {
        return { error: "LAST_ACTIVE_ADMIN" };
      }

      db.prepare("DELETE FROM users WHERE id = ? AND role = 'ADMIN'").run(
        adminId,
      );

      return { admin };
    });

    if (outcome.error === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        code: "ADMIN_NOT_FOUND",
        message: "Administrator not found.",
      });
    }

    if (outcome.error === "HAS_HISTORY") {
      return res.status(409).json({
        success: false,
        code: "ADMIN_HAS_HISTORY",
        message:
          "This administrator has handled fines, payments or fine types, so the account is kept for the records. Deactivate it instead to block sign-in.",
      });
    }

    if (outcome.error === "LAST_ACTIVE_ADMIN") {
      return res.status(409).json({
        success: false,
        code: "LAST_ACTIVE_ADMIN",
        message: "SmartFine needs at least one active administrator.",
      });
    }

    removeAdminProfileFile(outcome.admin.profile_picture_uri);

    return res.json({
      success: true,
      message: `${outcome.admin.first_name} ${outcome.admin.last_name}'s administrator account has been deleted.`,
    });
  } catch (error) {
    console.error("Delete administrator error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to delete the administrator.",
    });
  }
});

module.exports = router;
