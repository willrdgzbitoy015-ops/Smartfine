const express = require("express");

const db = require("../database/database");
const { authenticateToken } = require("./auth");

const router = express.Router();

const QR_PREFIX = "SMARTFINE_STUDENT:";

// GET /api/student-qr/me
// Student identity comes only from the verified JWT.
router.get("/me", authenticateToken, (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const userId = Number(req.authUser?.userId);
    const tokenRole = String(req.authUser?.role || "").toUpperCase();

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Your session is invalid. Please log in again.",
      });
    }

    if (tokenRole !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message: "A Student account is required.",
      });
    }

    const student = db
      .prepare(
        `
        SELECT
          id,
          username,
          first_name,
          middle_name,
          last_name,
          grade_level,
          section,
          role,
          account_status,
          COALESCE(student_number, username) AS student_id
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
      )
      .get(userId);

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Your account could not be found. Please log in again.",
      });
    }

    if (
      String(student.role || "").toUpperCase() !== "STUDENT" ||
      String(student.account_status || "").toUpperCase() !== "ACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message: "An active Student account is required.",
      });
    }

    // Matches the Student ID used by the existing Officer scanner.
    const studentId = String(student.student_id ?? "").trim();

    if (!studentId) {
      return res.status(409).json({
        success: false,
        message:
          "Your Student ID is unavailable. Please contact the administrator.",
      });
    }

    const fullName = [
      student.first_name,
      student.middle_name,
      student.last_name,
    ]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(" ");

    return res.json({
      success: true,
      student: {
        id: Number(student.id),
        studentId,
        fullName: fullName || student.username,
        gradeLevel: student.grade_level || "",
        section: student.section || "",
      },
      qrValue: `${QR_PREFIX}${studentId}`,
    });
  } catch (error) {
    console.error("Student QR error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your QR code. Please try again.",
    });
  }
});

module.exports = router;
