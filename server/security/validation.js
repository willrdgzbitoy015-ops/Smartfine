// Shared checks for values people type, used by every route that accepts them.

// name@domain.tld: letters, digits and the usual symbols before the @ (no
// leading, trailing or doubled dots); a domain of dot-separated labels; and a
// top-level domain of at least two letters.
const EMAIL =
  /^(?!\.)(?!.*\.\.)[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+(?<!\.)@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

function isValidEmail(value) {
  if (typeof value !== "string") return false;

  const text = value.trim();

  return text.length <= 254 && text.split("@")[0].length <= 64 && EMAIL.test(text);
}

// Password rules for every account: 8 to 72 characters (bcrypt only uses the
// first 72 bytes), with a lowercase and an uppercase letter, a number and a
// special character. Used by the routes and by init-db.js.
function validatePasswordPolicy(password) {
  const value = String(password || "");

  // Only the first 72 bytes of a password are used by the hashing, so longer
  // ones are refused instead of being silently cut.
  if (Buffer.byteLength(value, "utf8") > 72) {
    return {
      valid: false,
      code: "PASSWORD_TOO_LONG",
      message: "Password must not exceed 72 characters.",
    };
  }

  if (value.length < 8) {
    return {
      valid: false,
      code: "PASSWORD_TOO_SHORT",
      message: "Password must contain at least 8 characters.",
    };
  }

  if (!/[a-z]/.test(value)) {
    return {
      valid: false,
      code: "PASSWORD_LOWERCASE_REQUIRED",
      message: "Password must contain at least one lowercase letter.",
    };
  }

  if (!/[A-Z]/.test(value)) {
    return {
      valid: false,
      code: "PASSWORD_UPPERCASE_REQUIRED",
      message: "Password must contain at least one uppercase letter.",
    };
  }

  if (!/[0-9]/.test(value)) {
    return {
      valid: false,
      code: "PASSWORD_NUMBER_REQUIRED",
      message: "Password must contain at least one number.",
    };
  }

  if (!/[^A-Za-z0-9\s]/.test(value)) {
    return {
      valid: false,
      code: "PASSWORD_SPECIAL_CHARACTER_REQUIRED",
      message: "Password must contain at least one special character.",
    };
  }

  return {
    valid: true,
  };
}

module.exports = { isValidEmail, validatePasswordPolicy };
