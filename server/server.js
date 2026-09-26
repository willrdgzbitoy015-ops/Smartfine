require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const officerProfileRoutes = require("./routes/officer-profile");
const officerProfilePhotoRoutes = require("./routes/officer-profile-photo");
const dashboardRoutes = require("./routes/dashboard");
const studentsRoutes = require("./routes/students");
const finesRoutes = require("./routes/fines");
const studentFineReadRoutes = require("./routes/student-fine-reads");
const officersRoutes = require("./routes/officers");
const reportsRoutes = require("./routes/reports");
const settingsRoutes = require("./routes/settings");
const adminNotificationRoutes = require("./routes/admin-notifications");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/fines/my-fines", studentFineReadRoutes);
app.use("/api/fines", finesRoutes);

app.use("/api/officers", officersRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/officer-profile", officerProfilePhotoRoutes);
app.use("/api/officer-profile", officerProfileRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SmartFine API is running.",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SmartFine server running on port ${PORT}`);
});
