// Server-side sessions.
//
// A sign-in token is only good while its session row is alive:
//   - logging out ends the session at once, so the token is dead everywhere;
//   - a session with no activity for 15 minutes ends (the app sends a short
//     "I am active" signal while someone is using it; background refreshes do
//     not count, so an unattended screen cannot keep a session open);
//   - a password change or reset ends the person's other sessions;
//   - locking, deactivating or changing the role of an account ends all of
//     its sessions.
// Sessions also keep the IP address and device, for the Log Trail.
const crypto = require("node:crypto");
const { EventEmitter } = require("node:events");
const jwt = require("jsonwebtoken");

const db = require("../database/database");
const { signingKey } = require("./secrets");

function positive(value, fallback) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : fallback;
}

// 15 minutes. SMARTFINE_IDLE_SECONDS exists so tests can use a short time.
const IDLE_SECONDS = Math.floor(positive(process.env.SMARTFINE_IDLE_SECONDS, 15 * 60));

// A session never lasts longer than this, however active.
const ABSOLUTE_SECONDS = 8 * 60 * 60;

// The app warns this long before the idle limit.
const WARNING_SECONDS = Math.min(120, Math.floor(IDLE_SECONDS / 4));

db.exec(`
  CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    last_activity_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    ended_at INTEGER,
    end_reason TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, ended_at);
`);

// Old sessions are not needed after a month.
db.prepare("DELETE FROM user_sessions WHERE COALESCE(ended_at, expires_at) < ?").run(
  Date.now() - 30 * 24 * 60 * 60 * 1000,
);

// Listeners (the live-update socket) hear about every ended session.
const events = new EventEmitter();

class SessionError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const MESSAGES = {
  INVALID_TOKEN: "Your session is invalid or has expired. Please sign in again.",
  SESSION_IDLE: "You were signed out after 15 minutes of inactivity. Please sign in again.",
  SESSION_ENDED: "You were signed out. Please sign in again.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
};

function reject(code) {
  return new SessionError(401, code, MESSAGES[code]);
}

// Creates a session and its signed token. `ipAddress` and `userAgent` are
// recorded as given (see clientDetails).
function startSession({ user, ipAddress = null, userAgent = null }) {
  const id = crypto.randomUUID();
  const now = Date.now();

  db.prepare(
    `INSERT INTO user_sessions (id, user_id, created_at, last_activity_at, expires_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, user.id, now, now, now + ABSOLUTE_SECONDS * 1000, ipAddress, userAgent);

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role, sid: id },
    signingKey(),
    { expiresIn: ABSOLUTE_SECONDS },
  );

  return { token, sessionId: id, idleSeconds: IDLE_SECONDS, warningSeconds: WARNING_SECONDS };
}

function endRow(row, reason) {
  const result = db
    .prepare("UPDATE user_sessions SET ended_at = ?, end_reason = ? WHERE id = ? AND ended_at IS NULL")
    .run(Date.now(), reason, row.id);

  if (Number(result.changes) === 1) {
    events.emit("ended", { sessionId: row.id, userId: Number(row.user_id) });
  }
}

// Decodes a token and checks its session. Throws SessionError when the token
// is not good any more, with a code the app understands.
function verifyToken(token) {
  let decoded;

  try {
    decoded = jwt.verify(String(token || ""), signingKey());
  } catch {
    throw reject("INVALID_TOKEN");
  }

  // Tokens made before sessions existed carry no session ID.
  if (!decoded.sid) {
    throw reject("INVALID_TOKEN");
  }

  const row = db.prepare("SELECT * FROM user_sessions WHERE id = ?").get(decoded.sid);

  if (!row || Number(row.user_id) !== Number(decoded.userId)) {
    throw reject("INVALID_TOKEN");
  }

  const now = Date.now();

  if (row.ended_at) {
    throw reject(row.end_reason === "IDLE" ? "SESSION_IDLE" : "SESSION_ENDED");
  }

  if (now > Number(row.expires_at)) {
    endRow(row, "EXPIRED");
    throw reject("SESSION_EXPIRED");
  }

  if (now - Number(row.last_activity_at) > IDLE_SECONDS * 1000) {
    endRow(row, "IDLE");
    throw reject("SESSION_IDLE");
  }

  return { ...decoded, sid: row.id };
}

// The session a token names, whatever its state (so logging out with an
// already-ended session still works quietly).
function peek(token) {
  try {
    const decoded = jwt.verify(String(token || ""), signingKey());

    return decoded.sid ? db.prepare("SELECT * FROM user_sessions WHERE id = ?").get(decoded.sid) || null : null;
  } catch {
    return null;
  }
}

// "I am using the app": keeps the session from going idle.
function touch(sessionId) {
  db.prepare("UPDATE user_sessions SET last_activity_at = ? WHERE id = ? AND ended_at IS NULL").run(
    Date.now(),
    sessionId,
  );
}

function end(sessionId, reason) {
  const row = db.prepare("SELECT * FROM user_sessions WHERE id = ?").get(sessionId);

  if (row && !row.ended_at) {
    endRow(row, reason);
  }
}

// Ends every live session of a person, except `exceptSessionId`.
function endAllForUser(userId, reason, exceptSessionId = null) {
  const rows = db
    .prepare("SELECT * FROM user_sessions WHERE user_id = ? AND ended_at IS NULL AND id != ?")
    .all(userId, exceptSessionId || "");

  rows.forEach((row) => endRow(row, reason));

  return rows.length;
}

// Whether a session is still good right now (the live-update socket asks).
function isLive(sessionId) {
  const row = db.prepare("SELECT * FROM user_sessions WHERE id = ?").get(sessionId);
  const now = Date.now();

  return Boolean(
    row &&
      !row.ended_at &&
      now <= Number(row.expires_at) &&
      now - Number(row.last_activity_at) <= IDLE_SECONDS * 1000,
  );
}

// The IP address (as the server sees it) and the device of a request.
function clientDetails(req) {
  return {
    ipAddress: String(req.ip || req.socket?.remoteAddress || "").replace(/^::ffff:/, "") || null,
    userAgent: String(req.headers?.["user-agent"] || "").slice(0, 200) || null,
  };
}

module.exports = {
  ABSOLUTE_SECONDS,
  IDLE_SECONDS,
  SessionError,
  WARNING_SECONDS,
  clientDetails,
  end,
  endAllForUser,
  events,
  isLive,
  peek,
  startSession,
  touch,
  verifyToken,
};
