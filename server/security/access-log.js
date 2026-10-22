// Log Trail entries for refused requests (unauthorized access).
const { logActivity } = require("../database/activity-log");
const { currentIp } = require("./request-context");

function routeOf(req) {
  const path = String(req.originalUrl || req.url || "").split("?")[0].slice(0, 120);

  return `${req.method} ${path}`;
}

// Records that a request was refused. The same refusal from the same address
// is written once a minute, so repeated requests cannot flood the log.
// Never records the token, only who it belonged to (when that is known).
function logDenied(req, { reason, userId = null }) {
  const route = routeOf(req);

  logActivity({
    actorId: userId,
    action: "ACCESS_DENIED",
    result: "DENIED",
    description: `Blocked ${route}: ${reason}`,
    // Without a known account (probing, expired links) one entry a minute per
    // address is enough; with one, once a minute per page.
    onceEvery: {
      key: userId ? `${currentIp()}|${route}|${userId}|${reason}` : `${currentIp()}|${reason}`,
      seconds: 60,
    },
  });
}

module.exports = { logDenied, routeOf };
