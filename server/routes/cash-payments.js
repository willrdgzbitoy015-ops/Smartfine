const express = require("express");
const crypto = require("node:crypto");

const db = require("../database/database");
const { notifyCashCollected } = require("../database/notifications");
const { authenticateToken } = require("./auth");

const router = express.Router();

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

function requireActiveRole(role) {
  return (req, res, next) => {
    try {
      const userId = Number(req.authUser?.userId);

      if (!Number.isSafeInteger(userId) || userId < 1) {
        return res.status(401).json({
          success: false,
          message: "Please sign in again.",
        });
      }

      const user = db
        .prepare("SELECT id, role, account_status FROM users WHERE id = ?")
        .get(userId);

      if (!user || user.role !== role || user.account_status !== "ACTIVE") {
        return res.status(403).json({
          success: false,
          message: `An active ${role} account is required.`,
        });
      }

      req.paymentUserId = userId;
      next();
    } catch (error) {
      console.error("Payment authorization failed:", error);

      return res.status(500).json({
        success: false,
        message: "Could not verify your account.",
      });
    }
  };
}

function paymentError(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
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

function sendError(res, error) {
  if (!error.status) {
    console.error("Cash payment failed:", error);
  }

  return res.status(error.status || 500).json({
    success: false,
    message: error.status
      ? error.message
      : "Could not process the cash payment.",
  });
}

function positiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function getPayableFine(fineId) {
  const fine = db
    .prepare(
      `SELECT
         id,
         fine_reference,
         student_id,
         amount_centavos,
         fine_status,
         paid_at,
         cancelled_at
       FROM fines
       WHERE id = ?`,
    )
    .get(fineId);

  if (!fine) {
    paymentError(404, "Fine not found.");
  }

  if (
    fine.fine_status !== "UNPAID" ||
    fine.paid_at ||
    fine.cancelled_at ||
    fine.amount_centavos <= 0
  ) {
    paymentError(409, "This fine is not available for cash payment.");
  }

  return fine;
}

function newReference() {
  return `CASH-${crypto.randomUUID()}`;
}

// A student requests to pay at the cashier.
// This creates a PENDING payment and an Admin notification.
// It does not mark the fine as paid.
router.post(
  "/cash-requests",
  authenticateToken,
  requireActiveRole("STUDENT"),
  (req, res) => {
    const fineId = positiveId(req.body?.fineId);

    if (!fineId) {
      return res.status(400).json({
        success: false,
        message: "A valid fine ID is required.",
      });
    }

    try {
      const payment = runTransaction(() => {
        const fine = getPayableFine(fineId);

        if (fine.student_id !== req.paymentUserId) {
          paymentError(403, "This fine does not belong to your account.");
        }

        const student = db
          .prepare("SELECT id FROM students WHERE user_id = ?")
          .get(req.paymentUserId);

        if (!student) {
          paymentError(409, "Your student record is unavailable.");
        }

        const pending = db
          .prepare(
            `SELECT
               id,
               payment_reference,
               payment_method,
               payment_status
             FROM payments
             WHERE fine_id = ?
               AND payment_status = 'PENDING'
             ORDER BY id DESC
             LIMIT 1`,
          )
          .get(fineId);

        if (pending) {
          if (pending.payment_method !== "CASH") {
            paymentError(
              409,
              "Another payment request is already pending for this fine.",
            );
          }

          // An existing request already has its notification.
          return pending;
        }

        const reference = newReference();

        const result = db
          .prepare(
            `INSERT INTO payments (
               payment_reference,
               fine_id,
               student_id,
               amount_centavos,
               payment_method,
               payment_status
             )
             VALUES (?, ?, ?, ?, 'CASH', 'PENDING')`,
          )
          .run(reference, fine.id, student.id, fine.amount_centavos);

        const paymentId = Number(result.lastInsertRowid);

        db.prepare(
          `INSERT INTO payment_events (
             payment_id,
             event_type,
             actor_user_id
           )
           VALUES (?, 'CASH_REQUESTED', ?)`,
        ).run(paymentId, req.paymentUserId);

        // This INSERT is in the same transaction as the payment request.
        // Each active Admin receives an independently readable notification.
        db.prepare(
          `INSERT INTO notifications (
             user_id,
             notification_type,
             title,
             message,
             related_fine_id,
             related_payment_id
           )
           SELECT
             admin.id,
             'PAYMENT',
             'Cashier Payment Requested',
             TRIM(
               student_user.first_name || ' ' ||
               COALESCE(student_user.middle_name || ' ', '') ||
               student_user.last_name
             ) ||
             ' requested to pay ' || ? ||
             ' at the cashier — ' ||
             printf('₱%.2f', ? / 100.0) || '.',
             ?,
             ?
           FROM users AS admin
           JOIN users AS student_user
             ON student_user.id = ?
           WHERE admin.role = 'ADMIN'
             AND admin.account_status = 'ACTIVE'`,
        ).run(
          fine.fine_reference,
          fine.amount_centavos,
          fine.id,
          paymentId,
          req.paymentUserId,
        );

        return {
          id: paymentId,
          payment_reference: reference,
          payment_status: "PENDING",
        };
      });

      return res.json({
        success: true,
        message: "Cash payment request saved. Pay the treasurer in person.",
        payment: {
          id: payment.id,
          paymentReference: payment.payment_reference,
          status: payment.payment_status,
        },
      });
    } catch (error) {
      return sendError(res, error);
    }
  },
);

// Student payment-request history.
router.get(
  "/cash-requests/me",
  authenticateToken,
  requireActiveRole("STUDENT"),
  (req, res) => {
    try {
      const payments = db
        .prepare(
          `SELECT
             p.id,
             p.payment_reference AS paymentReference,
             p.fine_id AS fineId,
             f.fine_reference AS fineReference,
             p.amount_centavos AS amountCentavos,
             p.payment_status AS status,
             p.created_at AS createdAt,
             p.paid_at AS paidAt
           FROM payments p
           JOIN students s
             ON s.id = p.student_id
           JOIN fines f
             ON f.id = p.fine_id
           WHERE s.user_id = ?
             AND f.student_id = ?
             AND p.payment_method = 'CASH'
           ORDER BY p.id DESC`,
        )
        .all(req.paymentUserId, req.paymentUserId);

      return res.json({ success: true, payments });
    } catch (error) {
      return sendError(res, error);
    }
  },
);

// Admin pending cash requests.
// Only requests for fines that can still be collected are actionable.
router.get(
  "/cash-requests",
  authenticateToken,
  requireActiveRole("ADMIN"),
  (req, res) => {
    try {
      const payments = db
        .prepare(
          `SELECT
             p.id,
             p.payment_reference AS paymentReference,
             p.fine_id AS fineId,
             f.fine_reference AS fineReference,
             p.amount_centavos AS amountCentavos,
             p.created_at AS createdAt,
             u.first_name AS firstName,
             u.last_name AS lastName,
             s.student_number AS studentNumber
           FROM payments p
           JOIN students s
             ON s.id = p.student_id
           JOIN users u
             ON u.id = s.user_id
           JOIN fines f
             ON f.id = p.fine_id
            AND f.student_id = u.id
           WHERE p.payment_method = 'CASH'
             AND p.payment_status = 'PENDING'
             AND f.fine_status = 'UNPAID'
             AND f.paid_at IS NULL
             AND f.cancelled_at IS NULL
           ORDER BY p.id DESC`,
        )
        .all();

      return res.json({ success: true, payments });
    } catch (error) {
      return sendError(res, error);
    }
  },
);

// Admin records the payment only after receiving cash.
// A student request is not required for an in-person collection.
router.post(
  "/cash-collections/:fineId",
  authenticateToken,
  requireActiveRole("ADMIN"),
  (req, res) => {
    const fineId = positiveId(req.params.fineId);

    if (!fineId) {
      return res.status(400).json({
        success: false,
        message: "A valid fine ID is required.",
      });
    }

    const notes =
      typeof req.body?.notes === "string" ? req.body.notes.trim() : "";

    if (notes.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Notes must be 500 characters or fewer.",
      });
    }

    try {
      const payment = runTransaction(() => {
        const fine = getPayableFine(fineId);

        // fines.student_id uses users.id; payments.student_id uses students.id.
        const student = db
          .prepare("SELECT id FROM students WHERE user_id = ?")
          .get(fine.student_id);

        if (!student) {
          paymentError(
            409,
            "No linked student record was found for this fine.",
          );
        }

        const pending = db
          .prepare(
            `SELECT
               id,
               payment_method,
               student_id,
               amount_centavos
             FROM payments
             WHERE fine_id = ?
               AND payment_status = 'PENDING'
             ORDER BY id DESC
             LIMIT 1`,
          )
          .get(fine.id);

        if (
          pending &&
          (pending.payment_method !== "CASH" ||
            pending.student_id !== student.id ||
            pending.amount_centavos !== fine.amount_centavos)
        ) {
          paymentError(
            409,
            "An incompatible payment is pending for this fine.",
          );
        }

        const completed = db
          .prepare(
            `SELECT id
             FROM payments
             WHERE fine_id = ?
               AND payment_status = 'SUCCESS'
             LIMIT 1`,
          )
          .get(fine.id);

        if (completed) {
          paymentError(409, "This fine already has a completed payment.");
        }

        let paymentId = pending?.id;

        if (!paymentId) {
          const result = db
            .prepare(
              `INSERT INTO payments (
                 payment_reference,
                 fine_id,
                 student_id,
                 amount_centavos,
                 payment_method,
                 payment_status
               )
               VALUES (?, ?, ?, ?, 'CASH', 'PENDING')`,
            )
            .run(newReference(), fine.id, student.id, fine.amount_centavos);

          paymentId = Number(result.lastInsertRowid);
        }

        const paidAt = db
          .prepare("SELECT CURRENT_TIMESTAMP AS value")
          .get().value;

        const updatedFine = db
          .prepare(
            `UPDATE fines
             SET fine_status = 'PAID',
                 paid_at = ?,
                 updated_at = ?
             WHERE id = ?
               AND fine_status = 'UNPAID'
               AND paid_at IS NULL
               AND cancelled_at IS NULL`,
          )
          .run(paidAt, paidAt, fine.id);

        if (Number(updatedFine.changes) !== 1) {
          paymentError(409, "This fine could not be marked as paid.");
        }

        const updatedPayment = db
          .prepare(
            `UPDATE payments
             SET payment_status = 'SUCCESS',
                 confirmed_by = ?,
                 confirmed_at = ?,
                 paid_at = ?,
                 payment_notes = ?
             WHERE id = ?
               AND payment_status = 'PENDING'`,
          )
          .run(req.paymentUserId, paidAt, paidAt, notes || null, paymentId);

        if (Number(updatedPayment.changes) !== 1) {
          paymentError(409, "The payment could not be confirmed.");
        }

        db.prepare(
          `INSERT INTO payment_events (
             payment_id,
             event_type,
             actor_user_id
           )
           VALUES (?, 'CASH_COLLECTED', ?)`,
        ).run(paymentId, req.paymentUserId);

        notifyCashCollected(fine.id, paymentId, req.paymentUserId);

        return db
          .prepare(
            `SELECT
               id,
               payment_reference AS paymentReference,
               fine_id AS fineId,
               amount_centavos AS amountCentavos,
               payment_status AS status,
               paid_at AS paidAt
             FROM payments
             WHERE id = ?`,
          )
          .get(paymentId);
      });

      return res.json({
        success: true,
        message: "Cash payment recorded and fine marked as paid.",
        payment,
      });
    } catch (error) {
      return sendError(res, error);
    }
  },
);

module.exports = router;
