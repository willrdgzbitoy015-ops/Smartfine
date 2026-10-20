// System reset: deletes SmartFine's records so another school (or a new
// school year) can start fresh.
//
// Rules:
// - Only an active administrator can reset, with their password and the
//   typed phrase (checked in routes/system-reset.js).
// - Money still moving stops the reset. Open GCash checkouts are settled
//   with PayMongo first (closed, or recorded if they were paid), and a
//   refund PayMongo is still processing blocks the reset.
// - A full copy of the database is saved before anything is deleted, and the
//   uploaded profile pictures are moved next to it, in
//   server/database/backups/reset-<time>/.
// - The administrator who resets keeps their account and stays signed in.
//   Everything else is deleted in one transaction; fine types and the
//   school name can be kept.
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const db = require("./database");
const online = require("../payments/online-payments");
const refunds = require("../payments/refunds");

const DB_PATH = path.join(__dirname, "smartfine.db");
const BACKUP_ROOT = path.join(__dirname, "backups");
const UPLOADS = path.join(__dirname, "..", "uploads");
const UPLOAD_FOLDERS = ["student-profiles", "officer-profiles", "admin-profiles", "fine-evidence"];

// Creates the fine_evidence table if this backend has not made it yet.
require("./fine-evidence");
const { logActivity } = require("./activity-log");

const CONFIRM_PHRASE = "RESET SMARTFINE";

// Deleted children first, so foreign keys never point at a removed row.
const WIPED_TABLES = [
  "fine_evidence",
  "refunds",
  "payment_events",
  "payments",
  "notifications",
  "student_fine_reads",
  "fines",
  "students",
  "fines_officers",
  "password_reset_codes",
  "audit_logs",
];

class ResetError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// One reset at a time in this server.
let resetRunning = false;

function count(sql, ...args) {
  return Number(db.prepare(sql).get(...args).n);
}

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

function adminPicture(adminId) {
  const row = db
    .prepare("SELECT profile_picture_uri FROM users WHERE id = ?")
    .get(adminId);

  return row?.profile_picture_uri ? path.basename(row.profile_picture_uri) : null;
}

// Uploaded pictures except the resetting administrator's own.
function picturesToMove(adminId) {
  const keep = adminPicture(adminId);
  const files = [];

  for (const folder of UPLOAD_FOLDERS) {
    const directory = path.join(UPLOADS, folder);

    if (!fs.existsSync(directory)) continue;

    for (const name of fs.readdirSync(directory)) {
      if (folder === "admin-profiles" && name === keep) continue;

      if (fs.statSync(path.join(directory, name)).isFile()) {
        files.push({ folder, name });
      }
    }
  }

  return files;
}

function processingRefunds() {
  return db
    .prepare(
      `SELECT r.id, r.refund_reference, f.fine_reference
       FROM refunds r
       JOIN fines f ON f.id = r.fine_id
       WHERE r.status = 'PROCESSING'
       ORDER BY r.id`,
    )
    .all();
}

function openCheckouts() {
  return db
    .prepare(
      `SELECT p.id, p.fine_id, f.fine_reference
       FROM payments p
       JOIN fines f ON f.id = p.fine_id
       WHERE p.payment_method = 'GCASH' AND p.payment_status = 'PENDING'
       ORDER BY p.id`,
    )
    .all();
}

// ==========================================
// WHAT A RESET WOULD DELETE
// ==========================================

