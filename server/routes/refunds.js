// Refund requests and refunds. Mounted at /api/refunds.
const express = require("express");

const db = require("../database/database");
const paymongo = require("../payments/paymongo");
const refunds = require("../payments/refunds");
const { authenticateToken } = require("./auth");

const router = express.Router();

router.use(authenticateToken);

// Every route needs an active account; each route then names the roles it
// accepts.
router.use((req, res, next) => {
  try {
    const userId = Number(req.authUser?.userId);

    if (!Number.isSafeInteger(userId) || userId < 1) {
      return res.status(401).json({ success: false, message: "Please sign in again." });
    }

    const user = db
      .prepare("SELECT id, role, account_status FROM users WHERE id = ?")
      .get(userId);

    if (!user || user.account_status !== "ACTIVE") {
      return res.status(403).json({ success: false, message: "An active account is required." });
    }

    req.refundUser = user;
    res.set("Cache-Control", "no-store");
    next();
  } catch (error) {
    console.error("Refund authorization failed:", error);
    return res.status(500).json({ success: false, message: "Could not verify your account." });
  }
});

function allow(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.refundUser.role)) {
      return res.status(403).json({
        success: false,
        message:
          roles.length === 1 && roles[0] === "ADMIN"
            ? "Administrator access is required."
            : "Your account cannot use refunds.",
      });
    }

    next();
  };
}

function positiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function sendError(res, error) {
  if (error instanceof refunds.RefundError) {
    return res.status(error.status).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }

  if (error instanceof paymongo.PayMongoError) {
    console.error("PayMongo refund request failed:", error.status, error.message);

    return res.status(502).json({
      success: false,
      code: "PAYMONGO_UNAVAILABLE",
      message: "PayMongo could not be reached. Please try again in a moment.",
    });
  }

  console.error("Refund request failed:", error);

  return res.status(500).json({
    success: false,
    message: "Could not process the refund.",
  });
}

function refundForUser(refundId, user) {
  const refund = refunds.getRefund(refundId);

  if (
    !refund ||
    (user.role === "STUDENT" && Number(refund.student_user_id) !== Number(user.id))
  ) {
    throw new refunds.RefundError(404, "REFUND_NOT_FOUND", "Refund not found.");
  }

  return refund;
}

// ==========================================
// STUDENT: MY REFUNDS AND REFUNDABLE PAYMENTS
// ==========================================

