const express = require("express");
const router = express.Router();

const db = require("../database/database");

console.log("dashboard.js loaded");

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

router.get("/stats", (req, res) => {
  try {
    const totalStudents = db
      .prepare(
        `
      SELECT COUNT(*) AS total
      FROM users
      WHERE role = 'STUDENT'
    `,
      )
      .get();

    res.json({
      success: true,

      stats: {
        totalStudents: totalStudents.total,

        unpaidFines: 0,

        todayCollection: 0,

        paidFines: 0,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    res.status(500).json({
      success: false,

      message: "Failed to load dashboard statistics.",

      error: error.message,
    });
  }
});

// ==========================================
// RECENT ACTIVITIES
// ==========================================

router.get("/recent-activities", (req, res) => {
  try {
    // ======================================
    // RECENT FINES
    // ======================================

    const fineActivities = db
      .prepare(
        `
          SELECT
            f.id AS id,

            TRIM(
              u.first_name || ' ' ||
              COALESCE(
                u.middle_name || ' ',
                ''
              ) ||
              u.last_name
            ) AS name,

            'was fined for ' ||
            vt.violation_name
              AS description,

            f.amount_centavos / 100.0
              AS amount,

            f.created_at
              AS created_at,

            'fine'
              AS activity_type,

            CASE
              WHEN officer.id IS NOT NULL
              THEN
                'By ' ||
                TRIM(
                  officer.first_name ||
                  ' ' ||
                  officer.last_name
                )

              ELSE
                'Fine recorded'
            END
              AS details

          FROM fines f

          JOIN users u
            ON u.id = f.student_id

          JOIN violation_types vt
            ON vt.id =
               f.violation_type_id

          LEFT JOIN users officer
            ON officer.id =
               f.recorded_by

          WHERE
            f.cancelled_at IS NULL

          ORDER BY
            f.created_at DESC,
            f.id DESC

          LIMIT 10
        `,
      )
      .all();

    // ======================================
    // RECENT PAYMENTS
    // ======================================

    const paymentActivities = db
      .prepare(
        `
          SELECT
            p.id AS id,

            TRIM(
              u.first_name || ' ' ||
              COALESCE(
                u.middle_name || ' ',
                ''
              ) ||
              u.last_name
            ) AS name,

            'settled outstanding balance'
              AS description,

            p.amount_centavos / 100.0
              AS amount,

            COALESCE(
              p.paid_at,
              p.confirmed_at,
              p.created_at
            )
              AS created_at,

            'paid'
              AS activity_type,

            CASE
              WHEN
                p.payment_method
                IS NOT NULL

              THEN
                'Payment via ' ||
                p.payment_method

              ELSE
                'Payment processed'
            END
              AS details

          FROM payments p

          JOIN users u
            ON u.id =
               p.student_id

          WHERE
            UPPER(
              p.payment_status
            ) = 'PAID'

          ORDER BY
            COALESCE(
              p.paid_at,
              p.confirmed_at,
              p.created_at
            ) DESC

          LIMIT 10
        `,
      )
      .all();

    // ======================================
    // COMBINE FINES + PAYMENTS
    // ======================================

    const activities = [...fineActivities, ...paymentActivities]
      .sort((a, b) => {
        return (
          parseDatabaseDate(b.created_at) - parseDatabaseDate(a.created_at)
        );
      })
      .slice(0, 5);

    // ======================================
    // RESPONSE
    // ======================================

    res.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("Recent activities error:", error);

    res.status(500).json({
      success: false,

      message: "Failed to load recent activities.",

      error: error.message,
    });
  }
});

// ==========================================
// SQLITE DATE SORT HELPER
// ==========================================

function parseDatabaseDate(value) {
  if (!value) {
    return 0;
  }

  let normalized = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
    normalized = normalized.replace(" ", "T") + "Z";
  }

  const time = new Date(normalized).getTime();

  return Number.isNaN(time) ? 0 : time;
}

module.exports = router;
