// Who may call a route: a valid login token for an account that is still
// active and has one of the allowed roles. The account is checked in the
// database on every request, so a deactivated account stops working at once.
const db = require("../database/database");
const { authenticateToken } = require("../routes/auth");
const { logDenied } = require("../security/access-log");

const ROLE_MESSAGES = {
  ADMIN: "Administrator access is required.",
  "ADMIN,FINES_OFFICER": "Only an Administrator or a Fines Officer can do this.",
};

function activeAccount(roles) {
  return (req, res, next) => {
    try {
      const userId = Number(req.authUser?.userId);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        logDenied(req, { reason: "no valid sign-in was sent" });

        return res.status(401).json({
          success: false,
          code: "AUTH_REQUIRED",
          message: "Please sign in again.",
        });
      }

      const user = db
        .prepare("SELECT id, role, account_status FROM users WHERE id = ?")
        .get(userId);

      if (!user || String(user.account_status).toUpperCase() !== "ACTIVE") {
        logDenied(req, { reason: "the account is not active", userId: user ? userId : null });

        return res.status(403).json({
          success: false,
          code: "ACCOUNT_INACTIVE",
          message: "An active account is required. Please sign in again.",
        });
      }

      const role = String(user.role).toUpperCase();

      if (!roles.includes(role)) {
        logDenied(req, { reason: `a ${role.toLowerCase().replace("_", " ")} account may not use it`, userId });

        return res.status(403).json({
          success: false,
          code: "ROLE_NOT_ALLOWED",
          message: ROLE_MESSAGES[roles.join(",")] || "Your account cannot do this.",
        });
      }

      // The signed-in account, for routes to use instead of the request body.
      req.account = { id: Number(user.id), role };
      next();
    } catch (error) {
      console.error("Account check failed:", error);
      return res.status(500).json({
        success: false,
        message: "Could not verify your account.",
      });
    }
  };
}

// Use as route middleware: router.get("/", requireActive("ADMIN"), handler)
function requireActive(...roles) {
  return [authenticateToken, activeAccount(roles)];
}

module.exports = { requireActive };