function resetSummary(adminId) {
  const settings =
    db.prepare("SELECT school_name, academic_year FROM system_settings WHERE id = 1").get() || {};

  return {
    confirmPhrase: CONFIRM_PHRASE,
    counts: {
      students: count("SELECT COUNT(*) n FROM users WHERE role = 'STUDENT'"),
      officers: count("SELECT COUNT(*) n FROM users WHERE role = 'FINES_OFFICER'"),
      otherAdmins: count("SELECT COUNT(*) n FROM users WHERE role = 'ADMIN' AND id != ?", adminId),
      fines: count("SELECT COUNT(*) n FROM fines"),
      payments: count("SELECT COUNT(*) n FROM payments"),
      collectedCentavos: count(
        "SELECT COALESCE(SUM(amount_centavos), 0) n FROM payments WHERE payment_status = 'SUCCESS'",
      ),
      refunds: count("SELECT COUNT(*) n FROM refunds"),
      notifications: count("SELECT COUNT(*) n FROM notifications"),
      fineTypes: count("SELECT COUNT(*) n FROM violation_types"),
      pictures: picturesToMove(adminId).length,
    },
    school: {
      schoolName: settings.school_name || "",
      academicYear: settings.academic_year || "",
    },
    // Closed with PayMongo when the reset starts.
    openCheckouts: openCheckouts().map((row) => row.fine_reference),
    // Block the reset until PayMongo finishes them.
    processingRefunds: processingRefunds().map((row) => ({
      refundReference: row.refund_reference,
      fineReference: row.fine_reference,
    })),
  };
}

// ==========================================
// RESET
// ==========================================

function backupStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

// Refunds are checked first: a refused reset must not have closed anyone's
// checkout.
async function settleMoneyInMotion(adminId) {
  // A refund may have finished since it was last checked.
  for (const refund of processingRefunds()) {
    try {
      await refunds.refreshRefund(refund.id);
    } catch (error) {
      console.error("System reset: could not check a refund:", error);
    }
  }

  const stillProcessing = processingRefunds();

  if (stillProcessing.length > 0) {
    const fines = stillProcessing.map((row) => row.fine_reference);

    throw new ResetError(
      409,
      "REFUND_PROCESSING",
      `PayMongo is still processing a refund for ${fines.join(", ")}. Wait until it is completed (use Check Refund Status on the fine), then reset. Nothing was deleted.`,
      { fines },
    );
  }

  // Close open GCash checkouts so nobody can pay into a deleted fine. One
  // paid at the last moment is recorded first, so the backup has it.
  const fineIds = [...new Set(openCheckouts().map((row) => row.fine_id))];

  for (const fineId of fineIds) {
    try {
      await online.settlePendingOnlinePayment(fineId, adminId, "SYSTEM_RESET");
    } catch (error) {
      console.error("System reset: could not settle a GCash checkout:", error);

      throw new ResetError(
        503,
        "CHECKOUT_CHECK_FAILED",
        "A GCash payment is in progress and PayMongo could not be reached to close it. Nothing was deleted. Please try again in a moment.",
      );
    }
  }
}

function saveDatabaseBackup(folder) {
  const target = path.join(folder, "smartfine.db");

  db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);

  // The copy must open and hold the same people before anything is deleted.
  const copy = new DatabaseSync(target, { readOnly: true });

  try {
    const users = Number(copy.prepare("SELECT COUNT(*) n FROM users").get().n);

    if (users !== count("SELECT COUNT(*) n FROM users")) {
      throw new Error("The backup copy does not match the database.");
    }
  } finally {
    copy.close();
  }

  return target;
}

function movePictures(files, folder) {
  let moved = 0;
  const failed = [];

  for (const file of files) {
    const from = path.join(UPLOADS, file.folder, file.name);
    const toDirectory = path.join(folder, "uploads", file.folder);
    const to = path.join(toDirectory, file.name);

    try {
      fs.mkdirSync(toDirectory, { recursive: true });

      try {
        fs.renameSync(from, to);
      } catch {
        // Another drive: copy, then remove.
        fs.copyFileSync(from, to);
        fs.unlinkSync(from);
      }

      moved += 1;
    } catch (error) {
      console.error(`System reset: could not move ${file.folder}/${file.name}:`, error);
      failed.push(`${file.folder}/${file.name}`);
    }
  }

  return { moved, failed };
}

