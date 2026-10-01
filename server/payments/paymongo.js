// Minimal PayMongo client for Hosted Checkout (GCash).
// Keys come from server/.env and are never sent to the app:
//   PAYMONGO_SECRET_KEY      sk_test_... (test mode) or sk_live_...
//   PAYMONGO_WEBHOOK_SECRET  whsec_... (from setup-paymongo-webhook.js)
//   PAYMONGO_API_BASE        optional; only for local testing
const crypto = require("node:crypto");

const REQUEST_TIMEOUT_MS = 15000;

// Webhook timestamps older than this are rejected (replayed requests).
const WEBHOOK_TOLERANCE_SECONDS = 10 * 60;

class PayMongoError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "PayMongoError";
    this.status = status;
    this.details = details;
  }
}

function secretKey() {
  return String(process.env.PAYMONGO_SECRET_KEY || "").trim();
}

function apiBase() {
  return String(process.env.PAYMONGO_API_BASE || "https://api.paymongo.com")
    .trim()
    .replace(/\/+$/, "");
}

function isConfigured() {
  return /^sk_(test|live)_\S+$/.test(secretKey());
}

function isTestMode() {
  return secretKey().startsWith("sk_test_");
}

async function request(method, path, body) {
  if (!isConfigured()) {
    throw new PayMongoError("Online payment is not set up yet.", 503);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBase()}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${secretKey()}:`).toString("base64")}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    let json = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!response.ok) {
      const detail = json?.errors?.[0]?.detail;

      throw new PayMongoError(
        detail || `PayMongo returned HTTP ${response.status}.`,
        response.status,
        json?.errors,
      );
    }

    return json;
  } catch (error) {
    if (error instanceof PayMongoError) {
      throw error;
    }

    throw new PayMongoError(
      controller.signal.aborted
        ? "PayMongo did not respond in time."
        : "Could not reach PayMongo.",
      502,
    );
  } finally {
    clearTimeout(timer);
  }
}

// The parts of a checkout session SmartFine relies on.
function summarizeSession(json) {
  const data = json?.data || {};
  const attributes = data.attributes || {};
  const payments = Array.isArray(attributes.payments) ? attributes.payments : [];
  const paid = payments.find((payment) => payment?.attributes?.status === "paid");

  return {
    id: data.id || null,
    status: attributes.status || null,
    checkoutUrl: attributes.checkout_url || null,
    referenceNumber: attributes.reference_number || null,
    livemode: Boolean(attributes.livemode),
    paidPayment: paid
      ? {
          id: paid.id,
          amountCentavos: Number(paid.attributes.amount),
          currency: paid.attributes.currency || "PHP",
        }
      : null,
  };
}

async function createCheckoutSession({
  amountCentavos,
  name,
  description,
  referenceNumber,
  successUrl,
  cancelUrl,
  metadata,
}) {
  const json = await request("POST", "/v1/checkout_sessions", {
    data: {
      attributes: {
        line_items: [
          {
            name,
            amount: amountCentavos,
            currency: "PHP",
            quantity: 1,
          },
        ],
        payment_method_types: ["gcash"],
        success_url: successUrl,
        cancel_url: cancelUrl,
        reference_number: referenceNumber,
        description,
        send_email_receipt: false,
        show_description: true,
        show_line_items: true,
        metadata,
      },
    },
  });

  return summarizeSession(json);
}

async function retrieveCheckoutSession(sessionId) {
  return summarizeSession(
    await request("GET", `/v1/checkout_sessions/${encodeURIComponent(sessionId)}`),
  );
}

async function expireCheckoutSession(sessionId) {
  return summarizeSession(
    await request(
      "POST",
      `/v1/checkout_sessions/${encodeURIComponent(sessionId)}/expire`,
    ),
  );
}

// Webhook endpoints (used by setup-paymongo-webhook.js).
async function listWebhooks() {
  const json = await request("GET", "/v1/webhooks");
  return Array.isArray(json?.data) ? json.data : [];
}

async function createWebhook(url, events) {
  const json = await request("POST", "/v1/webhooks", {
    data: { attributes: { url, events } },
  });
  return json?.data;
}

async function updateWebhook(webhookId, url, events) {
  const json = await request("PUT", `/v1/webhooks/${encodeURIComponent(webhookId)}`, {
    data: { attributes: { url, events } },
  });
  return json?.data;
}

// Header: "t=<unix seconds>,te=<test signature>,li=<live signature>".
// Signed text: "<t>.<raw request body>", HMAC-SHA256 with the webhook secret.
function verifyWebhookSignature(rawBody, header, options = {}) {
  const secret = options.secret ?? process.env.PAYMONGO_WEBHOOK_SECRET;
  const nowSeconds = (options.now ?? Date.now()) / 1000;

  if (!secret || !rawBody || !header) {
    return false;
  }

  const parts = {};

  for (const part of String(header).split(",")) {
    const separator = part.indexOf("=");
    if (separator > 0) {
      parts[part.slice(0, separator).trim()] = part.slice(separator + 1).trim();
    }
  }

  const timestamp = Number(parts.t);

  if (
    !Number.isFinite(timestamp) ||
    Math.abs(nowSeconds - timestamp) > WEBHOOK_TOLERANCE_SECONDS
  ) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${parts.t}.${rawBody}`)
    .digest("hex");

  return [parts.te, parts.li].some(
    (signature) =>
      typeof signature === "string" &&
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)),
  );
}

module.exports = {
  PayMongoError,
  createCheckoutSession,
  createWebhook,
  expireCheckoutSession,
  isConfigured,
  isTestMode,
  listWebhooks,
  retrieveCheckoutSession,
  updateWebhook,
  verifyWebhookSignature,
};
