// One-time repair for cashier requests left PENDING by fines that were
// cancelled before the cancellation fix. Safe to run more than once.
//
//   Dry run, no changes:    node server/repair-cancelled-cash.js
//   Back up, then repair:   node server/repair-cancelled-cash.js --apply
const fs = require("node:fs");
const path = require("node:path");
const db = require("./database/database");

const apply = process.argv.includes("--apply");

const STALE_REQUESTS = `
  FROM payments p
  JOIN fines f ON f.id = p.fine_id
  WHERE p.payment_method = 'CASH'
    AND p.payment_status = 'PENDING'
    AND f.cancelled_at IS NOT NULL`;

const CHECKS = {
  staleRequests: {
    label: "Pending cash requests on cancelled fines",
    sql: `SELECT COUNT(*) AS count ${STALE_REQUESTS}`,
  },
  unreadNotices: {
    label: "Unread Admin PAYMENT notices for those requests",
    sql: `SELECT COUNT(*) AS count
      FROM notifications n
      JOIN payments p ON p.id = n.related_payment_id
      JOIN fines f ON f.id = p.fine_id
      WHERE n.notification_type = 'PAYMENT' AND n.is_read = 0
        AND p.payment_method = 'CASH'
        AND p.payment_status IN ('PENDING', 'CANCELLED')
        AND f.cancelled_at IS NOT NULL`,
  },
  staleFineStatus: {
    label: "Cancelled fines not marked CANCELLED",
    sql: `SELECT COUNT(*) AS count FROM fines
      WHERE cancelled_at IS NOT NULL AND paid_at IS NULL
        AND fine_status <> 'CANCELLED'`,
  },
  // Guards: the repair must never change these.
  successfulPayments: {
    label: "Successful payments (must not change)",
    guard: true,
    sql: `SELECT COUNT(*) AS count FROM payments
      WHERE payment_status = 'SUCCESS'`,
  },
  successfulCentavos: {
    label: "Successful payment total, centavos (must not change)",
    guard: true,
    sql: `SELECT COALESCE(SUM(amount_centavos), 0) AS count FROM payments
      WHERE payment_status = 'SUCCESS'`,
  },
  activeRequests: {
    label: "Pending requests on active fines (must not change)",
    guard: true,
    sql: `SELECT COUNT(*) AS count FROM payments p
      JOIN fines f ON f.id = p.fine_id
      WHERE p.payment_status = 'PENDING' AND f.cancelled_at IS NULL`,
  },
};

function snapshot() {
  return Object.fromEntries(
    Object.entries(CHECKS).map(([key, check]) => [
      key,
      Number(db.prepare(check.sql).get().count),
    ]),
  );
}

function printCounts(title, counts) {
  console.log(`\n${title}`);
  console.table(
    Object.entries(CHECKS).map(([key, check]) => ({
      check: check.label,
      records: counts[key],
    })),
  );
}

function backupDatabase() {
  const directory = path.join(__dirname, "database", "backups");
  fs.mkdirSync(directory, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    directory,
    `smartfine-before-cash-repair-${timestamp}.db`,
  );

  // VACUUM INTO writes a consistent copy even while the backend is running.
  db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`);

  if (!fs.existsSync(backupPath) || fs.statSync(backupPath).size === 0) {
    throw new Error("The database backup was not created.");
  }

  return backupPath;
}

try {
  const before = snapshot();
  printCounts("Before repair", before);

  const affected = db
    .prepare(
      `SELECT
         p.id AS paymentId,
         p.payment_reference AS paymentReference,
         f.fine_reference AS fineReference,
         f.cancelled_at AS fineCancelledAt
       ${STALE_REQUESTS}
       ORDER BY p.id`,
    )
    .all();

  if (affected.length > 0) {
    console.log("\nRequests to cancel:");
    console.table(affected);
  }

  const needsRepair =
    before.staleRequests + before.unreadNotices + before.staleFineStatus > 0;

  if (!needsRepair) {
    console.log("\nNothing to repair. No changes were made.");
  } else if (!apply) {
    console.log(
      "\nDry run: no changes were made. Run with --apply to back up and repair.",
    );
  } else {
    console.log(`\nDatabase backup created: ${backupDatabase()}`);

    db.exec("BEGIN IMMEDIATE");

    try {
      // Record the history entry before the request's status changes.
      const events = db
        .prepare(
          `INSERT INTO payment_events (payment_id, event_type, details_json)
           SELECT p.id, 'CASH_REQUEST_CANCELLED',
             '{"source":"repair-cancelled-cash"}'
           ${STALE_REQUESTS}`,
        )
        .run();

      const requests = db
        .prepare(
          `UPDATE payments
           SET payment_status = 'CANCELLED'
           WHERE id IN (SELECT p.id ${STALE_REQUESTS})`,
        )
        .run();

      const notices = db
        .prepare(
          `UPDATE notifications
           SET is_read = 1
           WHERE notification_type = 'PAYMENT' AND is_read = 0
             AND related_payment_id IN (
               SELECT p.id
               FROM payments p
               JOIN fines f ON f.id = p.fine_id
               WHERE p.payment_method = 'CASH'
                 AND p.payment_status = 'CANCELLED'
                 AND f.cancelled_at IS NOT NULL
             )`,
        )
        .run();

      const fines = db
        .prepare(
          `UPDATE fines
           SET fine_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
           WHERE cancelled_at IS NOT NULL AND paid_at IS NULL
             AND fine_status <> 'CANCELLED'`,
        )
        .run();

      const after = snapshot();

      for (const [key, check] of Object.entries(CHECKS)) {
        if (check.guard && after[key] !== before[key]) {
          throw new Error(
            `${check.label} changed from ${before[key]} to ${after[key]}.`,
          );
        }
      }

      db.exec("COMMIT");

      console.log("\nChanges applied:");
      console.table([
        {
          change: "Cash requests set to CANCELLED",
          records: Number(requests.changes),
        },
        {
          change: "Admin PAYMENT notices marked read",
          records: Number(notices.changes),
        },
        {
          change: "Fine statuses set to CANCELLED",
          records: Number(fines.changes),
        },
        {
          change: "History events added",
          records: Number(events.changes),
        },
      ]);

      printCounts("After repair", after);
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
} catch (error) {
  console.error("\nCash request repair stopped:", error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