async function resetSystem({ adminId, keepFineTypes = true, keepSchoolDetails = true }) {
  if (resetRunning) {
    throw new ResetError(409, "RESET_RUNNING", "A system reset is already running. Please wait for it to finish.");
  }

  resetRunning = true;

  try {
    await settleMoneyInMotion(adminId);

    const stamp = backupStamp();
    const folderName = `reset-${stamp}`;
    const folder = path.join(BACKUP_ROOT, folderName);

    fs.mkdirSync(folder, { recursive: true });

    try {
      saveDatabaseBackup(folder);
    } catch (error) {
      console.error("System reset: backup failed:", error);

      throw new ResetError(
        500,
        "BACKUP_FAILED",
        "The backup could not be saved, so nothing was deleted.",
      );
    }

    const pictures = picturesToMove(adminId);

    let removed;

    try {
      removed = runTransaction(() => {
        // Checked again inside the transaction: another administrator may have
        // reset or removed this account a moment ago.
        const admin = db
          .prepare("SELECT role, account_status FROM users WHERE id = ?")
          .get(adminId);

        if (!admin || admin.role !== "ADMIN" || admin.account_status !== "ACTIVE") {
          throw new ResetError(403, "ADMIN_INACTIVE", "This administrator account is no longer active. Nothing was deleted.");
        }

        // A checkout opened after the settling above stops the reset.
        if (count("SELECT COUNT(*) n FROM payments WHERE payment_method = 'GCASH' AND payment_status = 'PENDING'") > 0) {
          throw new ResetError(409, "CHECKOUT_STARTED", "A student just started a GCash payment. Nothing was deleted. Please try again in a moment.");
        }

        if (processingRefunds().length > 0) {
          throw new ResetError(409, "REFUND_PROCESSING", "A refund is processing with PayMongo. Nothing was deleted.");
        }

        const counts = {
          students: count("SELECT COUNT(*) n FROM users WHERE role = 'STUDENT'"),
          officers: count("SELECT COUNT(*) n FROM users WHERE role = 'FINES_OFFICER'"),
          otherAdmins: count("SELECT COUNT(*) n FROM users WHERE role = 'ADMIN' AND id != ?", adminId),
          fines: count("SELECT COUNT(*) n FROM fines"),
          payments: count("SELECT COUNT(*) n FROM payments"),
          refunds: count("SELECT COUNT(*) n FROM refunds"),
          notifications: count("SELECT COUNT(*) n FROM notifications"),
          fineTypes: keepFineTypes ? 0 : count("SELECT COUNT(*) n FROM violation_types"),
        };

        for (const table of WIPED_TABLES) {
          db.exec(`DELETE FROM ${table}`);
        }

        db.prepare("DELETE FROM users WHERE id != ?").run(adminId);

        if (!keepFineTypes) {
          db.exec("DELETE FROM violation_types");
        }

        if (!keepSchoolDetails) {
          db.prepare(
            `UPDATE system_settings
             SET school_name = '', academic_year = '', updated_at = CURRENT_TIMESTAMP
             WHERE id = 1`,
          ).run();
        }

        // New records number from 1 again (F-YYYY-0001 and so on are worked
        // out from the remaining rows).
        const renumbered = [...WIPED_TABLES, "users", ...(keepFineTypes ? [] : ["violation_types"])];
        db.prepare(
          `DELETE FROM sqlite_sequence WHERE name IN (${renumbered.map(() => "?").join(", ")})`,
        ).run(...renumbered);

        // The first entry of the new, empty log.
        logActivity({
          actorId: adminId,
          action: "SYSTEM_RESET",
          entityType: "SYSTEM",
          description: `System reset. Backup: ${folderName}. Fine types ${keepFineTypes ? "kept" : "deleted"}; school details ${keepSchoolDetails ? "kept" : "cleared"}.`,
          details: { backupFolder: folderName, keepFineTypes, keepSchoolDetails },
        });

        return counts;
      });
    } catch (error) {
      // Nothing was deleted, so the backup of this attempt is not needed.
      fs.rmSync(folder, { recursive: true, force: true });
      throw error;
    }

    // Pictures move only after the records are gone, so a failed reset never
    // leaves records pointing at missing pictures.
    const pictureResult = movePictures(pictures, folder);

    return {
      backupFolder: folderName,
      removed: { ...removed, pictures: pictureResult.moved },
      picturesNotMoved: pictureResult.failed,
      keptFineTypes: keepFineTypes,
      keptSchoolDetails: keepSchoolDetails,
    };
  } finally {
    resetRunning = false;
  }
}

module.exports = {
  CONFIRM_PHRASE,
  ResetError,
  resetSummary,
  resetSystem,
};
