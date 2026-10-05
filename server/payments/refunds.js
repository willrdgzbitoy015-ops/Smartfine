// Refunds for paid fines.
//
// Rules:
// - A student asks for a refund of their own completed payment and an Admin
//   approves or rejects it. An Admin may also refund a payment directly
//   (for example a GCash payment that arrived after the fine was cancelled).
// - GCash payments are refunded through PayMongo (POST /v1/refunds) within
//   180 days of payment. Cash refunds are recorded by the Admin who handed
//   the money back.
// - A refund is finished only when PayMongo reports it "succeeded" (or the
//   Admin confirms the cash was returned). Only then is the fine cancelled.
//   A failed refund leaves the fine Paid.
// - One payment has at most one open or completed refund, enforced by a
//   unique index, so double taps, two Admins or repeated webhooks can never
//   refund the same payment twice.
// - Payment records are never changed; reports subtract refunded payments.
const crypto = require("node:crypto");

const db = require("../database/database");
const notices = require("../database/notifications");
const paymongo = require("./paymongo");

db.exec(`
  CREATE TABLE IF NOT EXISTS refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    refund_reference TEXT NOT NULL UNIQUE,
    payment_id INTEGER NOT NULL REFERENCES payments(id),
    fine_id INTEGER NOT NULL REFERENCES fines(id),
    student_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    amount_centavos INTEGER NOT NULL CHECK (amount_centavos > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'GCASH')),
    reason_code TEXT NOT NULL
      CHECK (reason_code IN ('WRONG_FINE', 'DUPLICATE', 'OTHER')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'REQUESTED'
      CHECK (status IN (
        'REQUESTED', 'WITHDRAWN', 'REJECTED',
        'PROCESSING', 'SUCCEEDED', 'FAILED'
      )),
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TEXT,
    review_note TEXT,
    gateway_refund_id TEXT,
    gateway_status TEXT,
    failure_reason TEXT,
    completed_at TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_one_open_per_payment
    ON refunds(payment_id)
    WHERE status IN ('REQUESTED', 'PROCESSING', 'SUCCEEDED');

  CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_gateway_refund_id
    ON refunds(gateway_refund_id)
    WHERE gateway_refund_id IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
  CREATE INDEX IF NOT EXISTS idx_refunds_fine ON refunds(fine_id);
  CREATE INDEX IF NOT EXISTS idx_refunds_student ON refunds(student_user_id);
`);

// PayMongo keeps GCash payments refundable for 180 days.
const GCASH_REFUND_DAYS = 180;

// PayMongo refunds start at ₱1.00.
const PAYMONGO_MINIMUM_CENTAVOS = 100;

const REASONS = {
  WRONG_FINE: { label: "Fine issued by mistake", paymongo: "requested_by_customer" },
  DUPLICATE: { label: "Paid more than once", paymongo: "duplicate" },
  OTHER: { label: "Other reason", paymongo: "others" },
};

const OPEN_STATUSES = ["REQUESTED", "PROCESSING", "SUCCEEDED"];

class RefundError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "RefundError";
    this.status = status;
    this.code = code;
  }
}

