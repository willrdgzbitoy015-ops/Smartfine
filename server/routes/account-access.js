// Administrator controls over other people's access. Mounted at /api/access.
//
//   POST /:id/lock     lock an account so it cannot sign in
//   POST /:id/unlock   unlock it (also clears a "too many attempts" lockout)
//   POST /:id/role     { role: "ADMIN" | "FINES_OFFICER" } for staff accounts
//
// Administrators only. Every change is written to the Activity Log.
const express = require("express");

const db = require("../database/database");
const { logActivity, fullName } = require("../database/activity-log");
const { requireActive } = require("../middleware/access");
const { generateNextEmployeeNumber } = require("./officers");
const sessions = require("../security/sessions");

const router = express.Router();

router.use(requireActive("ADMIN"));

const ROLE_LABELS = { ADMIN: "Administrator", FINES_OFFICER: "Fines Officer", STUDENT: "Student" };

function target(req, res) {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(400).json({ success: false, message: "Invalid account." });
    return null;
  }

  const user = db
    .prepare(
      `SELECT id, username, first_name, middle_name, last_name, role, account_status,
              locked_until, failed_login_attempts, lockout_count
       FROM users
       WHERE id = ? AND username NOT LIKE '\\_\\_archived\\_%' ESCAPE '\\'`,
    )
    .get(id);

  if (!user) {
    res.status(404).json({ success: false, code: "NOT_FOUND", message: "Account not found." });
    return null;
  }

  return user;
}

function displayName(user) {
  return fullName(user.first_name, user.middle_name, user.last_name) || user.username;
}

function activeAdminCount() {
  return Number(
    db
      .prepare("SELECT COUNT(*) n FROM users WHERE role = 'ADMIN' AND account_status = 'ACTIVE'")
      .get().n,
  );
}

function timedLockActive(user) {
  const until = user.locked_until ? new Date(user.locked_until).getTime() : 0;

  return Number.isFinite(until) && until > Date.now();
}

// The account's access state, for the Account Access card.
router.get("/:id", (req, res) => {
  try {
    const user = target(req, res);
    if (!user) return undefined;

    const until = user.locked_until ? new Date(user.locked_until).getTime() : 0;

    res.set("Cache-Control", "no-store");

    return res.json({
      success: true,
      access: {
        id: user.id,
        role: user.role,
        accountStatus: user.account_status,
        failedAttempts: Number(user.failed_login_attempts) || 0,
        timedLockSecondsLeft: timedLockActive(user)
          ? Math.max(1, Math.ceil((until - Date.now()) / 1000))
          : 0,
        isSelf: user.id === req.account.id,
        canChangeRole: user.role !== "STUDENT" && user.id !== req.account.id,
      },
    });
  } catch (error) {
    console.error("Load account access error:", error);
    return res.status(500).json({ success: false, message: "Could not load the account's access." });
  }
});

