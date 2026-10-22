// The key that signs sign-in tokens and hashes one-time codes.
//
// Order of use:
//   1. SMARTFINE_SECRET in server/.env (at least 16 characters), if you set it;
//   2. otherwise a random key that SmartFine creates once and keeps in
//      server/.signing-key (kept out of git; delete the file to sign everyone
//      out and make a new key).
// The key is never in the source code.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const KEY_FILE = path.join(__dirname, "..", ".signing-key");

let cached = null;

function signingKey() {
  if (cached) {
    return cached;
  }

  const configured = String(process.env.SMARTFINE_SECRET || "").trim();

  if (configured.length >= 16) {
    cached = configured;
    return cached;
  }

  try {
    const stored = fs.readFileSync(KEY_FILE, "utf8").trim();

    if (stored.length >= 32) {
      cached = stored;
      return cached;
    }
  } catch {
    // No key yet: make one below.
  }

  const generated = crypto.randomBytes(48).toString("hex");

  fs.writeFileSync(KEY_FILE, generated, { mode: 0o600 });

  console.log("Created a private signing key in server/.signing-key (do not share or commit it).");

  cached = generated;
  return cached;
}

// The key that encrypts database backups (AES-256).
//
//   1. SMARTFINE_BACKUP_KEY in server/.env (at least 16 characters), if you
//      set it: keep a copy somewhere safe, away from this computer;
//   2. otherwise a random key SmartFine creates once and keeps in
//      server/.backup-key (kept out of git).
// Without this key a backup cannot be opened, so keep a copy of it.
const BACKUP_KEY_FILE = path.join(__dirname, "..", ".backup-key");

let backupCached = null;

function backupKey() {
  if (backupCached) {
    return backupCached;
  }

  const configured = String(process.env.SMARTFINE_BACKUP_KEY || "").trim();

  if (configured.length >= 16) {
    backupCached = crypto.scryptSync(configured, "smartfine-backup-key-v1", 32);
    return backupCached;
  }

  try {
    const stored = fs.readFileSync(BACKUP_KEY_FILE, "utf8").trim();

    if (/^[0-9a-f]{64}$/i.test(stored)) {
      backupCached = Buffer.from(stored, "hex");
      return backupCached;
    }
  } catch {
    // No key yet: make one below.
  }

  const generated = crypto.randomBytes(32);

  fs.writeFileSync(BACKUP_KEY_FILE, generated.toString("hex"), { mode: 0o600 });

  console.log("Created the backup encryption key in server/.backup-key (keep a copy somewhere safe; do not commit it).");

  backupCached = generated;
  return backupCached;
}

module.exports = { backupKey, signingKey };
