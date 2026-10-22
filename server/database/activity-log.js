// The Log Trail: who did what, when, from where, and how it went. Stored in
// audit_logs.
//
// Each entry keeps the person's name and role as they were at the time, the
// affected module, the IP address (when known) and the result (SUCCESS,
// FAILED or DENIED), so the log still reads correctly if an account is
// renamed or deleted later.
//
// Entries are never edited or deleted:
//   - no route changes or removes an entry;
//   - the database itself refuses to update or delete a log row (triggers
//     below), except that System Reset may clear the log after saving a copy
//     in its backup (clearForReset);
//   - passwords, password hashes, one-time codes, tokens and session IDs are
//     removed from anything that is written (see clean()).
const db = require("./database");
const { currentIp } = require("../security/request-context");

// Older databases have the bare audit_logs table; add what the log needs.
const existingColumns = new Set(
  db.prepare("PRAGMA table_info(audit_logs)").all().map((column) => column.name),
);

for (const [name, type] of [
  ["actor_name", "TEXT"],
  ["actor_role", "TEXT"],
  ["category", "TEXT"],
  ["related_fine_id", "INTEGER"],
  ["details_json", "TEXT"],
  ["ip_address", "TEXT"],
  ["result", "TEXT"],
  ["module", "TEXT"],
]) {
  if (!existingColumns.has(name)) {
    db.exec(`ALTER TABLE audit_logs ADD COLUMN ${name} ${type}`);
  }
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_fine ON audit_logs(related_fine_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_result ON audit_logs(result);

  -- An entry cannot be changed once written. (A deleted account's entries
  -- may lose their user link, which is all the database does on its own.)
  CREATE TRIGGER IF NOT EXISTS audit_logs_no_edit
  BEFORE UPDATE OF action, entity_type, entity_id, description, created_at,
    actor_name, actor_role, category, related_fine_id, details_json,
    ip_address, result, module ON audit_logs
  BEGIN
    SELECT RAISE(ABORT, 'Log entries cannot be changed.');
  END;

  CREATE TRIGGER IF NOT EXISTS audit_logs_no_relink
  BEFORE UPDATE OF user_id ON audit_logs
  WHEN NEW.user_id IS NOT NULL
  BEGIN
    SELECT RAISE(ABORT, 'Log entries cannot be changed.');
  END;
`);

const NO_DELETE_TRIGGER = `
  CREATE TRIGGER IF NOT EXISTS audit_logs_no_delete
  BEFORE DELETE ON audit_logs
  BEGIN
    SELECT RAISE(ABORT, 'Log entries cannot be deleted.');
  END;
`;

db.exec(NO_DELETE_TRIGGER);

// For System Reset only (inside its transaction, after its backup is saved).
function clearForReset() {
  db.exec("DROP TRIGGER IF EXISTS audit_logs_no_delete");

  try {
    db.exec("DELETE FROM audit_logs");
  } finally {
    db.exec(NO_DELETE_TRIGGER);
  }
}

// First match wins: [action prefix, category, affected module].
const RULES = [
  ["LOGIN_", "SECURITY", "Login"],
  ["LOGOUT", "SECURITY", "Login"],
  ["AUTO_LOGOUT", "SECURITY", "Login"],
  ["LOCKOUT_", "SECURITY", "Login"],
  ["SESSION_", "SECURITY", "Sessions"],
  ["OTP_", "SECURITY", "Verification"],
  ["PASSWORD_", "SECURITY", "Passwords"],
  ["EMAIL_", "SECURITY", "Email"],
  ["ACCESS_", "SECURITY", "Access control"],
  ["ACCOUNT_FIRST_LOGIN", "SECURITY", "Verification"],
  ["ACCOUNT_EMAIL", "SECURITY", "Email"],
  ["ACCOUNT_ROLE", "ACCOUNTS", "Roles"],
  ["ACCOUNT_", "ACCOUNTS", "User accounts"],
  ["STUDENT", "ACCOUNTS", "Students"],
  ["OFFICER_", "ACCOUNTS", "Fines officers"],
  ["ADMIN_", "ACCOUNTS", "Administrators"],
  ["FINE_TYPE_", "FINE_TYPES", "Fine types"],
  ["FINE_", "FINES", "Fines"],
  ["EVIDENCE_", "FINES", "Fines"],
  ["CASH_", "PAYMENTS", "Payments"],
  ["REFUND_", "PAYMENTS", "Refunds"],
  ["BACKUP_", "SYSTEM", "Backup & Recovery"],
  ["EXPORT_", "SYSTEM", "Reports"],
  ["SETTINGS_", "SYSTEM", "Settings"],
  ["SYSTEM_", "SYSTEM", "System"],
];

const CATEGORIES = ["SECURITY", "ACCOUNTS", "FINES", "PAYMENTS", "FINE_TYPES", "SYSTEM"];
const RESULTS = ["SUCCESS", "FAILED", "DENIED"];
const MODULES = [...new Set(RULES.map((rule) => rule[2]))];

function ruleOf(action) {
  return RULES.find(([prefix]) => String(action).startsWith(prefix)) || ["", "SYSTEM", "System"];
}

const categoryOf = (action) => ruleOf(action)[1];
const moduleOf = (action) => ruleOf(action)[2];

// ---- keeping secrets out of the log ----

// Anything under a key like these is dropped; text that looks like a password
// hash or a sign-in token is blanked.
const SECRET_KEY = /hash|otp|token|secret|session|^sid$|verification.?code|^code$|pass(word|wd)?$/i;
const SECRET_TEXT = [
  [/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/g, "[hidden]"],
  [/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[hidden]"],
];

function cleanText(text) {
  return SECRET_TEXT.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), String(text));
}

function clean(value, depth = 0) {
  if (value === null || value === undefined || depth > 6) return value ?? null;
  if (typeof value === "string") return cleanText(value);
  if (Array.isArray(value)) return value.map((item) => clean(item, depth + 1));

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SECRET_KEY.test(key))
        .map(([key, item]) => [key, clean(item, depth + 1)]),
    );
  }

  return value;
}

// "ju***" or "ju***@example.com": enough to recognise a mistyped sign-in
// name without keeping a whole account name (or a password typed in the wrong
// box).
function maskIdentifier(value) {
  const text = String(value || "").trim().slice(0, 80);

  if (!text) return "Unknown account";

  const [local, ...domain] = text.split("@");
  const shown = `${local.slice(0, 2)}***`;

  return domain.length ? `${shown}@${domain.join("@")}` : shown;
}

// The same event from the same place is written once per window (so a
// flood of refused requests cannot fill the log).
const recent = new Map();

function throttled(key, milliseconds) {
  const now = Date.now();

  if ((recent.get(key) || 0) > now) return true;

  recent.set(key, now + milliseconds);

  if (recent.size > 2000) {
    for (const [name, until] of recent) {
      if (until <= now) recent.delete(name);
    }
  }

  return false;
}

function pesos(centavos) {
  return `₱${(Number(centavos || 0) / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fullName(first, middle, last) {
  return [first, middle, last]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
}

function personName(userId) {
  if (!userId) return null;

  const user = db
    .prepare("SELECT first_name, middle_name, last_name, role FROM users WHERE id = ?")
    .get(userId);

  return user ? fullName(user.first_name, user.middle_name, user.last_name) : null;
}

// Writes one entry. A failure is reported in the server log and never undoes
// the action that was already saved.
//
//   result      SUCCESS (default), FAILED (it did not work) or DENIED (it was
//               refused, e.g. a lockout or an unauthorized request)
//   actorName   shown when there is no account (a sign-in with an unknown name)
//   ip          defaults to the address of the request being handled
//   onceEvery   { key, seconds }: skip this entry if the same key was written
//               within that time
function logActivity({
  actorId,
  action,
  description,
  entityType = null,
  entityId = null,
  fineId = null,
  details = null,
  result = "SUCCESS",
  actorName = null,
  ip = undefined,
  onceEvery = null,
}) {
  try {
    if (
      onceEvery &&
      throttled(
        `${action}|${ip === undefined ? currentIp() : ip}|${onceEvery.key}`,
        (onceEvery.seconds || 60) * 1000,
      )
    ) {
      return;
    }

    const actor = actorId
      ? db
          .prepare("SELECT first_name, middle_name, last_name, role FROM users WHERE id = ?")
          .get(actorId)
      : null;

    const [, category, module] = ruleOf(action);

    db.prepare(
      `INSERT INTO audit_logs (
         user_id, action, entity_type, entity_id, description,
         actor_name, actor_role, category, related_fine_id, details_json,
         ip_address, result, module
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      actor ? Number(actorId) : null,
      action,
      entityType,
      entityId === null || entityId === undefined ? null : Number(entityId),
      description ? cleanText(description) : description,
      actor
        ? fullName(actor.first_name, actor.middle_name, actor.last_name)
        : actorName
          ? String(actorName).slice(0, 120)
          : null,
      actor ? actor.role : null,
      category,
      fineId === null || fineId === undefined ? null : Number(fineId),
      details ? JSON.stringify(clean(details)) : null,
      (ip === undefined ? currentIp() : ip) || null,
      RESULTS.includes(result) ? result : "SUCCESS",
      module,
    );
  } catch (error) {
    console.error(`Activity log write failed (${action}):`, error);
  }
}

// "amount ₱100.00 → ₱50.00; violation A → B" for the fields that changed.
function describeChanges(before, after, labels) {
  const changes = [];

  for (const [key, label] of Object.entries(labels)) {
    const from = before[key] ?? "";
    const to = after[key] ?? "";

    if (String(from) !== String(to)) {
      changes.push({ field: key, label, from, to });
    }
  }

  return changes;
}

function changeText(changes) {
  return changes
    .map((change) => `${change.label} ${change.from === "" ? "(blank)" : change.from} → ${change.to === "" ? "(blank)" : change.to}`)
    .join("; ");
}

// Filters: category, result, module, from/to (YYYY-MM-DD, the server's local
// days) and a search over the person, activity, module, address and result.
function listActivity({
  category = "ALL",
  result = "ALL",
  module = "ALL",
  from = "",
  to = "",
  search = "",
  page = 1,
  pageSize = 20,
}) {
  const where = [];
  const args = [];

  if (category && category !== "ALL") {
    where.push("a.category = ?");
    args.push(category);
  }

  if (result && result !== "ALL") {
    where.push("COALESCE(a.result, 'SUCCESS') = ?");
    args.push(result);
  }

  if (module && module !== "ALL") {
    where.push("COALESCE(a.module, '') = ?");
    args.push(module);
  }

  if (from) {
    where.push("date(a.created_at, 'localtime') >= ?");
    args.push(from);
  }

  if (to) {
    where.push("date(a.created_at, 'localtime') <= ?");
    args.push(to);
  }

  const text = String(search || "").trim().toLowerCase();

  if (text) {
    where.push(
      `(LOWER(COALESCE(a.description, '')) LIKE ?
        OR LOWER(COALESCE(a.actor_name, TRIM(u.first_name || ' ' || u.last_name), '')) LIKE ?
        OR LOWER(COALESCE(a.module, '')) LIKE ?
        OR LOWER(COALESCE(a.ip_address, '')) LIKE ?
        OR LOWER(COALESCE(a.action, '')) LIKE ?)`,
    );
    args.push(`%${text}%`, `%${text}%`, `%${text}%`, `%${text}%`, `%${text.replace(/ /g, "_")}%`);
  }

  const filter = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const size = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const total = Number(
    db
      .prepare(`SELECT COUNT(*) n FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id ${filter}`)
      .get(...args).n,
  );
  const pages = Math.max(Math.ceil(total / size), 1);
  const current = Math.min(Math.max(Number(page) || 1, 1), pages);

  const entries = db
    .prepare(
      `SELECT
         a.id, a.action, a.category, a.description, a.entity_type, a.entity_id,
         a.related_fine_id, a.details_json, a.created_at,
         a.user_id, a.actor_role, a.ip_address, a.result, a.module,
         COALESCE(a.actor_name, TRIM(u.first_name || ' ' || u.last_name)) AS actor_name
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ${filter}
       ORDER BY a.id DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...args, size, (current - 1) * size)
    .map((row) => {
      let details = null;

      try {
        details = row.details_json ? JSON.parse(row.details_json) : null;
      } catch {}

      return {
        id: Number(row.id),
        action: row.action,
        category: row.category || categoryOf(row.action),
        module: row.module || moduleOf(row.action),
        result: row.result || "SUCCESS",
        description: row.description,
        entityType: row.entity_type,
        entityId: row.entity_id === null ? null : Number(row.entity_id),
        fineId: row.related_fine_id === null ? null : Number(row.related_fine_id),
        ipAddress: row.ip_address || null,
        actor: row.user_id || row.actor_name
          ? { id: row.user_id === null ? null : Number(row.user_id), name: row.actor_name || "Unknown", role: row.actor_role }
          : null,
        details,
        createdAt: row.created_at,
      };
    });

  return { entries, total, page: current, pageSize: size, pages };
}

module.exports = {
  CATEGORIES,
  MODULES,
  RESULTS,
  changeText,
  clearForReset,
  describeChanges,
  fullName,
  listActivity,
  logActivity,
  maskIdentifier,
  personName,
  pesos,
};
