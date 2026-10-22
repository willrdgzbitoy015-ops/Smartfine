// One-time codes (OTP) for first sign-in and for changing an email address.
//
// - A code is 6 digits, expires after 10 minutes and works once.
// - 5 wrong tries end the request; the person must start again.
// - A new code can be requested only 60 seconds after the last one, up to 5
//   times, and only within 30 minutes of the first.
// - Codes are never stored: only a keyed hash is, so neither the database nor
//   the logs ever hold a usable code.
// - Requests live in the database, so a backend restart does not lose them.
const crypto = require("node:crypto");

const db = require("../database/database");
const { MailError, codeEmail, sendMail } = require("./mailer");
const { signingKey } = require("./secrets");

const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;
const MAX_SENDS = 5;
const MAX_LIFETIME_MINUTES = 30;
const STEP_MINUTES = 10;

const PURPOSES = {
  FIRST_LOGIN: {
    subject: "Your SmartFine verification code",
    intro: "Use this code to verify your email and finish setting up your SmartFine account:",
  },
  EMAIL_CHANGE: {
    subject: "Confirm your new SmartFine email",
    intro: "Use this code to confirm this email address for your SmartFine account:",
  },
};

db.exec(`
  CREATE TABLE IF NOT EXISTS otp_challenges (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL CHECK (purpose IN ('FIRST_LOGIN', 'EMAIL_CHANGE')),
    target_email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    send_count INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    resend_available_at INTEGER NOT NULL,
    verified_at INTEGER,
    step_token_hash TEXT,
    used_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_otp_user_purpose ON otp_challenges(user_id, purpose);
`);

class OtpError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

function mailError(error) {
  if (error instanceof MailError && error.code === "EMAIL_NOT_CONFIGURED") {
    return new OtpError(
      503,
      "EMAIL_NOT_CONFIGURED",
      "The SmartFine email service is not set up, so a verification code cannot be sent. Please contact the administrator.",
    );
  }

  return new OtpError(
    502,
    "EMAIL_SEND_FAILED",
    "The verification email could not be sent. Please try again in a moment.",
  );
}

function hashValue(value, challengeId) {
  return crypto
    .createHmac("sha256", signingKey())
    .update(`otp:${challengeId}:${value}`)
    .digest("hex");
}

function sameHash(a, b) {
  const first = Buffer.from(String(a || ""), "hex");
  const second = Buffer.from(String(b || ""), "hex");

  return first.length > 0 && first.length === second.length && crypto.timingSafeEqual(first, second);
}

function newCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function maskEmail(email) {
  const [name = "", domain = ""] = String(email || "").split("@");

  if (!domain) return "";

  const visible = name.length <= 2 ? name.charAt(0) : name.slice(0, 2);

  return `${visible}${"*".repeat(Math.max(name.length - visible.length, 2))}@${domain}`;
}

function seconds(milliseconds) {
  return Math.max(0, Math.ceil(milliseconds / 1000));
}

function info(row, now = Date.now()) {
  return {
    challengeId: row.id,
    maskedEmail: maskEmail(row.target_email),
    expiresInSeconds: seconds(row.expires_at - now),
    resendAfterSeconds: seconds(row.resend_available_at - now),
  };
}

function loadOpen(challengeId, purpose, userId) {
  const row = db
    .prepare("SELECT * FROM otp_challenges WHERE id = ?")
    .get(String(challengeId || ""));

  if (
    !row ||
    row.purpose !== purpose ||
    row.used_at ||
    (userId !== null && Number(row.user_id) !== Number(userId))
  ) {
    throw new OtpError(
      400,
      "INVALID_CHALLENGE",
      "This verification request is no longer valid. Please start again.",
    );
  }

  return row;
}

