// Checks for what people type. The server repeats every one of them
// (server/security/validation.js and the password policy in routes/auth.js);
// these give the answer straight away, before anything is sent.

// name@domain.tld: letters, digits and the usual symbols before the @ (no
// leading, trailing or doubled dots); a domain of dot-separated labels; and a
// top-level domain of at least two letters.
const EMAIL =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

export function isValidEmail(value: string) {
  const text = String(value ?? "").trim();
  const local = text.split("@")[0];

  return (
    text.length <= 254 &&
    local.length <= 64 &&
    !local.startsWith(".") &&
    !local.endsWith(".") &&
    !text.includes("..") &&
    EMAIL.test(text)
  );
}

// Only the first 72 bytes of a password are used by the hashing, so longer
// passwords are refused instead of being silently cut short.
export const MAX_PASSWORD_BYTES = 72;

export function passwordBytes(value: string) {
  let bytes = 0;

  for (const character of String(value ?? "")) {
    const code = character.codePointAt(0) ?? 0;

    bytes += code > 0xffff ? 4 : code > 0x7ff ? 3 : code > 0x7f ? 2 : 1;
  }

  return bytes;
}

export const PASSWORD_TOO_LONG_MESSAGE = "Password must not exceed 72 characters.";
