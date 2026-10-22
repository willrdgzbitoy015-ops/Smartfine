// A small in-memory request limiter, per client IP address.
//
//   const limit = rateLimit({ max: 40, windowMs: 60000 });
//   router.get("/captcha", limit, handler);
//
// Over the limit, the answer is 429 with Retry-After. The counts live in
// memory, so a restart clears them.
function rateLimit({ max, windowMs }) {
  const hits = new Map();

  return (req, res, next) => {
    const key = String(req.ip || req.socket?.remoteAddress || "unknown");
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((time) => now - time < windowMs);

    if (recent.length >= max) {
      hits.set(key, recent);

      res.set("Retry-After", String(Math.ceil((recent[0] + windowMs - now) / 1000)));

      return res.status(429).json({
        success: false,
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Please wait a moment and try again.",
      });
    }

    recent.push(now);
    hits.set(key, recent);

    // Old keys are dropped now and then so the table cannot grow forever.
    if (hits.size > 5000) {
      for (const [other, times] of hits) {
        if (!times.some((time) => now - time < windowMs)) hits.delete(other);
      }
    }

    return next();
  };
}

module.exports = { rateLimit };
