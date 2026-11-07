// Creates a new, empty SmartFine database with one administrator account.
//
//   1. Copy server/.env.example to server/.env and fill in
//      INIT_ADMIN_USERNAME, INIT_ADMIN_EMAIL and INIT_ADMIN_PASSWORD.
//   2. From the server folder: node init-db.js
//   3. Start the backend (node server.js) and sign in with that username or
//      email. You can then delete the INIT_ADMIN_* lines from server/.env.
//
// The tables come from database/schema.sql (structure only, no data). The
// script refuses to run when database/smartfine.db already exists, so it can
// never overwrite a database that holds real records. (The one exception is
// an empty 0-byte file, which `node server.js` leaves behind when it is
// started before this script; it holds nothing and is replaced.)
const fs = require("node:fs");
const path = require("node:path");

require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const bcrypt = require("bcryptjs");
const { DatabaseSync } = require("node:sqlite");
const { isValidEmail, validatePasswordPolicy } = require("./security/validation");

const DB_PATH = path.join(__dirname, "database", "smartfine.db");
const SCHEMA_PATH = path.join(__dirname, "database", "schema.sql");

// Same username rule as "Add Administrator" (routes/admins.js).
const USERNAME_PATTERN = /^[A-Za-z0-9]{3,30}$/;

function fail(message) {
  console.error(message);
  process.exit(1);
}

// True when smartfine.db exists and is not the empty 0-byte file.
function databaseExists() {
  try {
    return fs.statSync(DB_PATH).size > 0;
  } catch {
    return false;
  }
}

async function main() {
  if (databaseExists()) {
    fail(
      `${DB_PATH} already exists. Nothing was changed.\n` +
        "init-db.js only creates a new database; move or rename the existing file first if you really want a fresh one.",
    );
  }

  const username = String(process.env.INIT_ADMIN_USERNAME || "").trim();
  const email = String(process.env.INIT_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.INIT_ADMIN_PASSWORD || "");

  if (!username || !email || !password) {
    fail("Set INIT_ADMIN_USERNAME, INIT_ADMIN_EMAIL and INIT_ADMIN_PASSWORD in server/.env first (see server/.env.example).");
  }

  if (!USERNAME_PATTERN.test(username)) {
    fail("INIT_ADMIN_USERNAME must be 3 to 30 letters or numbers, with no spaces.");
  }

  if (!isValidEmail(email)) {
    fail("INIT_ADMIN_EMAIL is not a valid email address.");
  }

  const policy = validatePasswordPolicy(password);

  if (!policy.valid) {
    fail(`INIT_ADMIN_PASSWORD: ${policy.message}`);
  }

  // Same hashing as the routes that create accounts.
  const passwordHash = await bcrypt.hash(password, 10);
  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");

  // Build the database under a temporary name and rename it at the end, so a
  // failure never leaves a half-made smartfine.db behind.
  const tempPath = `${DB_PATH}.init-${process.pid}`;
  const db = new DatabaseSync(tempPath);

  try {
    db.exec("BEGIN;");
    db.exec(schema);

    // needs_first_login = 0: this account skips the first sign-in email code
    // (the email service may not be set up yet). is_verified stays 0 because
    // the address has not been confirmed; Change Email in the app confirms it.
    db.prepare(
      `INSERT INTO users (
         username, first_name, last_name, email, password_hash,
         role, account_status, is_verified, needs_first_login
       ) VALUES (?, 'System', 'Administrator', ?, ?, 'ADMIN', 'ACTIVE', 0, 0)`,
    ).run(username, email, passwordHash);

    db.exec("COMMIT;");
    db.close();
  } catch (error) {
    try {
      db.close();
    } catch {}
    fs.rmSync(tempPath, { force: true });
    fail(`Could not create the database: ${error.message}`);
  }

  if (databaseExists()) {
    fs.rmSync(tempPath, { force: true });
    fail(`${DB_PATH} appeared while this script was running. Nothing was changed.`);
  }

  fs.rmSync(DB_PATH, { force: true }); // only ever the empty 0-byte file here
  fs.renameSync(tempPath, DB_PATH);

  console.log(`Created ${path.relative(process.cwd(), DB_PATH) || DB_PATH}`);
  console.log(`Administrator: ${username} (${email})`);
  console.log("Start the backend with `node server.js` and sign in with that username or email.");
  console.log("You can now remove INIT_ADMIN_PASSWORD from server/.env.");
}

main().catch((error) => fail(error.message));
