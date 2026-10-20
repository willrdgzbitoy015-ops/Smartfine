// GCash payments through PayMongo Hosted Checkout.
// Mounted at /api/payments next to the cashier routes.
const express = require("express");

const db = require("../database/database");
const paymongo = require("../payments/paymongo");
const online = require("../payments/online-payments");
const refunds = require("../payments/refunds");
const { ensureStudentRecord } = require("../database/student-records");
const { authenticateToken } = require("./auth");

const router = express.Router();

function requireActiveUser(roles) {
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

      if (!user || !roles.includes(user.role) || user.account_status !== "ACTIVE") {
        return res.status(403).json({
          success: false,
          message: "Your account cannot use online payments.",
        });
      }

      req.paymentUser = user;
      next();
    } catch (error) {
      console.error("Online payment authorization failed:", error);

      return res.status(500).json({
        success: false,
        message: "Could not verify your account.",
      });
    }
  };
}

function positiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function routeError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function sendError(res, error) {
  if (error instanceof paymongo.PayMongoError) {
    console.error("PayMongo request failed:", error.status, error.message);

    return res.status(error.status === 503 ? 503 : 502).json({
      success: false,
      code: "PAYMONGO_UNAVAILABLE",
      message:
        error.status === 503
          ? "Online payment is not available yet. Please pay at the cashier."
          : "GCash checkout is unavailable right now. Please try again in a moment.",
    });
  }

  if (!error.status) {
    console.error("Online payment failed:", error);
  }

  return res.status(error.status || 500).json({
    success: false,
    code: error.code,
    message: error.status ? error.message : "Could not process the online payment.",
  });
}

