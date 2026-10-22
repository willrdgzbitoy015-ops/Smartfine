// Backup and recovery of the SmartFine database.
//
// Backups
//   - A consistent copy of the whole database is taken while the server runs
//     (VACUUM INTO), checked (integrity, people count), encrypted with AES-256-GCM
//     and saved as server/backups/<id>.sfbak with a small <id>.json beside it
//     (when, by whom, what is inside, SHA-256 of the data). The plain copy
//     exists only for a moment and is deleted at once.
//   - The key is not in the code and not in the backup folder (see
//     backupKey in security/secrets.js). GCM also detects any change to a
//     backup file, and a file renamed to another backup's name.
//   - The folder is outside everything the server serves, and out of git.
//   - Automatic: once a day (at SMARTFINE_BACKUP_HOUR, default 2 AM; a missed
//     one is made as soon as the server runs again). The newest 14 automatic
//     backups are kept. Backups made by hand, before a restore and before a
//     System Reset are kept too (a reset's backup is never removed).
//
// Restore
//   - An administrator picks a backup. It is decrypted and checked first, a
//     backup of the current data is saved ("before restore", so a restore can
//     be undone), and then the data is copied into the live database in one
//     transaction: if anything fails nothing changes.
//   - The Log Trail is NOT restored: it stays as it is and gains the entry for
//     the restore. Sessions and pending codes are not restored either; every
//     session ends, so everyone signs in again against the restored accounts.
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const db = require("./database");
const { logActivity, personName } = require("./activity-log");
const { backupKey } = require("../security/secrets");

const BACKUP_DIR = path.resolve(process.env.SMARTFINE_BACKUP_DIR || path.join(__dirname, "..", "backups"));

const MAGIC = Buffer.from([0x53, 0x46, 0x42, 0x4b, 0x01]); // "SFBK" + format 1
const IV_BYTES = 12;
const TAG_BYTES = 16;

const TYPES = {
  SCHEDULED: { slug: "scheduled", label: "Automatic" },
  MANUAL: { slug: "manual", label: "Manual" },
  BEFORE_RESTORE: { slug: "before-restore", label: "Before a restore" },
  BEFORE_RESET: { slug: "before-reset", label: "Before a system reset" },
};

// 22 Oct 2026, 2:00 AM (the school's time zone), for the Log Trail.
function when(iso) {
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const ID_PATTERN = /^\d{8}T\d{9}Z-(scheduled|manual|before-restore|before-reset)$/;

// How many of each kind are kept (null = never removed).
const KEEP = {
  SCHEDULED: Math.max(Number(process.env.SMARTFINE_BACKUP_KEEP) || 14, 3),
  MANUAL: 20,
  BEFORE_RESTORE: 10,
  BEFORE_RESET: null,
};

// Tables a restore leaves alone: the Log Trail, live sessions and pending codes.
const NOT_RESTORED = new Set(["audit_logs", "user_sessions", "otp_challenges"]);

// What a backup must contain to be worth restoring.
const REQUIRED_TABLES = ["users", "students", "fines", "payments", "violation_types", "system_settings"];

class BackupError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let busy = false;

// ---------------------------------------------------------------- helpers

function idPattern(id) {
  return typeof id === "string" && ID_PATTERN.test(id);
}

function fileOf(id, extension) {
  // The id is checked against a strict pattern first, so it cannot name a
  // path outside the backup folder.
  if (!idPattern(id)) {
    throw new BackupError(400, "INVALID_BACKUP", "That is not a valid backup.");
  }

  return path.join(BACKUP_DIR, `${id}.${extension}`);
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function encrypt(plain, id) {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", backupKey(), iv);

  cipher.setAAD(Buffer.from(id));

  const body = Buffer.concat([cipher.update(plain), cipher.final()]);

  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), body]);
}

