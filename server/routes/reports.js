const express = require("express");
const db = require("../database/database");
const { authenticateToken } = require("./auth");
const router = express.Router();
function activeAdmin(req, res, next) {
  const userId = Number(req.authUser?.userId);
  if (!Number.isSafeInteger(userId) || userId < 1)
    return res
      .status(401)
      .json({ success: false, message: "Please sign in again." });
  try {
    const user = db
      .prepare("SELECT role, account_status FROM users WHERE id = ?")
      .get(userId);
    if (!user || user.role !== "ADMIN" || user.account_status !== "ACTIVE")
      return res
        .status(403)
        .json({
          success: false,
          message: "An active administrator account is required.",
        });
    req.reportAdminId = userId;
    res.set("Cache-Control", "no-store");
    next();
  } catch (error) {
    console.error("Reports authorization error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not verify account." });
  }
}
function unreadCount(userId) {
  return Number(
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM notifications
    WHERE user_id = ? AND notification_type = 'SYSTEM' AND title = 'Payment Collected'
      AND related_payment_id IS NOT NULL AND is_read = 0`,
      )
      .get(userId).count,
  );
}
router.get("/notifications", authenticateToken, activeAdmin, (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT n.id, n.title, n.message,
      n.related_payment_id AS paymentId, n.is_read AS isRead, n.created_at AS createdAt
      FROM notifications n JOIN payments p ON p.id = n.related_payment_id
      WHERE n.user_id = ? AND n.notification_type = 'SYSTEM'
        AND n.title = 'Payment Collected' AND p.payment_status = 'SUCCESS'
      ORDER BY n.is_read ASC, n.created_at DESC, n.id DESC LIMIT 30`,
      )
      .all(req.reportAdminId);
    return res.json({
      success: true,
      notifications: rows.map((r) => ({
        ...r,
        isRead: Number(r.isRead) === 1,
      })),
      unreadCount: unreadCount(req.reportAdminId),
    });
  } catch (error) {
    console.error("Reports notifications error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not load activity." });
  }
});
router.patch(
  "/notifications/read-all",
  authenticateToken,
  activeAdmin,
  (req, res) => {
    try {
      const result = db
        .prepare(
          `UPDATE notifications SET is_read = 1
      WHERE user_id = ? AND notification_type = 'SYSTEM' AND title = 'Payment Collected'
        AND related_payment_id IS NOT NULL AND is_read = 0`,
        )
        .run(req.reportAdminId);
      return res.json({
        success: true,
        updatedCount: result.changes,
        unreadCount: 0,
      });
    } catch (error) {
      console.error("Reports mark all read error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Could not mark activity as read." });
    }
  },
);
router.patch(
  "/notifications/:id/read",
  authenticateToken,
  activeAdmin,
  (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1)
      return res
        .status(400)
        .json({ success: false, message: "Invalid activity ID." });
    try {
      const result = db
        .prepare(
          `UPDATE notifications SET is_read = 1
      WHERE id = ? AND user_id = ? AND notification_type = 'SYSTEM'
        AND title = 'Payment Collected' AND related_payment_id IS NOT NULL`,
        )
        .run(id, req.reportAdminId);
      if (!result.changes)
        return res
          .status(404)
          .json({ success: false, message: "Activity not found." });
      return res.json({
        success: true,
        unreadCount: unreadCount(req.reportAdminId),
      });
    } catch (error) {
      console.error("Reports mark read error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Could not mark activity as read." });
    }
  },
);
function formatPaymentRow(payment) {
  const amountCentavos = Number(payment.amount_centavos || 0);
  return {
    id: Number(payment.id),
    payment_reference: payment.payment_reference,
    payment_method: payment.payment_method,
    payment_status: payment.payment_status,
    amount_centavos: amountCentavos,
    amount: amountCentavos / 100,
    student_id: Number(payment.student_id),
    student_number: payment.student_number,
    student_name: payment.student_name,
    fine_id: Number(payment.fine_id),
    fine_reference: payment.fine_reference,
    violation_name: payment.violation_name || null,
    gateway_transaction_id: payment.gateway_transaction_id,
    gateway_reference: payment.gateway_reference,
    confirmed_by: payment.confirmed_by ? Number(payment.confirmed_by) : null,
    confirmed_by_name: payment.confirmed_by_name || null,
    payment_notes: payment.payment_notes || null,
    created_at: payment.created_at,
    confirmed_at: payment.confirmed_at,
    paid_at: payment.paid_at,
    transaction_date: payment.transaction_date,
  };
}
const paymentJoins = `
  FROM payments p
  LEFT JOIN fines f
    ON f.id = p.fine_id
  LEFT JOIN violation_types vt
    ON vt.id = f.violation_type_id
  LEFT JOIN students student_record
    ON student_record.id = p.student_id
  LEFT JOIN users student
    ON student.id = student_record.user_id
  LEFT JOIN users confirmer
    ON confirmer.id = p.confirmed_by
`;
const studentName = `
  TRIM(
    student.first_name || ' ' ||
    COALESCE(student.middle_name || ' ', '') ||
    student.last_name
  )
`;
const confirmerName = `
  CASE
    WHEN confirmer.id IS NOT NULL THEN
      TRIM(
        confirmer.first_name || ' ' ||
        COALESCE(confirmer.middle_name || ' ', '') ||
        confirmer.last_name
      )
    ELSE NULL
  END
`;
// GET /api/reports/payments
router.get("/payments", (req, res) => {
  try {
    const summary = db
      .prepare(
        `SELECT
           COALESCE(
             SUM(
               CASE
                 WHEN paid_at IS NOT NULL
                 THEN amount_centavos
                 ELSE 0
               END
             ),
             0
           ) AS total_collected_centavos,
           COALESCE(
             SUM(
               CASE
                 WHEN payment_status = 'PENDING'
                 THEN amount_centavos
                 ELSE 0
               END
             ),
             0
           ) AS pending_payments_centavos,
           COALESCE(
             SUM(
               CASE
                 WHEN paid_at IS NOT NULL
                  AND DATE(paid_at, 'localtime') =
                      DATE('now', 'localtime')
                 THEN amount_centavos
                 ELSE 0
               END
             ),
             0
           ) AS today_payment_centavos,
           COUNT(
             CASE WHEN paid_at IS NOT NULL THEN 1 END
           ) AS total_collected_count,
           COUNT(
             CASE WHEN payment_status = 'PENDING' THEN 1 END
           ) AS pending_payment_count,
           COUNT(
             CASE
               WHEN paid_at IS NOT NULL
                AND DATE(paid_at, 'localtime') =
                    DATE('now', 'localtime')
               THEN 1
             END
           ) AS today_payment_count
         FROM payments`,
      )
      .get();
    const transactions = db
      .prepare(
        `SELECT
           p.id,
           p.payment_reference,
           p.fine_id,
           p.student_id,
           p.amount_centavos,
           p.payment_method,
           p.payment_status,
           p.gateway_transaction_id,
           p.gateway_reference,
           p.confirmed_by,
           p.payment_notes,
           p.created_at,
           p.confirmed_at,
           p.paid_at,
           COALESCE(
             p.paid_at,
             p.confirmed_at,
             p.created_at
           ) AS transaction_date,
           f.fine_reference,
           vt.violation_name,
           COALESCE(
             student_record.student_number,
             student.student_number,
             student.username
           ) AS student_number,
           ${studentName} AS student_name,
           ${confirmerName} AS confirmed_by_name
         ${paymentJoins}
         ORDER BY
           COALESCE(
             p.paid_at,
             p.confirmed_at,
             p.created_at
           ) DESC,
           p.id DESC`,
      )
      .all();
    const totalCollectedCentavos = Number(
      summary.total_collected_centavos || 0,
    );
    const pendingPaymentsCentavos = Number(
      summary.pending_payments_centavos || 0,
    );
    const todayPaymentCentavos = Number(summary.today_payment_centavos || 0);
    return res.json({
      success: true,
      summary: {
        totalCollectedCentavos,
        totalCollected: totalCollectedCentavos / 100,
        pendingPaymentsCentavos,
        pendingPayments: pendingPaymentsCentavos / 100,
        todayPaymentCentavos,
        todayPayment: todayPaymentCentavos / 100,
        totalCollectedCount: Number(summary.total_collected_count || 0),
        pendingPaymentCount: Number(summary.pending_payment_count || 0),
        todayPaymentCount: Number(summary.today_payment_count || 0),
      },
      transactions: transactions.map(formatPaymentRow),
      totalTransactions: transactions.length,
    });
  } catch (error) {
    console.error("Payment reports error:", error);
    return res.status(500).json({
      success: false,
      code: "PAYMENT_REPORT_ERROR",
      message: "Failed to load payment reports.",
    });
  }
});
// GET /api/reports/payments/:id
router.get("/payments/:id", (req, res) => {
  const paymentId = Number(req.params.id);
  if (!Number.isSafeInteger(paymentId) || paymentId < 1) {
    return res.status(400).json({
      success: false,
      code: "INVALID_PAYMENT_ID",
      message: "Invalid payment transaction ID.",
    });
  }
  try {
    const payment = db
      .prepare(
        `SELECT
           p.id,
           p.payment_reference,
           p.fine_id,
           p.student_id,
           p.amount_centavos,
           p.payment_method,
           p.payment_status,
           p.gateway_transaction_id,
           p.gateway_reference,
           p.confirmed_by,
           p.payment_notes,
           p.created_at,
           p.confirmed_at,
           p.paid_at,
           COALESCE(
             p.paid_at,
             p.confirmed_at,
             p.created_at
           ) AS transaction_date,
           f.fine_reference,
           f.fine_status,
           f.issued_at AS fine_issued_at,
           vt.violation_code,
           vt.violation_name,
           COALESCE(
             student_record.student_number,
             student.student_number,
             student.username
           ) AS student_number,
           student.username AS student_username,
           student.first_name AS student_first_name,
           student.middle_name AS student_middle_name,
           student.last_name AS student_last_name,
           ${studentName} AS student_name,
           ${confirmerName} AS confirmed_by_name,
           confirmer.username AS confirmed_by_username,
           confirmer.role AS confirmed_by_role
         ${paymentJoins}
         WHERE p.id = ?
         LIMIT 1`,
      )
      .get(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        code: "PAYMENT_NOT_FOUND",
        message: "Payment transaction not found.",
      });
    }
    const method = String(payment.payment_method || "")
      .trim()
      .toUpperCase();
    const status = String(payment.payment_status || "PENDING")
      .trim()
      .toUpperCase();
    const isCashierPayment = ["CASH", "CASHIER", "PAY_AT_CASHIER"].includes(
      method,
    );
    const paymentMethodLabel = isCashierPayment
      ? "Pay at Cashier"
      : method === "GCASH"
        ? "GCash"
        : payment.payment_method || "Not specified";
    const paymentStatusLabel =
      payment.paid_at || status === "PAID" || status === "SUCCESS"
        ? "Paid"
        : status === "CANCELLED"
          ? "Cancelled"
          : status === "FAILED"
            ? "Failed"
            : "Pending";
    let statusMessage = "This payment is currently pending.";
    if (isCashierPayment) {
      if (payment.paid_at) {
        statusMessage = payment.confirmed_by_name
          ? `This payment was received and confirmed at the cashier by ${payment.confirmed_by_name}.`
          : "This payment was received and confirmed at the cashier.";
      } else if (status === "CANCELLED") {
        statusMessage = "This cashier payment request was cancelled.";
      } else {
        statusMessage = "Waiting for payment and confirmation at the cashier.";
      }
    } else if (payment.paid_at) {
      statusMessage = "This payment was completed successfully.";
    } else if (status === "CANCELLED") {
      statusMessage = "This payment transaction was cancelled.";
    } else if (status === "FAILED") {
      statusMessage =
        "This payment transaction was not completed successfully.";
    } else {
      statusMessage = "This payment transaction is awaiting completion.";
    }
    const amountCentavos = Number(payment.amount_centavos || 0);
    return res.json({
      success: true,
      payment: {
        id: Number(payment.id),
        payment_reference: payment.payment_reference,
        payment_method: payment.payment_method,
        payment_method_label: paymentMethodLabel,
        payment_status: payment.payment_status,
        payment_status_label: paymentStatusLabel,
        is_cashier_payment: isCashierPayment,
        amount_centavos: amountCentavos,
        amount: amountCentavos / 100,
        reference_number:
          payment.gateway_reference ||
          payment.gateway_transaction_id ||
          payment.payment_reference,
        gateway_transaction_id: payment.gateway_transaction_id,
        gateway_reference: payment.gateway_reference,
        student_id: Number(payment.student_id),
        student_number: payment.student_number,
        student_username: payment.student_username,
        student_first_name: payment.student_first_name,
        student_middle_name: payment.student_middle_name,
        student_last_name: payment.student_last_name,
        student_name: payment.student_name,
        fine_id: Number(payment.fine_id),
        fine_reference: payment.fine_reference,
        fine_status: payment.fine_status,
        fine_issued_at: payment.fine_issued_at,
        violation_code: payment.violation_code,
        violation_name: payment.violation_name,
        confirmed_by: payment.confirmed_by
          ? Number(payment.confirmed_by)
          : null,
        confirmed_by_name: payment.confirmed_by_name,
        confirmed_by_username: payment.confirmed_by_username,
        confirmed_by_role: payment.confirmed_by_role,
        payment_notes: payment.payment_notes,
        created_at: payment.created_at,
        confirmed_at: payment.confirmed_at,
        paid_at: payment.paid_at,
        transaction_date: payment.transaction_date,
        status_message: statusMessage,
      },
    });
  } catch (error) {
    console.error("Detailed payment report error:", error);
    return res.status(500).json({
      success: false,
      code: "PAYMENT_REPORT_DETAIL_ERROR",
      message: "Failed to load payment transaction details.",
    });
  }
});
module.exports = router;
