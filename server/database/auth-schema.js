// Account columns added for first-login verification. Older databases get
// them when the backend starts; existing accounts are not changed (0 means
// "no first-login check", so people already using SmartFine are not forced
// through it).
const db = require("./database");

const columns = new Set(
  db.prepare("PRAGMA table_info(users)").all().map((column) => column.name),
);

// 1 = a new account that must verify its email and choose its own password at
// the first sign-in.
if (!columns.has("needs_first_login")) {
  db.exec(
    "ALTER TABLE users ADD COLUMN needs_first_login INTEGER NOT NULL DEFAULT 0",
  );
}
