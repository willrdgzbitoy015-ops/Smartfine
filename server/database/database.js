const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const dbPath = path.join(__dirname, "smartfine.db");
const db = new DatabaseSync(dbPath);

db.exec("PRAGMA foreign_keys = ON;");

// SQLite runs this trigger as part of the fine INSERT.
// If the fine INSERT fails, no notification is created.
db.exec(`
  CREATE TRIGGER IF NOT EXISTS notify_admins_when_officer_records_fine
  AFTER INSERT ON fines
  WHEN EXISTS (
    SELECT 1
    FROM users
    WHERE id = NEW.recorded_by
      AND role = 'FINES_OFFICER'
  )
  BEGIN
    INSERT INTO notifications (
      user_id,
      notification_type,
      title,
      message,
      related_fine_id
    )
    SELECT
      admin.id,
      'FINE',
      'New Fine Recorded',
      TRIM(
        student.first_name || ' ' ||
        COALESCE(student.middle_name || ' ', '') ||
        student.last_name
      ) ||
      ' was issued ' ||
      violation.violation_name ||
      ' — ' ||
      printf('₱%.2f', NEW.amount_centavos / 100.0) ||
      ' by Officer ' ||
      TRIM(
        officer.first_name || ' ' ||
        COALESCE(officer.middle_name || ' ', '') ||
        officer.last_name
      ) ||
      '.',
      NEW.id
    FROM users AS admin
    JOIN users AS student
      ON student.id = NEW.student_id
    JOIN users AS officer
      ON officer.id = NEW.recorded_by
    JOIN violation_types AS violation
      ON violation.id = NEW.violation_type_id
    WHERE admin.role = 'ADMIN'
      AND admin.account_status = 'ACTIVE';
  END;
`);

console.log("Connected to SmartFine SQLite database.");

module.exports = db;
