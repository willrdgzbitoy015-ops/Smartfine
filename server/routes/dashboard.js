const express = require("express");

const router = express.Router();

const db = require("../database/database");

console.log("dashboard.js loaded");

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

router.get("/stats", (req, res) => {
  try {
    // ======================================
    // TOTAL ACTIVE / VISIBLE STUDENTS
    //
    // Archived students remain in users
    // for historical fine/payment records,
    // but should not count on Dashboard.
    // ======================================

    const totalStudentsResult = db
      .prepare(
        `
          SELECT
            COUNT(*) AS total

          FROM users

          WHERE
            role = 'STUDENT'

            AND
            username NOT LIKE
              '__archived_student_%'
        `,
      )
      .get();

    // ======================================
    // UNPAID FINES
    //
    // Includes normal unpaid/pending fines.
    //
    // Excludes:
    // - PAID
    // - CANCELLED
    // - WAIVED
    // ======================================

    const unpaidFinesResult = db
      .prepare(
        `
          SELECT
            COUNT(*) AS total

          FROM fines

          WHERE
            cancelled_at IS NULL

            AND
            paid_at IS NULL

            AND
            UPPER(
              COALESCE(
                fine_status,
                'UNPAID'
              )
            )
            NOT IN (
              'PAID',
              'CANCELLED',
              'WAIVED'
            )
        `,
      )
      .get();

    // ======================================
    // PAID FINES
    //
    // A fine is considered paid when:
    // - paid_at exists
    // OR
    // - fine_status = PAID
    //
    // Cancelled fines are never counted.
    // ======================================

    const paidFinesResult = db
      .prepare(
        `
          SELECT
            COUNT(*) AS total

          FROM fines

          WHERE
            cancelled_at IS NULL

            AND
            UPPER(
              COALESCE(
                fine_status,
                ''
              )
            ) != 'CANCELLED'

            AND
            (
              paid_at IS NOT NULL

              OR

              UPPER(
                COALESCE(
                  fine_status,
                  ''
                )
              ) = 'PAID'
            )
        `,
      )
      .get();

    // ======================================
    // TODAY'S COLLECTION
    //
    // Current SmartFine payment workflow
    // marks a fine paid using fines.paid_at.
    //
    // SQLite CURRENT_TIMESTAMP is UTC.
    // +8 hours converts it to Philippine time.
    //
    // Only fines actually paid today are
    // included in Today's Collection.
    // ======================================

    const todayCollectionResult = db
      .prepare(
        `
          SELECT
            COALESCE(
              SUM(
                amount_centavos
              ),
              0
            ) / 100.0
              AS total

          FROM fines

          WHERE
            cancelled_at IS NULL

            AND
            paid_at IS NOT NULL

            AND
            UPPER(
              COALESCE(
                fine_status,
                'PAID'
              )
            ) != 'CANCELLED'

            AND
            DATE(
              DATETIME(
                paid_at,
                '+8 hours'
              )
            )
            =
            DATE(
              DATETIME(
                'now',
                '+8 hours'
              )
            )
        `,
      )
      .get();

    // ======================================
    // NORMALIZE VALUES
    // ======================================

    const totalStudents = Number(totalStudentsResult?.total || 0);

    const unpaidFines = Number(unpaidFinesResult?.total || 0);

    const paidFines = Number(paidFinesResult?.total || 0);

    const todayCollection = Number(todayCollectionResult?.total || 0);

    // ======================================
    // RESPONSE
    // ======================================

    return res.json({
      success: true,

      stats: {
        totalStudents,

        unpaidFines,

        todayCollection,

        paidFines,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    return res.status(500).json({
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
              WHEN
                officer.id IS NOT NULL

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
            ON
              u.id =
              f.student_id

          JOIN violation_types vt
            ON
              vt.id =
              f.violation_type_id

          LEFT JOIN users officer
            ON
              officer.id =
              f.recorded_by

          WHERE
            f.cancelled_at IS NULL

            AND
            UPPER(
              COALESCE(
                f.fine_status,
                'UNPAID'
              )
            ) != 'CANCELLED'

          ORDER BY
            f.created_at DESC,
            f.id DESC

          LIMIT 10
        `,
      )
      .all();

    // ======================================
    // RECENT PAYMENTS
    //
    // payments.student_id refers to
    // students.id, while students.user_id
    // refers to users.id.
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
                p.payment_method IS NOT NULL

              THEN
                'Payment via ' ||
                p.payment_method

              ELSE
                'Payment processed'

            END
              AS details

          FROM payments p

          JOIN students s
            ON
              s.id =
              p.student_id

          JOIN users u
            ON
              u.id =
              s.user_id

          WHERE
            UPPER(
              COALESCE(
                p.payment_status,
                ''
              )
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

    return res.json({
      success: true,

      activities,
    });
  } catch (error) {
    console.error("Recent activities error:", error);

    return res.status(500).json({
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

  // ========================================
  // SQLITE CURRENT_TIMESTAMP
  //
  // Example:
  // 2026-09-07 12:35:20
  //
  // SQLite stores CURRENT_TIMESTAMP as UTC.
  // ========================================

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
    normalized = normalized.replace(" ", "T") + "Z";
  }

  const time = new Date(normalized).getTime();

  return Number.isNaN(time) ? 0 : time;
}

module.exports = router;
