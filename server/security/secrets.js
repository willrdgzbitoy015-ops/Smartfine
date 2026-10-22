// The key that signs sign-in tokens and hashes one-time codes.
//
// Set SMARTFINE_SECRET in server/.env to your own long random value. Without
// it the built-in development value is used, which keeps sign-ins working on a
// developer's machine but is NOT private (it is in the source code).
const DEVELOPMENT_KEY = "REMOVED";

function signingKey() {
  const configured = String(process.env.SMARTFINE_SECRET || "").trim();

  return configured || DEVELOPMENT_KEY;
}

module.exports = { signingKey };