function decrypt(blob, id) {
  const unreadable = new BackupError(
    422,
    "BACKUP_UNREADABLE",
    "This backup cannot be opened: it was changed or damaged, or it was made with a different key.",
  );

  if (blob.length < MAGIC.length + IV_BYTES + TAG_BYTES || !blob.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw unreadable;
  }

  try {
    const iv = blob.subarray(MAGIC.length, MAGIC.length + IV_BYTES);
    const tag = blob.subarray(MAGIC.length + IV_BYTES, MAGIC.length + IV_BYTES + TAG_BYTES);
    const body = blob.subarray(MAGIC.length + IV_BYTES + TAG_BYTES);
    const decipher = crypto.createDecipheriv("aes-256-gcm", backupKey(), iv);

    decipher.setAAD(Buffer.from(id));
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(body), decipher.final()]);
  } catch {
    throw unreadable;
  }
}

function newId(type) {
  // 2026-10-22T02:00:00.123Z -> 20261022T020000123Z
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(".", "");

  return `${stamp}-${TYPES[type].slug}`;
}

function readMeta(id) {
  const file = fileOf(id, "json");

  let meta;

  try {
    meta = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    throw new BackupError(404, "BACKUP_NOT_FOUND", "That backup was not found.");
  }

  if (!meta || meta.id !== id || !fs.existsSync(fileOf(id, "sfbak"))) {
    throw new BackupError(404, "BACKUP_NOT_FOUND", "That backup was not found.");
  }

  return meta;
}

function count(source, sql) {
  try {
    return Number(source.prepare(sql).get().n);
  } catch {
    return 0;
  }
}

// What a backup holds, for the list.
function contentsOf(source) {
  return {
    students: count(source, "SELECT COUNT(*) n FROM users WHERE role = 'STUDENT'"),
    officers: count(source, "SELECT COUNT(*) n FROM users WHERE role = 'FINES_OFFICER'"),
    administrators: count(source, "SELECT COUNT(*) n FROM users WHERE role = 'ADMIN'"),
    fines: count(source, "SELECT COUNT(*) n FROM fines"),
    payments: count(source, "SELECT COUNT(*) n FROM payments"),
  };
}

// Opens a plain copy read-only and checks it is a healthy SmartFine database.
function inspectCopy(file) {
  let source;

  try {
    source = new DatabaseSync(file, { readOnly: true });
  } catch {
    throw new BackupError(422, "BACKUP_UNREADABLE", "This backup is not a readable database.");
  }

  try {
    const integrity = source.prepare("PRAGMA integrity_check").get();

    if (!integrity || Object.values(integrity)[0] !== "ok") {
      throw new BackupError(422, "BACKUP_DAMAGED", "This backup is damaged (the database check failed).");
    }

    const tables = new Set(
      source.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name),
    );

    const missing = REQUIRED_TABLES.filter((name) => !tables.has(name));

    if (missing.length) {
      throw new BackupError(422, "BACKUP_INCOMPLETE", `This backup does not look like a SmartFine database (missing ${missing.join(", ")}).`);
    }

    return { tables, contents: contentsOf(source), activeAdministrators: count(source, "SELECT COUNT(*) n FROM users WHERE role = 'ADMIN' AND account_status = 'ACTIVE'") };
  } finally {
    source.close();
  }
}

function ensureDirectory() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });
}

// ---------------------------------------------------------------- create

