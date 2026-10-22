// Wrong "current password" answers while changing a password: 5 in 15
// minutes per account, then a pause. A stolen, still-signed-in session cannot
// be used to guess the password. Kept in memory.
const MAX_TRIES = 5;
const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map();

function recent(userId) {
  const now = Date.now();
  const list = (failures.get(userId) || []).filter((time) => now - time < WINDOW_MS);

  failures.set(userId, list);

  return list;
}

function blocked(userId) {
  return recent(userId).length >= MAX_TRIES;
}

function fail(userId) {
  recent(userId).push(Date.now());
}

function clear(userId) {
  failures.delete(userId);
}

const TOO_MANY = {
  success: false,
  code: "TOO_MANY_PASSWORD_TRIES",
  message: "Too many incorrect passwords. Please try again in a few minutes.",
};

module.exports = { TOO_MANY, blocked, clear, fail };
