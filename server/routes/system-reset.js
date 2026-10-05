// System reset. Mounted at /api/system-reset.
const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../database/database");
const reset = require("../database/system-reset");
const { authenticateToken, requireAdmin } = require("./auth");

const router = express.Router();

// A signed-in administrator whose account is active.
router.use(authenticateToken, requireAdmin);

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// What a reset would delete, and anything that would stop it.
router.get("/", (req, res) => {
  try {
    return res.json({
      success: true,
      summary: reset.resetSummary(Number(req.authUser.userId)),
    });
  } catch (error) {
    console.error("System reset summary failed:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load what a reset would delete.",
    });
  }
});

router.post("/", async (req, res) => {
  const adminId = Number(req.authUser.userId);
  const { currentPassword, confirmation, keepFineTypes, keepSchoolDetails } = req.body || {};

  if (String(confirmation || "").trim().toUpperCase() !== reset.CONFIRM_PHRASE) {
    return res.status(400).json({
      success: false,
      code: "CONFIRMATION_MISMATCH",
      message: `Type ${reset.CONFIRM_PHRASE} exactly to confirm the reset.`,
    });
  }

  if (typeof currentPassword !== "string" || currentPassword === "") {
    return res.status(400).json({
      success: false,
      code: "PASSWORD_REQUIRED",
      message: "Enter your current password to confirm the reset.",
    });
  }

  try {
    const user = db
      .prepare("SELECT password_hash FROM users WHERE id = ?")
      .get(adminId);

    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(401).json({
        success: false,
        code: "CURRENT_PASSWORD_INCORRECT",
        message: "Current password is incorrect. Nothing was deleted.",
      });
    }

    const result = await reset.resetSystem({
      adminId,
      // Anything other than an explicit false keeps them.
      keepFineTypes: keepFineTypes !== false,
      keepSchoolDetails: keepSchoolDetails !== false,
    });

    console.log(`System reset by administrator ${adminId}. Backup: ${result.backupFolder}`);

    return res.json({
      success: true,
      message: "SmartFine was reset.",
      ...result,
    });
  } catch (error) {
    if (error instanceof reset.ResetError) {
      return res.status(error.status).json({
        success: false,
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      });
    }

    console.error("System reset failed:", error);

    return res.status(500).json({
      success: false,
      message: "The reset failed. Nothing was deleted.",
    });
  }
});

module.exports = router;
