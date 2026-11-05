// Digital receipts for successful payments (GCash and cash).
// Mounted at /api/payments next to the cashier and GCash routes.
//
//   GET  /api/payments/:id/receipt        the receipt data (logs "Receipt viewed")
//   POST /api/payments/:id/receipt/saved  the app saved or shared the picture
//                                         (logs "Receipt saved")
//
// Only the student who owns the payment, or an Administrator, may use them.
// Everyone else is refused with 403 and a DENIED Log Trail entry.
// Nothing here changes a payment, a fine or a refund: it only reads them.
const express = require("express");

const db = require("../database/database");
const { logActivity } = require("../database/activity-log");
const { requireActive } = require("../middleware/access");
const { logDenied } = require("../security/access-log");
const { rateLimit } = require("../security/rate-limit");

const router = express.Router();

const receiptLimit = rateLimit({ max: 120, windowMs: 10 * 60 * 1000, name: "payment receipts" });

const METHOD_LABELS = { CASH: "Pay at Cashier", GCASH: "GCash" };

function fullName(first, middle, last) {
  return [first, middle, last]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
}

function schoolName() {
  const row = db.prepare("SELECT school_name FROM system_settings WHERE id = 1").get();

  return String(row?.school_name || "").trim();
}

// The payment with everything its receipt shows. Null when there is none.
function loadPayment(paymentId) {
  return (
    db
      .prepare(
        `SELECT
           p.id, p.payment_reference, p.payment_method, p.payment_status,
           p.amount_centavos, p.gateway_reference, p.gateway_transaction_id,
           p.confirmed_by, p.confirmed_at, p.paid_at, p.created_at,
           f.id AS fine_id, f.fine_reference,
           COALESCE(vt.violation_name, 'Violation') AS violation_name,
           s.user_id AS owner_user_id, s.student_number,
           su.first_name AS student_first, su.middle_name AS student_middle,
           su.last_name AS student_last,
           cu.first_name AS confirmer_first, cu.middle_name AS confirmer_middle,
           cu.last_name AS confirmer_last
         FROM payments p
         JOIN fines f ON f.id = p.fine_id
         LEFT JOIN violation_types vt ON vt.id = f.violation_type_id
         JOIN students s ON s.id = p.student_id
         JOIN users su ON su.id = s.user_id
         LEFT JOIN users cu ON cu.id = p.confirmed_by
         WHERE p.id = ?`,
      )
      .get(paymentId) || null
  );
}

// When the payment was refunded, or null.
function refundDate(paymentId) {
  const refund = db
    .prepare(
      `SELECT COALESCE(completed_at, reviewed_at, updated_at) AS refunded_at
       FROM refunds
       WHERE payment_id = ? AND status = 'SUCCEEDED'
       ORDER BY id DESC
       LIMIT 1`,
    )
    .get(paymentId);

  return refund ? refund.refunded_at : null;
}

function receiptOf(payment) {
  const isCash = payment.payment_method === "CASH";
  const confirmer = fullName(payment.confirmer_first, payment.confirmer_middle, payment.confirmer_last);
  const refundedAt = refundDate(payment.id);

  return {
    id: Number(payment.id),
    paymentReference: payment.payment_reference,
    studentName: fullName(payment.student_first, payment.student_middle, payment.student_last),
    studentNumber: payment.student_number,
    fineReference: payment.fine_reference,
    violationName: payment.violation_name,
    amountCentavos: Number(payment.amount_centavos),
    method: payment.payment_method,
    methodLabel: METHOD_LABELS[payment.payment_method] || payment.payment_method,
    // The PayMongo reference, for GCash only (the same one Reports shows).
    gatewayReference: isCash ? null : payment.gateway_reference || payment.gateway_transaction_id || null,
    paidAt: payment.paid_at || payment.confirmed_at || payment.created_at,
    // Cash: the administrator who received the money. GCash is confirmed by
    // PayMongo, so there is no one to name.
    confirmedBy: isCash && confirmer ? confirmer : null,
    schoolName: schoolName(),
    refunded: Boolean(refundedAt),
    refundedAt,
  };
}

// Who may open this payment's receipt. Null when allowed, or the reason why not.
function whyRefused(payment, account) {
  if (account.role === "ADMIN") {
    return null;
  }

  if (!payment) {
    // Same answer as for someone else's payment, so ids cannot be probed.
    return "the receipt does not belong to this student";
  }

  return Number(payment.owner_user_id) === account.id ? null : "the receipt belongs to another student";
}

function paymentIdOf(req, res) {
  const text = String(req.params.id || "");

  if (!/^\d{1,12}$/.test(text) || Number(text) < 1) {
    res.status(400).json({ success: false, code: "INVALID_PAYMENT", message: "That is not a valid payment." });

    return null;
  }

  return Number(text);
}

// Shared by both routes: the payment, once the signed-in account is allowed
// to see it and it is a successful payment. Sends the refusal itself.
function allowedPayment(req, res) {
  const paymentId = paymentIdOf(req, res);

  if (paymentId === null) {
    return null;
  }

  const payment = loadPayment(paymentId);
  const refusal = whyRefused(payment, req.account);

  if (refusal) {
    logDenied(req, { reason: refusal, userId: req.account.id });

    res.status(403).json({
      success: false,
      code: "RECEIPT_NOT_ALLOWED",
      message: "You can only open the receipts of your own payments.",
    });

    return null;
  }

  if (!payment) {
    res.status(404).json({ success: false, code: "PAYMENT_NOT_FOUND", message: "Payment not found." });

    return null;
  }

  if (payment.payment_status !== "SUCCESS") {
    res.status(409).json({
      success: false,
      code: "PAYMENT_NOT_SUCCESSFUL",
      message: "A receipt is only available for successful payments.",
    });

    return null;
  }

  return payment;
}

router.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.get("/:id/receipt", requireActive("ADMIN", "STUDENT"), receiptLimit, (req, res) => {
  try {
    const payment = allowedPayment(req, res);

    if (!payment) {
      return undefined;
    }

    const receipt = receiptOf(payment);

    logActivity({
      actorId: req.account.id,
      action: "RECEIPT_VIEWED",
      entityType: "PAYMENT",
      entityId: receipt.id,
      fineId: payment.fine_id,
      description: `Receipt viewed for payment ${receipt.paymentReference} (fine ${receipt.fineReference}, ${receipt.methodLabel}).`,
      details: { paymentReference: receipt.paymentReference, method: receipt.method },
    });

    return res.json({ success: true, receipt });
  } catch (error) {
    console.error("GET /api/payments/:id/receipt failed:", error);

    return res.status(500).json({ success: false, message: "The receipt could not be loaded." });
  }
});

// The app calls this after the picture was saved to the gallery, downloaded or
// shared. The picture is made on the device, so this is the only trace of it.
router.post("/:id/receipt/saved", requireActive("ADMIN", "STUDENT"), receiptLimit, (req, res) => {
  try {
    const payment = allowedPayment(req, res);

    if (!payment) {
      return undefined;
    }

    const how = ["saved", "shared", "downloaded"].includes(req.body?.how) ? req.body.how : "saved";

    logActivity({
      actorId: req.account.id,
      action: "RECEIPT_SAVED",
      entityType: "PAYMENT",
      entityId: Number(payment.id),
      fineId: payment.fine_id,
      description: `Receipt ${how} for payment ${payment.payment_reference} (fine ${payment.fine_reference}).`,
      details: { paymentReference: payment.payment_reference, how },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("POST /api/payments/:id/receipt/saved failed:", error);

    return res.status(500).json({ success: false, message: "Could not record that the receipt was saved." });
  }
});

module.exports = router;