router.get("/me", allow("STUDENT"), (req, res) => {
  try {
    const studentUserId = req.refundUser.id;

    const payments = db
      .prepare(
        `SELECT p.id
         FROM payments p
         JOIN students s ON s.id = p.student_id
         WHERE s.user_id = ? AND p.payment_status = 'SUCCESS'
         ORDER BY p.id DESC
         LIMIT 200`,
      )
      .all(studentUserId)
      .map((row) => refunds.paymentSummary(refunds.getPayment(row.id)));

    return res.json({
      success: true,
      gcashRefundDays: refunds.GCASH_REFUND_DAYS,
      refunds: refunds
        .listRefunds({ studentUserId })
        .map(refunds.formatRefund),
      payments,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// ==========================================
// ADMIN: LIST AND ONE FINE
// ==========================================

router.get("/", allow("ADMIN"), (req, res) => {
  try {
    const status = String(req.query.status || "").trim().toUpperCase();

    const valid = ["REQUESTED", "WITHDRAWN", "REJECTED", "PROCESSING", "SUCCEEDED", "FAILED"];

    const rows = refunds.listRefunds({
      status: valid.includes(status) ? status : undefined,
    });

    const counts = db
      .prepare("SELECT status, COUNT(*) AS count FROM refunds GROUP BY status")
      .all()
      .reduce((all, row) => ({ ...all, [row.status]: Number(row.count) }), {});

    return res.json({
      success: true,
      refunds: rows.map(refunds.formatRefund),
      counts,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// The fine pop-up: its received payment and every refund for the fine.
router.get("/fine/:fineId", allow("ADMIN"), (req, res) => {
  const fineId = positiveId(req.params.fineId);

  if (!fineId) {
    return res.status(400).json({ success: false, message: "Invalid fine ID." });
  }

  try {
    const latest = refunds.latestReceivedPayment(fineId);
    const rows = refunds.listRefunds({ fineId });

    // A request waiting for review is checked as if approved now, so the
    // request itself does not make its own payment look non-refundable.
    const waiting = latest
      ? rows.find((row) => row.status === "REQUESTED" && Number(row.payment_id) === Number(latest.id))
      : null;

    return res.json({
      success: true,
      gatewayConfigured: paymongo.isConfigured(),
      payment: latest
        ? refunds.paymentSummary(refunds.getPayment(latest.id), waiting ? Number(waiting.id) : null)
        : null,
      refunds: rows.map(refunds.formatRefund),
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// ==========================================
// REQUEST (student) OR REFUND DIRECTLY (admin)
// ==========================================

router.post("/", allow("STUDENT", "ADMIN"), async (req, res) => {
  const paymentId = positiveId(req.body?.paymentId);

  if (!paymentId) {
    return res.status(400).json({ success: false, message: "A valid payment is required." });
  }

  try {
    const user = req.refundUser;

    if (user.role === "STUDENT") {
      const refund = refunds.createRefundRequest({
        paymentId,
        actorId: user.id,
        actorRole: "STUDENT",
        reasonCode: req.body?.reasonCode,
        reason: req.body?.reason,
      });

      return res.status(201).json({
        success: true,
        message: "Refund requested. An administrator will review it.",
        refund: refunds.formatRefund(refund),
      });
    }

    const refund = await refunds.refundDirectly({
      paymentId,
      adminId: user.id,
      reasonCode: req.body?.reasonCode,
      reason: req.body?.reason,
      cashReturned: req.body?.cashReturned === true,
      note: req.body?.note,
    });

    return res.status(refund.status === "FAILED" ? 200 : 201).json({
      success: refund.status !== "FAILED",
      message: refundMessage(refund),
      refund: refunds.formatRefund(refund),
    });
  } catch (error) {
    return sendError(res, error);
  }
});

function refundMessage(refund) {
  if (refund.status === "SUCCEEDED") {
    return refund.payment_method === "GCASH"
      ? "Refund completed. PayMongo sent the money back to the student's GCash account."
      : "Cash refund recorded.";
  }

  if (refund.status === "PROCESSING") {
    return "Refund sent to PayMongo. It is processing and the fine is cancelled once PayMongo confirms it.";
  }

  if (refund.status === "FAILED") {
    return refund.failure_reason || "The refund did not go through.";
  }

  return "Refund updated.";
}

// ==========================================
// STUDENT WITHDRAWS
// ==========================================

router.post("/:id/withdraw", allow("STUDENT"), (req, res) => {
  const refundId = positiveId(req.params.id);

  if (!refundId) {
    return res.status(400).json({ success: false, message: "Invalid refund ID." });
  }

  try {
    const refund = refunds.withdrawRefund(refundId, req.refundUser.id);

    return res.json({
      success: true,
      message: "Refund request withdrawn.",
      refund: refunds.formatRefund(refund),
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// ==========================================
// ADMIN DECIDES
// ==========================================

router.post("/:id/approve", allow("ADMIN"), async (req, res) => {
  const refundId = positiveId(req.params.id);

  if (!refundId) {
    return res.status(400).json({ success: false, message: "Invalid refund ID." });
  }

  try {
    const refund = await refunds.approveRefund(refundId, req.refundUser.id, {
      note: req.body?.note,
      cashReturned: req.body?.cashReturned === true,
    });

    return res.json({
      success: refund.status !== "FAILED",
      message: refundMessage(refund),
      refund: refunds.formatRefund(refund),
    });
  } catch (error) {
    return sendError(res, error);
  }
});

router.post("/:id/reject", allow("ADMIN"), (req, res) => {
  const refundId = positiveId(req.params.id);

  if (!refundId) {
    return res.status(400).json({ success: false, message: "Invalid refund ID." });
  }

  try {
    const refund = refunds.rejectRefund(refundId, req.refundUser.id, req.body?.note);

    return res.json({
      success: true,
      message: "Refund request declined. The student was notified.",
      refund: refunds.formatRefund(refund),
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// ==========================================
// CHECK A GCASH REFUND WITH PAYMONGO
// ==========================================

router.post("/:id/refresh", allow("STUDENT", "ADMIN"), async (req, res) => {
  const refundId = positiveId(req.params.id);

  if (!refundId) {
    return res.status(400).json({ success: false, message: "Invalid refund ID." });
  }

  try {
    refundForUser(refundId, req.refundUser);

    const refund = await refunds.refreshRefund(refundId);

    return res.json({ success: true, refund: refunds.formatRefund(refund) });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