// Takes, checks, encrypts and stores a backup. Synchronous on purpose: nothing
// else can change the data while it runs.
function writeBackup({ type, adminId = null }) {
  if (!TYPES[type]) {
    throw new BackupError(400, "INVALID_TYPE", "Unknown backup type.");
  }

  ensureDirectory();

  const id = newId(type);
  const temp = path.join(BACKUP_DIR, `.tmp-${id}.db`);
  const encryptedFile = fileOf(id, "sfbak");
  const metaFile = fileOf(id, "json");

  try {
    db.prepare("VACUUM INTO ?").run(temp);

    const inspected = inspectCopy(temp);
    const live = count(db, "SELECT COUNT(*) n FROM users");
    const copied = inspected.contents.students + inspected.contents.officers + inspected.contents.administrators;

    if (live !== copied) {
      throw new Error("The copy does not hold the same people as the database.");
    }

    const plain = fs.readFileSync(temp);
    const encrypted = encrypt(plain, id);

    fs.writeFileSync(encryptedFile, encrypted, { mode: 0o600 });

    // Read it back: the stored file must open and match before it counts.
    if (sha256(decrypt(fs.readFileSync(encryptedFile), id)) !== sha256(plain)) {
      throw new Error("The stored backup did not match the copy.");
    }

    const meta = {
      id,
      type,
      createdAt: new Date().toISOString(),
      createdBy: adminId ? { id: Number(adminId), name: personName(adminId) } : null,
      sizeBytes: encrypted.length,
      databaseBytes: plain.length,
      sha256: sha256(plain),
      contents: inspected.contents,
      verifiedAt: new Date().toISOString(),
      verified: true,
    };

    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2), { mode: 0o600 });

    return meta;
  } catch (error) {
    fs.rmSync(encryptedFile, { force: true });
    fs.rmSync(metaFile, { force: true });

    throw error;
  } finally {
    fs.rmSync(temp, { force: true });
  }
}

function logCreated(meta, adminId) {
  logActivity({
    actorId: adminId,
    actorName: adminId ? null : "SmartFine (automatic backup)",
    action: "BACKUP_CREATED",
    entityType: "BACKUP",
    description: `Backup saved (${TYPES[meta.type].label.toLowerCase()}, ${formatSize(meta.sizeBytes)}, encrypted): ${meta.contents.students} students, ${meta.contents.fines} fines, ${meta.contents.payments} payments.`,
    details: { backupId: meta.id, type: meta.type, sizeBytes: meta.sizeBytes },
    ip: adminId ? undefined : null,
  });
}

