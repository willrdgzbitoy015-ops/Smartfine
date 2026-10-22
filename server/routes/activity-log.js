// Activity log for Administrators. Mounted at /api/activity-log.
//
//   GET /api/activity-log?category=SECURITY&result=FAILED&module=Login
//                         &from=2026-10-01&to=2026-10-31&search=&page=1&pageSize=20
//
// Read-only: there is no route that changes or deletes an entry.
const express = require("express");

const { CATEGORIES, MODULES, RESULTS, listActivity } = require("../database/activity-log");
const { requireActive } = require("../middleware/access");

const router = express.Router();

router.get("/", requireActive("ADMIN"), (req, res) => {
  try {
    const category = String(req.query.category || "ALL").toUpperCase();

    if (category !== "ALL" && !CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: "Unknown category." });
    }

    const result = String(req.query.result || "ALL").toUpperCase();

    if (result !== "ALL" && !RESULTS.includes(result)) {
      return res.status(400).json({ success: false, message: "Unknown result." });
    }

    const module = String(req.query.module || "ALL");

    if (module !== "ALL" && !MODULES.includes(module)) {
      return res.status(400).json({ success: false, message: "Unknown module." });
    }

    const dates = {};

    for (const key of ["from", "to"]) {
      const value = String(req.query[key] || "").trim();

      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return res.status(400).json({ success: false, message: "Dates must look like 2026-10-31." });
      }

      dates[key] = value;
    }

    res.set("Cache-Control", "no-store");

    return res.json({
      success: true,
      categories: CATEGORIES,
      results: RESULTS,
      modules: MODULES,
      ...listActivity({
        category,
        result,
        module,
        from: dates.from,
        to: dates.to,
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