// Starts a verification and emails the first code. If a code was sent less
// than a minute ago, `reuseRecent` hands back that request instead of sending
// another email; otherwise the person must wait.
async function issue({ userId, purpose, targetEmail, name, reuseRecent = false }) {
  const now = Date.now();

  const open = db
    .prepare(
      `SELECT * FROM otp_challenges
       WHERE user_id = ? AND purpose = ? AND used_at IS NULL AND verified_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId, purpose);

  if (open && open.expires_at > now && open.resend_available_at > now) {
    if (reuseRecent) {
      return info(open, now);
    }

    throw new OtpError(
      429,
      "RESEND_WAIT",
      `Please wait ${seconds(open.resend_available_at - now)} seconds before asking for another code.`,
      { retryAfterSeconds: seconds(open.resend_available_at - now) },
    );
  }

  // Only the newest request for this person and purpose stays valid.
  db.prepare(
    "UPDATE otp_challenges SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL",
  ).run(now, userId, purpose);

  const id = crypto.randomUUID();
  const code = newCode();

  db.prepare(
    `INSERT INTO otp_challenges
       (id, user_id, purpose, target_email, code_hash, created_at, expires_at, resend_available_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    userId,
    purpose,
    targetEmail,
    hashValue(code, id),
    now,
    now + CODE_MINUTES * 60 * 1000,
    now + RESEND_SECONDS * 1000,
  );

  try {
    await sendMail({
      to: targetEmail,
      ...codeEmail({ name, code, minutes: CODE_MINUTES, ...PURPOSES[purpose] }),
    });
  } catch (error) {
    db.prepare("DELETE FROM otp_challenges WHERE id = ?").run(id);
    throw mailError(error);
  }

  return info(db.prepare("SELECT * FROM otp_challenges WHERE id = ?").get(id), now);
}

// A fresh code for an open request, after the waiting time.
async function resend({ challengeId, purpose, userId = null, name }) {
  const row = loadOpen(challengeId, purpose, userId);
  const now = Date.now();

  if (row.verified_at) {
    throw new OtpError(400, "INVALID_CHALLENGE", "This code was already used. Please start again.");
  }

  if (now - row.created_at > MAX_LIFETIME_MINUTES * 60 * 1000 || row.send_count >= MAX_SENDS) {
    throw new OtpError(
      429,
      "TOO_MANY_CODES",
      "Too many codes were requested. Please start again.",
    );
  }

  if (now < row.resend_available_at) {
    throw new OtpError(
      429,
      "RESEND_WAIT",
      `Please wait ${seconds(row.resend_available_at - now)} seconds before asking for another code.`,
      { retryAfterSeconds: seconds(row.resend_available_at - now) },
    );
  }

  const code = newCode();

  try {
    await sendMail({
      to: row.target_email,
      ...codeEmail({ name, code, minutes: CODE_MINUTES, ...PURPOSES[purpose] }),
    });
  } catch (error) {
    throw mailError(error);
  }

  db.prepare(
    `UPDATE otp_challenges
     SET code_hash = ?, attempts = 0, send_count = send_count + 1,
         expires_at = ?, resend_available_at = ?
     WHERE id = ? AND used_at IS NULL`,
  ).run(
    hashValue(code, row.id),
    now + CODE_MINUTES * 60 * 1000,
    now + RESEND_SECONDS * 1000,
    row.id,
  );

  return info(db.prepare("SELECT * FROM otp_challenges WHERE id = ?").get(row.id), now);
}

// Checks a code. Returns the request when it is right; the caller then
// finishes with markVerified() or markUsed().
function checkCode({ challengeId, code, purpose, userId = null }) {
  const row = loadOpen(challengeId, purpose, userId);
  const now = Date.now();

  if (row.verified_at) {
    throw new OtpError(400, "CODE_ALREADY_USED", "This code was already used. Please start again.");
  }

  if (now > row.expires_at) {
    throw new OtpError(410, "CODE_EXPIRED", "This code has expired. Please ask for a new one.");
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    throw new OtpError(
      429,
      "TOO_MANY_ATTEMPTS",
      "Too many incorrect codes. Please start again.",
    );
  }

  const entered = String(code ?? "").trim();

  if (!/^\d{6}$/.test(entered)) {
    throw new OtpError(400, "INVALID_CODE_FORMAT", "Please enter the 6-digit code.");
  }

  if (!sameHash(hashValue(entered, row.id), row.code_hash)) {
    const attempts = row.attempts + 1;
    const remaining = MAX_ATTEMPTS - attempts;

    db.prepare("UPDATE otp_challenges SET attempts = ? WHERE id = ?").run(attempts, row.id);

    if (remaining <= 0) {
      // The request is over; a new one is needed.
      db.prepare("UPDATE otp_challenges SET used_at = ? WHERE id = ?").run(now, row.id);

      throw new OtpError(
        429,
        "TOO_MANY_ATTEMPTS",
        "Too many incorrect codes. Please start again.",
      );
    }

    throw new OtpError(
      400,
      "CODE_INCORRECT",
      `That code is not correct. ${remaining} ${remaining === 1 ? "attempt" : "attempts"} remaining.`,
      { attemptsRemaining: remaining },
    );
  }

  return row;
}

// The code was right but more is to come (first sign-in): hands out a token
// that the next step must present, and spends the code.
function markVerified(challengeId) {
  const stepToken = crypto.randomBytes(24).toString("hex");

  const result = db
    .prepare(
      `UPDATE otp_challenges
       SET verified_at = ?, step_token_hash = ?
       WHERE id = ? AND verified_at IS NULL AND used_at IS NULL`,
    )
    .run(Date.now(), hashValue(stepToken, challengeId), challengeId);

  if (Number(result.changes) !== 1) {
    throw new OtpError(400, "CODE_ALREADY_USED", "This code was already used. Please start again.");
  }

  return { stepToken, expiresInSeconds: STEP_MINUTES * 60 };
}

// The next step after markVerified(): checks the token and the time limit.
function checkStep({ challengeId, stepToken, purpose, userId = null }) {
  const row = loadOpen(challengeId, purpose, userId);

  if (
    !row.verified_at ||
    !sameHash(hashValue(String(stepToken || ""), row.id), row.step_token_hash) ||
    Date.now() - row.verified_at > STEP_MINUTES * 60 * 1000
  ) {
    throw new OtpError(
      400,
      "INVALID_CHALLENGE",
      "This verification has expired. Please start again.",
    );
  }

  return row;
}

// Ends the request for good. Returns false if someone else already did.
function markUsed(challengeId) {
  const result = db
    .prepare("UPDATE otp_challenges SET used_at = ? WHERE id = ? AND used_at IS NULL")
    .run(Date.now(), challengeId);

  return Number(result.changes) === 1;
}

// Sends the right HTTP answer for an OTP problem.
function sendOtpError(res, error) {
  if (error instanceof OtpError) {
    return res.status(error.status).json({
      success: false,
      code: error.code,
      message: error.message,
      ...error.extra,
    });
  }

  throw error;
}

module.exports = {
  CODE_MINUTES,
  OtpError,
  checkCode,
  checkStep,
  issue,
  markUsed,
  markVerified,
  maskEmail,
  resend,
  sendOtpError,
};
