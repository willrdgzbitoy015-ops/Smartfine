// Registers (or updates) the PayMongo webhook that confirms GCash payments.
//
// Usage (from the server folder, with PAYMONGO_SECRET_KEY in server/.env):
//   node setup-paymongo-webhook.js https://your-ngrok-address
//
// Run it again whenever the public address changes; the same webhook is
// updated. The webhook secret is written to server/.env and never printed.
const fs = require("node:fs");
const path = require("node:path");

const ENV_PATH = path.join(__dirname, ".env");

require("dotenv").config({ path: ENV_PATH });

const paymongo = require("./payments/paymongo");

const EVENTS = ["checkout_session.payment.paid"];

function saveEnvValue(name, value) {
  const current = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
  const eol = current.includes("\r\n") ? "\r\n" : "\n";
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");

  const next = pattern.test(current)
    ? current.replace(pattern, line)
    : `${current}${current && !current.endsWith(eol) ? eol : ""}${line}${eol}`;

  fs.writeFileSync(ENV_PATH, next);
}

async function main() {
  const base = String(process.argv[2] || "").trim().replace(/\/+$/, "");

  if (!/^https:\/\/[^\s/]+/i.test(base)) {
    console.error("Give the public https address, e.g.:");
    console.error("  node setup-paymongo-webhook.js https://your-ngrok-address");
    process.exit(1);
  }

  if (!paymongo.isConfigured()) {
    console.error("Add PAYMONGO_SECRET_KEY=sk_test_... to server/.env first.");
    process.exit(1);
  }

  const url = `${base}/api/payments/paymongo/webhook`;
  const savedId = String(process.env.PAYMONGO_WEBHOOK_ID || "").trim();
  const webhooks = await paymongo.listWebhooks();

  const existing =
    webhooks.find((webhook) => webhook.id === savedId) ||
    webhooks.find((webhook) => webhook.attributes?.url === url);

  if (existing) {
    if (existing.attributes?.url !== url) {
      await paymongo.updateWebhook(existing.id, url, EVENTS);
      console.log(`Updated webhook ${existing.id} to ${url}`);
    } else {
      console.log(`Webhook ${existing.id} already points to ${url}`);
    }

    saveEnvValue("PAYMONGO_WEBHOOK_ID", existing.id);

    if (!process.env.PAYMONGO_WEBHOOK_SECRET) {
      console.log(
        "PAYMONGO_WEBHOOK_SECRET is missing from server/.env. Copy the webhook's secret key from the PayMongo dashboard into it.",
      );
    }

    if (existing.attributes?.status === "disabled") {
      console.log("This webhook is disabled. Enable it in the PayMongo dashboard.");
    }
  } else {
    const created = await paymongo.createWebhook(url, EVENTS);
    const secret = created?.attributes?.secret_key;

    saveEnvValue("PAYMONGO_WEBHOOK_ID", created.id);

    if (secret) {
      saveEnvValue("PAYMONGO_WEBHOOK_SECRET", secret);
      console.log(`Created webhook ${created.id} for ${url}`);
      console.log("Saved its secret to server/.env (not shown here).");
    } else {
      console.log(`Created webhook ${created.id} for ${url}`);
      console.log(
        "PayMongo did not return the secret. Copy it from the PayMongo dashboard into PAYMONGO_WEBHOOK_SECRET in server/.env.",
      );
    }
  }

  console.log("Restart the SmartFine server so it uses the new settings.");
}

main().catch((error) => {
  console.error("Webhook setup failed:", error.message);
  process.exit(1);
});
