const express = require("express");

const router = express.Router();

const db = require("../database/database");
const { authenticateToken } = require("./auth");

console.log("dashboard.js loaded");

// ==========================================
// ACTIVE ADMIN ONLY
// ==========================================

router.use(authenticateToken);

router.use((req, res, next) => {
  try {
    const userId = Number(req.authUser?.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Please sign in again.",
      });
    }

    const user = db
      .prepare("SELECT role, account_status FROM users WHERE id = ?")
      .get(userId);

    if (!user || user.role !== "ADMIN" || user.account_status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "An active administrator account is required.",
      });
    }

    res.set("Cache-Control", "no-store");
    next();
  } catch (error) {
    console.error("Dashboard authorization error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not verify your account.",
    });
  }
});

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

router.get("/stats", (req, res) => {
  try {
    // Archived students stay in users for history but are not counted.
    const totalStudents = db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM users
         WHERE role = 'STUDENT'
           AND username NOT LIKE '__archived_student_%'`,
      )
      .get();

    // Unpaid excludes PAID, CANCELLED, and WAIVED fines.
    const unpaid = db
      .prepare(
        `SELECT
           COUNT(*) AS total,
           COALESCE(SUM(amount_centavos), 0) AS centavos
         FROM fines
         WHERE cancelled_at IS NULL
           AND paid_at IS NULL
           AND UPPER(COALESCE(fine_status, 'UNPAID'))
             NOT IN ('PAID', 'CANCELLED', 'WAIVED')`,
      )
      .get();

    // Same rule as the Admin Pending Cash list: only collectable requests.
    const pendingCash = db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM payments p
         JOIN fines f ON f.id = p.fine_id
         WHERE p.payment_method = 'CASH'
           AND p.payment_status = 'PENDING'
           AND f.fine_status = 'UNPAID'
           AND f.paid_at IS NULL
           AND f.cancelled_at IS NULL`,
      )
      .get();

    // A fine is paid when paid_at exists or its status is PAID.
    const paidFines = db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM fines
         WHERE cancelled_at IS NULL
           AND UPPER(COALESCE(fine_status, '')) != 'CANCELLED'
           AND (
             paid_at IS NOT NULL
             OR UPPER(COALESCE(fine_status, '')) = 'PAID'
           )`,
      )
      .get();

    // Collections come from payment records, like Payment Reports.
    // CURRENT_TIMESTAMP is UTC; +8 hours gives Philippine time.
    const today = db
      .prepare(
        `SELECT
           COUNT(*) AS total,
           COALESCE(SUM(amount_centavos), 0) AS centavos
         FROM payments
         WHERE payment_status = 'SUCCESS'
           AND paid_at IS NOT NULL
           AND DATE(DATETIME(paid_at, '+8 hours')) =
               DATE(DATETIME('now', '+8 hours'))`,
      )
      .get();

    const collected = db
      .prepare(
        `SELECT
           COUNT(*) AS total,
           COALESCE(SUM(amount_centavos), 0) AS centavos
         FROM payments
         WHERE payment_status = 'SUCCESS'
           AND paid_at IS NOT NULL`,
      )
      .get();

    return res.json({
      success: true,
      stats: {
        totalStudents: Number(totalStudents.total),
        unpaidFines: Number(unpaid.total),
        unpaidAmountCentavos: Number(unpaid.centavos),
        pendingCashRequests: Number(pendingCash.total),
        paidFines: Number(paidFines.total),
        todayCollection: Number(today.centavos) / 100,
        todayCollectionCentavos: Number(today.centavos),
        todayCollectionCount: Number(today.total),
        totalCollectedCentavos: Number(collected.centavos),
        totalCollectedCount: Number(collected.total),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics.",
    });
  }
});

// ==========================================
// ACTIVITY FEED
//
// Every recorded Admin-side event, newest first:
// fines issued and cancelled, cashier requests,
// payments, and new student and officer accounts.
// ==========================================

function fullName(alias) {
  return `TRIM(
    ${alias}.first_name || ' ' ||
    COALESCE(${alias}.middle_name || ' ', '') ||
    ${alias}.last_name
  )`;
}

const ACTIVITY_FEED = `
  SELECT
    'FINE_ISSUED' AS type,
    'FINES' AS category,
    'fine-' || f.id AS activity_key,
    f.created_at AS occurred_at,
    f.id AS fine_id,
    f.fine_reference AS fine_reference,
    NULL AS payment_id,
    NULL AS user_id,
    ${fullName("student")} AS subject_name,
    'was fined for ' || COALESCE(vt.violation_name, 'a violation') AS description,
    ${fullName("actor")} AS actor_name,
    actor.role AS actor_role,
    f.amount_centavos AS amount_centavos
  FROM fines f
  JOIN users student ON student.id = f.student_id
  LEFT JOIN violation_types vt ON vt.id = f.violation_type_id
  LEFT JOIN users actor ON actor.id = f.recorded_by

  UNION ALL

  SELECT
    'CASH_REQUESTED',
    'CASH_REQUESTS',
    'request-' || pe.id,
    pe.created_at,
    p.fine_id,
    f.fine_reference,
    p.id,
    NULL,
    ${fullName("student")},
    'requested to pay ' || f.fine_reference || ' at the cashier',
    NULL,
    NULL,
    p.amount_centavos
  FROM payment_events pe
  JOIN payments p ON p.id = pe.payment_id
  JOIN fines f ON f.id = p.fine_id
  JOIN students s ON s.id = p.student_id
  JOIN users student ON student.id = s.user_id
  WHERE pe.event_type = 'CASH_REQUESTED'

  UNION ALL

  SELECT
    'PAYMENT_RECEIVED',
    'PAYMENTS',
    'payment-' || p.id,
    COALESCE(p.paid_at, p.confirmed_at, p.created_at),
    p.fine_id,
    f.fine_reference,
    p.id,
    NULL,
    ${fullName("student")},
    'paid ' || f.fine_reference ||
      CASE WHEN p.payment_method = 'CASH' THEN ' in cash' ELSE ' online' END,
    ${fullName("actor")},
    actor.role,
    p.amount_centavos
  FROM payments p
  JOIN fines f ON f.id = p.fine_id
  JOIN students s ON s.id = p.student_id
  JOIN users student ON student.id = s.user_id
  LEFT JOIN users actor ON actor.id = p.confirmed_by
  WHERE p.payment_status = 'SUCCESS'

  UNION ALL

  -- Older fines marked paid before payment records existed.
  SELECT
    'FINE_MARKED_PAID',
    'PAYMENTS',
    'paid-' || f.id,
    f.paid_at,
    f.id,
    f.fine_reference,
    NULL,
    NULL,
    ${fullName("student")},
    'had ' || f.fine_reference || ' marked paid (no payment record)',
    NULL,
    NULL,
    f.amount_centavos
  FROM fines f
  JOIN users student ON student.id = f.student_id
  WHERE f.paid_at IS NOT NULL
    AND f.cancelled_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM payments p
      WHERE p.fine_id = f.id AND p.payment_status = 'SUCCESS'
    )

  UNION ALL

  SELECT
    'FINE_CANCELLED',
    'CANCELLED',
    'cancel-' || f.id,
    f.cancelled_at,
    f.id,
    f.fine_reference,
    NULL,
    NULL,
    ${fullName("student")},
    'had ' || f.fine_reference || ' (' ||
      COALESCE(vt.violation_name, 'a violation') || ') cancelled',
    ${fullName("actor")},
    actor.role,
    f.amount_centavos
  FROM fines f
  JOIN users student ON student.id = f.student_id
  LEFT JOIN violation_types vt ON vt.id = f.violation_type_id
  LEFT JOIN users actor ON actor.id = f.cancelled_by
  WHERE f.cancelled_at IS NOT NULL

  UNION ALL

  -- Accounts still in use (archived accounts have no profile to open).
  SELECT
    CASE WHEN u.role = 'STUDENT' THEN 'STUDENT_ADDED' ELSE 'OFFICER_ADDED' END,
    'ACCOUNTS',
    'account-' || u.id,
    u.created_at,
    NULL,
    NULL,
    NULL,
    u.id,
    ${fullName("u")},
    CASE
      WHEN u.role = 'STUDENT' THEN 'was added as a student'
      ELSE 'was added as a fines officer'
    END,
    NULL,
    NULL,
    NULL
  FROM users u
  WHERE u.role IN ('STUDENT', 'FINES_OFFICER')
    AND u.username NOT LIKE '__archived_%'
`;

const CATEGORIES = [
  "ALL",
  "FINES",
  "CASH_REQUESTS",
  "PAYMENTS",
  "CANCELLED",
  "ACCOUNTS",
];

router.get("/activities", (req, res) => {
  const category = String(req.query.category || "ALL").toUpperCase();
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);

  if (
    !CATEGORIES.includes(category) ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Use a known category, limit 1–100, and a non-negative integer offset.",
    });
  }

  try {
    const rows = db
      .prepare(
        `SELECT * FROM (${ACTIVITY_FEED})
         WHERE ? = 'ALL' OR category = ?
         ORDER BY datetime(occurred_at) DESC, activity_key DESC
         LIMIT ? OFFSET ?`,
      )
      .all(category, category, limit + 1, offset);

    const counts = { ALL: 0 };
    for (const key of CATEGORIES.slice(1)) counts[key] = 0;

    for (const row of db
      .prepare(
        `SELECT category, COUNT(*) AS total
         FROM (${ACTIVITY_FEED})
         GROUP BY category`,
      )
      .all()) {
      counts[row.category] = Number(row.total);
      counts.ALL += Number(row.total);
    }

    const hasMore = rows.length > limit;

    return res.json({
      success: true,
      activities: rows.slice(0, limit).map((row) => ({
        key: row.activity_key,
        type: row.type,
        category: row.category,
        occurredAt: row.occurred_at,
        fineId: row.fine_id === null ? null : Number(row.fine_id),
        fineReference: row.fine_reference,
        paymentId: row.payment_id === null ? null : Number(row.payment_id),
        userId: row.user_id === null ? null : Number(row.user_id),
        subjectName: row.subject_name,
        description: row.description,
        actorName: row.actor_name,
        actorRole: row.actor_role,
        amountCentavos:
          row.amount_centavos === null ? null : Number(row.amount_centavos),
      })),
      counts,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    console.error("Dashboard activities error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load activities.",
    });
  }
});

module.exports = router;
