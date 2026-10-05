// Notification helpers shared by the routes that change fines and payments.
// Call them inside the route's transaction so a notice exists only when the
// event it describes was saved.
const db = require("./database");

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON notifications(user_id, is_read, notification_type);
`);

function peso(centavos) {
  return `₱${(Number(centavos) / 100).toFixed(2)}`;
}

function fineContext(fineId) {
  return db
    .prepare(
      `SELECT
         f.id,
         f.fine_reference AS reference,
         f.amount_centavos AS amountCentavos,
         f.student_id AS studentId,
         f.recorded_by AS officerId,
         COALESCE(vt.violation_name, 'Violation') AS violation,
         TRIM(
           student.first_name || ' ' ||
           COALESCE(student.middle_name || ' ', '') ||
           student.last_name
         ) AS studentName
       FROM fines f
       LEFT JOIN violation_types vt ON vt.id = f.violation_type_id
       LEFT JOIN users student ON student.id = f.student_id
       WHERE f.id = ?`,
    )
    .get(fineId);
}

function insertNotice(userId, type, title, message, fineId, paymentId) {
  db.prepare(
    `INSERT INTO notifications (
       user_id, notification_type, title, message,
       related_fine_id, related_payment_id
     )
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(userId, type, title, message, fineId, paymentId ?? null);
}

// Only active accounts can sign in to read a notice.
function activeUser(userId, role) {
  return db
    .prepare(
      `SELECT id, first_name, last_name, role
       FROM users
       WHERE id = ? AND role = ? AND account_status = 'ACTIVE'`,
    )
    .get(userId, role);
}

function notifyStudent(context, type, title, message, paymentId) {
  if (activeUser(context.studentId, "STUDENT")) {
    insertNotice(context.studentId, type, title, message, context.id, paymentId);
  }
}

// The recording officer is told about changes made by someone else.
function notifyRecordingOfficer(
  context,
  actorUserId,
  type,
  title,
  message,
  paymentId,
) {
  if (!context.officerId || context.officerId === actorUserId) return;
  if (activeUser(context.officerId, "FINES_OFFICER")) {
    insertNotice(context.officerId, type, title, message, context.id, paymentId);
  }
}

function actorLabel(userId) {
  const user = db
    .prepare("SELECT role, first_name, last_name FROM users WHERE id = ?")
    .get(userId);
  if (!user) return "an administrator";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return `${user.role === "ADMIN" ? "Admin" : "Officer"} ${name}`.trim();
}

// A fine was cancelled; any pending cashier request was cancelled with it.
function notifyFineCancelled(fineId, cancelledBy, reason, cashRequestsCancelled) {
  const context = fineContext(fineId);
  if (!context) return;

  notifyStudent(
    context,
    "FINE",
    "Fine Cancelled",
    `${context.reference} (${context.violation} — ${peso(context.amountCentavos)}) was cancelled. No payment is needed.` +
      (cashRequestsCancelled > 0
        ? " Your cashier payment request was cancelled too."
        : ""),
  );

  notifyRecordingOfficer(
    context,
    cancelledBy,
    "FINE",
    "Fine Cancelled",
    `${context.reference} (${context.violation}) issued to ${context.studentName} was cancelled by ${actorLabel(cancelledBy)}.` +
      (reason ? ` Reason: ${reason}` : ""),
  );
}

// Cash was received and the fine is Paid.
function notifyCashCollected(fineId, paymentId, collectedBy) {
  const context = fineContext(fineId);
  if (!context) return;
  const amount = peso(context.amountCentavos);

  // The cashier request is complete, so it no longer needs Admin attention.
  db.prepare(
    `UPDATE notifications
     SET is_read = 1
     WHERE notification_type = 'PAYMENT'
       AND title = 'Cashier Payment Requested'
       AND related_payment_id = ?
       AND is_read = 0`,
  ).run(paymentId);

  notifyStudent(
    context,
    "PAYMENT",
    "Payment Recorded",
    `Your cash payment of ${amount} for ${context.reference} (${context.violation}) was received. This fine is now Paid.`,
    paymentId,
  );

  notifyRecordingOfficer(
    context,
    collectedBy,
    "PAYMENT",
    "Fine Paid",
    `${context.reference} (${context.violation}) issued to ${context.studentName} was paid in cash — ${amount}.`,
    paymentId,
  );

  // Reports activity is separate from the Fines PAYMENT cashier requests.
  db.prepare(
    `INSERT INTO notifications (
       user_id, notification_type, title, message,
       related_fine_id, related_payment_id
     )
     SELECT id, 'SYSTEM', 'Payment Collected', ?, ?, ?
     FROM users
     WHERE role = 'ADMIN' AND account_status = 'ACTIVE'`,
  ).run(
    `Cash payment collected for ${context.reference} — ${amount}.`,
    context.id,
    paymentId,
  );
}

// PayMongo confirmed a GCash payment and the fine is Paid.
function notifyOnlinePaymentReceived(fineId, paymentId) {
  const context = fineContext(fineId);
  if (!context) return;
  const amount = peso(context.amountCentavos);

  notifyStudent(
    context,
    "PAYMENT",
    "Payment Received",
    `Your GCash payment of ${amount} for ${context.reference} (${context.violation}) was received. This fine is now Paid.`,
    paymentId,
  );

  // The student paid, so the officer is always told.
  notifyRecordingOfficer(
    context,
    null,
    "PAYMENT",
    "Fine Paid",
    `${context.reference} (${context.violation}) issued to ${context.studentName} was paid online via GCash — ${amount}.`,
    paymentId,
  );

  // Same title as cash collections so it appears in Reports activity.
  db.prepare(
    `INSERT INTO notifications (
       user_id, notification_type, title, message,
       related_fine_id, related_payment_id
     )
     SELECT id, 'SYSTEM', 'Payment Collected', ?, ?, ?
     FROM users
     WHERE role = 'ADMIN' AND account_status = 'ACTIVE'`,
  ).run(
    `GCash payment received for ${context.reference} — ${amount}.`,
    context.id,
    paymentId,
  );
}

