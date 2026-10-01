// GCash payments through PayMongo Hosted Checkout.
//
// Rules:
// - A fine becomes Paid only after PayMongo confirms the payment: a signed
//   webhook, or SmartFine retrieving the checkout session from PayMongo.
//   Returning from the checkout page proves nothing on its own.
// - Recording a confirmation is idempotent: repeated webhooks and status
//   checks never pay a fine twice or duplicate notifications.
// - Before cash, an edit, or a cancellation touches a fine, any open GCash
//   checkout is settled first: recorded if it was paid, otherwise expired.
const crypto = require("node:crypto");

const db = require("../database/database");
const {
  notifyOnlinePaymentNeedsReview,
  notifyOnlinePaymentReceived,
} = require("../database/notifications");
const paymongo = require("./paymongo");

// A reserved payment that never got a checkout page is closed after this.
const STALE_RESERVATION_SECONDS = 120;

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

function newOnlineReference() {
  return `GCASH-${crypto.randomUUID()}`;
}

function getPayment(paymentId) {
  return db
    .prepare(
      `SELECT
         p.*,
         (julianday('now') - julianday(p.created_at)) * 86400 AS age_seconds
       FROM payments p
       WHERE p.id = ?`,
    )
    .get(paymentId);
}

function pendingOnlinePayment(fineId) {
  return db
    .prepare(
      `SELECT id
       FROM payments
       WHERE fine_id = ?
         AND payment_method = 'GCASH'
         AND payment_status = 'PENDING'
       ORDER BY id DESC
       LIMIT 1`,
    )
    .get(fineId);
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

// The checkout page saved when the session was created.
function savedCheckoutUrl(paymentId) {
  const row = db
    .prepare(
      `SELECT details_json
       FROM payment_events
       WHERE payment_id = ? AND event_type = 'ONLINE_CHECKOUT_CREATED'
       ORDER BY id DESC
       LIMIT 1`,
    )
    .get(paymentId);

  try {
    return row ? JSON.parse(row.details_json).checkoutUrl || null : null;
  } catch {
    return null;
  }
}

// Saves PayMongo's confirmation that a GCash payment was made.
// Returns { outcome: "paid" | "already_paid" | "duplicate_event" |
// "needs_review" | "unknown" }.
function recordOnlinePaid(
  paymentId,
  { gatewayPaymentId, amountCentavos, gatewayEventId = null, source },
) {
  return runTransaction(() => {
    const payment = getPayment(paymentId);

    if (!payment || payment.payment_method !== "GCASH") {
      return { outcome: "unknown" };
    }

    // A webhook delivered again (PayMongo retries) is recognised by its id.
    if (gatewayEventId) {
      const seen = db
        .prepare("SELECT 1 FROM payment_events WHERE gateway_event_id = ?")
        .get(gatewayEventId);

      if (seen) {
        return { outcome: "duplicate_event", fineId: payment.fine_id };
      }
    }

    if (payment.payment_status === "SUCCESS") {
      if (gatewayEventId) {
        insertEvent(
          payment.id,
          "ONLINE_PAYMENT_CONFIRMED_AGAIN",
          { source },
          null,
          gatewayEventId,
        );
      }

      return { outcome: "already_paid", fineId: payment.fine_id };
    }

    const fine = db
      .prepare(
        `SELECT id, fine_status, paid_at, cancelled_at
         FROM fines
         WHERE id = ?`,
      )
      .get(payment.fine_id);

    let problem = null;

    if (!fine) {
      problem = "the fine no longer exists.";
    } else if (fine.cancelled_at || fine.fine_status === "CANCELLED") {
      problem = "the fine was cancelled before the payment arrived.";
    } else if (fine.paid_at || fine.fine_status === "PAID") {
      problem = "the fine had already been paid another way.";
    } else if (
      Number.isFinite(amountCentavos) &&
      amountCentavos !== payment.amount_centavos
    ) {
      problem = `PayMongo reported ₱${(amountCentavos / 100).toFixed(2)}, but the fine amount was ₱${(payment.amount_centavos / 100).toFixed(2)}.`;
    }

    const now = db.prepare("SELECT CURRENT_TIMESTAMP AS value").get().value;

    // The money was received either way, so the payment is recorded as such.
    db.prepare(
      `UPDATE payments
       SET payment_status = 'SUCCESS',
           gateway_transaction_id = ?,
           confirmed_at = ?,
           paid_at = ?,
           payment_notes = ?
       WHERE id = ?`,
    ).run(
      gatewayPaymentId || null,
      now,
      now,
      problem ? `Needs review: ${problem}` : null,
      payment.id,
    );

    if (problem) {
      // A cancelled or already paid fine is never changed automatically.
      insertEvent(
        payment.id,
        "ONLINE_PAYMENT_NEEDS_REVIEW",
        { source, gatewayPaymentId, problem },
        null,
        gatewayEventId,
      );

      notifyOnlinePaymentNeedsReview(payment.fine_id, payment.id, problem);

      return { outcome: "needs_review", fineId: payment.fine_id };
    }

    const updatedFine = db
      .prepare(
        `UPDATE fines
         SET fine_status = 'PAID', paid_at = ?, updated_at = ?
         WHERE id = ?
           AND fine_status = 'UNPAID'
           AND paid_at IS NULL
           AND cancelled_at IS NULL`,
      )
      .run(now, now, fine.id);

    if (Number(updatedFine.changes) !== 1) {
      throw new Error("The fine could not be marked as paid.");
    }

    // A cashier request for the same fine is no longer needed.
    db.prepare(
      `INSERT INTO payment_events (payment_id, event_type, details_json)
       SELECT id, 'CASH_REQUEST_SUPERSEDED', ?
       FROM payments
       WHERE fine_id = ? AND payment_method = 'CASH'
         AND payment_status = 'PENDING'`,
    ).run(JSON.stringify({ paidBy: payment.payment_reference }), fine.id);

    db.prepare(
      `UPDATE notifications
       SET is_read = 1
       WHERE notification_type = 'PAYMENT' AND is_read = 0
         AND title = 'Cashier Payment Requested'
         AND related_payment_id IN (
           SELECT id FROM payments
           WHERE fine_id = ? AND payment_method = 'CASH'
             AND payment_status = 'PENDING'
         )`,
    ).run(fine.id);

    db.prepare(
      `UPDATE payments
       SET payment_status = 'CANCELLED'
       WHERE fine_id = ? AND payment_method = 'CASH'
         AND payment_status = 'PENDING'`,
    ).run(fine.id);

    insertEvent(
      payment.id,
      "ONLINE_PAYMENT_PAID",
      { source, gatewayPaymentId },
      null,
      gatewayEventId,
    );

    notifyOnlinePaymentReceived(fine.id, payment.id);

    return { outcome: "paid", fineId: fine.id };
  });
}

// Closes an open GCash payment that was not paid.
function closeOnlinePayment(paymentId, actorUserId, reason) {
  return runTransaction(() => {
    const result = db
      .prepare(
        `UPDATE payments
         SET payment_status = 'CANCELLED'
         WHERE id = ? AND payment_method = 'GCASH'
           AND payment_status = 'PENDING'`,
      )
      .run(paymentId);

    if (Number(result.changes) === 1) {
      insertEvent(paymentId, "ONLINE_CHECKOUT_CLOSED", { reason }, actorUserId);
    }

    return Number(result.changes) === 1;
  });
}

// A reserved payment whose checkout could not be created.
function markCheckoutFailed(paymentId, message) {
  runTransaction(() => {
    db.prepare(
      `UPDATE payments
       SET payment_status = 'FAILED', payment_notes = ?
       WHERE id = ? AND payment_status = 'PENDING'`,
    ).run(String(message || "Checkout could not be created.").slice(0, 300), paymentId);

    insertEvent(paymentId, "ONLINE_CHECKOUT_FAILED", { message });
  });
}

// Asks PayMongo for the latest state of an open GCash payment and saves it.
async function refreshOnlinePayment(paymentId) {
  let payment = getPayment(paymentId);

  if (!payment || payment.payment_method !== "GCASH") {
    return null;
  }

  let checkoutUrl = savedCheckoutUrl(payment.id);

  if (payment.payment_status === "PENDING") {
    if (!payment.gateway_reference) {
      // Reserved but no checkout page was ever attached.
      if (payment.age_seconds > STALE_RESERVATION_SECONDS) {
        closeOnlinePayment(payment.id, null, "NO_CHECKOUT_CREATED");
      }
    } else {
      const session = await paymongo.retrieveCheckoutSession(
        payment.gateway_reference,
      );

      checkoutUrl = session.checkoutUrl || checkoutUrl;

      if (session.paidPayment) {
        recordOnlinePaid(payment.id, {
          gatewayPaymentId: session.paidPayment.id,
          amountCentavos: session.paidPayment.amountCentavos,
          source: "STATUS_CHECK",
        });
      } else if (session.status === "expired") {
        closeOnlinePayment(payment.id, null, "CHECKOUT_EXPIRED");
      }
    }

    payment = getPayment(paymentId);
  }

  return {
    payment,
    checkoutUrl: payment.payment_status === "PENDING" ? checkoutUrl : null,
  };
}

// Before another action changes a fine, its open GCash checkout is settled:
// recorded if PayMongo says it was paid, otherwise expired and closed.
// Throws a PayMongoError when PayMongo cannot be reached, so the caller can
// ask the user to try again rather than risk losing a payment.
async function settlePendingOnlinePayment(fineId, actorUserId, reason) {
  const open = pendingOnlinePayment(fineId);

  if (!open) {
    return { paid: false };
  }

  const payment = getPayment(open.id);

  if (payment.gateway_reference) {
    let session = await paymongo.retrieveCheckoutSession(
      payment.gateway_reference,
    );

    if (!session.paidPayment && session.status === "active") {
      try {
        session = await paymongo.expireCheckoutSession(payment.gateway_reference);
      } catch (error) {
        if (
          !(error instanceof paymongo.PayMongoError) ||
          !error.status ||
          error.status >= 500
        ) {
          throw error;
        }

        // It may have been paid or expired a moment ago; check again.
        session = await paymongo.retrieveCheckoutSession(
          payment.gateway_reference,
        );
      }
    }

    if (session.paidPayment) {
      const { outcome } = recordOnlinePaid(payment.id, {
        gatewayPaymentId: session.paidPayment.id,
        amountCentavos: session.paidPayment.amountCentavos,
        source: reason,
      });

      return {
        paid: ["paid", "already_paid", "duplicate_event"].includes(outcome),
        outcome,
      };
    }
  }

  closeOnlinePayment(payment.id, actorUserId, reason);

  return { paid: false };
}

// The JSON error a route sends when PayMongo cannot be reached while settling.
function settleErrorResponse(error) {
  return {
    status: error instanceof paymongo.PayMongoError ? 503 : 500,
    body: {
      success: false,
      code: "ONLINE_PAYMENT_CHECK_FAILED",
      message:
        "This fine has a GCash payment in progress that could not be confirmed with PayMongo. Please try again in a moment.",
    },
  };
}

module.exports = {
  STALE_RESERVATION_SECONDS,
  closeOnlinePayment,
  getPayment,
  insertEvent,
  markCheckoutFailed,
  newOnlineReference,
  pendingOnlinePayment,
  recordOnlinePaid,
  refreshOnlinePayment,
  runTransaction,
  savedCheckoutUrl,
  settleErrorResponse,
  settlePendingOnlinePayment,
};
