// Writes sign-outs to the Log Trail. Every session ends through
// security/sessions.js, which announces it here with the reason:
//   - the person signed out            -> LOGOUT
//   - 15 minutes without activity       -> AUTO_LOGOUT
//   - anything else (password change, an administrator locking the account...)
//                                       -> SESSION_ENDED
// The session ID itself is never written.
const { logActivity } = require("../database/activity-log");
const { currentIp } = require("./request-context");
const sessions = require("./sessions");

function idleText() {
  const seconds = sessions.IDLE_SECONDS;

  return seconds >= 60
    ? `${Math.round(seconds / 60)} minute${Math.round(seconds / 60) === 1 ? "" : "s"}`
    : `${seconds} seconds`;
}

const WHY = {
  PASSWORD_RESET: "the password was reset",
  PASSWORD_CHANGED: "the password was changed on another device",
  ACCOUNT_LOCKED: "an administrator locked the account",
  ACCOUNT_DEACTIVATED: "the account was deactivated",
  ACCOUNT_ROLE_CHANGED: "the account role was changed",
  ACCOUNT_REMOVED: "the account was removed",
  RESTORE: "the data was restored from a backup",
};

function describe(reason) {
  if (reason === "LOGOUT") {
    return { action: "LOGOUT", text: "Signed out." };
  }

  if (reason === "IDLE") {
    return {
      action: "AUTO_LOGOUT",
      text: `Signed out automatically after ${idleText()} without activity.`,
    };
  }

  if (reason === "EXPIRED") {
    return {
      action: "AUTO_LOGOUT",
      text: "Signed out automatically because the session reached its time limit.",
    };
  }

  return {
    action: "SESSION_ENDED",
    text: `A session was ended because ${WHY[reason] || "the account changed"}.`,
  };
}

sessions.events.on("ended", ({ userId, reason, ipAddress }) => {
  const { action, text } = describe(reason);

  logActivity({
    actorId: userId,
    action,
    description: text,
    ip: currentIp() || ipAddress || null,
  });
});
