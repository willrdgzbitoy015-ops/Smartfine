const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const dbPath = path.join(__dirname, "database", "smartfine.db");

if (!fs.existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`);
  process.exit(1);
}

const db = new DatabaseSync(dbPath, { readOnly: true });

try {
  for (const name of ["users", "students", "fines", "payments"]) {
    const table = db
      .prepare(
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?",
      )
      .get(name);

    console.log(`\n=== ${name} ===`);
    console.log(table?.sql || "Table does not exist");
  }

  console.log("\n=== payments foreign keys ===");
  console.log(db.prepare("PRAGMA foreign_key_list(payments)").all());
} finally {
  db.close();
}
