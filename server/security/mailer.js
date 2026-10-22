// Sends SmartFine's emails (one-time codes). Uses the Gmail account named in
// server/.env: SMARTFINE_EMAIL_USER and SMARTFINE_EMAIL_APP_PASSWORD.
const nodemailer = require("nodemailer");

class MailError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Tests replace the real mailbox with their own function.
let transportOverride = null;

function setTransport(sender) {
  transportOverride = typeof sender === "function" ? sender : null;
}

function emailUser() {
  return String(process.env.SMARTFINE_EMAIL_USER || "").trim();
}

function createTransporter() {
  const user = emailUser();

  const password = String(process.env.SMARTFINE_EMAIL_APP_PASSWORD || "")
    .replace(/\s+/g, "")
    .trim();

  if (!user || !password) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: password },
  });
}

async function sendMail({ to, subject, text, html }) {
  if (transportOverride) {
    await transportOverride({ to, subject, text, html });
    return;
  }

  const transporter = createTransporter();

  if (!transporter) {
    throw new MailError(
      "EMAIL_NOT_CONFIGURED",
      "The SmartFine email service is not set up.",
    );
  }

  try {
    await transporter.sendMail({
      from: `"SmartFine" <${emailUser()}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    // The reason goes to the server log; the person only sees a safe message.
    console.error("Email could not be sent:", error.code || error.message);

    throw new MailError("EMAIL_SEND_FAILED", "The email could not be sent.");
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}

// A one-time code email: subject, plain text and a simple branded page.
function codeEmail({ name, code, minutes, subject, intro }) {
  const greeting = `Hello ${name || "there"},`;

  return {
    subject,

    text:
      `${greeting}\n\n${intro}\n\n${code}\n\n` +
      `This code expires in ${minutes} minutes and works once.\n\n` +
      `If you did not ask for this, you can ignore this message. ` +
      `Never share this code with anyone.\n\nSmartFine`,

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; color: #123266;">
        <h2 style="color: #173A73; margin-bottom: 20px;">SmartFine</h2>
        <p>${escapeHtml(greeting)}</p>
        <p>${escapeHtml(intro)}</p>
        <div style="margin: 24px 0; padding: 18px; background: #F1F4F8; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #173A73;">
          ${escapeHtml(code)}
        </div>
        <p>This code expires in ${minutes} minutes and works once.</p>
        <p>If you did not ask for this, you can ignore this email. Never share this code with anyone.</p>
        <p>SmartFine</p>
      </div>
    `,
  };
}

module.exports = { MailError, codeEmail, sendMail, setTransport };
