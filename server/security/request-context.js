// Remembers the client address of the request being handled, so the Log Trail
// can record it without every route passing it along.
const { AsyncLocalStorage } = require("node:async_hooks");

const storage = new AsyncLocalStorage();

// The address as the server sees it (the real client when behind ngrok, see
// "trust proxy" in server.js), without the IPv4-in-IPv6 prefix.
function clientIp(req) {
  return String(req?.ip || req?.socket?.remoteAddress || "").replace(/^::ffff:/, "") || null;
}

function requestContext(req, _res, next) {
  storage.run({ ip: clientIp(req) }, next);
}

function currentIp() {
  return storage.getStore()?.ip || null;
}

module.exports = { clientIp, currentIp, requestContext };
