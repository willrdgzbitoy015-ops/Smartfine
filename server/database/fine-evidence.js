// Evidence photos attached to fines, and the record of who handled each fine
// (recorded, collected, refunded, cancelled).
//
// Photos are kept in server/uploads/fine-evidence but are NOT served by the
// public /uploads folder: server.js blocks that path, and each photo is only
// reachable through a signed link that expires (see evidenceUrl).
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const db = require("./database");

const EVIDENCE_DIR = path.join(__dirname, "..", "uploads", "fine-evidence");

// Most photos one fine can hold at a time.
const MAX_EVIDENCE = 3;

// Largest photo accepted, after the phone compresses it.
const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

// A signed link stays the same for the rest of the hour it was made in, so a
// live reload does not make the app download the same photo again, and works
// for at least one more hour after that.
const LINK_WINDOW_SECONDS = 60 * 60;

// A new key each time the backend starts. Links made before a restart stop
// working; the apps reload (and get new links) when they reconnect.
const LINK_KEY =
  process.env.EVIDENCE_LINK_SECRET || crypto.randomBytes(32).toString("hex");

db.exec(`
  CREATE TABLE IF NOT EXISTS fine_evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fine_id INTEGER NOT NULL REFERENCES fines(id),
    file_name TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL
      CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- A removed photo keeps its row and file, so the removal stays visible.
    removed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    removed_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_fine_evidence_fine ON fine_evidence(fine_id);
`);

const MIME_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// The real type from the file's first bytes; the name and the type the phone
// reports are not trusted.
function sniffImageType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function linkSignature(evidenceId, expires) {
  return crypto
    .createHmac("sha256", LINK_KEY)
    .update(`fine-evidence:${evidenceId}:${expires}`)
    .digest("hex");
}

// Path (without the host) of a photo's signed link.
function evidenceUrl(evidenceId) {
  const now = Math.floor(Date.now() / 1000);
  const expires = (Math.floor(now / LINK_WINDOW_SECONDS) + 2) * LINK_WINDOW_SECONDS;

  return `/api/fines/evidence-file/${evidenceId}?expires=${expires}&signature=${linkSignature(evidenceId, expires)}`;
}