// Money arrived that SmartFine could not apply automatically (the fine was
// already cancelled or paid, or the amount differs). An Admin must review it,
// usually by refunding it from the fine pop-up.
function notifyOnlinePaymentNeedsReview(fineId, paymentId, reason) {
  const context = fineContext(fineId);
  if (!context) return;

  db.prepare(
    `INSERT INTO notifications (
       user_id, notification_type, title, message,
       related_fine_id, related_payment_id
     )
     SELECT id, 'PAYMENT', 'GCash Payment Needs Review', ?, ?, ?
     FROM users
     WHERE role = 'ADMIN' AND account_status = 'ACTIVE'`,
  ).run(
    `A GCash payment for ${context.reference} (${context.studentName}) was received but not applied: ${reason} Open the fine to refund it.`,
    context.id,
    paymentId,
  );
}

// ==========================================
// REFUNDS
// ==========================================

function methodLabel(method) {
  return method === "GCASH" ? "GCash" : "cash";
}

function notifyAdmins(type, title, message, fineId, paymentId) {
  db.prepare(
    `INSERT INTO notifications (
       user_id, notification_type, title, message,
       related_fine_id, related_payment_id
     )
     SELECT id, ?, ?, ?, ?, ?
     FROM users
     WHERE role = 'ADMIN' AND account_status = 'ACTIVE'`,
  ).run(type, title, message, fineId, paymentId ?? null);
}

// Refund notices that needed an Admin's attention are settled once the
// refund is decided.
function settleRefundNotices(paymentId) {
  db.prepare(
    `UPDATE notifications
     SET is_read = 1
     WHERE related_payment_id = ?
       AND is_read = 0
       AND title IN (
         'Refund Requested',
         'Refund Failed',
         'GCash Payment Needs Review'
       )
       AND user_id IN (SELECT id FROM users WHERE role = 'ADMIN')`,
  ).run(paymentId);
}

// A student asked for their money back; an Admin decides.
function notifyRefundRequested(refund) {
  const context = fineContext(refund.fine_id);
  if (!context) return;

  notifyAdmins(
    "PAYMENT",
    "Refund Requested",
    `${context.studentName} asked for a refund of ${peso(refund.amount_centavos)} for ${context.reference} (paid in ${methodLabel(refund.payment_method)}). Reason: ${refund.reason}`,
    context.id,
    refund.payment_id,
  );
}

function notifyRefundRejected(refund, note) {
  const context = fineContext(refund.fine_id);
  if (!context) return;

  notifyStudent(
    context,
    "PAYMENT",
    "Refund Request Declined",
    `Your refund request for ${context.reference} was declined.` +
      (note ? ` Note from the administrator: ${note}` : ""),
    refund.payment_id,
  );
}

// GCash refunds are processed by PayMongo after an Admin approves them.
function notifyRefundProcessing(refund) {
  const context = fineContext(refund.fine_id);
  if (!context) return;

  notifyStudent(
    context,
    "PAYMENT",
    "Refund Approved",
    `Your refund of ${peso(refund.amount_centavos)} for ${context.reference} was approved. PayMongo is sending it back to the GCash account you paid with; it usually arrives within a day.`,
    refund.payment_id,
  );
}

function notifyRefundCompleted(refund, fineCancelled) {
  const context = fineContext(refund.fine_id);
  if (!context) return;

  settleRefundNotices(refund.payment_id);

  notifyStudent(
    context,
    "PAYMENT",
    "Refund Completed",
    refund.payment_method === "GCASH"
      ? `Your refund of ${peso(refund.amount_centavos)} for ${context.reference} was sent to your GCash account.` +
          (fineCancelled ? " The fine has been cancelled." : "")
      : `Your cash refund of ${peso(refund.amount_centavos)} for ${context.reference} was recorded.` +
          (fineCancelled ? " The fine has been cancelled." : ""),
    refund.payment_id,
  );

  if (fineCancelled) {
    notifyRecordingOfficer(
      context,
      refund.reviewed_by,
      "FINE",
      "Fine Refunded",
      `${context.reference} (${context.violation}) issued to ${context.studentName} was refunded and cancelled by ${actorLabel(refund.reviewed_by)}.`,
      refund.payment_id,
    );
  }
}

function notifyRefundFailed(refund, reason) {
  const context = fineContext(refund.fine_id);
  if (!context) return;

  notifyAdmins(
    "PAYMENT",
    "Refund Failed",
    `The ${methodLabel(refund.payment_method)} refund of ${peso(refund.amount_centavos)} for ${context.reference} (${context.studentName}) did not go through: ${reason} The fine is still Paid.`,
    context.id,
    refund.payment_id,
  );
}

module.exports = {
  notifyCashCollected,
  notifyFineCancelled,
  notifyOnlinePaymentNeedsReview,
  notifyOnlinePaymentReceived,
  notifyRefundCompleted,
  notifyRefundFailed,
  notifyRefundProcessing,
  notifyRefundRejected,
  notifyRefundRequested,
  settleRefundNotices,
};
