const crypto = require("node:crypto");
const db = require("./database/database");

const apply = process.argv.includes("--apply");

function missingStudents() {
  const users = db
    .prepare(
      `
    SELECT
      u.id,
      u.username,
      u.student_number,
      u.grade_level,
      u.section
    FROM users AS u
    LEFT JOIN students AS s ON s.user_id = u.id
    WHERE u.role = 'STUDENT'
      AND s.id IS NULL
    ORDER BY u.id
  `,
    )
    .all();

  const existingNumbers = new Set(
    db
      .prepare("SELECT student_number FROM students")
      .all()
      .map((row) => row.student_number),
  );

  const candidates = [];

  for (const user of users) {
    const studentNumber = String(
      user.student_number || user.username || "",
    ).trim();

    if (!studentNumber) {
      throw new Error(
        `Student user ${user.id} has no student number or username.`,
      );
    }

    if (existingNumbers.has(studentNumber)) {
      throw new Error(
        `Student number ${studentNumber} already belongs to another student record. No rows were added.`,
      );
    }

    existingNumbers.add(studentNumber);
    candidates.push({ ...user, studentNumber });
  }

  return candidates;
}

try {
  if (!apply) {
    const candidates = missingStudents();

    console.log(`${candidates.length} student record(s) need to be linked:`);

    for (const student of candidates) {
      console.log(
        `  users.id=${student.id}, student_number=${student.studentNumber}`,
      );
    }

    console.log(
      "No database changes were made. Run with --apply to create these records.",
    );
  } else {
    db.exec("BEGIN IMMEDIATE");

    try {
      const candidates = missingStudents();

      const insert = db.prepare(`
        INSERT INTO students
          (user_id, student_number, grade_level, section, qr_token)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const student of candidates) {
        insert.run(
          student.id,
          student.studentNumber,
          student.grade_level || null,
          student.section || null,
          crypto.randomBytes(32).toString("hex"),
        );
      }

      db.exec("COMMIT");

      console.log(`Created ${candidates.length} linked student record(s).`);
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
} catch (error) {
  console.error("Student record repair stopped:", error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
