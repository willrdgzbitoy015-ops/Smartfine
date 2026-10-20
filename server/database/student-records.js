// The `students` row behind each student account. Payments point at it
// (payments.student_id = students.id), so a student account without one cannot
// request a cash payment or pay with GCash.
const crypto = require("node:crypto");

const db = require("./database");

class StudentRecordError extends Error {
  constructor(message) {
    super(message);
    // Payment routes answer with error.status.
    this.status = 409;
    this.code = "STUDENT_RECORD_CONFLICT";
  }
}

// Returns the students.id for a student account, creating the row when the
// account has none, and keeps grade and section the same as the account.
// Returns null for an account that is not a student. Call it inside the
// caller's transaction so the account and its record are saved together.
function ensureStudentRecord(userId) {
  const user = db
    .prepare(
      `SELECT id, role, username, student_number, grade_level, section
       FROM users
       WHERE id = ?`,
    )
    .get(userId);

  if (!user || String(user.role).toUpperCase() !== "STUDENT") {
    return null;
  }

  const existing = db
    .prepare("SELECT id, grade_level, section FROM students WHERE user_id = ?")
    .get(userId);

  if (existing) {
    if (
      (existing.grade_level || null) !== (user.grade_level || null) ||
      (existing.section || null) !== (user.section || null)
    ) {
      db.prepare(
        `UPDATE students
         SET grade_level = ?, section = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      ).run(user.grade_level || null, user.section || null, existing.id);
    }

    return Number(existing.id);
  }

  const studentNumber = String(user.student_number || user.username || "").trim();

  if (!studentNumber) {
    throw new StudentRecordError("This student account has no Student ID.");
  }

  const taken = db
    .prepare("SELECT user_id FROM students WHERE student_number = ?")
    .get(studentNumber);

  if (taken) {
    throw new StudentRecordError(
      `Student ID ${studentNumber} already belongs to another student record.`,
    );
  }

  const result = db
    .prepare(
      `INSERT INTO students (user_id, student_number, grade_level, section, qr_token)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      userId,
      studentNumber,
      user.grade_level || null,
      user.section || null,
      crypto.randomBytes(32).toString("hex"),
    );

  return Number(result.lastInsertRowid);
}

module.exports = { StudentRecordError, ensureStudentRecord };