function formatSize(bytes) {
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function createBackup({ type = "MANUAL", adminId = null } = {}) {
  if (busy) {
    throw new BackupError(409, "BACKUP_BUSY", "A backup or restore is already running. Please wait a moment.");
  }

  busy = true;

  try {
    const meta = writeBackup({ type, adminId });

    logCreated(meta, adminId);
    safePrune();

    return meta;
  } catch (error) {
    if (error instanceof BackupError) throw error;

    console.error("Backup failed:", error);

    logActivity({
      actorId: adminId,
      actorName: adminId ? null : "SmartFine (automatic backup)",
      action: "BACKUP_FAILED",
      result: "FAILED",
      entityType: "BACKUP",
      description: `A backup (${TYPES[type].label.toLowerCase()}) could not be saved.`,
      ip: adminId ? undefined : null,
    });

    throw new BackupError(500, "BACKUP_FAILED", "The backup could not be saved. Nothing was changed.");
  } finally {
    busy = false;
  }
}

// ---------------------------------------------------------------- list

function listBackups() {
  let names = [];

  try {
    names = fs.readdirSync(BACKUP_DIR).filter((name) => name.endsWith(".json"));
  } catch {
    return [];
  }

  const found = [];

  for (const name of names) {
    const id = name.slice(0, -".json".length);

    if (!idPattern(id)) continue;

    try {
      found.push(readMeta(id));
    } catch {
      // Half a backup (one file missing) is not offered.
    }
  }

  return found.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function publicMeta(meta) {
  return {
    id: meta.id,
    type: meta.type,
    typeLabel: TYPES[meta.type]?.label || meta.type,
    createdAt: meta.createdAt,
    createdBy: meta.createdBy || null,
    sizeBytes: meta.sizeBytes,
    contents: meta.contents,
    verified: Boolean(meta.verified),
    verifiedAt: meta.verifiedAt || null,
  };
}

// ---------------------------------------------------------------- verify

// Decrypts a stored backup and checks it: it opens with the key, matches its
// recorded SHA-256, and is a healthy SmartFine database.
function verifyBackup(id, adminId = null) {
  const meta = readMeta(id);
  const temp = path.join(BACKUP_DIR, `.verify-${crypto.randomBytes(6).toString("hex")}.db`);

  let outcome;

  try {
    const plain = decrypt(fs.readFileSync(fileOf(id, "sfbak")), id);

    if (sha256(plain) !== meta.sha256) {
      throw new BackupError(422, "BACKUP_DAMAGED", "This backup does not match its recorded checksum.");
    }

    fs.writeFileSync(temp, plain, { mode: 0o600 });
    inspectCopy(temp);

    outcome = { ok: true };
  } catch (error) {
    if (!(error instanceof BackupError)) throw error;

    outcome = { ok: false, code: error.code, message: error.message };
  } finally {
    fs.rmSync(temp, { force: true });
  }

  fs.writeFileSync(
    fileOf(id, "json"),
    JSON.stringify({ ...meta, verified: outcome.ok, verifiedAt: new Date().toISOString() }, null, 2),
    { mode: 0o600 },
  );

  logActivity({
    actorId: adminId,
    action: "BACKUP_VERIFIED",
    result: outcome.ok ? "SUCCESS" : "FAILED",
    entityType: "BACKUP",
    description: outcome.ok
      ? `Checked the backup made ${when(meta.createdAt)}: it opens and is intact.`
      : `Checked the backup made ${when(meta.createdAt)}: ${outcome.message}`,
    details: { backupId: id },
  });

  return outcome;
}

// ---------------------------------------------------------------- prune

function removeFiles(id) {
  fs.rmSync(fileOf(id, "sfbak"), { force: true });
  fs.rmSync(fileOf(id, "json"), { force: true });
}

// Drops the oldest backups beyond what each kind keeps.
function prune() {
  const all = listBackups();

  for (const type of Object.keys(TYPES)) {
    const keep = KEEP[type];

    if (keep === null) continue;

    const surplus = all.filter((meta) => meta.type === type).slice(keep);

    for (const meta of surplus) {
      removeFiles(meta.id);

      logActivity({
        actorId: null,
        actorName: "SmartFine (automatic backup)",
        action: "BACKUP_PRUNED",
        entityType: "BACKUP",
        description: `An old backup (${TYPES[type].label.toLowerCase()}, made ${when(meta.createdAt)}) was removed; the newest ${keep} of that kind are kept.`,
        details: { backupId: meta.id },
        ip: null,
      });
    }
  }
}

// Removing old backups is housekeeping: a problem there is reported on the
// server console and never fails the backup or restore that just worked.
function safePrune() {
  try {
    prune();
  } catch (error) {
    console.error("Backup clean-up failed:", error);
  }
}

// A crash in the middle of a backup, check or restore could leave a plain
// copy of the database behind. They are deleted when the server starts.
function removeLeftovers() {
  try {
    for (const name of fs.readdirSync(BACKUP_DIR)) {
      if (/^\.(tmp|restore|verify)-/.test(name)) {
        fs.rmSync(path.join(BACKUP_DIR, name), { force: true });
      }
    }
  } catch {
    // No backup folder yet.
  }
}

// ---------------------------------------------------------------- restore

// Copies the data of the (plain) backup file into the live database inside
// one transaction. Nothing changes if anything fails.
function swapIn(file) {
  const triggers = db
    .prepare("SELECT name, sql FROM sqlite_master WHERE type = 'trigger' AND name NOT LIKE 'audit_logs_%'")
    .all();

  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((row) => row.name)
    .filter((name) => !NOT_RESTORED.has(name));

  // Foreign keys cannot be switched inside a transaction.
  db.exec("PRAGMA foreign_keys = OFF");
  db.prepare("ATTACH DATABASE ? AS bk").run(file);

  try {
    db.exec("BEGIN IMMEDIATE");

    try {
      // The notification triggers must not fire while old rows come back.
      triggers.forEach((trigger) => db.exec(`DROP TRIGGER IF EXISTS "${trigger.name}"`));

      const inBackup = new Set(
        db.prepare("SELECT name FROM bk.sqlite_master WHERE type = 'table'").all().map((row) => row.name),
      );

      for (const table of tables) {
        db.exec(`DELETE FROM main."${table}"`);

        if (!inBackup.has(table)) continue;

        const wanted = new Set(db.prepare(`PRAGMA bk.table_info("${table}")`).all().map((column) => column.name));
        const shared = db
          .prepare(`PRAGMA main.table_info("${table}")`)
          .all()
          .map((column) => column.name)
          .filter((name) => wanted.has(name));

        if (!shared.length) continue;

        const columns = shared.map((name) => `"${name}"`).join(", ");

        db.exec(`INSERT INTO main."${table}" (${columns}) SELECT ${columns} FROM bk."${table}"`);
      }

      // Numbering of new records continues from the restored data.
      const names = tables.map((name) => `'${name}'`).join(", ");

      db.exec(`DELETE FROM main.sqlite_sequence WHERE name IN (${names})`);

      if (inBackup.has("sqlite_sequence")) {
        db.exec(`INSERT INTO main.sqlite_sequence (name, seq) SELECT name, seq FROM bk.sqlite_sequence WHERE name IN (${names})`);
      }

      triggers.forEach((trigger) => db.exec(trigger.sql));

      // Rows kept from before that point at people the backup does not have.
      db.exec("UPDATE audit_logs SET user_id = NULL WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM main.users)");
      db.exec("DELETE FROM user_sessions WHERE user_id NOT IN (SELECT id FROM main.users)");
      db.exec("DELETE FROM otp_challenges");

      const broken = db.prepare("PRAGMA foreign_key_check").all();

      if (broken.length) {
        throw new BackupError(422, "BACKUP_INCONSISTENT", "This backup is not consistent with SmartFine's data, so it was not restored.");
      }

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } finally {
    db.exec("DETACH DATABASE bk");
    db.exec("PRAGMA foreign_keys = ON");
  }
}

// `endSessions` is given by the caller so this module does not need to know
// about sessions.
function restoreBackup({ id, adminId, endSessions }) {
  if (busy) {
    throw new BackupError(409, "BACKUP_BUSY", "A backup or restore is already running. Please wait a moment.");
  }

  const meta = readMeta(id);
  const who = personName(adminId);
  const temp = path.join(BACKUP_DIR, `.restore-${crypto.randomBytes(6).toString("hex")}.db`);

  busy = true;

  try {
    // 1. Open it and make sure it is worth restoring.
    const plain = decrypt(fs.readFileSync(fileOf(id, "sfbak")), id);

    if (sha256(plain) !== meta.sha256) {
      throw new BackupError(422, "BACKUP_DAMAGED", "This backup does not match its recorded checksum, so it was not restored.");
    }

    fs.writeFileSync(temp, plain, { mode: 0o600 });

    const inspected = inspectCopy(temp);

    if (inspected.activeAdministrators < 1) {
      throw new BackupError(
        422,
        "BACKUP_NO_ADMIN",
        "This backup has no active administrator account, so nobody could sign in after restoring it. It was not restored.",
      );
    }

    // 2. Keep the current data, so the restore can be undone.
    const safety = writeBackup({ type: "BEFORE_RESTORE", adminId });

    logCreated(safety, adminId);

    // 3. Swap the data in.
    swapIn(temp);

    // 4. The data is restored; what follows must not turn that into a failure.
    // Everyone signs in again against the restored accounts.
    try {
      endSessions();
    } catch (error) {
      console.error("Restore: could not end every session:", error);
    }

    logActivity({
      actorId: adminId,
      actorName: who ? `${who} (account not in the restored data)` : null,
      action: "BACKUP_RESTORED",
      entityType: "BACKUP",
      description: `Restored all data from the backup made ${when(meta.createdAt)} (${TYPES[meta.type].label.toLowerCase()}). The data as it was just before is saved as a backup. Everyone was signed out.`,
      details: { backupId: id, safetyBackupId: safety.id, contents: inspected.contents },
    });

    safePrune();

    return { restored: publicMeta(meta), safetyBackup: publicMeta(safety) };
  } catch (error) {
    const known = error instanceof BackupError;

    if (!known) console.error("Restore failed:", error);

    logActivity({
      actorId: adminId,
      action: "BACKUP_RESTORE_FAILED",
      result: "FAILED",
      entityType: "BACKUP",
      description: known
        ? `Restoring the backup made ${when(meta.createdAt)} failed: ${error.message} Nothing was changed.`
        : `Restoring the backup made ${when(meta.createdAt)} failed. Nothing was changed.`,
      details: { backupId: id },
    });

    if (known) throw error;

    throw new BackupError(500, "RESTORE_FAILED", "The backup could not be restored. Nothing was changed.");
  } finally {
    fs.rmSync(temp, { force: true });
    busy = false;
  }
}

// A backup made for a System Reset that then did not go ahead.
function discard(id) {
  removeFiles(id);
}

// ---------------------------------------------------------------- schedule

function schedule() {
  const everySeconds = Number(process.env.SMARTFINE_BACKUP_EVERY_SECONDS) || 0;
  const hourSetting = Number(process.env.SMARTFINE_BACKUP_HOUR);
  const hour = Number.isInteger(hourSetting) && hourSetting >= 0 && hourSetting <= 23 ? hourSetting : 2;

  return { everySeconds, hour };
}

function lastScheduled() {
  return listBackups().find((meta) => meta.type === "SCHEDULED") || null;
}

function due(now = new Date()) {
  const { everySeconds, hour } = schedule();
  const last = lastScheduled();
  const lastTime = last ? new Date(last.createdAt).getTime() : null;

  if (everySeconds > 0) {
    return lastTime === null || now.getTime() - lastTime >= everySeconds * 1000;
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0).getTime();

  return now.getTime() >= today && (lastTime === null || lastTime < today);
}

let lastFailureAt = 0;
let lastFailure = null;

function nextRunAt(now = new Date()) {
  const { everySeconds, hour } = schedule();
  const last = lastScheduled();

  if (everySeconds > 0) {
    return new Date((last ? new Date(last.createdAt).getTime() : now.getTime()) + everySeconds * 1000).toISOString();
  }

  if (due(now)) return now.toISOString();

  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hour, 0, 0);

  return tomorrow.toISOString();
}

function scheduleInfo() {
  const { everySeconds, hour } = schedule();
  const last = lastScheduled();

  return {
    description: everySeconds > 0 ? `Every ${everySeconds} seconds` : `Every day at ${((hour + 11) % 12) + 1}:00 ${hour < 12 ? "AM" : "PM"}`,
    keepAutomatic: KEEP.SCHEDULED,
    encrypted: true,
    nextRunAt: nextRunAt(),
    lastAutomatic: last ? publicMeta(last) : null,
    lastFailure,
  };
}

function runDue() {
  if (busy || !due()) return;

  // After a failure, wait before trying again.
  const { everySeconds } = schedule();
  const pause = everySeconds > 0 ? Math.min(everySeconds, 10) * 1000 : 10 * 60 * 1000;

  if (Date.now() - lastFailureAt < pause) return;

  try {
    createBackup({ type: "SCHEDULED" });
    lastFailure = null;
  } catch (error) {
    lastFailureAt = Date.now();
    lastFailure = { at: new Date().toISOString(), message: error.message };
  }
}

let started = false;

// Checks every 20 seconds whether a backup is due (and shortly after the
// server starts, so one missed while it was off is made at once).
function startScheduler() {
  removeLeftovers();

  if (started || process.env.SMARTFINE_BACKUP_SCHEDULE === "off") return;

  started = true;

  // (SMARTFINE_BACKUP_CHECK_SECONDS exists so tests do not have to wait.)
  const every = Math.max(Number(process.env.SMARTFINE_BACKUP_CHECK_SECONDS) || 20, 1) * 1000;

  setTimeout(runDue, Math.min(15 * 1000, every)).unref();
  setInterval(runDue, every).unref();
}

module.exports = {
  BACKUP_DIR,
  BackupError,
  TYPES,
  createBackup,
  discard,
  due,
  idPattern,
  listBackups,
  publicMeta,
  restoreBackup,
  scheduleInfo,
  startScheduler,
  verifyBackup,
};
