// One-time backfill so existing records appear in the notification lists.
//   - Students: a "New Fine Issued" notice for each existing fine, keeping the
//     current My Fines read state (cancelled fines are added as read).
//   - Admins: a read "Payment Collected" Reports entry for each past cash
//     collection, so history shows without new alerts.
// Safe to run more than once: only missing notices are added.
//
//   Dry run, no changes:    node server/backfill-notifications.js
//   Back up, then add:      node server/backfill-notifications.js --apply
const fs = require("node:fs");
const path = require("node:path");
const db = require("./database/database");

const apply = process.argv.includes("--apply");

const MISSING_FINE_NOTICES = `
  FROM fines f
  JOIN users student
    ON student.id = f.student_id
   AND student.role = 'STUDENT'
   AND student.account_status = 'ACTIVE'
  LEFT JOIN violation_types vt ON vt.id = f.violation_type_id
  LEFT JOIN student_fine_reads sfr
    ON sfr.student_id = f.student_id AND sfr.fine_id = f.id
  WHERE NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = f.student_id
      AND n.related_fine_id = f.id
      AND n.notification_type = 'FINE'
      AND n.title = 'New Fine Issued'
  )`;

const MISSING_COLLECTION_NOTICES = `
  FROM payments p
  JOIN fines f ON f.id = p.fine_id
  JOIN users admin
    ON admin.role = 'ADMIN' AND admin.account_status = 'ACTIVE'
  WHERE p.payment_method = 'CASH'
    AND p.payment_status = 'SUCCESS'
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = admin.id
        AND n.related_payment_id = p.id
        AND n.notification_type = 'SYSTEM'
        AND n.title = 'Payment Collected'
    )`;

function snapshot() {
  const count = (sql) => Number(db.prepare(sql).get().count);
  return {
    missingFineNotices: count(
      `SELECT COUNT(*) AS count ${MISSING_FINE_NOTICES}`,
    ),
    missingUnreadFineNotices: count(
      `SELECT COUNT(*) AS count ${MISSING_FINE_NOTICES}
         AND sfr.fine_id IS NULL AND f.cancelled_at IS NULL`,
    ),
    missingCollectionNotices: count(
      `SELECT COUNT(*) AS count ${MISSING_COLLECTION_NOTICES}`,
    ),
    totalNotifications: count("SELECT COUNT(*) AS count FROM notifications"),
  };
}

function printCounts(title, counts) {
  console.log(`\n${title}`);
  console.table([
    {
      check: "Student fines without a New Fine Issued notice",
      records: counts.missingFineNotices,
    },
    {
      check: "  ...of those, unread in My Fines (will be NEW)",
      records: counts.missingUnreadFineNotices,
    },
    {
      check: "Past cash collections without an Admin Reports entry",
      records: counts.missingCollectionNotices,
    },
    { check: "All notifications", records: counts.totalNotifications },
  ]);
}

function backupDatabase() {
  const directory = path.join(__dirname, "database", "backups");
  fs.mkdirSync(directory, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    directory,
    `smartfine-before-notification-backfill-${timestamp}.db`,
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
  printCounts("Before backfill", before);

  if (before.missingFineNotices + before.missingCollectionNotices === 0) {
    console.log("\nNothing to backfill. No changes were made.");
  } else if (!apply) {
    console.log(
      "\nDry run: no changes were made. Run with --apply to back up and add them.",
    );
  } else {
    console.log(`\nDatabase backup created: ${backupDatabase()}`);

    db.exec("BEGIN IMMEDIATE");

    try {
      const fineNotices = db
        .prepare(
          `INSERT INTO notifications (
             user_id, notification_type, title, message,
             related_fine_id, is_read, created_at
           )
           SELECT
             f.student_id,
             'FINE',
             'New Fine Issued',
             COALESCE(vt.violation_name, 'Violation') ||
               ' — ' || printf('₱%.2f', f.amount_centavos / 100.0) ||
               ' was recorded on your account (' || f.fine_reference || ').',
             f.id,
             CASE
               WHEN sfr.fine_id IS NOT NULL OR f.cancelled_at IS NOT NULL
                 THEN 1
               ELSE 0
             END,
             f.created_at
           ${MISSING_FINE_NOTICES}`,
        )
        .run();

      const collectionNotices = db
        .prepare(
          `INSERT INTO notifications (
             user_id, notification_type, title, message,
             related_fine_id, related_payment_id, is_read, created_at
           )
           SELECT
             admin.id,
             'SYSTEM',
             'Payment Collected',
             'Cash payment collected for ' || f.fine_reference ||
               ' — ' || printf('₱%.2f', p.amount_centavos / 100.0) || '.',
             p.fine_id,
             p.id,
             1,
             COALESCE(p.paid_at, p.confirmed_at, p.created_at)
           ${MISSING_COLLECTION_NOTICES}`,
        )
        .run();

      db.exec("COMMIT");

      console.log("\nNotices added:");
      console.table([
        {
          change: "Student New Fine Issued notices",
          records: Number(fineNotices.changes),
        },
        {
          change: "Admin Reports Payment Collected entries (read)",
          records: Number(collectionNotices.changes),
        },
      ]);

      printCounts("After backfill", snapshot());
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
} catch (error) {
  console.error("\nNotification backfill stopped:", error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
