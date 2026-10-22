// Request hardening for every route:
//   - security headers (no sniffing, no framing, no caching of API answers);
//   - sanitizeInput: JSON bodies are cleaned before any route sees them
//     (control characters and HTML tags removed, text normalized, limits on
//     size and depth, dangerous keys dropped). Passwords, one-time codes and
//     tokens are never touched;
//   - safe errors: malformed requests and unexpected failures answer with a
//     short message, never a stack trace or database text.
// The database is only ever reached with parameterized queries (? placeholders).

const MAX_TEXT = 5000;
const MAX_DEPTH = 8;
const MAX_ITEMS = 5000;

// Control characters except tab, line feed and carriage return.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

// <b>, </script>, <img src=x onerror=...>, <!-- -->
const TAGS = /<\/?[a-zA-Z!][^>]*>/g;

// Credentials, codes and tokens are used exactly as typed.
const LEAVE_ALONE = /pass(word)?|secret|token|code|answer|otp/i;

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

// The only fields that may hold a list: each item is a row of plain values
// (the student import). Everything else in a body must be plain text, a
// number, true/false or empty, so a list or object can never pose as a name,
// a role or an amount.
const ROW_LISTS = new Set(["students"]);

// Called by the payment provider, not by the app: its body is used as sent.
const UNTOUCHED = /^\/api\/payments\/paymongo\/webhook(\/|$)/i;

class InputError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function cleanText(value) {
  return value.normalize("NFC").replace(CONTROL, "").replace(TAGS, "");
}

function clean(value, key, depth) {
  if (depth > MAX_DEPTH) {
    throw new InputError("INPUT_TOO_DEEP", "The request is too complicated.");
  }

  if (typeof value === "string") {
    if (value.length > MAX_TEXT) {
      throw new InputError("INPUT_TOO_LONG", "One of the fields is too long.");
    }

    return LEAVE_ALONE.test(key) ? value : cleanText(value);
  }

  if (Array.isArray(value)) {
    if (value.length > MAX_ITEMS) {
      throw new InputError("INPUT_TOO_LARGE", "The request has too many items.");
    }

    return value.map((item) => clean(item, key, depth + 1));
  }

  if (value && typeof value === "object") {
    const result = {};

    for (const [name, item] of Object.entries(value)) {
      if (DANGEROUS_KEYS.has(name)) continue;

      result[name] = clean(item, name, depth + 1);
    }

    return result;
  }

  return value;
}

function checkShape(body) {
  if (Array.isArray(body)) {
    throw new InputError("INVALID_BODY", "The request has the wrong format.");
  }

  for (const [name, value] of Object.entries(body)) {
    if (value && typeof value === "object") {
      const rows = ROW_LISTS.has(name) && Array.isArray(value);

      const plainRows =
        rows &&
        value.every(
          (row) =>
            row &&
            typeof row === "object" &&
            !Array.isArray(row) &&
            Object.values(row).every((item) => item === null || typeof item !== "object"),
        );

      if (!plainRows) {
        throw new InputError("INVALID_FIELD", `The "${name}" field has the wrong format.`);
      }
    }
  }
}

function sanitizeInput(req, res, next) {
  if (UNTOUCHED.test(req.path)) {
    return next();
  }

  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    try {
      checkShape(req.body);
      req.body = clean(req.body, "", 0);
    } catch (error) {
      if (error instanceof InputError) {
        return res.status(400).json({ success: false, code: error.code, message: error.message });
      }

      throw error;
    }
  }

  next();
}

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");

  // Answers from the API hold personal data: browsers and proxies must not
  // keep them. (A route that wants caching sets its own header afterwards.)
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store");
  }

  if (req.secure) {
    res.setHeader("Strict-Transport-Security", "max-age=15552000");
  }

  next();
}

function notFound(req, res) {
  res.status(404).json({ success: false, code: "NOT_FOUND", message: "Not found." });
}

// The last stop for anything a route did not answer itself.
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      code: "INVALID_JSON",
      message: "The request could not be read.",
    });
  }

  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      code: "REQUEST_TOO_LARGE",
      message: "The request is too large.",
    });
  }

  const status = Number(error?.status || error?.statusCode);

  if (status >= 400 && status < 500) {
    return res.status(status).json({
      success: false,
      code: "BAD_REQUEST",
      message: "The request could not be processed.",
    });
  }

  console.error("Unhandled error:", error);

  return res.status(500).json({
    success: false,
    code: "SERVER_ERROR",
    message: "Something went wrong. Please try again.",
  });
}

module.exports = { errorHandler, notFound, sanitizeInput, securityHeaders };
