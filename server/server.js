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
const realtime = require("./realtime");

const app = express();
const PORT = 3000;

app.use(cors());
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

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/fines/my-fines", studentFineReadRoutes);
app.use("/api/fines", fineEvidenceRoutes);
app.use("/api/fines", finesRoutes);

app.use("/api/student-qr", studentQRRoutes);
app.use("/api/student-profile", studentProfileRoutes);
app.use("/api/payments", cashPaymentRoutes);
app.use("/api/payments", onlinePaymentRoutes);

app.use("/api/officers", officersRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/system-reset", systemResetRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity-log", activityLogRoutes);
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

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`SmartFine server running on port ${PORT}`);
});

realtime.attach(server);
