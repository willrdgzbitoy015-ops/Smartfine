require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const officerProfileRoutes = require("./routes/officer-profile");
const officerProfilePhotoRoutes = require("./routes/officer-profile-photo");
const studentProfileRoutes = require("./routes/student-profile");
const dashboardRoutes = require("./routes/dashboard");
const studentsRoutes = require("./routes/students");
const finesRoutes = require("./routes/fines");
const fineEvidenceRoutes = require("./routes/fine-evidence");
const studentFineReadRoutes = require("./routes/student-fine-reads");
const studentQRRoutes = require("./routes/student-qr");
const cashPaymentRoutes = require("./routes/cash-payments");
const paymentReceiptRoutes = require("./routes/payment-receipts");
const officersRoutes = require("./routes/officers");
const reportsRoutes = require("./routes/reports");
const settingsRoutes = require("./routes/settings");
const adminRoutes = require("./routes/admins");
const refundRoutes = require("./routes/refunds");
const systemResetRoutes = require("./routes/system-reset");
const adminNotificationRoutes = require("./routes/admin-notifications");
const notificationRoutes = require("./routes/notifications");
const onlinePaymentRoutes = require("./routes/online-payments");
const activityLogRoutes = require("./routes/activity-log");
const firstLoginRoutes = require("./routes/first-login");
const accountEmailRoutes = require("./routes/account-email");
const accountAccessRoutes = require("./routes/account-access");
const backupRoutes = require("./routes/backups");
const realtime = require("./realtime");
const { requestContext } = require("./security/request-context");
const {
  errorHandler,
  notFound,
  sanitizeInput,
  securityHeaders,
} = require("./security/hardening");

// Writes sign-outs to the Log Trail.
require("./security/security-log");

const app = express();
// PORT in server/.env (default 3000; the web app expects 3000).
const PORT = Number(process.env.PORT) || 3000;

// ngrok sits in front of the app and connects from this computer; this makes
// req.ip the real client address for the Log Trail and the request limits.
// A forwarded address is only believed when it comes through that local
// connection, so someone on the network cannot invent their address.
app.set("trust proxy", "loopback");
app.disable("x-powered-by");

app.use(cors());
// Lets the Log Trail record the client address of every request.
app.use(requestContext);
app.use(securityHeaders);
// Announces every successful change to the signed-in apps (live updates).
app.use("/api", realtime.announceChanges);
// The raw body is kept so PayMongo webhook signatures can be verified.
app.use(
  express.json({
    verify: (req, _res, buffer) => {
      req.rawBody = buffer;
    },
  }),
);

// Cleans text in JSON bodies before any route reads it.
app.use(sanitizeInput);

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/auth/first-login", firstLoginRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/account/email", accountEmailRoutes);
app.use("/api/access", accountAccessRoutes);

app.use("/api/fines/my-fines", studentFineReadRoutes);
app.use("/api/fines", fineEvidenceRoutes);
app.use("/api/fines", finesRoutes);

app.use("/api/student-qr", studentQRRoutes);
app.use("/api/student-profile", studentProfileRoutes);
app.use("/api/payments", cashPaymentRoutes);
app.use("/api/payments", onlinePaymentRoutes);
app.use("/api/payments", paymentReceiptRoutes);

app.use("/api/officers", officersRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/system-reset", systemResetRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity-log", activityLogRoutes);
app.use("/api/backups", backupRoutes);
app.use("/api/officer-profile", officerProfilePhotoRoutes);
app.use("/api/officer-profile", officerProfileRoutes);

// Evidence photos are private: they are only served through the signed links
// of /api/fines/evidence-file.
app.use("/uploads/fine-evidence", (_req, res) => {
  res.status(404).json({ success: false, message: "Not found." });
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SmartFine API is running.",
  });
});

// Anything no route answered, and any failure a route did not handle.
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`SmartFine server running on port ${PORT}`);
});

realtime.attach(server);

// Automatic database backups (once a day, and one missed while the server was
// off is made as soon as it runs again).
require("./database/backup").startScheduler();
