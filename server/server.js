require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");

const officerProfileRoutes = require("./routes/officer-profile");

const dashboardRoutes = require("./routes/dashboard");

const studentsRoutes = require("./routes/students");

const finesRoutes = require("./routes/fines");

const officersRoutes = require("./routes/officers");

const reportsRoutes = require("./routes/reports");

const settingsRoutes = require("./routes/settings");

const app = express();

const PORT = 3000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

// ==========================================
// ROUTES
// ==========================================

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/students", studentsRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/fines", finesRoutes);

app.use("/api/officers", officersRoutes);

app.use("/api/reports", reportsRoutes);

app.use("/api/settings", settingsRoutes);

app.use("/api/officer-profile", officerProfileRoutes);

// ==========================================
// STATIC UPLOADS
// ==========================================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==========================================
// API TEST
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,

    message: "SmartFine API is running.",
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SmartFine server running on port ${PORT}`);
});
