// Live updates: tells every signed-in app that SmartFine data changed, so
// open screens reload without a manual refresh.
//
// A message carries only topic names, never records. The app answers by
// reloading through the normal API, which still checks who may see what.
const { Server } = require("socket.io");

const db = require("./database/database");

const ALL_TOPICS = ["fines", "payments", "refunds", "people", "settings"];

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
  ["/api/access", ["people"]],
  ["/api/account/email", ["people"]],
  ["/api/settings", ["settings"]],
  ["/api/system-reset", ALL_TOPICS],
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
    if (res.statusCode < 400) {
      publish(topicsForPath(req.originalUrl));
    }
  });

  next();
}

// Only signed-in, active accounts may listen.
function attach(httpServer) {
  const { verifyAuthToken } = require("./routes/auth");

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

      next();
    } catch {
      next(new Error("AUTH_REQUIRED"));
    }
  });

  return io;
}

module.exports = { announceChanges, attach, publish, topicsForPath };