// Links back into the app (Expo Go or an installed SmartFine build only).
function safeAppUrl(value) {
  const url = String(value || "").trim();

  return url.length > 0 &&
    url.length <= 300 &&
    /^(exp|exps|smartfine):\/\/[^\s"'<>]+$/i.test(url)
    ? url
    : null;
}

// The address PayMongo sends the student back to: PUBLIC_BASE_URL, or the
// address the app used (the ngrok URL when testing on a phone).
function publicBaseUrl(req) {
  const configured = String(process.env.PUBLIC_BASE_URL || "").trim();

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const protocol =
    String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() ||
    req.protocol;

  return `${protocol}://${req.get("host")}`;
}

function payableFineForStudent(fineId, userId) {
  const fine = db
    .prepare(
      `SELECT
         f.id,
         f.fine_reference,
         f.student_id,
         f.amount_centavos,
         f.fine_status,
         f.paid_at,
         f.cancelled_at,
         COALESCE(vt.violation_name, 'Violation') AS violation
       FROM fines f
       LEFT JOIN violation_types vt ON vt.id = f.violation_type_id
       WHERE f.id = ?`,
    )
    .get(fineId);

  if (!fine) {
    throw routeError(404, "FINE_NOT_FOUND", "Fine not found.");
  }

  if (fine.student_id !== userId) {
    throw routeError(403, "NOT_YOUR_FINE", "This fine does not belong to your account.");
  }

  if (fine.paid_at || fine.fine_status === "PAID") {
    throw routeError(409, "FINE_ALREADY_PAID", "This fine is already paid.");
  }

  if (fine.cancelled_at || fine.fine_status !== "UNPAID" || fine.amount_centavos <= 0) {
    throw routeError(409, "FINE_NOT_PAYABLE", "This fine cannot be paid online.");
  }

  return fine;
}

function clientPayment(payment, checkoutUrl) {
  return {
    id: payment.id,
    paymentReference: payment.payment_reference,
    fineId: payment.fine_id,
    amountCentavos: payment.amount_centavos,
    status: payment.payment_status,
    createdAt: payment.created_at,
    paidAt: payment.paid_at,
    needsReview: Boolean(payment.payment_notes?.startsWith("Needs review")),
    checkoutUrl: checkoutUrl || null,
  };
}

// The student may only see their own payments; Admins may see any.
function paymentForUser(paymentId, user) {
  const payment = online.getPayment(paymentId);

  if (!payment || payment.payment_method !== "GCASH") {
    throw routeError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
  }

  if (user.role === "STUDENT") {
    const owner = db
      .prepare("SELECT 1 FROM students WHERE id = ? AND user_id = ?")
      .get(payment.student_id, user.id);

    if (!owner) {
      throw routeError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
    }
  }

  return payment;
}

// ==========================================
// START (OR CONTINUE) A GCASH CHECKOUT
// ==========================================

router.post(
  "/online/checkout",
  authenticateToken,
  requireActiveUser(["STUDENT"]),
  async (req, res) => {
    res.set("Cache-Control", "no-store");

    if (!paymongo.isConfigured()) {
      return res.status(503).json({
        success: false,
        code: "ONLINE_PAYMENT_NOT_CONFIGURED",
        message: "Online payment is not available yet. Please pay at the cashier.",
      });
    }

    const fineId = positiveId(req.body?.fineId);

    if (!fineId) {
      return res.status(400).json({
        success: false,
        message: "A valid fine ID is required.",
      });
    }

    const userId = req.paymentUser.id;
    const returnUrl = safeAppUrl(req.body?.returnUrl);

    try {
      const fine = payableFineForStudent(fineId, userId);

      // An open checkout is reused rather than starting a second one.
      const open = online.pendingOnlinePayment(fine.id);

      if (open) {
        const refreshed = await online.refreshOnlinePayment(open.id);

        if (refreshed.payment.payment_status === "SUCCESS") {
          throw routeError(409, "FINE_ALREADY_PAID", "This fine was just paid.");
        }

        if (refreshed.payment.payment_status === "PENDING") {
          if (!refreshed.checkoutUrl) {
            throw routeError(
              409,
              "CHECKOUT_IN_PROGRESS",
              "A GCash checkout for this fine is being prepared. Please try again in a moment.",
            );
          }

          return res.json({
            success: true,
            reused: true,
            payment: clientPayment(refreshed.payment, refreshed.checkoutUrl),
            checkoutUrl: refreshed.checkoutUrl,
          });
        }
        // The old checkout ended without payment; start a new one below.
      }

      const reserved = online.runTransaction(() => {
        const current = payableFineForStudent(fine.id, userId);

        // Creates the student record for an account that was added without
        // one, instead of refusing the payment.
        const studentRecordId = ensureStudentRecord(userId);
        const student = studentRecordId ? { id: studentRecordId } : null;

        if (!student) {
          throw routeError(409, "STUDENT_RECORD_MISSING", "Your student record is unavailable.");
        }

        if (online.pendingOnlinePayment(current.id)) {
          throw routeError(
            409,
            "CHECKOUT_IN_PROGRESS",
            "A GCash checkout for this fine is being prepared. Please try again in a moment.",
          );
        }

        const reference = online.newOnlineReference();

        const result = db
          .prepare(
            `INSERT INTO payments (
               payment_reference, fine_id, student_id, amount_centavos,
               payment_method, payment_status
             )
             VALUES (?, ?, ?, ?, 'GCASH', 'PENDING')`,
          )
          .run(reference, current.id, student.id, current.amount_centavos);

        const paymentId = Number(result.lastInsertRowid);

        online.insertEvent(paymentId, "ONLINE_CHECKOUT_REQUESTED", null, userId);

        return { id: paymentId, reference };
      });

      const returnPage = (result) =>
        `${publicBaseUrl(req)}/api/payments/paymongo/return?result=${result}` +
        `&payment=${encodeURIComponent(reserved.reference)}` +
        (returnUrl ? `&app=${encodeURIComponent(returnUrl)}` : "");

      let session;

      try {
        session = await paymongo.createCheckoutSession({
          amountCentavos: fine.amount_centavos,
          name: `${fine.fine_reference} — ${fine.violation}`,
          description: `SmartFine fine ${fine.fine_reference}`,
          referenceNumber: reserved.reference,
          successUrl: returnPage("success"),
          cancelUrl: returnPage("cancel"),
          metadata: {
            payment_id: String(reserved.id),
            fine_id: String(fine.id),
            payment_reference: reserved.reference,
          },
        });

        if (!session.id || !session.checkoutUrl) {
          throw new paymongo.PayMongoError("PayMongo did not return a checkout page.", 502);
        }
      } catch (error) {
        online.markCheckoutFailed(reserved.id, error.message);
        throw error;
      }

      online.runTransaction(() => {
        db.prepare("UPDATE payments SET gateway_reference = ? WHERE id = ?").run(
          session.id,
          reserved.id,
        );

        online.insertEvent(reserved.id, "ONLINE_CHECKOUT_CREATED", {
          sessionId: session.id,
          checkoutUrl: session.checkoutUrl,
          testMode: paymongo.isTestMode(),
        });
      });

      return res.json({
        success: true,
        reused: false,
        payment: clientPayment(online.getPayment(reserved.id), session.checkoutUrl),
        checkoutUrl: session.checkoutUrl,
      });
    } catch (error) {
      return sendError(res, error);
    }
  },
);

// ==========================================
// THE STUDENT'S GCASH PAYMENTS
// ==========================================

router.get(
  "/online/me",
  authenticateToken,
  requireActiveUser(["STUDENT"]),
  (req, res) => {
    res.set("Cache-Control", "no-store");

    try {
      const payments = db
        .prepare(
          `SELECT p.*
           FROM payments p
           JOIN students s ON s.id = p.student_id
           WHERE s.user_id = ? AND p.payment_method = 'GCASH'
           ORDER BY p.id DESC
           LIMIT 100`,
        )
        .all(req.paymentUser.id)
        .map((payment) =>
          clientPayment(
            payment,
            payment.payment_status === "PENDING"
              ? online.savedCheckoutUrl(payment.id)
              : null,
          ),
        );

      return res.json({
        success: true,
        enabled: paymongo.isConfigured(),
        testMode: paymongo.isTestMode(),
        payments,
      });
    } catch (error) {
      return sendError(res, error);
    }
  },
);

// ==========================================
// CHECK A PAYMENT WITH PAYMONGO
// ==========================================

router.get(
  "/online/:paymentId",
  authenticateToken,
  requireActiveUser(["STUDENT", "ADMIN"]),
  async (req, res) => {
    res.set("Cache-Control", "no-store");

    const paymentId = positiveId(req.params.paymentId);

    if (!paymentId) {
      return res.status(400).json({ success: false, message: "Invalid payment ID." });
    }

    try {
      paymentForUser(paymentId, req.paymentUser);

      const refreshed = await online.refreshOnlinePayment(paymentId);

      return res.json({
        success: true,
        payment: clientPayment(refreshed.payment, refreshed.checkoutUrl),
      });
    } catch (error) {
      return sendError(res, error);
    }
  },
);

// ==========================================
// THE STUDENT STOPS A GCASH PAYMENT
// ==========================================

router.post(
  "/online/:paymentId/cancel",
  authenticateToken,
  requireActiveUser(["STUDENT"]),
  async (req, res) => {
    const paymentId = positiveId(req.params.paymentId);

    if (!paymentId) {
      return res.status(400).json({ success: false, message: "Invalid payment ID." });
    }

    try {
      const payment = paymentForUser(paymentId, req.paymentUser);

      if (payment.payment_status !== "PENDING") {
        throw routeError(409, "PAYMENT_NOT_PENDING", "This payment is no longer in progress.");
      }

      let settled;

      try {
        settled = await online.settlePendingOnlinePayment(
          payment.fine_id,
          req.paymentUser.id,
          "STUDENT_CANCELLED",
        );
      } catch (error) {
        const { status, body } = online.settleErrorResponse(error);
        return res.status(status).json(body);
      }

      if (settled.paid) {
        throw routeError(409, "FINE_ALREADY_PAID", "This payment was already completed. Your fine is paid.");
      }

      return res.json({
        success: true,
        message: "GCash payment cancelled. You can pay again at any time.",
        payment: clientPayment(online.getPayment(paymentId)),
      });
    } catch (error) {
      return sendError(res, error);
    }
  },
);

// ==========================================
// PAYMONGO WEBHOOK
// ==========================================

router.post("/paymongo/webhook", async (req, res) => {
  const rawBody = req.rawBody ? req.rawBody.toString("utf8") : "";

  if (!paymongo.verifyWebhookSignature(rawBody, req.get("Paymongo-Signature"))) {
    console.warn("Rejected a PayMongo webhook with an invalid signature.");
    return res.status(401).json({ success: false });
  }

  try {
    const event = req.body?.data;
    const type = event?.attributes?.type;

    // Refund results: the status is read back from PayMongo, never taken
    // from the webhook body.
    if (type === "payment.refunded" || type === "payment.refund.updated") {
      const outcomes = await refunds.handleRefundWebhook(event);
      return res.json({ success: true, refunds: outcomes });
    }

    if (type !== "checkout_session.payment.paid") {
      return res.json({ success: true, ignored: true });
    }

    const session = event.attributes.data;
    const paid = (session?.attributes?.payments || []).find(
      (payment) => payment?.attributes?.status === "paid",
    );

    const payment = db
      .prepare(
        `SELECT id
         FROM payments
         WHERE gateway_reference = ? AND payment_method = 'GCASH'`,
      )
      .get(session?.id);

    // Not a SmartFine checkout, or nothing paid: acknowledge so PayMongo stops retrying.
    if (!payment || !paid) {
      return res.json({ success: true, ignored: true });
    }

    const result = online.recordOnlinePaid(payment.id, {
      gatewayPaymentId: paid.id,
      amountCentavos: Number(paid.attributes.amount),
      gatewayEventId: event.id,
      source: "WEBHOOK",
    });

    return res.json({ success: true, outcome: result.outcome });
  } catch (error) {
    // A 500 makes PayMongo retry later.
    console.error("PayMongo webhook failed:", error);
    return res.status(500).json({ success: false });
  }
});

// ==========================================
// PAGE SHOWN AFTER THE CHECKOUT
// ==========================================

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

// Only tells the student to return to the app. It never changes a payment;
// the app confirms the payment with the server afterwards.
router.get("/paymongo/return", (req, res) => {
  const success = req.query.result === "success";
  const appUrl = safeAppUrl(req.query.app);

  const title = success ? "Payment submitted" : "Payment not completed";
  const message = success
    ? "SmartFine is confirming your GCash payment with PayMongo. Return to the app to see the result."
    : "No payment was made. You can return to SmartFine and try again.";

  res.set("Cache-Control", "no-store");
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SmartFine — ${escapeHtml(title)}</title>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #173A73; color: #123266; }
  main { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; }
  section { background: #fff; border-radius: 16px; padding: 28px 24px; max-width: 360px; width: 100%; text-align: center; }
  h1 { font-size: 20px; margin: 12px 0 8px; }
  p { color: #5E6776; font-size: 14px; line-height: 1.5; margin: 0 0 20px; }
  .mark { width: 64px; height: 64px; box-sizing: border-box; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900; ${success ? "color: #238A35; background: #E7F8EA; border: 2px solid #45B94F;" : "color: #fff; background: #8C939F;"} }
  a { display: block; padding: 14px; border-radius: 10px; background: #173A73; color: #fff; text-decoration: none; font-weight: 700; }
</style>
</head>
<body>
<main>
  <section>
    <div class="mark">${success ? "✓" : "!"}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    ${appUrl ? `<a href="${escapeHtml(appUrl)}">Return to SmartFine</a>` : "<p>You can close this page.</p>"}
  </section>
</main>
${appUrl ? `<script>setTimeout(function () { window.location.href = ${JSON.stringify(appUrl).replace(/</g, "\\u003c")}; }, 800);</script>` : ""}
</body>
</html>`);
});

module.exports = router;