router.post("/:id/lock", (req, res) => {
  try {
    const user = target(req, res);
    if (!user) return undefined;

    if (user.id === req.account.id) {
      return res.status(403).json({
        success: false,
        code: "SELF_LOCK",
        message: "You can't lock your own account.",
      });
    }

    if (user.account_status === "LOCKED") {
      return res.status(409).json({ success: false, code: "ALREADY_LOCKED", message: "This account is already locked." });
    }

    if (user.account_status !== "ACTIVE") {
      return res.status(409).json({
        success: false,
        code: "NOT_ACTIVE",
        message: "Only an active account can be locked. This one is inactive already and cannot sign in.",
      });
    }

    if (user.role === "ADMIN" && activeAdminCount() <= 1) {
      return res.status(409).json({
        success: false,
        code: "LAST_ACTIVE_ADMIN",
        message: "SmartFine needs at least one active administrator.",
      });
    }

    db.prepare(
      "UPDATE users SET account_status = 'LOCKED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).run(user.id);

    // They are signed out everywhere, right now.
    sessions.endAllForUser(user.id, "ACCOUNT_LOCKED");

    logActivity({
      actorId: req.account.id,
      action: "ACCOUNT_LOCKED",
      entityType: "USER",
      entityId: user.id,
      description: `Locked the ${ROLE_LABELS[user.role] || "user"} account of ${displayName(user)} (${user.username}).`,
    });

    return res.json({
      success: true,
      message: `${displayName(user)}'s account is locked and cannot sign in.`,
      accountStatus: "LOCKED",
    });
  } catch (error) {
    console.error("Lock account error:", error);
    return res.status(500).json({ success: false, message: "Could not lock the account." });
  }
});

router.post("/:id/unlock", (req, res) => {
  try {
    const user = target(req, res);
    if (!user) return undefined;

    const lockedByAdmin = user.account_status === "LOCKED";

    if (!lockedByAdmin && !timedLockActive(user) && Number(user.failed_login_attempts) === 0) {
      return res.status(409).json({
        success: false,
        code: "NOT_LOCKED",
        message: "This account is not locked.",
      });
    }

    if (user.account_status === "INACTIVE") {
      return res.status(409).json({
        success: false,
        code: "INACTIVE",
        message: "This account is inactive. Reactivate it instead.",
      });
    }

    // Also clears a "too many failed attempts" lockout and its history.
    db.prepare(
      `UPDATE users
       SET account_status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
           lockout_count = 0, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    ).run(user.id);

    logActivity({
      actorId: req.account.id,
      action: "ACCOUNT_UNLOCKED",
      entityType: "USER",
      entityId: user.id,
      description: `Unlocked the ${ROLE_LABELS[user.role] || "user"} account of ${displayName(user)} (${user.username})${
        lockedByAdmin ? "" : " after too many failed sign-ins"
      }.`,
    });

    return res.json({
      success: true,
      message: `${displayName(user)}'s account is unlocked.`,
      accountStatus: "ACTIVE",
    });
  } catch (error) {
    console.error("Unlock account error:", error);
    return res.status(500).json({ success: false, message: "Could not unlock the account." });
  }
});

router.post("/:id/role", (req, res) => {
  try {
    const user = target(req, res);
    if (!user) return undefined;

    const role = String(req.body?.role || "").toUpperCase();

    if (!["ADMIN", "FINES_OFFICER"].includes(role)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_ROLE",
        message: "Choose Administrator or Fines Officer.",
      });
    }

    if (user.id === req.account.id) {
      return res.status(403).json({
        success: false,
        code: "SELF_ROLE",
        message: "You can't change your own role.",
      });
    }

    if (user.role === "STUDENT") {
      return res.status(409).json({
        success: false,
        code: "STUDENT_ROLE",
        message: "A student account can't be changed to a staff role.",
      });
    }

    if (user.role === role) {
      return res.status(409).json({
        success: false,
        code: "SAME_ROLE",
        message: `This account is already a ${ROLE_LABELS[role]}.`,
      });
    }

    if (user.role === "ADMIN" && user.account_status === "ACTIVE" && activeAdminCount() <= 1) {
      return res.status(409).json({
        success: false,
        code: "LAST_ACTIVE_ADMIN",
        message: "SmartFine needs at least one active administrator.",
      });
    }

    db.exec("BEGIN IMMEDIATE");

    try {
      if (role === "FINES_OFFICER") {
        // Officers have a record of their own (employee number, area).
        const existing = db.prepare("SELECT id FROM fines_officers WHERE user_id = ?").get(user.id);

        if (!existing) {
          db.prepare("INSERT INTO fines_officers (user_id, employee_number) VALUES (?, ?)").run(
            user.id,
            generateNextEmployeeNumber(),
          );
        }
      }

      db.prepare("UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
        role,
        user.id,
      );

      logActivity({
        actorId: req.account.id,
        action: "ACCOUNT_ROLE_CHANGED",
        entityType: "USER",
        entityId: user.id,
        description: `Changed the role of ${displayName(user)} (${user.username}) from ${ROLE_LABELS[user.role]} to ${ROLE_LABELS[role]}.`,
        details: { from: user.role, to: role },
      });

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    // Signed out everywhere, so the next sign-in carries the new role.
    sessions.endAllForUser(user.id, "ACCOUNT_ROLE_CHANGED");

    return res.json({
      success: true,
      message: `${displayName(user)} is now a ${ROLE_LABELS[role]}. They need to sign in again.`,
      role,
    });
  } catch (error) {
    console.error("Change role error:", error);
    return res.status(500).json({ success: false, message: "Could not change the role." });
  }
});

module.exports = router;
