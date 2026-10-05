const express = require("express");
const db = require("../database/database");
const { authenticateToken } = require("./auth");

const router = express.Router();

// Every signed-in, active user can read and update only their own notices.
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

    if (
      !user ||
      user.account_status !== "ACTIVE" ||
      !["ADMIN", "FINES_OFFICER", "STUDENT"].includes(user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "An active account is required.",
      });
    }

    req.notificationUserId = userId;
    res.set("Cache-Control", "no-store");
    next();
  } catch (error) {
    console.error("Notification access error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load notifications.",
    });
  }
});

function unreadCounts(userId) {
  const counts = {
    total: 0,
    FINE: 0,
    PAYMENT: 0,
    SYSTEM: 0,
    ACCOUNT: 0,
    reports: 0,
  };

  const rows = db
    .prepare(
      `SELECT notification_type AS type, COUNT(*) AS count
       FROM notifications
       WHERE user_id = ? AND is_read = 0
       GROUP BY notification_type`,
    )
    .all(userId);

  for (const row of rows) {
    counts[row.type] = Number(row.count);
    counts.total += Number(row.count);
  }

  // Same rule as the Reports activity count in reports.js.
  counts.reports = Number(
    db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM notifications
         WHERE user_id = ? AND is_read = 0
           AND notification_type = 'SYSTEM'
           AND title = 'Payment Collected'
           AND related_payment_id IS NOT NULL`,
      )
      .get(userId).count,
  );

  return counts;
}

router.get("/unread-count", (req, res) => {
  try {
    const counts = unreadCounts(req.notificationUserId);

    return res.json({ success: true, unreadCount: counts.total, counts });
  } catch (error) {
    console.error("Notification count error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load unread count.",
    });
  }
});

router.get("/", (req, res) => {
  const limit = req.query.limit === undefined ? 30 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);

  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Use limit 1–100 and a non-negative integer offset.",
    });
  }

  try {
    const userId = req.notificationUserId;

    const rows = db
      .prepare(
        `SELECT
           n.id,
           n.notification_type AS notificationType,
           n.title,
           n.message,
           n.related_fine_id AS fineId,
           n.related_payment_id AS paymentId,
           n.is_read AS isRead,
           n.created_at AS createdAt,
           f.fine_reference AS fineReference,
           CASE
             WHEN f.id IS NULL THEN NULL
             WHEN f.cancelled_at IS NOT NULL THEN 'CANCELLED'
             WHEN f.paid_at IS NOT NULL THEN 'PAID'
             ELSE 'UNPAID'
           END AS fineStatus
         FROM notifications n
         LEFT JOIN fines f ON f.id = n.related_fine_id
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC, n.id DESC
         LIMIT ? OFFSET ?`,
      )
      .all(userId, limit + 1, offset);

    const hasMore = rows.length > limit;
    const counts = unreadCounts(userId);

    return res.json({
      success: true,
      notifications: rows.slice(0, limit).map((row) => ({
        ...row,
        isRead: Number(row.isRead) === 1,
      })),
      unreadCount: counts.total,
      counts,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    console.error("Notification list error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load notifications.",
    });
  }
});

// Called only after the linked record has loaded, so it marks one notice.
router.patch("/:id/read", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID.",
    });
  }

  try {
    const userId = req.notificationUserId;

    const notification = db
      .prepare(
        `SELECT id, notification_type, title, related_fine_id
         FROM notifications
         WHERE id = ? AND user_id = ?`,
      )
      .get(id, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    db.exec("BEGIN IMMEDIATE");

    try {
      db.prepare(
        `UPDATE notifications
         SET is_read = 1
         WHERE id = ? AND user_id = ? AND is_read = 0`,
      ).run(id, userId);

      // A student's new-fine notice and the fine's My Fines badge stay in step.
      if (
        notification.notification_type === "FINE" &&
        notification.title === "New Fine Issued" &&
        notification.related_fine_id
      ) {
        db.prepare(
          `INSERT OR IGNORE INTO student_fine_reads (student_id, fine_id)
           SELECT student_id, id
           FROM fines
           WHERE id = ? AND student_id = ? AND cancelled_at IS NULL`,
        ).run(notification.related_fine_id, userId);
      }

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    const counts = unreadCounts(userId);

    return res.json({ success: true, unreadCount: counts.total, counts });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to mark notification as read.",
    });
  }
});

// Deletes one of the signed-in user's own notices. Only the notice goes:
// the fine, payment or cashier request it mentions is not changed, and the
// fine's NEW/READ state in My Fines stays as it was.
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID.",
    });
  }

  try {
    const userId = req.notificationUserId;

    const result = db
      .prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?")
      .run(id, userId);

    if (Number(result.changes) !== 1) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const counts = unreadCounts(userId);

    return res.json({
      success: true,
      message: "Notification deleted.",
      unreadCount: counts.total,
      counts,
    });
  } catch (error) {
    console.error("Delete notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete the notification.",
    });
  }
});

module.exports = router;
