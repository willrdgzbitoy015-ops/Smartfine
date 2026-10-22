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

module.exports = { signingKey };
