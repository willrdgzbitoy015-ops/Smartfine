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

module.exports = { isValidEmail };
