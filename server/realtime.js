// Live updates: tells every signed-in app that SmartFine data changed, so
// open screens reload without a manual refresh.
//
// A message carries only topic names, never records. The app answers by
// reloading through the normal API, which still checks who may see what.
const { Server } = require("socket.io");

const db = require("./database/database");

const ALL_TOPICS = ["fines", "payments", "refunds", "people", "settings", "activity"];

// What a successful change under each API path touches. The first matching
// prefix wins, so the narrow ones come first.
const TOPICS_BY_PREFIX = [
  // A student opening a fine only changes their own read marks.
  ["/api/fines/my-fines", []],
  ["/api/fines", ["fines"]],
  ["/api/payments", ["fines", "payments"]],
  ["/api/refunds", ["fines", "payments", "refunds"]],
  ["/api/students", ["people", "fines"]],
  ["/api/officers", ["people", "fines"]],
  ["/api/admins", ["people"]],
  // Locking an account or changing a role or email changes people's records.
  ["/api/access", ["people", "activity"]],
  ["/api/account/email", ["people", "activity"]],
  // Signing in, out and the like only show in the Log Trail. The "I am active"
  // signal and the lockout check are sent all the time and say nothing new.
  ["/api/auth/activity", []],
  ["/api/auth/login-status", []],
  ["/api/auth/captcha", []],
  ["/api/auth", ["activity"]],
  ["/api/settings", ["settings"]],
  ["/api/system-reset", ALL_TOPICS],
  // A restore replaces everything.
  ["/api/backups/download", ["activity"]],
  ["/api/backups", ALL_TOPICS],
];

// Changes made in quick succession (an import, a payment that touches several
// tables) go out as one message.
const BATCH_MS = 100;

let io = null;
let timer = null;
const pending = new Set();

function publish(topics) {
  if (!io || !topics.length) {
    return;
  }

  topics.forEach((topic) => pending.add(topic));

  if (timer) {
    return;
  }

  timer = setTimeout(() => {
    timer = null;

    const batch = [...pending];
    pending.clear();

    io.emit("changed", { topics: batch });
  }, BATCH_MS);
}

function topicsForPath(url) {
  const path = String(url || "").split("?")[0].toLowerCase();

  // Saving a receipt picture only adds a Log Trail entry; payments are untouched.
  if (/^\/api\/payments\/\d+\/receipt(\/|$)/.test(path)) {
    return ["activity"];
  }

  for (const [prefix, topics] of TOPICS_BY_PREFIX) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return topics;
    }
  }

  return [];
}

// Express middleware: once a request that writes data succeeds, announce it.
// Announcing after the response means the change is already saved when the
// apps reload.
function announceChanges(req, res, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  res.on("finish", () => {
    // Failed sign-ins are Log Trail entries too, so /api/auth announces
    // refusals as well (but not server errors).
    const announce =
      res.statusCode < 400 ||
      (res.statusCode < 500 && /^\/api\/auth(\/|\?|$)/i.test(req.originalUrl));

    if (announce) {
      publish(topicsForPath(req.originalUrl));
    }
  });

  next();
}

// Only signed-in, active accounts may listen.
function attach(httpServer) {
  const { verifyAuthToken } = require("./routes/auth");
  const sessions = require("./security/sessions");

  io = new Server(httpServer, {
    serveClient: false,
    cors: { origin: true },
  });

  io.use((socket, next) => {
    try {
      const decoded = verifyAuthToken(String(socket.handshake.auth?.token || ""));

      const user = db
        .prepare("SELECT account_status FROM users WHERE id = ?")
        .get(decoded.userId);

      if (!user || user.account_status !== "ACTIVE") {
        return next(new Error("ACCOUNT_INACTIVE"));
      }

      // Remembered so the connection can be closed when its session ends.
      socket.data.sessionId = decoded.sid;

      next();
    } catch {
      next(new Error("AUTH_REQUIRED"));
    }
  });

  // A session that ends (logout, idle, password change, lock...) closes its
  // live connection at once.
  sessions.events.on("ended", ({ sessionId }) => {
    for (const socket of io.sockets.sockets.values()) {
      if (socket.data.sessionId === sessionId) {
        socket.disconnect(true);
      }
    }
  });

  // Sessions that simply ran out of idle time are noticed here.
  const sweep = setInterval(() => {
    for (const socket of io.sockets.sockets.values()) {
      if (socket.data.sessionId && !sessions.isLive(socket.data.sessionId)) {
        socket.disconnect(true);
      }
    }
  }, 30 * 1000);

  sweep.unref();

  return io;
}

module.exports = { announceChanges, attach, publish, topicsForPath };