function linkIsValid(evidenceId, expires, signature) {
  const expiresAt = Number(expires);

  if (!Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = Buffer.from(linkSignature(evidenceId, expiresAt), "hex");
  const given = Buffer.from(String(signature || ""), "hex");

  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

function fullName(first, middle, last) {
  return [first, middle, last]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
}

function person(row, prefix) {
  if (!row[`${prefix}_id`]) {
    return null;
  }

  return {
    id: Number(row[`${prefix}_id`]),
    name:
      fullName(row[`${prefix}_first`], row[`${prefix}_middle`], row[`${prefix}_last`]) ||
      "Unknown",
    role: row[`${prefix}_role`] || null,
    pictureUri: row[`${prefix}_picture`] || null,
  };
}

// SQL for the name, role and picture of the user in `column`, as `prefix_*`.
function personColumns(alias, prefix) {
  return `
    ${alias}.id AS ${prefix}_id,
    ${alias}.first_name AS ${prefix}_first,
    ${alias}.middle_name AS ${prefix}_middle,
    ${alias}.last_name AS ${prefix}_last,
    ${alias}.role AS ${prefix}_role,
    ${alias}.profile_picture_uri AS ${prefix}_picture
  `;
}

function fineRow(fineId) {
  return db
    .prepare(
      `SELECT
         f.id, f.student_id, f.recorded_by, f.created_at, f.paid_at,
         f.fine_status, f.cancelled_at, f.cancellation_reason,
         ${personColumns("recorder", "recorder")},
         ${personColumns("canceller", "canceller")}
       FROM fines f
       LEFT JOIN users recorder ON recorder.id = f.recorded_by
       LEFT JOIN users canceller ON canceller.id = f.cancelled_by
       WHERE f.id = ?`,
    )
    .get(fineId);
}

function fineIsLocked(fine) {
  const status = String(fine.fine_status || "").toUpperCase();

  return Boolean(fine.paid_at || fine.cancelled_at || status === "PAID" || status === "CANCELLED");
}

// Who may see this fine's record: any Administrator, the Officer who recorded
// it, and the student it belongs to.
function canView(user, fine) {
  if (user.role === "ADMIN") return true;
  if (user.role === "FINES_OFFICER") return Number(fine.recorded_by) === Number(user.id);
  if (user.role === "STUDENT") return Number(fine.student_id) === Number(user.id);
  return false;
}

// Photos are added (and removed) only while the fine is still unpaid, by an
// Administrator or the Officer who recorded it.
function canAdd(user, fine) {
  if (fineIsLocked(fine)) return false;
  if (user.role === "ADMIN") return true;
  return user.role === "FINES_OFFICER" && Number(fine.recorded_by) === Number(user.id);
}

// An Officer removes only photos they added themselves.
function canRemove(user, fine, evidence) {
  if (!canAdd(user, fine)) return false;
  if (user.role === "ADMIN") return true;
  return Number(evidence.uploaded_by) === Number(user.id);
}

function evidenceRows(fineId) {
  return db
    .prepare(
      `SELECT
         e.*,
         ${personColumns("uploader", "uploader")},
         ${personColumns("remover", "remover")}
       FROM fine_evidence e
       LEFT JOIN users uploader ON uploader.id = e.uploaded_by
       LEFT JOIN users remover ON remover.id = e.removed_by
       WHERE e.fine_id = ?
       ORDER BY e.id`,
    )
    .all(fineId);
}

function activeEvidenceCount(fineId) {
  return Number(
    db
      .prepare("SELECT COUNT(*) n FROM fine_evidence WHERE fine_id = ? AND removed_at IS NULL")
      .get(fineId).n,
  );
}

// The fine's record as `user` may see it: who handled it and its photos.
function fineTrail(fine, user) {
  const recordedBy = person(fine, "recorder");

  // The payment that settled the fine. Cash names the person who confirmed it;
  // GCash is confirmed by PayMongo, not by a person.
  const payment = db
    .prepare(
      `SELECT
         p.payment_reference, p.payment_method,
         COALESCE(p.paid_at, p.confirmed_at, p.created_at) AS paid_at,
         ${personColumns("collector", "collector")}
       FROM payments p
       LEFT JOIN users collector ON collector.id = p.confirmed_by
       WHERE p.fine_id = ? AND p.payment_status = 'SUCCESS'
       ORDER BY p.id DESC
       LIMIT 1`,
    )
    .get(fine.id);

  const refund = db
    .prepare(
      `SELECT
         r.refund_reference, r.payment_method,
         COALESCE(r.completed_at, r.reviewed_at, r.updated_at) AS refunded_at,
         ${personColumns("reviewer", "reviewer")}
       FROM refunds r
       LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
       WHERE r.fine_id = ? AND r.status = 'SUCCEEDED'
       ORDER BY r.id DESC
       LIMIT 1`,
    )
    .get(fine.id);

  const rows = evidenceRows(fine.id);

  return {
    fineId: Number(fine.id),
    recorded: {
      by: recordedBy,
      at: fine.created_at,
    },
    collected: payment
      ? {
          by: payment.payment_method === "CASH" ? person(payment, "collector") : null,
          method: payment.payment_method,
          reference: payment.payment_reference,
          at: payment.paid_at,
        }
      : fine.paid_at
        ? // Fines marked paid before payments were recorded.
          { by: null, method: null, reference: null, at: fine.paid_at }
        : null,
    refunded: refund
      ? {
          by: person(refund, "reviewer"),
          method: refund.payment_method,
          reference: refund.refund_reference,
          at: refund.refunded_at,
        }
      : null,
    cancelled: fine.cancelled_at
      ? {
          by: person(fine, "canceller"),
          reason: fine.cancellation_reason || null,
          at: fine.cancelled_at,
        }
      : null,
    evidence: rows
      .filter((row) => !row.removed_at)
      .map((row) => ({
        id: Number(row.id),
        url: evidenceUrl(row.id),
        uploadedBy: person(row, "uploader"),
        uploadedAt: row.uploaded_at,
        canRemove: canRemove(user, fine, row),
      })),
    // Removed photos are listed (without the photo) so a removal is never
    // silent.
    removedEvidence: rows
      .filter((row) => row.removed_at)
      .map((row) => ({
        id: Number(row.id),
        removedBy: person(row, "remover"),
        removedAt: row.removed_at,
      })),
    canAddEvidence: canAdd(user, fine) && activeEvidenceCount(fine.id) < MAX_EVIDENCE,
    maxEvidence: MAX_EVIDENCE,
    locked: fineIsLocked(fine),
  };
}

class EvidenceError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Saves one photo for a fine. The file is written first and removed again if
// the record cannot be saved.
function addEvidence({ fineId, user, buffer }) {
  const mimeType = sniffImageType(buffer);

  if (!mimeType) {
    throw new EvidenceError(400, "INVALID_IMAGE", "Please attach a JPG, PNG or WEBP photo.");
  }

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  const fileName = `fine-${fineId}-${crypto.randomUUID()}${MIME_EXTENSIONS[mimeType]}`;
  const filePath = path.join(EVIDENCE_DIR, fileName);

  fs.writeFileSync(filePath, buffer, { flag: "wx" });

  db.exec("BEGIN IMMEDIATE");

  try {
    // Checked inside the transaction so two uploads at once cannot pass the
    // limit, and a fine paid a moment ago is not changed.
    const fine = fineRow(fineId);

    if (!fine) {
      throw new EvidenceError(404, "FINE_NOT_FOUND", "This fine no longer exists.");
    }

    if (fineIsLocked(fine)) {
      throw new EvidenceError(
        409,
        "FINE_LOCKED",
        "This fine is already paid or cancelled, so its evidence can no longer change.",
      );
    }

    if (!canAdd(user, fine)) {
      throw new EvidenceError(
        403,
        "NOT_ALLOWED",
        "Only an Administrator or the Officer who recorded this fine can add evidence.",
      );
    }

    if (activeEvidenceCount(fineId) >= MAX_EVIDENCE) {
      throw new EvidenceError(
        409,
        "EVIDENCE_LIMIT",
        `A fine can have up to ${MAX_EVIDENCE} evidence photos.`,
      );
    }

    const result = db
      .prepare(
        `INSERT INTO fine_evidence (fine_id, file_name, mime_type, size_bytes, uploaded_by)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(fineId, fileName, mimeType, buffer.length, user.id);

    db.exec("COMMIT");

    return Number(result.lastInsertRowid);
  } catch (error) {
    db.exec("ROLLBACK");

    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") {
        console.error("Evidence cleanup failed:", cleanupError);
      }
    }

    throw error;
  }
}

function removeEvidence({ fineId, evidenceId, user }) {
  db.exec("BEGIN IMMEDIATE");

  try {
    const fine = fineRow(fineId);
    const evidence = db
      .prepare("SELECT * FROM fine_evidence WHERE id = ? AND fine_id = ?")
      .get(evidenceId, fineId);

    if (!fine || !evidence || evidence.removed_at) {
      throw new EvidenceError(404, "EVIDENCE_NOT_FOUND", "This photo was already removed.");
    }

    if (fineIsLocked(fine)) {
      throw new EvidenceError(
        409,
        "FINE_LOCKED",
        "This fine is already paid or cancelled, so its evidence can no longer change.",
      );
    }

    if (!canRemove(user, fine, evidence)) {
      throw new EvidenceError(
        403,
        "NOT_ALLOWED",
        "You can only remove photos you added to fines you recorded.",
      );
    }

    db.prepare(
      `UPDATE fine_evidence
       SET removed_by = ?, removed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND removed_at IS NULL`,
    ).run(user.id, evidenceId);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

// The stored file of a photo that has not been removed.
function evidenceFile(evidenceId) {
  const row = db
    .prepare(
      "SELECT file_name, mime_type FROM fine_evidence WHERE id = ? AND removed_at IS NULL",
    )
    .get(evidenceId);

  if (!row || !/^fine-\d+-[0-9a-f-]+\.(jpg|png|webp)$/.test(row.file_name)) {
    return null;
  }

  const filePath = path.join(EVIDENCE_DIR, row.file_name);

  return fs.existsSync(filePath) ? { filePath, mimeType: row.mime_type } : null;
}

module.exports = {
  MAX_EVIDENCE,
  MAX_EVIDENCE_BYTES,
  EvidenceError,
  addEvidence,
  canView,
  evidenceFile,
  fineRow,
  fineTrail,
  linkIsValid,
  removeEvidence,
};
