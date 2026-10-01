const express = require("express");
const db = require("../database/database");
const { authenticateToken } = require("./auth");

const router = express.Router();

db.exec(`
  CREATE TABLE IF NOT EXISTS student_fine_reads (
    student_id INTEGER NOT NULL,
    fine_id INTEGER NOT NULL,
    read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, fine_id)
  );
`);

router.post("/:id/read", authenticateToken, (req, res) => {
  try {
    const studentId = Number(req.authUser?.userId);
    const fineId = Number(req.params.id);

    if (!Number.isSafeInteger(studentId) || studentId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Please sign in again.",
      });
    }

    if (!Number.isSafeInteger(fineId) || fineId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid fine ID.",
      });
    }

    const student = db
      .prepare("SELECT role, account_status FROM users WHERE id = ?")
      .get(studentId);

    if (
      !student ||
      String(student.role).toUpperCase() !== "STUDENT" ||
      String(student.account_status).toUpperCase() !== "ACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message: "An active student account is required.",
      });
    }

    const fine = db
      .prepare(
        `
        SELECT id
        FROM fines
        WHERE id = ?
          AND student_id = ?
          AND cancelled_at IS NULL
          AND UPPER(COALESCE(fine_status, '')) <> 'CANCELLED'
      `,
      )
      .get(fineId, studentId);

    if (!fine) {
      return res.status(404).json({
        success: false,
        message: "Fine not found.",
      });
    }

    db.prepare(
      `
      INSERT INTO student_fine_reads (student_id, fine_id)
      VALUES (?, ?)
      ON CONFLICT(student_id, fine_id) DO NOTHING
    `,
    ).run(studentId, fineId);

    // Viewing the fine also reads its matching new-fine notification.
    db.prepare(
      `
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ?
        AND related_fine_id = ?
        AND notification_type = 'FINE'
        AND title = 'New Fine Issued'
        AND is_read = 0
    `,
    ).run(studentId, fineId);

    const read = db
      .prepare(
        `
        SELECT read_at AS readAt
        FROM student_fine_reads
        WHERE student_id = ? AND fine_id = ?
      `,
      )
      .get(studentId, fineId);

    return res.json({
      success: true,
      fineId,
      isRead: true,
      readAt: read.readAt,
    });
  } catch (error) {
    console.error("Mark fine as read failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update fine status.",
    });
  }
});

module.exports = router;
