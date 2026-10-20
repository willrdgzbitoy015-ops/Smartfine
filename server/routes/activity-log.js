// Activity log for Administrators. Mounted at /api/activity-log.
//
//   GET /api/activity-log?category=FINES&search=&page=1&pageSize=20
//
// Read-only: there is no route that changes or deletes an entry.
const express = require("express");

const { CATEGORIES, listActivity } = require("../database/activity-log");
const { requireActive } = require("../middleware/access");

const router = express.Router();

router.get("/", requireActive("ADMIN"), (req, res) => {
  try {
    const category = String(req.query.category || "ALL").toUpperCase();

    if (category !== "ALL" && !CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: "Unknown category." });
    }

    res.set("Cache-Control", "no-store");

    return res.json({
      success: true,
      categories: CATEGORIES,
      ...listActivity({
        category,
        search: String(req.query.search || "").slice(0, 100),
        page: req.query.page,
        pageSize: req.query.pageSize,
      }),
    });
  } catch (error) {
    console.error("Activity log read failed:", error);
    return res.status(500).json({ success: false, message: "Could not load the activity log." });
  }
});

module.exports = router;
