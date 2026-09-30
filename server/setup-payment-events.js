const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const dbPath = path.join(__dirname, "database", "smartfine.db");
const backupDirectory = path.join(__dirname, "database", "backups");

if (!fs.existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`);
  process.exit(1);
}

fs.mkdirSync(backupDirectory, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = path.join(
  backupDirectory,
  `smartfine-before-payments-${timestamp}.db`,
);

fs.copyFileSync(dbPath, backupPath, fs.constants.COPYFILE_EXCL);
console.log(`Database backup created: ${backupPath}`);

const db = new DatabaseSync(dbPath);

try {
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("BEGIN IMMEDIATE;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      payment_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,

      actor_user_id INTEGER,
      gateway_event_id TEXT,

      details_json TEXT,

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (payment_id)
        REFERENCES payments(id),

      FOREIGN KEY (actor_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id
    ON payment_events(payment_id);
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_gateway_event_id
    ON payment_events(gateway_event_id)
    WHERE gateway_event_id IS NOT NULL;
  `);

  db.exec("COMMIT;");

  const result = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'payment_events'",
    )
    .get();

  console.log(
    result
      ? "Success: payment_events table is ready."
      : "The payment_events table was not found.",
  );
} catch (error) {
  try {
    db.exec("ROLLBACK;");
  } catch {
    // No active transaction remains.
  }

  console.error("Payment database setup failed:", error);
  process.exitCode = 1;
} finally {
  db.close();
}
