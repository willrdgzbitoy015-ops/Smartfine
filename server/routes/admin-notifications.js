const express = require("express");
const db = require("../database/database");
const { authenticateToken } = require("./auth");

const router = express.Router();

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

// Existing callers default to FINE. Cashier requests specify ?type=PAYMENT.
function requestedType(req, res) {
  const type = req.query.type === undefined ? "FINE" : req.query.type;

  if (type !== "FINE" && type !== "PAYMENT") {
    res.status(400).json({
      success: false,
      message: "Notification type must be FINE or PAYMENT.",
    });
    return null;
  }

  return type;
}

function unreadCount(userId, type) {
  return Number(
    db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM notifications
         WHERE user_id = ?
           AND notification_type = ?
           AND is_read = 0`,
      )
      .get(userId, type).count,
  );
}

router.get("/unread-count", (req, res) => {
  const type = requestedType(req, res);
  if (!type) return;

  try {
    return res.json({
      success: true,
      unreadCount: unreadCount(req.notificationUserId, type),
    });
  } catch (error) {
    console.error("Notification count error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load unread count.",
    });
  }
});

router.get("/", (req, res) => {
  const type = requestedType(req, res);
  if (!type) return;

  try {
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
    const offset =
      req.query.offset === undefined ? 0 : Number(req.query.offset);

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

    const userId = req.notificationUserId;

    const rows = db
      .prepare(
        `SELECT
           id,
           notification_type AS notificationType,
           title,
           message,
           related_fine_id AS fineId,
           related_payment_id AS paymentId,
           is_read AS isRead,
           created_at AS createdAt
         FROM notifications
         WHERE user_id = ?
           AND notification_type = ?
         ORDER BY created_at DESC, id DESC
         LIMIT ? OFFSET ?`,
      )
      .all(userId, type, limit + 1, offset);

    const hasMore = rows.length > limit;

    const notifications = rows.slice(0, limit).map((row) => ({
      ...row,
      isRead: Number(row.isRead) === 1,
    }));

    return res.json({
      success: true,
      notifications,
      unreadCount: unreadCount(userId, type),
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

router.patch("/read-all", (req, res) => {
  const type = requestedType(req, res);
  if (!type) return;

  try {
    const userId = req.notificationUserId;

    const result = db
      .prepare(
        `UPDATE notifications
         SET is_read = 1
         WHERE user_id = ?
           AND notification_type = ?
           AND is_read = 0`,
      )
      .run(userId, type);

    return res.json({
      success: true,
      updatedCount: Number(result.changes),
      unreadCount: unreadCount(userId, type),
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to mark notifications as read.",
    });
  }
});

// Called after a fine's details load: reads this Admin's FINE and PAYMENT
// notices for that fine and reports which ones existed.
router.patch("/fine/:fineId/read", (req, res) => {
  try {
    const fineId = Number(req.params.fineId);

    if (!Number.isSafeInteger(fineId) || fineId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid fine ID.",
      });
    }

    const userId = req.notificationUserId;
    const notices = { FINE: null, PAYMENT: null };

    const rows = db
      .prepare(
        `SELECT notification_type AS type, MIN(is_read) AS allRead
         FROM notifications
         WHERE user_id = ?
           AND related_fine_id = ?
           AND notification_type IN ('FINE', 'PAYMENT')
         GROUP BY notification_type`,
      )
      .all(userId, fineId);

    for (const row of rows) {
      notices[row.type] = { wasUnread: Number(row.allRead) === 0 };
    }

    db.prepare(
      `UPDATE notifications
       SET is_read = 1
       WHERE user_id = ?
         AND related_fine_id = ?
         AND notification_type IN ('FINE', 'PAYMENT')
         AND is_read = 0`,
    ).run(userId, fineId);

    return res.json({
      success: true,
      notices,
      unreadCount: {
        FINE: unreadCount(userId, "FINE"),
        PAYMENT: unreadCount(userId, "PAYMENT"),
      },
    });
  } catch (error) {
    console.error("Mark fine notifications read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to mark notifications as read.",
    });
  }
});

router.patch("/:id/read", (req, res) => {
  const type = requestedType(req, res);
  if (!type) return;

  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const userId = req.notificationUserId;

    const notification = db
      .prepare(
        `SELECT id
         FROM notifications
         WHERE id = ?
           AND user_id = ?
           AND notification_type = ?`,
      )
      .get(id, userId, type);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    db.prepare(
      `UPDATE notifications
       SET is_read = 1
       WHERE id = ?
         AND user_id = ?
         AND notification_type = ?
         AND is_read = 0`,
    ).run(id, userId, type);

    return res.json({
      success: true,
      unreadCount: unreadCount(userId, type),
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to mark notification as read.",
    });
  }
});

module.exports = router;
