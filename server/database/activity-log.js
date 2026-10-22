// Activity log: who changed what, and when. Stored in audit_logs.
//
// The actor's name and role are saved with each entry, so the log still reads
// correctly if that account is renamed or deleted later. There is no route
// that edits or deletes entries; System Reset is the only thing that clears
// the log (and keeps a copy in its backup).
const db = require("./database");

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
]) {
  if (!existingColumns.has(name)) {
    db.exec(`ALTER TABLE audit_logs ADD COLUMN ${name} ${type}`);
  }
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_fine ON audit_logs(related_fine_id);
`);

// The first matching prefix names an action's category.
const CATEGORY_BY_PREFIX = [
  ["FINE_TYPE_", "FINE_TYPES"],
  ["FINE_", "FINES"],
  ["EVIDENCE_", "FINES"],
  ["CASH_", "PAYMENTS"],
  ["REFUND_", "PAYMENTS"],
  ["STUDENT", "ACCOUNTS"],
  ["OFFICER_", "ACCOUNTS"],
  ["ADMIN_", "ACCOUNTS"],
  ["ACCOUNT_", "ACCOUNTS"],
  ["SYSTEM_", "SYSTEM"],
];

const CATEGORIES = ["FINES", "PAYMENTS", "ACCOUNTS", "FINE_TYPES", "SYSTEM"];

function categoryOf(action) {
  const match = CATEGORY_BY_PREFIX.find(([prefix]) => action.startsWith(prefix));
  return match ? match[1] : "SYSTEM";
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
function logActivity({
  actorId,
  action,
  description,
  entityType = null,
  entityId = null,
  fineId = null,
  details = null,
}) {
  try {
    const actor = actorId
      ? db
          .prepare("SELECT first_name, middle_name, last_name, role FROM users WHERE id = ?")
          .get(actorId)
      : null;

    db.prepare(
      `INSERT INTO audit_logs (
         user_id, action, entity_type, entity_id, description,
         actor_name, actor_role, category, related_fine_id, details_json
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      actor ? Number(actorId) : null,
      action,
      entityType,
      entityId === null || entityId === undefined ? null : Number(entityId),
      description,
      actor ? fullName(actor.first_name, actor.middle_name, actor.last_name) : null,
      actor ? actor.role : null,
      categoryOf(action),
      fineId === null || fineId === undefined ? null : Number(fineId),
      details ? JSON.stringify(details) : null,
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

function listActivity({ category = "ALL", search = "", page = 1, pageSize = 20 }) {
  const where = [];
  const args = [];

  if (category && category !== "ALL") {
    where.push("a.category = ?");
    args.push(category);
  }

  const text = String(search || "").trim().toLowerCase();

  if (text) {
    where.push("(LOWER(COALESCE(a.description, '')) LIKE ? OR LOWER(COALESCE(a.actor_name, '')) LIKE ?)");
    args.push(`%${text}%`, `%${text}%`);
  }

  const filter = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const size = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const total = Number(db.prepare(`SELECT COUNT(*) n FROM audit_logs a ${filter}`).get(...args).n);
  const pages = Math.max(Math.ceil(total / size), 1);
  const current = Math.min(Math.max(Number(page) || 1, 1), pages);

  const entries = db
    .prepare(
      `SELECT
         a.id, a.action, a.category, a.description, a.entity_type, a.entity_id,
         a.related_fine_id, a.details_json, a.created_at,
         a.user_id, a.actor_role,
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
        description: row.description,
        entityType: row.entity_type,
        entityId: row.entity_id === null ? null : Number(row.entity_id),
        fineId: row.related_fine_id === null ? null : Number(row.related_fine_id),
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
  changeText,
  describeChanges,
  fullName,
  listActivity,
  logActivity,
  personName,
  pesos,
};
