const db = require("../database/database");

const studentId = Number(process.argv[2]);

if (!Number.isSafeInteger(studentId) || studentId <= 0) {
  const students = db
    .prepare(
      `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      COUNT(DISTINCT f.id) AS fine_count,
      COUNT(DISTINCT sfr.fine_id) AS read_count
    FROM users AS u
    LEFT JOIN fines AS f
      ON f.student_id = u.id
      AND f.cancelled_at IS NULL
      AND UPPER(COALESCE(f.fine_status, '')) <> 'CANCELLED'
    LEFT JOIN student_fine_reads AS sfr
      ON sfr.student_id = u.id
      AND sfr.fine_id = f.id
    WHERE UPPER(u.role) = 'STUDENT'
    GROUP BY u.id, u.first_name, u.last_name
    ORDER BY u.id
  `,
    )
    .all();

  console.table(students);
  console.log("Run again with the correct student ID:");
  console.log("node reset-student-fines-unread.js STUDENT_ID");
  process.exit(0);
}

const student = db
  .prepare(
    `
  SELECT id, first_name, last_name
  FROM users
  WHERE id = ? AND UPPER(role) = 'STUDENT'
`,
  )
  .get(studentId);

if (!student) {
  console.error("Student ID not found.");
  process.exit(1);
}

const result = db
  .prepare(
    `
  DELETE FROM student_fine_reads
  WHERE student_id = ?
`,
  )
  .run(studentId);

console.log(
  `${student.first_name} ${student.last_name}: ` +
    `${result.changes} read records removed. ` +
    "Those fines will now appear NEW.",
);