function runTransaction(work) {
  db.exec("BEGIN IMMEDIATE");

  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function now() {
  return db.prepare("SELECT CURRENT_TIMESTAMP AS value").get().value;
}

function insertEvent(paymentId, eventType, details, actorUserId = null, gatewayEventId = null) {
  db.prepare(
    `INSERT INTO payment_events (
       payment_id, event_type, actor_user_id, gateway_event_id, details_json
     )
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    paymentId,
    eventType,
    actorUserId,
    gatewayEventId,
    details ? JSON.stringify(details) : null,
  );
}

// ==========================================
// READ
// ==========================================

const REFUND_SELECT = `
  SELECT
    r.*,
    f.fine_reference,
    f.fine_status,
    f.cancelled_at AS fine_cancelled_at,
    COALESCE(vt.violation_name, 'Violation') AS violation_name,
    p.payment_reference,
    p.paid_at AS payment_paid_at,
    TRIM(
      student.first_name || ' ' ||
      COALESCE(student.middle_name || ' ', '') ||
      student.last_name
    ) AS student_name,
    COALESCE(student.student_number, student.username) AS student_number,
    TRIM(COALESCE(reviewer.first_name, '') || ' ' || COALESCE(reviewer.last_name, '')) AS reviewer_name,
    TRIM(COALESCE(requester.first_name, '') || ' ' || COALESCE(requester.last_name, '')) AS requester_name,
    requester.role AS requester_role
  FROM refunds r
  JOIN payments p ON p.id = r.payment_id
  JOIN fines f ON f.id = r.fine_id
  LEFT JOIN violation_types vt ON vt.id = f.violation_type_id
  LEFT JOIN users student ON student.id = r.student_user_id
  LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
  LEFT JOIN users requester ON requester.id = r.requested_by
`;

function getRefund(refundId) {
  return db.prepare(`${REFUND_SELECT} WHERE r.id = ?`).get(refundId);
}

function listRefunds({ status, studentUserId, fineId, limit = 200 } = {}) {
  const where = [];
  const params = [];

  if (status) {
    where.push("r.status = ?");
    params.push(status);
  }

  if (studentUserId) {
    where.push("r.student_user_id = ?");
    params.push(studentUserId);
  }

  if (fineId) {
    where.push("r.fine_id = ?");
    params.push(fineId);
  }

  return db
    .prepare(
      `${REFUND_SELECT}
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY r.id DESC
       LIMIT ?`,
    )
    .all(...params, limit);
}

function formatRefund(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    refundReference: row.refund_reference,
    paymentId: Number(row.payment_id),
    paymentReference: row.payment_reference,
    fineId: Number(row.fine_id),
    fineReference: row.fine_reference,
    violationName: row.violation_name,
    studentName: row.student_name || null,
    studentNumber: row.student_number || null,
    amountCentavos: Number(row.amount_centavos),
    paymentMethod: row.payment_method,
    reasonCode: row.reason_code,
    reasonLabel: REASONS[row.reason_code]?.label || "Other reason",
    reason: row.reason,
    status: row.status,
    requestedBy: row.requested_by ? Number(row.requested_by) : null,
    requestedByName: row.requester_name || null,
    requestedByRole: row.requester_role || null,
    requestedAt: row.requested_at,
    reviewedBy: row.reviewed_by ? Number(row.reviewed_by) : null,
    reviewedByName: row.reviewer_name || null,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
    gatewayRefundId: row.gateway_refund_id,
    gatewayStatus: row.gateway_status,
    failureReason: row.failure_reason,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

function getPayment(paymentId) {
  return db
    .prepare(
      `SELECT
         p.*,
         s.user_id AS student_user_id,
         (julianday('now') - julianday(COALESCE(p.paid_at, p.created_at))) AS age_days
       FROM payments p
       LEFT JOIN students s ON s.id = p.student_id
       WHERE p.id = ?`,
    )
    .get(paymentId);
}

// The payment that settled the fine, or any received payment for it.
function latestReceivedPayment(fineId) {
  return db
    .prepare(
      `SELECT id
       FROM payments
       WHERE fine_id = ? AND payment_status = 'SUCCESS'
       ORDER BY COALESCE(paid_at, created_at) DESC, id DESC
       LIMIT 1`,
    )
    .get(fineId);
}

function openRefundFor(paymentId, exceptRefundId = null) {
  return db
    .prepare(
      `SELECT id, status, refund_reference
       FROM refunds
       WHERE payment_id = ?
         AND status IN ('REQUESTED', 'PROCESSING', 'SUCCEEDED')
         AND (? IS NULL OR id <> ?)
       ORDER BY id DESC
       LIMIT 1`,
    )
    .get(paymentId, exceptRefundId, exceptRefundId);
}

// Whether a payment can be refunded, and why not when it cannot.
function eligibility(payment, exceptRefundId = null) {
  if (!payment) {
    return { refundable: false, reason: "This fine has no payment record to refund." };
  }

  if (payment.payment_status !== "SUCCESS") {
    return { refundable: false, reason: "Only completed payments can be refunded." };
  }

  if (!["CASH", "GCASH"].includes(payment.payment_method)) {
    return { refundable: false, reason: "This payment method cannot be refunded here." };
  }

  const open = openRefundFor(payment.id, exceptRefundId);

  if (open) {
    const what =
      open.status === "SUCCEEDED"
        ? "This payment was already refunded."
        : open.status === "PROCESSING"
          ? "A refund for this payment is already being processed."
          : "A refund for this payment has already been requested.";

    return { refundable: false, reason: what, openRefundId: Number(open.id) };
  }

  if (payment.payment_method === "GCASH") {
    if (!payment.gateway_transaction_id) {
      return {
        refundable: false,
        reason:
          "This GCash payment has no PayMongo payment ID, so it can only be refunded from the PayMongo dashboard.",
      };
    }

    if (Number(payment.age_days) > GCASH_REFUND_DAYS) {
      return {
        refundable: false,
        reason: `GCash payments can only be refunded within ${GCASH_REFUND_DAYS} days of payment.`,
      };
    }

    if (Number(payment.amount_centavos) < PAYMONGO_MINIMUM_CENTAVOS) {
      return { refundable: false, reason: "PayMongo refunds must be at least ₱1.00." };
    }
  }

  return {
    refundable: true,
    reason: null,
    refundableUntil:
      payment.payment_method === "GCASH"
        ? db
            .prepare("SELECT DATETIME(?, ?) AS value")
            .get(payment.paid_at || payment.created_at, `+${GCASH_REFUND_DAYS} days`)
            .value
        : null,
  };
}

function paymentSummary(payment, exceptRefundId = null) {
  if (!payment) return null;

  const check = eligibility(payment, exceptRefundId);

  return {
    paymentId: Number(payment.id),
    paymentReference: payment.payment_reference,
    fineId: Number(payment.fine_id),
    paymentMethod: payment.payment_method,
    amountCentavos: Number(payment.amount_centavos),
    paidAt: payment.paid_at,
    refundable: check.refundable,
    notRefundableReason: check.reason,
    refundableUntil: check.refundableUntil || null,
  };
}

// ==========================================
// VALIDATION
// ==========================================

function cleanReason(reasonCode, reason) {
  const code = String(reasonCode || "").trim().toUpperCase();
  const text = String(reason || "").trim().replace(/\s+/g, " ");

  if (!REASONS[code]) {
    throw new RefundError(400, "INVALID_REASON", "Choose why the payment should be refunded.");
  }

  if (text.length < 10) {
    throw new RefundError(
      400,
      "REASON_TOO_SHORT",
      "Please explain the refund in at least 10 characters.",
    );
  }

  if (text.length > 500) {
    throw new RefundError(400, "REASON_TOO_LONG", "Keep the explanation under 500 characters.");
  }

  return { code, text };
}

function newReference() {
  return `REFUND-${crypto.randomUUID()}`;
}

// ==========================================
// REQUEST
// ==========================================

// Students may refund only their own payments; Admins any payment.
function createRefundRequest({ paymentId, actorId, actorRole, reasonCode, reason }) {
  const { code, text } = cleanReason(reasonCode, reason);

  return runTransaction(() => {
    const payment = getPayment(paymentId);

    if (!payment) {
      throw new RefundError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
    }

    if (actorRole === "STUDENT" && Number(payment.student_user_id) !== Number(actorId)) {
      throw new RefundError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
    }

    const check = eligibility(payment);

    if (!check.refundable) {
      throw new RefundError(409, "NOT_REFUNDABLE", check.reason);
    }

    const reference = newReference();

    const result = db
      .prepare(
        `INSERT INTO refunds (
           refund_reference, payment_id, fine_id, student_user_id,
           amount_centavos, payment_method, reason_code, reason,
           status, requested_by
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'REQUESTED', ?)`,
      )
      .run(
        reference,
        payment.id,
        payment.fine_id,
        payment.student_user_id || null,
        payment.amount_centavos,
        payment.payment_method,
        code,
        text,
        actorId,
      );

    const refundId = Number(result.lastInsertRowid);

    insertEvent(payment.id, "REFUND_REQUESTED", { refundReference: reference, reasonCode: code }, actorId);

    const refund = getRefund(refundId);

    if (actorRole === "STUDENT") {
      notices.notifyRefundRequested(refund);
    }

    return refund;
  });
}

// The student takes back a request an Admin has not decided yet.
function withdrawRefund(refundId, studentUserId) {
  return runTransaction(() => {
    const refund = getRefund(refundId);

    if (!refund || Number(refund.student_user_id) !== Number(studentUserId)) {
      throw new RefundError(404, "REFUND_NOT_FOUND", "Refund request not found.");
    }

    if (refund.status !== "REQUESTED") {
      throw new RefundError(409, "REFUND_DECIDED", "This refund request was already decided.");
    }

    db.prepare(
      `UPDATE refunds
       SET status = 'WITHDRAWN', updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'REQUESTED'`,
    ).run(refundId);

    insertEvent(refund.payment_id, "REFUND_WITHDRAWN", { refundReference: refund.refund_reference }, studentUserId);
    notices.settleRefundNotices(refund.payment_id);

    return getRefund(refundId);
  });
}

function rejectRefund(refundId, adminId, note) {
  const text = String(note || "").trim().replace(/\s+/g, " ");

  if (text.length < 5) {
    throw new RefundError(400, "NOTE_REQUIRED", "Tell the student why the refund was declined (at least 5 characters).");
  }

  return runTransaction(() => {
    const refund = getRefund(refundId);

    if (!refund) {
      throw new RefundError(404, "REFUND_NOT_FOUND", "Refund request not found.");
    }

    if (refund.status !== "REQUESTED") {
      throw new RefundError(409, "REFUND_DECIDED", "This refund request was already decided.");
    }

    db.prepare(
      `UPDATE refunds
       SET status = 'REJECTED', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP,
           review_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'REQUESTED'`,
    ).run(adminId, text.slice(0, 500), refundId);

    insertEvent(refund.payment_id, "REFUND_REJECTED", { refundReference: refund.refund_reference }, adminId);
    notices.settleRefundNotices(refund.payment_id);
    notices.notifyRefundRejected(refund, text);

    return getRefund(refundId);
  });
}

// ==========================================
// COMPLETE
// ==========================================

// Inside a transaction: the refund succeeded. The fine is cancelled when this
// payment is what made it Paid.
function markSucceeded(refund, { source, gatewayStatus = null }) {
  if (refund.status === "SUCCEEDED") {
    return false;
  }

  const timestamp = now();

  // Anything else still open for this payment can no longer succeed.
  db.prepare(
    `UPDATE refunds
     SET status = 'FAILED',
         failure_reason = 'Another refund for this payment succeeded.',
         updated_at = ?
     WHERE payment_id = ? AND id <> ? AND status IN ('REQUESTED', 'PROCESSING')`,
  ).run(timestamp, refund.payment_id, refund.id);

  db.prepare(
    `UPDATE refunds
     SET status = 'SUCCEEDED',
         gateway_status = COALESCE(?, gateway_status),
         failure_reason = NULL,
         completed_at = ?,
         updated_at = ?
     WHERE id = ?`,
  ).run(gatewayStatus, timestamp, timestamp, refund.id);

  const payment = getPayment(refund.payment_id);
  const fine = db
    .prepare("SELECT id, fine_status, paid_at, cancelled_at FROM fines WHERE id = ?")
    .get(refund.fine_id);

  // A "needs review" payment never paid the fine, so the fine is left alone.
  const paidTheFine =
    fine &&
    !fine.cancelled_at &&
    fine.fine_status === "PAID" &&
    !String(payment?.payment_notes || "").startsWith("Needs review");

  let fineCancelled = false;

  if (paidTheFine) {
    const reasonLabel = REASONS[refund.reason_code]?.label || "Refunded";

    const updated = db
      .prepare(
        `UPDATE fines
         SET fine_status = 'CANCELLED',
             cancelled_at = ?,
             cancelled_by = ?,
             cancellation_reason = ?,
             updated_at = ?
         WHERE id = ? AND cancelled_at IS NULL`,
      )
      .run(
        timestamp,
        refund.reviewed_by,
        `Refunded (${reasonLabel}): ${refund.reason}`.slice(0, 500),
        timestamp,
        fine.id,
      );

    fineCancelled = Number(updated.changes) === 1;
  }

  insertEvent(
    refund.payment_id,
    "REFUND_SUCCEEDED",
    { refundReference: refund.refund_reference, source, fineCancelled },
    refund.reviewed_by,
  );

  notices.notifyRefundCompleted(getRefund(refund.id), fineCancelled);

  return true;
}

function markFailed(refund, reason, { gatewayStatus = null, notify = true } = {}) {
  db.prepare(
    `UPDATE refunds
     SET status = 'FAILED',
         gateway_status = COALESCE(?, gateway_status),
         failure_reason = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
  ).run(gatewayStatus, String(reason).slice(0, 500), refund.id);

  insertEvent(refund.payment_id, "REFUND_FAILED", { refundReference: refund.refund_reference, reason }, refund.reviewed_by);

  if (notify) {
    notices.notifyRefundFailed(refund, reason);
  }
}

// Applies a status PayMongo reported. Safe to call repeatedly.
function applyGatewayRefund(refundId, gateway, source) {
  return runTransaction(() => {
    const refund = getRefund(refundId);

    if (!refund || refund.status === "SUCCEEDED") {
      return refund;
    }

    if (gateway.id && !refund.gateway_refund_id) {
      db.prepare("UPDATE refunds SET gateway_refund_id = ? WHERE id = ?").run(gateway.id, refund.id);
    }

    const status = String(gateway.status || "").toLowerCase();

    if (status === "succeeded") {
      markSucceeded(getRefund(refundId), { source, gatewayStatus: status });
    } else if (status === "failed") {
      if (refund.status !== "FAILED") {
        markFailed(refund, "PayMongo could not process the refund.", { gatewayStatus: status });
      }
    } else if (status) {
      db.prepare(
        `UPDATE refunds
         SET gateway_status = ?,
             status = CASE WHEN status = 'FAILED' THEN 'PROCESSING' ELSE status END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      ).run(status, refund.id);
    }

    return getRefund(refundId);
  });
}

// ==========================================
// APPROVE
// ==========================================

async function approveRefund(refundId, adminId, { note, cashReturned } = {}) {
  const reviewNote = String(note || "").trim().replace(/\s+/g, " ").slice(0, 500) || null;

  // Step 1: claim the request so it is approved once, even on a double tap.
  const claimed = runTransaction(() => {
    const refund = getRefund(refundId);

    if (!refund) {
      throw new RefundError(404, "REFUND_NOT_FOUND", "Refund request not found.");
    }

    if (refund.status !== "REQUESTED") {
      throw new RefundError(409, "REFUND_DECIDED", "This refund request was already decided.");
    }

    const check = eligibility(getPayment(refund.payment_id), refund.id);

    if (!check.refundable) {
      throw new RefundError(409, "NOT_REFUNDABLE", check.reason);
    }

    if (refund.payment_method === "CASH" && cashReturned !== true) {
      throw new RefundError(
        400,
        "CASH_NOT_CONFIRMED",
        "Confirm that you returned the cash to the student before recording the refund.",
      );
    }

    db.prepare(
      `UPDATE refunds
       SET status = 'PROCESSING', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP,
           review_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'REQUESTED'`,
    ).run(adminId, reviewNote, refundId);

    insertEvent(refund.payment_id, "REFUND_APPROVED", { refundReference: refund.refund_reference }, adminId);

    const approved = getRefund(refundId);

    // Cash was handed back in person: the refund is complete now.
    if (approved.payment_method === "CASH") {
      markSucceeded(approved, { source: "CASH_RETURNED" });
    }

    return getRefund(refundId);
  });

  if (claimed.payment_method !== "GCASH") {
    return claimed;
  }

  // Step 2: ask PayMongo to send the money back.
  const payment = getPayment(claimed.payment_id);

  let gateway;

  try {
    gateway = await paymongo.createRefund({
      amountCentavos: Number(claimed.amount_centavos),
      paymentId: payment.gateway_transaction_id,
      reason: REASONS[claimed.reason_code]?.paymongo || "others",
      notes: `SmartFine ${claimed.fine_reference}: ${claimed.reason}`,
      metadata: {
        refund_id: String(claimed.id),
        refund_reference: claimed.refund_reference,
        fine_reference: String(claimed.fine_reference || ""),
      },
    });
  } catch (error) {
    if (error instanceof paymongo.PayMongoError && error.status === 503) {
      // Nothing was sent: put the request back for later.
      runTransaction(() => {
        db.prepare(
          `UPDATE refunds
           SET status = 'REQUESTED', reviewed_by = NULL, reviewed_at = NULL,
               review_note = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND status = 'PROCESSING'`,
        ).run(claimed.id);
      });

      throw new RefundError(503, "PAYMONGO_NOT_CONFIGURED", "Online payment is not set up, so GCash refunds cannot be sent yet.");
    }

    const reason =
      error instanceof paymongo.PayMongoError && error.status >= 400 && error.status < 500
        ? `PayMongo declined the refund: ${error.message}`
        : "PayMongo did not respond, so the refund could not be confirmed. Check the PayMongo dashboard before trying again.";

    runTransaction(() => markFailed(getRefund(claimed.id), reason));

    return getRefund(claimed.id);
  }

  const result = applyGatewayRefund(claimed.id, gateway, "APPROVAL");

  if (result.status === "PROCESSING") {
    runTransaction(() => notices.notifyRefundProcessing(result));
  }

  return result;
}

// Admins refunding without a student request: request and approve at once.
async function refundDirectly({ paymentId, adminId, reasonCode, reason, cashReturned, note }) {
  const payment = getPayment(paymentId);

  if (payment?.payment_method === "CASH" && cashReturned !== true) {
    throw new RefundError(
      400,
      "CASH_NOT_CONFIRMED",
      "Confirm that you returned the cash to the student before recording the refund.",
    );
  }

  const request = createRefundRequest({
    paymentId,
    actorId: adminId,
    actorRole: "ADMIN",
    reasonCode,
    reason,
  });

  return approveRefund(request.id, adminId, { note, cashReturned });
}

// ==========================================
// CHECK WITH PAYMONGO
// ==========================================

async function refreshRefund(refundId) {
  const refund = getRefund(refundId);

  if (
    !refund ||
    refund.payment_method !== "GCASH" ||
    !refund.gateway_refund_id ||
    !["PROCESSING", "FAILED"].includes(refund.status)
  ) {
    return refund;
  }

  const gateway = await paymongo.retrieveRefund(refund.gateway_refund_id);

  return applyGatewayRefund(refund.id, gateway, "STATUS_CHECK");
}

// payment.refunded / payment.refund.updated. The status always comes from
// PayMongo itself, so a repeated or reordered webhook cannot change the
// outcome.
async function handleRefundWebhook(event) {
  const resource = event?.attributes?.data || {};
  const attributes = resource.attributes || {};

  const gatewayIds = new Set();
  const localIds = new Set();
  let paymentGatewayId = null;

  if (typeof resource.id === "string" && resource.id.startsWith("ref_")) {
    gatewayIds.add(resource.id);
  }

  if (typeof resource.id === "string" && resource.id.startsWith("pay_")) {
    paymentGatewayId = resource.id;
  }

  if (typeof attributes.payment_id === "string") {
    paymentGatewayId = attributes.payment_id;
  }

  for (const item of Array.isArray(attributes.refunds) ? attributes.refunds : []) {
    if (typeof item?.id === "string") {
      gatewayIds.add(item.id);
    }
  }

  if (attributes.metadata?.refund_id) {
    localIds.add(Number(attributes.metadata.refund_id));
  }

  // Refunds SmartFine knows by PayMongo id, by its own id, or (when PayMongo
  // did not answer the create call) by the payment still awaiting a result.
  const candidates = new Map();

  for (const gatewayId of gatewayIds) {
    const row = db.prepare("SELECT id FROM refunds WHERE gateway_refund_id = ?").get(gatewayId);

    if (row) {
      candidates.set(Number(row.id), gatewayId);
    } else {
      // Unknown to SmartFine yet: read its metadata to find our record.
      try {
        const gateway = await paymongo.retrieveRefund(gatewayId);
        const localId = Number(gateway.metadata?.refund_id);

        if (Number.isSafeInteger(localId) && localId > 0) {
          candidates.set(localId, gatewayId);
        }
      } catch (error) {
        console.error("Could not read PayMongo refund", gatewayId, error.message);
      }
    }
  }

  for (const localId of localIds) {
    if (Number.isSafeInteger(localId) && localId > 0 && !candidates.has(localId)) {
      candidates.set(localId, null);
    }
  }

  if (candidates.size === 0 && paymentGatewayId) {
    for (const row of db
      .prepare(
        `SELECT r.id, r.gateway_refund_id
         FROM refunds r
         JOIN payments p ON p.id = r.payment_id
         WHERE p.gateway_transaction_id = ?
           AND r.status IN ('PROCESSING', 'FAILED')
           AND r.gateway_refund_id IS NOT NULL`,
      )
      .all(paymentGatewayId)) {
      candidates.set(Number(row.id), row.gateway_refund_id);
    }
  }

  const outcomes = [];

  for (const [refundId, gatewayId] of candidates) {
    const refund = getRefund(refundId);

    if (!refund || refund.payment_method !== "GCASH") continue;

    const id = gatewayId || refund.gateway_refund_id;

    if (!id) continue;

    const gateway = await paymongo.retrieveRefund(id);

    // The refund must belong to this payment.
    const payment = getPayment(refund.payment_id);

    if (gateway.paymentId && payment?.gateway_transaction_id && gateway.paymentId !== payment.gateway_transaction_id) {
      console.warn("Ignored a PayMongo refund for a different payment:", id);
      continue;
    }

    const updated = applyGatewayRefund(refund.id, gateway, "WEBHOOK");

    outcomes.push({ refundId: refund.id, status: updated?.status });
  }

  return outcomes;
}

module.exports = {
  GCASH_REFUND_DAYS,
  REASONS,
  RefundError,
  approveRefund,
  createRefundRequest,
  eligibility,
  formatRefund,
  getPayment,
  getRefund,
  handleRefundWebhook,
  latestReceivedPayment,
  listRefunds,
  paymentSummary,
  refreshRefund,
  refundDirectly,
  rejectRefund,
  withdrawRefund,
};
