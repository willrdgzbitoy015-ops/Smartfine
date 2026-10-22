const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const ExcelJS = require("exceljs");

const fs = require("fs");
const path = require("path");

const router = express.Router();

const db = require("../database/database");
const {
  StudentRecordError,
  ensureStudentRecord,
} = require("../database/student-records");
const { authenticateToken } = require("./auth");
const { requireActive } = require("../middleware/access");
const {
  changeText,
  describeChanges,
  logActivity,
} = require("../database/activity-log");

// A student account as people read it, for the activity log's before/after.
function studentAccountSnapshot(userId) {
  const user = db
    .prepare(
      `SELECT first_name, middle_name, last_name, username, email,
              contact_number, grade_level, section, account_status
       FROM users WHERE id = ?`,
    )
    .get(userId);

  if (!user) {
    return null;
  }

  return {
    name: [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" "),
    username: user.username || "",
    email: user.email || "",
    contact: user.contact_number || "",
    grade: user.grade_level || "",
    section: user.section || "",
    status: user.account_status || "",
  };
}

const STUDENT_FIELDS = {
  name: "name",
  username: "username",
  email: "email",
  contact: "contact number",
  grade: "grade",
  section: "section",
  status: "status",
};

console.log("students.js loaded");

// ==========================================
// ARCHIVED STUDENT MARKER
// ==========================================

const ARCHIVED_USERNAME_PREFIX = "__archived_student_";

function isArchivedUsername(username) {
  return String(username || "").startsWith(ARCHIVED_USERNAME_PREFIX);
}

// ==========================================
// BULK IMPORT DEFAULT PASSWORD
// ==========================================

const DEFAULT_STUDENT_PASSWORD = "Smartfine@2026";

// ==========================================
// ALLOWED GRADE LEVELS
// ==========================================

const ALLOWED_GRADE_LEVELS = [
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

// ==========================================
// ADMIN ONLY
// ==========================================

function requireAdmin(req, res, next) {
  const role = String(req.authUser?.role || "")
    .trim()
    .toUpperCase();

  if (role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      code: "ADMIN_REQUIRED",
      message: "Only an administrator can perform this action.",
    });
  }

  next();
}

// ==========================================
// SAFE EXPORT FILENAME
// ==========================================

function makeSafeExportFileName(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// ==========================================
// IMPORT TEMPLATE / FILE HELPERS
// ==========================================

function normalizeImportHeader(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function parseImportClassInformation(value) {
  const className = String(value || "")
    .trim()
    .replace(/^Class:\s*/i, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ");

  const match = className.match(/^Grade\s+(7|8|9|10|11|12)\s*-\s*(.+)$/i);

  if (!match) {
    throw new Error(
      'Invalid class format. Expected something like "Grade 8 - Ponkan" or "Grade 12 - TVL ICT - Pagatpat".',
    );
  }

  const gradeLevel = `Grade ${match[1]}`;

  const classPart = String(match[2] || "").trim();

  if (!classPart) {
    throw new Error("The student file does not contain a Section.");
  }

  if (gradeLevel === "Grade 11" || gradeLevel === "Grade 12") {
    const strandMatch = classPart.match(/^(STEM|ABM|TVL)\b\s*(.*)$/i);

    if (!strandMatch) {
      throw new Error(
        `${gradeLevel} must include a valid Strand: STEM, ABM, or TVL.`,
      );
    }

    const strand = String(strandMatch[1]).toUpperCase();

    const section = String(strandMatch[2] || "")
      .replace(/^\s*-\s*/, "")
      .trim();

    if (!section) {
      throw new Error(`${gradeLevel} must include a Section after the Strand.`);
    }

    return {
      gradeLevel,
      strand,
      section,
      databaseSection: `${strand} ${section}`.trim(),
      displayName: `${gradeLevel} - ${strand} ${section}`.trim(),
    };
  }

  return {
    gradeLevel,
    strand: "",
    section: classPart,
    databaseSection: classPart,
    displayName: `${gradeLevel} - ${classPart}`,
  };
}

function parseCsvRows(text) {
  const rows = [];

  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '"') {
      if (insideQuotes && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (character === "," && !insideQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }

      row.push(cell.trim());

      const containsValue = row.some(
        (value) => String(value || "").trim() !== "",
      );

      if (containsValue) {
        rows.push(row);
      }

      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());

    const containsValue = row.some(
      (value) => String(value || "").trim() !== "",
    );

    if (containsValue) {
      rows.push(row);
    }
  }

  return rows;
}

function findImportColumns(headers) {
  const normalizedHeaders = headers.map(normalizeImportHeader);

  function findColumn(aliases) {
    for (const alias of aliases) {
      const index = normalizedHeaders.indexOf(alias);

      if (index >= 0) {
        return index;
      }
    }

    return -1;
  }

  const columns = {
    studentNumber: findColumn([
      "student_id",
      "student_id_number",
      "student_number",
    ]),

    firstName: findColumn(["first_name"]),

    middleName: findColumn(["middle_name"]),

    lastName: findColumn(["last_name"]),

    email: findColumn(["email"]),

    contactNumber: findColumn([
      "contact_number",
      "contact_no",
      "phone",
      "phone_number",
    ]),
  };

  const missing = [];

  if (columns.studentNumber < 0) {
    missing.push("Student ID");
  }

  if (columns.firstName < 0) {
    missing.push("First Name");
  }

  if (columns.middleName < 0) {
    missing.push("Middle Name");
  }

  if (columns.lastName < 0) {
    missing.push("Last Name");
  }

  if (columns.email < 0) {
    missing.push("Email");
  }

  if (columns.contactNumber < 0) {
    missing.push("Contact Number");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required student file column(s): ${missing.join(", ")}.`,
    );
  }

  return columns;
}

function getExcelCellText(cell) {
  if (!cell) {
    return "";
  }

  const text = String(cell.text ?? "").trim();

  if (text) {
    return text;
  }

  if (cell.value === null || cell.value === undefined) {
    return "";
  }

  if (typeof cell.value === "object") {
    if (cell.value.text) {
      return String(cell.value.text).trim();
    }

    if (Array.isArray(cell.value.richText)) {
      return cell.value.richText
        .map((part) => String(part.text || ""))
        .join("")
        .trim();
    }

    if (cell.value.result !== undefined) {
      return String(cell.value.result).trim();
    }
  }

  return String(cell.value).trim();
}

function parseCsvStudentImport(buffer) {
  const rawText = buffer.toString("utf8").replace(/^\uFEFF/, "");

  const rows = parseCsvRows(rawText);

  if (rows.length < 3) {
    throw new Error(
      "Invalid CSV format. Please use the official SmartFine student template.",
    );
  }

  let className = "";

  const firstLabel = String(rows[0]?.[0] || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (
    firstLabel === "grade and section:" ||
    firstLabel === "grade and section"
  ) {
    className = String(rows[0]?.[1] || "").trim();
  } else {
    for (const row of rows.slice(0, 10)) {
      for (const value of row) {
        const text = String(value || "").trim();

        if (/^Class:\s*Grade\s+/i.test(text)) {
          className = text.replace(/^Class:\s*/i, "").trim();
          break;
        }
      }

      if (className) {
        break;
      }
    }
  }

  if (!className) {
    throw new Error(
      "The CSV does not contain valid Grade and Section information.",
    );
  }

  const parsedClass = parseImportClassInformation(className);

  let headerRowIndex = -1;
  let columns = null;

  for (let index = 0; index < Math.min(rows.length, 20); index += 1) {
    try {
      const candidateColumns = findImportColumns(rows[index]);

      headerRowIndex = index;
      columns = candidateColumns;
      break;
    } catch (error) {
      // Keep searching.
    }
  }

  if (headerRowIndex < 0 || !columns) {
    throw new Error(
      "Could not find the SmartFine student column headings in the CSV.",
    );
  }

  const students = [];

  for (let index = headerRowIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];

    const getValue = (columnIndex) => {
      if (columnIndex < 0) {
        return "";
      }

      return String(row[columnIndex] || "").trim();
    };

    const studentNumber = getValue(columns.studentNumber);

    const firstName = getValue(columns.firstName);

    const middleName = getValue(columns.middleName);

    const lastName = getValue(columns.lastName);

    const email = getValue(columns.email).toLowerCase();

    const contactNumber = normalizeImportContactNumber(
      getValue(columns.contactNumber),
    );

    const hasAnyValue = [
      studentNumber,
      firstName,
      middleName,
      lastName,
      email,
      contactNumber,
    ].some((value) => String(value || "").trim() !== "");

    if (!hasAnyValue) {
      continue;
    }

    if (studentNumber.toUpperCase() === "EXAMPLE") {
      continue;
    }

    students.push({
      rowNumber: index + 1,
      studentNumber,
      firstName,
      middleName,
      lastName,
      email,
      contactNumber,
    });
  }

  if (students.length === 0) {
    throw new Error("The CSV does not contain any real student records.");
  }

  return {
    fileType: "CSV",
    class: parsedClass,
    students,
  };
}

async function parseExcelStudentImport(buffer) {
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("The Excel file does not contain a worksheet.");
  }

  let className = "";

  for (
    let rowNumber = 1;
    rowNumber <= Math.min(worksheet.rowCount, 15);
    rowNumber += 1
  ) {
    const row = worksheet.getRow(rowNumber);

    for (
      let columnNumber = 1;
      columnNumber <= Math.max(row.cellCount, 6);
      columnNumber += 1
    ) {
      const text = getExcelCellText(row.getCell(columnNumber));

      if (/^Class:\s*Grade\s+/i.test(text)) {
        className = text.replace(/^Class:\s*/i, "").trim();
        break;
      }

      if (/^(Grade and section:|Grade and section)$/i.test(text)) {
        const nextCellText = getExcelCellText(row.getCell(columnNumber + 1));

        if (nextCellText) {
          className = nextCellText;
          break;
        }
      }
    }

    if (className) {
      break;
    }
  }

  if (!className) {
    throw new Error(
      "The Excel file does not contain valid Grade and Section information.",
    );
  }

  const parsedClass = parseImportClassInformation(className);

  let headerRowNumber = -1;
  let columns = null;

  for (
    let rowNumber = 1;
    rowNumber <= Math.min(worksheet.rowCount, 25);
    rowNumber += 1
  ) {
    const row = worksheet.getRow(rowNumber);

    const values = [];

    for (
      let columnNumber = 1;
      columnNumber <= Math.max(row.cellCount, 6);
      columnNumber += 1
    ) {
      values.push(getExcelCellText(row.getCell(columnNumber)));
    }

    try {
      const candidateColumns = findImportColumns(values);

      headerRowNumber = rowNumber;
      columns = candidateColumns;
      break;
    } catch (error) {
      // Keep searching.
    }
  }

  if (headerRowNumber < 0 || !columns) {
    throw new Error(
      "Could not find the SmartFine student column headings in the Excel file.",
    );
  }

  const students = [];

  for (
    let rowNumber = headerRowNumber + 1;
    rowNumber <= worksheet.rowCount;
    rowNumber += 1
  ) {
    const row = worksheet.getRow(rowNumber);

    const getValue = (zeroBasedColumnIndex) =>
      getExcelCellText(row.getCell(zeroBasedColumnIndex + 1));

    const studentNumber = getValue(columns.studentNumber);

    const firstName = getValue(columns.firstName);

    const middleName = getValue(columns.middleName);

    const lastName = getValue(columns.lastName);

    const email = getValue(columns.email).toLowerCase();

    const contactNumber = normalizeImportContactNumber(
      getValue(columns.contactNumber),
    );

    const hasAnyValue = [
      studentNumber,
      firstName,
      middleName,
      lastName,
      email,
      contactNumber,
    ].some((value) => String(value || "").trim() !== "");

    if (!hasAnyValue) {
      continue;
    }

    if (studentNumber.toUpperCase() === "EXAMPLE") {
      continue;
    }

    students.push({
      rowNumber,
      studentNumber,
      firstName,
      middleName,
      lastName,
      email,
      contactNumber,
    });
  }

  if (students.length === 0) {
    throw new Error(
      "The Excel file does not contain any real student records.",
    );
  }

  return {
    fileType: "XLSX",
    class: parsedClass,
    students,
  };
}

// ==========================================
// PROFILE PICTURE DIRECTORY
// ==========================================

const studentProfileUploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "student-profiles",
);

if (!fs.existsSync(studentProfileUploadDirectory)) {
  fs.mkdirSync(studentProfileUploadDirectory, {
    recursive: true,
  });
}

// ==========================================
// MULTER STORAGE
// ==========================================

const profilePictureStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, studentProfileUploadDirectory);
  },

  filename: (req, file, callback) => {
    const studentId = String(req.params.id || "student");

    const extension = getImageExtension(file);

    const filename = `student-${studentId}-${Date.now()}${extension}`;

    callback(null, filename);
  },
});

// ==========================================
// IMAGE FILTER
// ==========================================

function profilePictureFilter(req, file, callback) {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true);
    return;
  }

  callback(new Error("Only JPG, JPEG, PNG, and WEBP images are allowed."));
}

// ==========================================
// PROFILE PICTURE UPLOAD
// ==========================================

const uploadProfilePicture = multer({
  storage: profilePictureStorage,

  fileFilter: profilePictureFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ==========================================
// STUDENT IMPORT FILE UPLOAD
//
// Used for previewing SmartFine .xlsx / .csv
// teacher files before the existing bulk
// import route creates accounts.
// ==========================================

function studentImportFileFilter(req, file, callback) {
  const extension = path.extname(file.originalname || "").toLowerCase();

  const allowedExtensions = [".xlsx", ".csv"];

  if (allowedExtensions.includes(extension)) {
    callback(null, true);
    return;
  }

  callback(
    new Error(
      "Only SmartFine Excel (.xlsx) and CSV (.csv) student files are allowed.",
    ),
  );
}

const uploadStudentImportFile = multer({
  storage: multer.memoryStorage(),

  fileFilter: studentImportFileFilter,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// ==========================================
// GET IMAGE EXTENSION
// ==========================================

function getImageExtension(file) {
  const originalExtension = path.extname(file.originalname || "").toLowerCase();

  if (
    originalExtension === ".jpg" ||
    originalExtension === ".jpeg" ||
    originalExtension === ".png" ||
    originalExtension === ".webp"
  ) {
    return originalExtension;
  }

  switch (file.mimetype) {
    case "image/png":
      return ".png";

    case "image/webp":
      return ".webp";

    default:
      return ".jpg";
  }
}

// ==========================================
// DELETE PROFILE PICTURE FILE
// ==========================================

function deleteProfilePictureFile(profilePictureUri) {
  try {
    if (!profilePictureUri) {
      return;
    }

    const filename = path.basename(profilePictureUri);

    const absolutePath = path.join(studentProfileUploadDirectory, filename);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    console.error("Delete profile picture file error:", error);
  }
}

// ==========================================
// GENERATE NEXT STUDENT ID
// ==========================================

function generateNextStudentId() {
  const currentYear = new Date().getFullYear();

  const latestStudent = db
    .prepare(
      `
      SELECT
        student_number
      FROM users
      WHERE
        role = 'STUDENT'
        AND student_number LIKE ?
      ORDER BY student_number DESC
      LIMIT 1
      `,
    )
    .get(`${currentYear}-%`);

  if (!latestStudent || !latestStudent.student_number) {
    return `${currentYear}-0001`;
  }

  const parts = String(latestStudent.student_number).split("-");

  const lastNumber = Number(parts[1]) || 0;

  const nextNumber = lastNumber + 1;

  return `${currentYear}-${String(nextNumber).padStart(4, "0")}`;
}

// ==========================================
// STUDENT USERNAME HELPERS
//
// Will Rodriguez -> willrodriguez
//
// Duplicate:
// willrodriguez2
// willrodriguez3
// ==========================================

function normalizeUsernamePart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function generateSuggestedUsername(firstName, lastName) {
  const cleanFirstName = normalizeUsernamePart(firstName);

  const cleanLastName = normalizeUsernamePart(lastName);

  if (!cleanFirstName || !cleanLastName) {
    return "";
  }

  return `${cleanFirstName}${cleanLastName}`;
}

// ==========================================
// CHECK USERNAME AGAINST ALL USERS
// ==========================================

function usernameExists(username, excludeUserId = null) {
  if (!username) {
    return false;
  }

  if (Number.isInteger(Number(excludeUserId)) && Number(excludeUserId) > 0) {
    return Boolean(
      db
        .prepare(
          `
          SELECT id
          FROM users
          WHERE
            LOWER(username) = LOWER(?)
            AND id != ?
          LIMIT 1
          `,
        )
        .get(username, Number(excludeUserId)),
    );
  }

  return Boolean(
    db
      .prepare(
        `
        SELECT id
        FROM users
        WHERE
          LOWER(username) = LOWER(?)
        LIMIT 1
        `,
      )
      .get(username),
  );
}

// ==========================================
// GENERATE UNIQUE STUDENT USERNAME
// ==========================================

function generateUniqueStudentUsername(
  firstName,
  lastName,
  reservedUsernames = new Set(),
  excludeUserId = null,
) {
  let baseUsername = generateSuggestedUsername(firstName, lastName);

  if (!baseUsername) {
    const fallbackId =
      Number.isInteger(Number(excludeUserId)) && Number(excludeUserId) > 0
        ? Number(excludeUserId)
        : Date.now();

    baseUsername = `student${fallbackId}`;
  }

  let candidate = baseUsername;

  let suffix = 2;

  while (
    reservedUsernames.has(candidate.toLowerCase()) ||
    usernameExists(candidate, excludeUserId)
  ) {
    candidate = `${baseUsername}${suffix}`;

    suffix += 1;
  }

  reservedUsernames.add(candidate.toLowerCase());

  return candidate;
}

// ==========================================
// MIGRATE OLD NUMERIC USERNAMES
// ==========================================

function migrateLegacyStudentUsernames(gradeLevel, section) {
  const normalizedGradeLevel = String(gradeLevel || "").trim();

  const normalizedSection = String(section || "").trim();

  if (!normalizedGradeLevel || !normalizedSection) {
    return [];
  }

  const legacyStudents = db
    .prepare(
      `
      SELECT
        id,
        student_number,
        username,
        first_name,
        last_name
      FROM users
      WHERE
        role = 'STUDENT'
        AND username NOT LIKE
          '__archived_student_%'
        AND TRIM(grade_level) = ?
        AND LOWER(TRIM(section))
          = LOWER(TRIM(?))
        AND LOWER(
          TRIM(
            COALESCE(username, '')
          )
        )
          =
        LOWER(
          TRIM(
            COALESCE(
              student_number,
              ''
            )
          )
        )
      ORDER BY id ASC
      `,
    )
    .all(normalizedGradeLevel, normalizedSection);

  if (legacyStudents.length === 0) {
    return [];
  }

  const migrated = [];

  const reservedUsernames = new Set();

  try {
    db.exec("BEGIN TRANSACTION;");

    for (const student of legacyStudents) {
      const newUsername = generateUniqueStudentUsername(
        student.first_name,
        student.last_name,
        reservedUsernames,
        student.id,
      );

      db.prepare(
        `
        UPDATE users
        SET
          username = ?,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE
          id = ?
          AND role = 'STUDENT'
        `,
      ).run(newUsername, student.id);

      migrated.push({
        id: student.id,

        studentNumber: student.student_number,

        oldUsername: student.username,

        username: newUsername,
      });
    }

    db.exec("COMMIT;");
  } catch (error) {
    try {
      db.exec("ROLLBACK;");
    } catch (rollbackError) {
      console.error(
        "Legacy student username migration rollback error:",
        rollbackError,
      );
    }

    throw error;
  }

  return migrated;
}

// ==========================================
// FORMAT FULL NAME
// ==========================================

function formatName(firstName, middleName, lastName) {
  return [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
}

// ==========================================
// NORMALIZE IMPORT CONTACT NUMBER
// ==========================================

function normalizeImportContactNumber(value) {
  return String(value || "")
    .trim()
    .replace(/^'+/, "")
    .replace(/[\s()+-]/g, "");
}

// ==========================================
// SCIENTIFIC NOTATION CHECK
// ==========================================

function isScientificNotation(value) {
  return /^[+-]?(?:\d+\.?\d*|\.\d+)[eE][+-]?\d+$/.test(
    String(value || "").trim(),
  );
}

// ==========================================
// PASSWORD POLICY
// ==========================================

function validatePasswordPolicy(password) {
  const value = String(password || "");

  if (value.length < 8) {
    return {
      valid: false,
      code: "PASSWORD_TOO_SHORT",
      message: "Password must contain at least 8 characters.",
    };
  }

  if (!/[a-z]/.test(value)) {
    return {
      valid: false,
      code: "PASSWORD_LOWERCASE_REQUIRED",
      message: "Password must contain at least one lowercase letter.",
    };
  }

  if (!/[A-Z]/.test(value)) {
    return {
      valid: false,
      code: "PASSWORD_UPPERCASE_REQUIRED",
      message: "Password must contain at least one uppercase letter.",
    };
  }

  if (!/[0-9]/.test(value)) {
    return {
      valid: false,
      code: "PASSWORD_NUMBER_REQUIRED",
      message: "Password must contain at least one number.",
    };
  }

  if (!/[^A-Za-z0-9\s]/.test(value)) {
    return {
      valid: false,
      code: "PASSWORD_SPECIAL_CHARACTER_REQUIRED",
      message: "Password must contain at least one special character.",
    };
  }

  return {
    valid: true,
  };
}

// ==========================================
// GET NEXT STUDENT ID
// ==========================================

router.get("/next-id", requireActive("ADMIN"), (req, res) => {
  try {
    const studentId = generateNextStudentId();

    return res.json({
      success: true,
      studentId,
    });
  } catch (error) {
    console.error("Generate Student ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate Student ID.",
      error: error.message,
    });
  }
});

// ==========================================
// GET ALL STUDENTS
// ==========================================

router.get("/", requireActive("ADMIN", "FINES_OFFICER"), (req, res) => {
  try {
    const students = db
      .prepare(
        `
        SELECT
          u.id,

          COALESCE(
            u.student_number,
            u.username
          ) AS student_id,

          u.username,

          u.first_name,
          u.middle_name,
          u.last_name,

          TRIM(
            u.first_name || ' ' ||
            COALESCE(
              u.middle_name || ' ',
              ''
            ) ||
            u.last_name
          ) AS full_name,

          u.email,
          u.contact_number,

          u.grade_level,
          u.section,

          u.account_status,

          u.profile_picture_uri,

          COALESCE(
            SUM(
              CASE
                WHEN
                  f.id IS NOT NULL
                  AND f.cancelled_at IS NULL
                  AND UPPER(
                    COALESCE(
                      f.fine_status,
                      'UNPAID'
                    )
                  ) != 'CANCELLED'
                THEN f.amount_centavos
                ELSE 0
              END
            ),
            0
          ) / 100.0
            AS total_fines,

          COALESCE(
            SUM(
              CASE
                WHEN
                  f.id IS NOT NULL
                  AND f.cancelled_at IS NULL
                  AND f.paid_at IS NULL
                  AND UPPER(
                    COALESCE(
                      f.fine_status,
                      'UNPAID'
                    )
                  )
                  NOT IN (
                    'PAID',
                    'CANCELLED',
                    'WAIVED'
                  )
                THEN f.amount_centavos
                ELSE 0
              END
            ),
            0
          ) / 100.0
            AS outstanding_balance

        FROM users u

        LEFT JOIN fines f
          ON f.student_id =
            u.id

        WHERE
          u.role = 'STUDENT'
          AND
          u.username NOT LIKE
            '__archived_student_%'

        GROUP BY
          u.id,
          u.student_number,
          u.username,
          u.first_name,
          u.middle_name,
          u.last_name,
          u.email,
          u.contact_number,
          u.grade_level,
          u.section,
          u.account_status,
          u.profile_picture_uri

        ORDER BY
          u.last_name ASC,
          u.first_name ASC
        `,
      )
      .all();

    return res.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error("Load students error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load students.",
      error: error.message,
    });
  }
});

// ==========================================
// DOWNLOAD STYLED STUDENT IMPORT TEMPLATE
//
// GET /api/students/import-template
// ==========================================

router.get(
  "/import-template",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const gradeLevel = String(req.query.gradeLevel || "").trim();

      const section = String(req.query.section || "").trim();

      if (!gradeLevel || !section) {
        return res.status(400).json({
          success: false,
          code: "IMPORT_TEMPLATE_CLASS_REQUIRED",
          message:
            "Please select both Grade Level and Section before downloading the template.",
        });
      }

      if (!ALLOWED_GRADE_LEVELS.includes(gradeLevel)) {
        return res.status(400).json({
          success: false,
          code: "INVALID_GRADE_LEVEL",
          message: "Grade Level must be Grade 7 through Grade 12.",
        });
      }

      const className = `${gradeLevel} - ${section}`;

      const workbook = new ExcelJS.Workbook();

      workbook.creator = "SmartFine";

      workbook.lastModifiedBy = "SmartFine";

      workbook.created = new Date();

      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet("Student Import", {
        views: [
          {
            state: "frozen",
            ySplit: 7,
          },
        ],
      });

      // ====================================
      // COLUMN WIDTHS
      // ====================================

      worksheet.columns = [
        {
          key: "studentId",
          width: 20,
        },

        {
          key: "firstName",
          width: 22,
        },

        {
          key: "middleName",
          width: 22,
        },

        {
          key: "lastName",
          width: 24,
        },

        {
          key: "email",
          width: 36,
        },

        {
          key: "contactNumber",
          width: 22,
        },
      ];

      // ====================================
      // TITLE
      // ====================================

      worksheet.mergeCells("A1:F1");

      const titleCell = worksheet.getCell("A1");

      titleCell.value = "SMARTFINE STUDENT IMPORT TEMPLATE";

      titleCell.font = {
        bold: true,
        size: 18,
        color: {
          argb: "FFFFFFFF",
        },
      };

      titleCell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "FF173A73",
        },
      };

      worksheet.getRow(1).height = 30;

      // ====================================
      // CLASS
      // ====================================

      worksheet.mergeCells("A2:F2");

      const classCell = worksheet.getCell("A2");

      classCell.value = `Class: ${className}`;

      classCell.font = {
        bold: true,
        size: 12,
        color: {
          argb: "FF123266",
        },
      };

      classCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      worksheet.getRow(2).height = 22;

      // ====================================
      // TEACHER NOTICE
      // ====================================

      worksheet.mergeCells("A3:F3");

      const noticeCell = worksheet.getCell("A3");

      noticeCell.value =
        "For completion by the assigned teacher only. Do not change the class information or column headings.";

      noticeCell.font = {
        italic: true,
        size: 10,
        color: {
          argb: "FFD32F2F",
        },
      };

      noticeCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      worksheet.getRow(3).height = 24;

      // ====================================
      // USERNAME RULE
      // ====================================

      worksheet.mergeCells("A4:F4");

      const usernameRuleCell = worksheet.getCell("A4");

      usernameRuleCell.value =
        "SmartFine automatically creates the login Username from First Name + Last Name in lowercase without spaces. Duplicate names receive a number suffix.";

      usernameRuleCell.font = {
        size: 10,
        color: {
          argb: "FF52647A",
        },
      };

      usernameRuleCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      worksheet.getRow(4).height = 30;

      // ====================================
      // REQUIRED FIELDS NOTE
      // ====================================

      worksheet.mergeCells("A5:F5");

      const requiredFieldsCell = worksheet.getCell("A5");

      requiredFieldsCell.value =
        "Required: Student ID, First Name, Last Name, Email, and Contact Number. Middle Name is optional. Enter real students beginning on Row 9.";

      requiredFieldsCell.font = {
        italic: true,
        size: 9,
        color: {
          argb: "FF7A7F87",
        },
      };

      requiredFieldsCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      worksheet.getRow(5).height = 28;

      // ====================================
      // SPACING
      // ====================================

      worksheet.getRow(6).height = 8;

      // ====================================
      // TABLE HEADER
      // ====================================

      const headerRow = worksheet.getRow(7);

      const headers = [
        "Student ID",
        "First Name",
        "Middle Name",
        "Last Name",
        "Email",
        "Contact Number",
      ];

      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);

        cell.value = header;

        cell.font = {
          bold: true,
          color: {
            argb: "FFFFFFFF",
          },
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FF173A73",
          },
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };

        cell.border = {
          top: {
            style: "thin",
            color: {
              argb: "FFD8DEE8",
            },
          },

          left: {
            style: "thin",
            color: {
              argb: "FFD8DEE8",
            },
          },

          bottom: {
            style: "thin",
            color: {
              argb: "FFD8DEE8",
            },
          },

          right: {
            style: "thin",
            color: {
              argb: "FFD8DEE8",
            },
          },
        };
      });

      headerRow.height = 26;

      // ====================================
      // EXAMPLE ROW
      // ====================================

      const exampleRow = worksheet.getRow(8);

      exampleRow.values = [
        "EXAMPLE",
        "Juan",
        "Santos",
        "Dela Cruz",
        "juan@example.com",
        "09XXXXXXXXX",
      ];

      exampleRow.height = 28;

      exampleRow.eachCell((cell, columnNumber) => {
        cell.font = {
          italic: true,
          color: {
            argb: "FF7A5A00",
          },
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FFFFF4E5",
          },
        };

        cell.alignment = {
          vertical: "middle",

          horizontal:
            columnNumber === 1 || columnNumber === 6 ? "center" : "left",

          wrapText: true,
        };

        cell.border = {
          top: {
            style: "thin",
            color: {
              argb: "FFE3E7ED",
            },
          },

          left: {
            style: "thin",
            color: {
              argb: "FFE3E7ED",
            },
          },

          bottom: {
            style: "thin",
            color: {
              argb: "FFE3E7ED",
            },
          },

          right: {
            style: "thin",
            color: {
              argb: "FFE3E7ED",
            },
          },
        };
      });

      // ====================================
      // EMPTY TEACHER ENTRY ROWS
      // ====================================

      for (let rowNumber = 9; rowNumber <= 108; rowNumber += 1) {
        const row = worksheet.getRow(rowNumber);

        row.values = ["", "", "", "", "", ""];

        row.height = 24;

        row.eachCell(
          {
            includeEmpty: true,
          },
          (cell, columnNumber) => {
            cell.alignment = {
              vertical: "middle",

              horizontal:
                columnNumber === 1 || columnNumber === 6 ? "center" : "left",

              wrapText: false,
            };

            cell.border = {
              top: {
                style: "thin",
                color: {
                  argb: "FFE3E7ED",
                },
              },

              left: {
                style: "thin",
                color: {
                  argb: "FFE3E7ED",
                },
              },

              bottom: {
                style: "thin",
                color: {
                  argb: "FFE3E7ED",
                },
              },

              right: {
                style: "thin",
                color: {
                  argb: "FFE3E7ED",
                },
              },
            };

            if ((rowNumber - 9) % 2 === 1) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                  argb: "FFF7F9FC",
                },
              };
            }
          },
        );
      }

      // ====================================
      // STUDENT ID / PHONE AS TEXT
      // ====================================

      for (let rowNumber = 8; rowNumber <= 108; rowNumber += 1) {
        worksheet.getCell(`A${rowNumber}`).numFmt = "@";

        worksheet.getCell(`F${rowNumber}`).numFmt = "@";
      }

      // ====================================
      // FILTER
      // ====================================

      worksheet.autoFilter = {
        from: "A7",
        to: "F7",
      };

      // ====================================
      // PRINT SETTINGS
      // ====================================

      worksheet.pageSetup = {
        orientation: "landscape",

        fitToPage: true,

        fitToWidth: 1,

        fitToHeight: 0,

        paperSize: 9,

        margins: {
          left: 0.25,

          right: 0.25,

          top: 0.5,

          bottom: 0.5,

          header: 0.2,

          footer: 0.2,
        },
      };

      worksheet.headerFooter.oddFooter =
        "&CSmartFine Student Import Template - Teacher Copy";

      const workbookBuffer = await workbook.xlsx.writeBuffer();

      const safeGrade = makeSafeExportFileName(gradeLevel);

      const safeSection = makeSafeExportFileName(section);

      const fileName = `SmartFine_${safeGrade}_${safeSection}_Student_Import_Template.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );

      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private",
      );

      res.setHeader("Pragma", "no-cache");

      return res.send(Buffer.from(workbookBuffer));
    } catch (error) {
      console.error("Download student import template error:", error);

      return res.status(500).json({
        success: false,

        code: "STUDENT_IMPORT_TEMPLATE_ERROR",

        message: "Failed to create the SmartFine student import template.",

        error: error.message,
      });
    }
  },
);

// ==========================================
// PARSE STUDENT IMPORT FILE
//
// POST /api/students/parse-import-file
//
// multipart/form-data:
//
// studentFile = .xlsx or .csv
//
// Reads file only.
// Does NOT create student accounts.
// ==========================================

router.post(
  "/parse-import-file",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    uploadStudentImportFile.single("studentFile")(
      req,
      res,
      async (uploadError) => {
        if (uploadError) {
          console.error("Student import file upload error:", uploadError);

          let message =
            uploadError.message || "Failed to upload the student import file.";

          if (uploadError.code === "LIMIT_FILE_SIZE") {
            message = "The student import file must not exceed 10 MB.";
          }

          return res.status(400).json({
            success: false,

            code: "STUDENT_IMPORT_FILE_UPLOAD_ERROR",

            message,
          });
        }

        try {
          if (!req.file || !req.file.buffer) {
            return res.status(400).json({
              success: false,

              code: "STUDENT_IMPORT_FILE_REQUIRED",

              message:
                "Please choose a SmartFine Excel (.xlsx) or CSV (.csv) student file.",
            });
          }

          const extension = path
            .extname(req.file.originalname || "")
            .toLowerCase();

          let parsed;

          if (extension === ".xlsx") {
            parsed = await parseExcelStudentImport(req.file.buffer);
          } else if (extension === ".csv") {
            parsed = parseCsvStudentImport(req.file.buffer);
          } else {
            return res.status(400).json({
              success: false,

              code: "UNSUPPORTED_STUDENT_IMPORT_FILE",

              message:
                "Only SmartFine Excel (.xlsx) and CSV (.csv) student files are supported.",
            });
          }

          return res.json({
            success: true,

            code: "STUDENT_IMPORT_FILE_PARSED",

            message: `${parsed.students.length} student record${
              parsed.students.length === 1 ? "" : "s"
            } found in the file.`,

            file: {
              name: req.file.originalname,

              type: parsed.fileType,
            },

            class: parsed.class,

            studentCount: parsed.students.length,

            students: parsed.students,
          });
        } catch (error) {
          console.error("Parse student import file error:", error);

          return res.status(400).json({
            success: false,

            code: "STUDENT_IMPORT_FILE_PARSE_ERROR",

            message:
              error.message ||
              "Failed to read the SmartFine student import file.",
          });
        }
      },
    );
  },
);

// ==========================================
// MIGRATE LEGACY USERNAMES
// ==========================================

router.post(
  "/migrate-usernames",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    try {
      const gradeLevel = String(req.body?.gradeLevel || "").trim();

      const section = String(req.body?.section || "").trim();

      if (!gradeLevel || !section) {
        return res.status(400).json({
          success: false,
          code: "MIGRATION_CLASS_REQUIRED",
          message: "Please select both Grade Level and Section.",
        });
      }

      if (!ALLOWED_GRADE_LEVELS.includes(gradeLevel)) {
        return res.status(400).json({
          success: false,
          code: "INVALID_GRADE_LEVEL",
          message: "Grade Level must be Grade 7 through Grade 12.",
        });
      }

      const migrated = migrateLegacyStudentUsernames(gradeLevel, section);

      return res.json({
        success: true,

        code: "STUDENT_USERNAMES_MIGRATED",

        message:
          migrated.length > 0
            ? `${migrated.length} legacy student username${
                migrated.length === 1 ? "" : "s"
              } updated successfully.`
            : "No legacy student usernames needed updating.",

        migratedCount: migrated.length,

        students: migrated,
      });
    } catch (error) {
      console.error("Migrate student usernames error:", error);

      return res.status(500).json({
        success: false,

        code: "MIGRATE_STUDENT_USERNAMES_ERROR",

        message: "Failed to update legacy student usernames.",

        error: error.message,
      });
    }
  },
);

// ==========================================
// EXPORT STUDENT ACCOUNT SHEET
// ==========================================

router.get(
  "/export-accounts",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const gradeLevel = String(req.query.gradeLevel || "").trim();

      const section = String(req.query.section || "").trim();

      if (!gradeLevel || !section) {
        return res.status(400).json({
          success: false,
          code: "EXPORT_CLASS_REQUIRED",
          message: "Please select both Grade Level and Section.",
        });
      }

      if (!ALLOWED_GRADE_LEVELS.includes(gradeLevel)) {
        return res.status(400).json({
          success: false,
          code: "INVALID_GRADE_LEVEL",
          message: "Grade Level must be Grade 7 through Grade 12.",
        });
      }

      const accounts = db
        .prepare(
          `
          SELECT
            id,
            student_number,
            username,

            first_name,
            middle_name,
            last_name,

            password_hash,

            grade_level,
            section

          FROM users

          WHERE
            role = 'STUDENT'

            AND
            username NOT LIKE
              '__archived_student_%'

            AND
            TRIM(grade_level) = ?

            AND
            LOWER(TRIM(section))
              =
            LOWER(TRIM(?))

            AND
            UPPER(
              COALESCE(
                account_status,
                ''
              )
            ) = 'ACTIVE'

          ORDER BY
            last_name ASC,
            first_name ASC,
            middle_name ASC
          `,
        )
        .all(gradeLevel, section);

      if (accounts.length === 0) {
        return res.status(404).json({
          success: false,

          code: "NO_STUDENT_ACCOUNTS_FOUND",

          message: `No active student accounts were found for ${gradeLevel} - ${section}.`,
        });
      }

      const defaultPasswordMatches = await Promise.all(
        accounts.map((student) =>
          student.password_hash
            ? bcrypt.compare(
                DEFAULT_STUDENT_PASSWORD,
                String(student.password_hash),
              )
            : Promise.resolve(false),
        ),
      );

      const workbook = new ExcelJS.Workbook();

      workbook.creator = "SmartFine";

      workbook.lastModifiedBy = "SmartFine";

      workbook.created = new Date();

      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet("Student Accounts", {
        views: [
          {
            state: "frozen",
            ySplit: 7,
          },
        ],
      });

      worksheet.columns = [
        {
          key: "number",
          width: 8,
        },

        {
          key: "studentId",
          width: 20,
        },

        {
          key: "studentName",
          width: 34,
        },

        {
          key: "username",
          width: 24,
        },

        {
          key: "initialPassword",
          width: 24,
        },

        {
          key: "gradeLevel",
          width: 16,
        },

        {
          key: "section",
          width: 30,
        },

        {
          key: "note",
          width: 52,
        },
      ];

      worksheet.mergeCells("A1:H1");

      const titleCell = worksheet.getCell("A1");

      titleCell.value = "SMARTFINE STUDENT ACCOUNT LIST";

      titleCell.font = {
        bold: true,
        size: 18,
        color: {
          argb: "FFFFFFFF",
        },
      };

      titleCell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "FF173A73",
        },
      };

      worksheet.getRow(1).height = 30;

      worksheet.mergeCells("A2:H2");

      const classCell = worksheet.getCell("A2");

      classCell.value = `Class: ${gradeLevel} - ${section}`;

      classCell.font = {
        bold: true,
        size: 12,
        color: {
          argb: "FF123266",
        },
      };

      classCell.alignment = {
        horizontal: "center",
      };

      worksheet.mergeCells("A3:H3");

      const privacyCell = worksheet.getCell("A3");

      privacyCell.value =
        "For distribution by the assigned teacher only. Keep this file private.";

      privacyCell.font = {
        italic: true,
        size: 10,
        color: {
          argb: "FFD32F2F",
        },
      };

      privacyCell.alignment = {
        horizontal: "center",
      };

      worksheet.mergeCells("A4:H4");

      const accountRuleCell = worksheet.getCell("A4");

      accountRuleCell.value = `Username = First Name + Last Name in lowercase without spaces. Duplicate names receive a number suffix. Initial Password = ${DEFAULT_STUDENT_PASSWORD}`;

      accountRuleCell.font = {
        size: 10,
        color: {
          argb: "FF52647A",
        },
      };

      accountRuleCell.alignment = {
        horizontal: "center",
        wrapText: true,
      };

      worksheet.getRow(4).height = 28;

      worksheet.mergeCells("A5:H5");

      const passwordNoticeCell = worksheet.getCell("A5");

      passwordNoticeCell.value =
        "Important: The Initial Password is shown only while the account still uses Smartfine@2026. SmartFine never retrieves or exports a changed password.";

      passwordNoticeCell.font = {
        italic: true,
        size: 9,
        color: {
          argb: "FF7A7F87",
        },
      };

      passwordNoticeCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      worksheet.getRow(5).height = 28;

      worksheet.getRow(6).height = 8;

      const headerRow = worksheet.getRow(7);

      const headers = [
        "No.",
        "Student ID",
        "Student Name",
        "Username",
        "Initial Password",
        "Grade Level",
        "Section",
        "Account Note",
      ];

      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);

        cell.value = header;

        cell.font = {
          bold: true,
          color: {
            argb: "FFFFFFFF",
          },
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FF173A73",
          },
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };

        cell.border = {
          top: {
            style: "thin",
            color: {
              argb: "FFD8DEE8",
            },
          },

          left: {
            style: "thin",
            color: {
              argb: "FFD8DEE8",
            },
          },

          bottom: {
            style: "thin",
            color: {
              argb: "FFD8DEE8",
            },
          },

          right: {
            style: "thin",
            color: {
              argb: "FFD8DEE8",
            },
          },
        };
      });

      headerRow.height = 26;

      accounts.forEach((student, index) => {
        const studentNumber = String(student.student_number || "").trim();

        const username = String(student.username || "").trim();

        const stillUsesDefaultPassword = Boolean(defaultPasswordMatches[index]);

        const initialPassword = stillUsesDefaultPassword
          ? DEFAULT_STUDENT_PASSWORD
          : "";

        const accountNote = stillUsesDefaultPassword
          ? "Initial password is currently valid. The student should change it after first login."
          : "The password has already been changed or was set individually. SmartFine cannot retrieve the current password.";

        const row = worksheet.addRow({
          number: index + 1,

          studentId: studentNumber || username,

          studentName: formatName(
            student.first_name,
            student.middle_name,
            student.last_name,
          ),

          username,

          initialPassword,

          gradeLevel: student.grade_level || "",

          section: student.section || "",

          note: accountNote,
        });

        row.height = 38;

        row.eachCell((cell, columnNumber) => {
          cell.alignment = {
            vertical: "middle",

            horizontal:
              columnNumber === 1 || columnNumber === 6 ? "center" : "left",

            wrapText: true,
          };

          cell.border = {
            top: {
              style: "thin",
              color: {
                argb: "FFE3E7ED",
              },
            },

            left: {
              style: "thin",
              color: {
                argb: "FFE3E7ED",
              },
            },

            bottom: {
              style: "thin",
              color: {
                argb: "FFE3E7ED",
              },
            },

            right: {
              style: "thin",
              color: {
                argb: "FFE3E7ED",
              },
            },
          };

          if (index % 2 === 1) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: "FFF7F9FC",
              },
            };
          }
        });

        row.getCell(2).numFmt = "@";

        const usernameCell = row.getCell(4);

        usernameCell.numFmt = "@";

        usernameCell.font = {
          bold: true,
          color: {
            argb: "FF123266",
          },
        };

        const passwordCell = row.getCell(5);

        passwordCell.numFmt = "@";

        if (stillUsesDefaultPassword) {
          passwordCell.font = {
            bold: true,
            color: {
              argb: "FF123266",
            },
          };

          passwordCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb: "FFEAF2FF",
            },
          };
        } else {
          passwordCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb: "FFFFF4E5",
            },
          };
        }
      });

      worksheet.autoFilter = {
        from: "A7",
        to: "H7",
      };

      worksheet.pageSetup = {
        orientation: "landscape",

        fitToPage: true,

        fitToWidth: 1,

        fitToHeight: 0,

        paperSize: 9,

        margins: {
          left: 0.25,

          right: 0.25,

          top: 0.5,

          bottom: 0.5,

          header: 0.2,

          footer: 0.2,
        },
      };

      worksheet.headerFooter.oddFooter =
        "&CSmartFine Student Account List - Confidential";

      const workbookBuffer = await workbook.xlsx.writeBuffer();

      const safeGrade = makeSafeExportFileName(gradeLevel);

      const safeSection = makeSafeExportFileName(section);

      const fileName = `SmartFine_${safeGrade}_${safeSection}_Student_Accounts.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );

      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private",
      );

      res.setHeader("Pragma", "no-cache");

      return res.send(Buffer.from(workbookBuffer));
    } catch (error) {
      console.error("Export student accounts error:", error);

      return res.status(500).json({
        success: false,

        code: "EXPORT_STUDENT_ACCOUNTS_ERROR",

        message: "Failed to export student account sheet.",

        error: error.message,
      });
    }
  },
);

// ==========================================
// CREATE STUDENT
// ==========================================

router.post("/", requireActive("ADMIN"), async (req, res) => {
  try {
    const {
      username,

      firstName,
      middleName,
      lastName,

      email,
      contactNumber,

      gradeLevel,
      section,

      password,
      confirmPassword,

      accountStatus,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !contactNumber ||
      !gradeLevel ||
      !section ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,

        code: "MISSING_FIELDS",

        message: "Please complete all required student information.",
      });
    }

    const normalizedFirstName = String(firstName).trim();

    const normalizedMiddleName = middleName ? String(middleName).trim() : null;

    const normalizedLastName = String(lastName).trim();

    const normalizedEmail = String(email).trim().toLowerCase();

    const normalizedContactNumber = String(contactNumber).trim();

    const normalizedGradeLevel = String(gradeLevel).trim();

    const normalizedSection = String(section).trim();

    const normalizedStatus = String(accountStatus || "ACTIVE").toUpperCase();

    const passwordValue = String(password);

    // The Admin may type the username. Without one, SmartFine builds it from
    // the name and adds a number when that name is taken.
    const requestedUsername =
      typeof username === "string" ? username.trim().toLowerCase() : "";

    let normalizedUsername;

    if (requestedUsername) {
      if (!/^[a-z0-9]+$/.test(requestedUsername)) {
        return res.status(400).json({
          success: false,

          code: "INVALID_USERNAME",

          message: "Username may contain letters and numbers only.",
        });
      }

      if (requestedUsername.length < 3) {
        return res.status(400).json({
          success: false,

          code: "INVALID_USERNAME",

          message: "Username must contain at least 3 characters.",
        });
      }

      if (usernameExists(requestedUsername)) {
        return res.status(409).json({
          success: false,

          code: "USERNAME_EXISTS",

          message: "This username is already being used by another account.",
        });
      }

      normalizedUsername = requestedUsername;
    } else {
      normalizedUsername = generateUniqueStudentUsername(
        normalizedFirstName,
        normalizedLastName,
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,

        code: "INVALID_EMAIL",

        message: "Please enter a valid email address.",
      });
    }

    const existingEmail = db
      .prepare(
        `
          SELECT id
          FROM users
          WHERE
            LOWER(email) =
            LOWER(?)
          `,
      )
      .get(normalizedEmail);

    if (existingEmail) {
      return res.status(409).json({
        success: false,

        code: "EMAIL_EXISTS",

        message: "This email address is already being used.",
      });
    }

    if (!/^[0-9]+$/.test(normalizedContactNumber)) {
      return res.status(400).json({
        success: false,

        code: "INVALID_CONTACT_NUMBER",

        message: "Contact Number must contain numbers only.",
      });
    }

    if (
      normalizedContactNumber.length < 10 ||
      normalizedContactNumber.length > 15
    ) {
      return res.status(400).json({
        success: false,

        code: "INVALID_CONTACT_NUMBER",

        message: "Contact Number must contain 10 to 15 digits.",
      });
    }

    if (passwordValue !== String(confirmPassword)) {
      return res.status(400).json({
        success: false,

        code: "PASSWORD_MISMATCH",

        message: "Password and Confirm Password do not match.",
      });
    }

    const passwordValidation = validatePasswordPolicy(passwordValue);

    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,

        code: passwordValidation.code,

        message: passwordValidation.message,
      });
    }

    if (normalizedStatus !== "ACTIVE" && normalizedStatus !== "INACTIVE") {
      return res.status(400).json({
        success: false,

        code: "INVALID_ACCOUNT_STATUS",

        message: "Account status must be ACTIVE or INACTIVE.",
      });
    }

    const generatedStudentId = generateNextStudentId();

    const existingStudentNumber = db
      .prepare(
        `
            SELECT id
            FROM users
            WHERE
              student_number = ?
            `,
      )
      .get(generatedStudentId);

    if (existingStudentNumber) {
      return res.status(409).json({
        success: false,

        code: "STUDENT_ID_EXISTS",

        message: "The generated Student ID already exists. Please try again.",
      });
    }

    const passwordHash = await bcrypt.hash(passwordValue, 10);

    // The account and its student record (which payments need) are saved
    // together, or not at all.
    let result;

    db.exec("BEGIN TRANSACTION;");

    try {
      result = db
        .prepare(
          `
            INSERT INTO users (
              student_number,
              username,

              first_name,
              middle_name,
              last_name,

              email,
              contact_number,

              password_hash,

              role,
              account_status,

              grade_level,
              section,

              profile_picture_uri,

              needs_first_login
            )

            VALUES (
              ?,
              ?,

              ?,
              ?,
              ?,

              ?,
              ?,

              ?,

              'STUDENT',
              ?,

              ?,
              ?,

              NULL,

              1
            )
            `,
        )
        .run(
          generatedStudentId,
          normalizedUsername,

          normalizedFirstName,
          normalizedMiddleName,
          normalizedLastName,

          normalizedEmail,
          normalizedContactNumber,

          passwordHash,

          normalizedStatus,

          normalizedGradeLevel,
          normalizedSection,
        );

      ensureStudentRecord(Number(result.lastInsertRowid));

      logActivity({
        actorId: req.account.id,
        action: "STUDENT_ADDED",
        entityType: "USER",
        entityId: Number(result.lastInsertRowid),
        description: `Added student ${formatName(
          normalizedFirstName,
          normalizedMiddleName,
          normalizedLastName,
        )} (${generatedStudentId}), ${normalizedGradeLevel} - ${normalizedSection}${
          normalizedStatus === "ACTIVE" ? "" : ", inactive"
        }.`,
        details: { studentId: generatedStudentId, username: normalizedUsername },
      });

      db.exec("COMMIT;");
    } catch (transactionError) {
      try {
        db.exec("ROLLBACK;");
      } catch (rollbackError) {
        console.error("Create student rollback error:", rollbackError);
      }

      throw transactionError;
    }

    return res.status(201).json({
      success: true,

      message: "Student account created successfully.",

      student: {
        id: Number(result.lastInsertRowid),

        studentId: generatedStudentId,

        username: normalizedUsername,

        firstName: normalizedFirstName,

        middleName: normalizedMiddleName,

        lastName: normalizedLastName,

        fullName: formatName(
          normalizedFirstName,
          normalizedMiddleName,
          normalizedLastName,
        ),

        email: normalizedEmail,

        contactNumber: normalizedContactNumber,

        gradeLevel: normalizedGradeLevel,

        section: normalizedSection,

        accountStatus: normalizedStatus,

        profilePictureUri: null,

        role: "STUDENT",
      },
    });
  } catch (error) {
    // Someone else took the username between the check and the save.
    if (String(error.message).includes("UNIQUE constraint failed: users.username")) {
      return res.status(409).json({
        success: false,

        code: "USERNAME_EXISTS",

        message: "This username is already being used by another account.",
      });
    }

    if (error instanceof StudentRecordError) {
      return res.status(409).json({
        success: false,

        code: error.code,

        message: `${error.message} No account was created.`,
      });
    }

    console.error("Create student error:", error);

    return res.status(500).json({
      success: false,

      code: "CREATE_STUDENT_ERROR",

      message: "Failed to create student account.",

      error: error.message,
    });
  }
});

// ==========================================
// BULK IMPORT STUDENTS
// ==========================================

router.post("/bulk-import", requireActive("ADMIN"), async (req, res) => {
  try {
    const { gradeLevel, section, students } = req.body;

    const normalizedGradeLevel = String(gradeLevel || "").trim();

    const normalizedSection = String(section || "").trim();

    if (!normalizedGradeLevel || !normalizedSection) {
      return res.status(400).json({
        success: false,

        code: "IMPORT_CLASS_REQUIRED",

        message: "Grade Level and Section are required.",
      });
    }

    if (!ALLOWED_GRADE_LEVELS.includes(normalizedGradeLevel)) {
      return res.status(400).json({
        success: false,

        code: "INVALID_GRADE_LEVEL",

        message: "Grade Level must be Grade 7 through Grade 12.",
      });
    }

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,

        code: "IMPORT_STUDENTS_REQUIRED",

        message: "No student records were provided for import.",
      });
    }

    if (students.length > 2000) {
      return res.status(400).json({
        success: false,

        code: "IMPORT_TOO_LARGE",

        message: "A maximum of 2,000 students may be imported at one time.",
      });
    }

    const defaultPasswordValidation = validatePasswordPolicy(
      DEFAULT_STUDENT_PASSWORD,
    );

    if (!defaultPasswordValidation.valid) {
      return res.status(500).json({
        success: false,

        code: "DEFAULT_PASSWORD_INVALID",

        message:
          "The configured default student password does not meet the SmartFine password policy.",
      });
    }

    const requestStudentNumbers = new Set();

    const requestEmails = new Set();

    const requestUsernames = new Set();

    const validatedStudents = [];

    const errors = [];

    for (let index = 0; index < students.length; index += 1) {
      const student = students[index] || {};

      const rowNumber = Number(student.rowNumber) || index + 1;

      const studentNumber = String(student.studentNumber || "").trim();

      const firstName = String(student.firstName || "").trim();

      const middleName = student.middleName
        ? String(student.middleName).trim()
        : null;

      const lastName = String(student.lastName || "").trim();

      const email = String(student.email || "")
        .trim()
        .toLowerCase();

      const rawContactNumber = String(student.contactNumber || "").trim();

      const contactNumber = normalizeImportContactNumber(rawContactNumber);

      if (studentNumber.toUpperCase() === "EXAMPLE") {
        continue;
      }

      const studentErrors = [];

      if (!studentNumber) {
        studentErrors.push("Student ID Number is required.");
      }

      if (!firstName) {
        studentErrors.push("First Name is required.");
      }

      if (!lastName) {
        studentErrors.push("Last Name is required.");
      }

      if (!email) {
        studentErrors.push("Email is required.");
      }

      if (!contactNumber) {
        studentErrors.push("Contact Number is required.");
      }

      if (studentNumber && !/^[A-Za-z0-9_-]+$/.test(studentNumber)) {
        studentErrors.push(
          "Student ID Number may contain letters, numbers, hyphens, and underscores only.",
        );
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        studentErrors.push("Invalid email address.");
      }

      if (rawContactNumber && isScientificNotation(rawContactNumber)) {
        studentErrors.push(
          "Contact Number appears to be in scientific notation. Format the Excel Contact Number column as Text and re-enter the phone number.",
        );
      } else {
        if (contactNumber && !/^[0-9]+$/.test(contactNumber)) {
          studentErrors.push("Contact Number must contain numbers only.");
        }

        if (
          contactNumber &&
          (contactNumber.length < 10 || contactNumber.length > 15)
        ) {
          studentErrors.push("Contact Number must contain 10 to 15 digits.");
        }
      }

      const studentNumberKey = studentNumber.toLowerCase();

      const emailKey = email.toLowerCase();

      if (studentNumberKey && requestStudentNumbers.has(studentNumberKey)) {
        studentErrors.push("Duplicate Student ID Number inside this import.");
      }

      if (emailKey && requestEmails.has(emailKey)) {
        studentErrors.push("Duplicate Email inside this import.");
      }

      if (studentNumber) {
        const existingStudentNumber = db
          .prepare(
            `
                SELECT id
                FROM users
                WHERE
                  LOWER(
                    COALESCE(
                      student_number,
                      ''
                    )
                  )
                  =
                  LOWER(?)
                `,
          )
          .get(studentNumber);

        if (existingStudentNumber) {
          studentErrors.push("Student ID Number already exists.");
        }
      }

      if (email) {
        const existingEmail = db
          .prepare(
            `
                SELECT id
                FROM users
                WHERE
                  LOWER(email)
                  =
                  LOWER(?)
                `,
          )
          .get(email);

        if (existingEmail) {
          studentErrors.push("Email address already exists.");
        }
      }

      if (studentErrors.length > 0) {
        errors.push({
          rowNumber,

          studentNumber,

          name: formatName(firstName, middleName, lastName),

          errors: studentErrors,
        });

        continue;
      }

      const username = generateUniqueStudentUsername(
        firstName,
        lastName,
        requestUsernames,
      );

      requestStudentNumbers.add(studentNumberKey);

      requestEmails.add(emailKey);

      validatedStudents.push({
        rowNumber,

        studentNumber,

        username,

        firstName,

        middleName,

        lastName,

        email,

        contactNumber,
      });
    }

    if (errors.length > 0) {
      return res.status(409).json({
        success: false,

        code: "IMPORT_VALIDATION_FAILED",

        message:
          "Some student records failed backend validation. No student accounts were created.",

        validCount: validatedStudents.length,

        invalidCount: errors.length,

        errors,
      });
    }

    if (validatedStudents.length === 0) {
      return res.status(400).json({
        success: false,

        code: "NO_VALID_IMPORT_RECORDS",

        message: "No valid student records are available for import.",
      });
    }

    const defaultPasswordHash = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10);

    const insertStudent = db.prepare(
      `
          INSERT INTO users (
            student_number,
            username,

            first_name,
            middle_name,
            last_name,

            email,
            contact_number,

            password_hash,

            role,
            account_status,

            grade_level,
            section,

            profile_picture_uri,

            needs_first_login
          )

          VALUES (
            ?,
            ?,

            ?,
            ?,
            ?,

            ?,
            ?,

            ?,

            'STUDENT',
            'ACTIVE',

            ?,
            ?,

            NULL,

            1
          )
          `,
    );

    const importedStudents = [];

    try {
      db.exec("BEGIN TRANSACTION;");

      for (const student of validatedStudents) {
        const result = insertStudent.run(
          student.studentNumber,

          student.username,

          student.firstName,

          student.middleName,

          student.lastName,

          student.email,

          student.contactNumber,

          defaultPasswordHash,

          normalizedGradeLevel,

          normalizedSection,
        );

        // Each imported account gets the student record payments need.
        ensureStudentRecord(Number(result.lastInsertRowid));

        importedStudents.push({
          id: Number(result.lastInsertRowid),

          studentId: student.studentNumber,

          username: student.username,

          firstName: student.firstName,

          middleName: student.middleName,

          lastName: student.lastName,

          fullName: formatName(
            student.firstName,
            student.middleName,
            student.lastName,
          ),

          email: student.email,

          contactNumber: student.contactNumber,

          gradeLevel: normalizedGradeLevel,

          section: normalizedSection,

          accountStatus: "ACTIVE",

          role: "STUDENT",
        });
      }

      logActivity({
        actorId: req.account.id,
        action: "STUDENTS_IMPORTED",
        entityType: "USER",
        description: `Imported ${importedStudents.length} student account${
          importedStudents.length === 1 ? "" : "s"
        } into ${normalizedGradeLevel} - ${normalizedSection}.`,
        details: {
          students: importedStudents.map((student) => ({
            id: student.id,
            studentId: student.studentId,
            name: student.fullName,
          })),
        },
      });

      db.exec("COMMIT;");
    } catch (transactionError) {
      try {
        db.exec("ROLLBACK;");
      } catch (rollbackError) {
        console.error("Bulk student import rollback error:", rollbackError);
      }

      throw transactionError;
    }

    return res.status(201).json({
      success: true,

      code: "BULK_STUDENT_IMPORT_SUCCESS",

      message: `${importedStudents.length} student account${
        importedStudents.length === 1 ? "" : "s"
      } imported successfully.`,

      importedCount: importedStudents.length,

      class: {
        gradeLevel: normalizedGradeLevel,

        section: normalizedSection,
      },

      accountSetup: {
        username: "First Name + Last Name (lowercase, no spaces, unique)",

        defaultPassword: DEFAULT_STUDENT_PASSWORD,

        role: "STUDENT",

        accountStatus: "ACTIVE",
      },

      students: importedStudents,
    });
  } catch (error) {
    if (error instanceof StudentRecordError) {
      return res.status(409).json({
        success: false,

        code: error.code,

        message: `${error.message} No student accounts were created.`,
      });
    }

    console.error("Bulk student import error:", error);

    return res.status(500).json({
      success: false,

      code: "BULK_STUDENT_IMPORT_ERROR",

      message: "Failed to import student accounts.",

      error: error.message,
    });
  }
});

// ==========================================
// UPLOAD PROFILE PICTURE
// ==========================================

router.post("/:id/profile-picture", requireActive("ADMIN"), (req, res) => {
  uploadProfilePicture.single("profilePicture")(req, res, (uploadError) => {
    if (uploadError) {
      console.error("Profile picture upload error:", uploadError);

      let message = uploadError.message || "Failed to upload profile picture.";

      if (uploadError.code === "LIMIT_FILE_SIZE") {
        message = "Profile picture must not exceed 5 MB.";
      }

      return res.status(400).json({
        success: false,

        code: "PROFILE_PICTURE_UPLOAD_ERROR",

        message,
      });
    }

    try {
      const studentId = Number(req.params.id);

      if (!Number.isInteger(studentId) || studentId <= 0) {
        if (req.file) {
          deleteProfilePictureFile(req.file.path);
        }

        return res.status(400).json({
          success: false,

          code: "INVALID_STUDENT_ID",

          message: "Invalid student ID.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,

          code: "PROFILE_PICTURE_REQUIRED",

          message: "Please select a profile picture.",
        });
      }

      const student = db
        .prepare(
          `
              SELECT
                id,
                student_number,
                username,
                first_name,
                middle_name,
                last_name,
                profile_picture_uri
              FROM users
              WHERE
                id = ?
                AND
                role = 'STUDENT'
                AND
                username NOT LIKE
                  '__archived_student_%'
              `,
        )
        .get(studentId);

      if (!student) {
        deleteProfilePictureFile(req.file.path);

        return res.status(404).json({
          success: false,

          code: "STUDENT_NOT_FOUND",

          message: "Student not found.",
        });
      }

      const profilePictureUri = `/uploads/student-profiles/${req.file.filename}`;

      db.prepare(
        `
            UPDATE users
            SET
              profile_picture_uri = ?,
              updated_at =
                CURRENT_TIMESTAMP
            WHERE
              id = ?
              AND role = 'STUDENT'
            `,
      ).run(profilePictureUri, studentId);

      if (student.profile_picture_uri) {
        deleteProfilePictureFile(student.profile_picture_uri);
      }

      return res.json({
        success: true,

        message: "Profile picture updated successfully.",

        profilePictureUri,

        student: {
          id: student.id,

          studentId: student.student_number,

          fullName: formatName(
            student.first_name,
            student.middle_name,
            student.last_name,
          ),

          profilePictureUri,
        },
      });
    } catch (error) {
      console.error("Save profile picture error:", error);

      if (req.file) {
        deleteProfilePictureFile(req.file.path);
      }

      return res.status(500).json({
        success: false,

        code: "SAVE_PROFILE_PICTURE_ERROR",

        message: "Failed to save student profile picture.",

        error: error.message,
      });
    }
  });
});

// ==========================================
// REMOVE PROFILE PICTURE
// ==========================================

router.delete("/:id/profile-picture", requireActive("ADMIN"), (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({
        success: false,

        code: "INVALID_STUDENT_ID",

        message: "Invalid student ID.",
      });
    }

    const student = db
      .prepare(
        `
          SELECT
            id,
            username,
            profile_picture_uri
          FROM users
          WHERE
            id = ?
            AND role = 'STUDENT'
            AND
            username NOT LIKE
              '__archived_student_%'
          `,
      )
      .get(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,

        code: "STUDENT_NOT_FOUND",

        message: "Student not found.",
      });
    }

    if (!student.profile_picture_uri) {
      return res.json({
        success: true,

        message: "Student does not have a profile picture.",

        profilePictureUri: null,
      });
    }

    db.prepare(
      `
        UPDATE users
        SET
          profile_picture_uri =
            NULL,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE
          id = ?
          AND role = 'STUDENT'
        `,
    ).run(studentId);

    deleteProfilePictureFile(student.profile_picture_uri);

    return res.json({
      success: true,

      message: "Profile picture removed successfully.",

      profilePictureUri: null,
    });
  } catch (error) {
    console.error("Remove profile picture error:", error);

    return res.status(500).json({
      success: false,

      code: "REMOVE_PROFILE_PICTURE_ERROR",

      message: "Failed to remove student profile picture.",

      error: error.message,
    });
  }
});

// ==========================================
// GET SINGLE STUDENT PROFILE
// ==========================================

router.get("/:id", requireActive("ADMIN", "FINES_OFFICER"), (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({
        success: false,

        message: "Invalid student ID.",
      });
    }

    const student = db
      .prepare(
        `
          SELECT
            id,

            COALESCE(
              student_number,
              username
            ) AS student_id,

            username,

            first_name,
            middle_name,
            last_name,

            TRIM(
              first_name || ' ' ||
              COALESCE(
                middle_name || ' ',
                ''
              ) ||
              last_name
            ) AS full_name,

            email,
            contact_number,

            grade_level,
            section,

            account_status,
            profile_picture_uri

          FROM users

          WHERE
            id = ?
            AND role = 'STUDENT'
            AND
            username NOT LIKE
              '__archived_student_%'
          `,
      )
      .get(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,

        message: "Student not found.",
      });
    }

    const totals = db
      .prepare(
        `
          SELECT
            COALESCE(
              SUM(
                CASE
                  WHEN
                    cancelled_at
                      IS NULL
                    AND
                    UPPER(
                      COALESCE(
                        fine_status,
                        'UNPAID'
                      )
                    ) !=
                      'CANCELLED'
                  THEN
                    amount_centavos
                  ELSE
                    0
                END
              ),
              0
            ) / 100.0
              AS total_fines,

            COALESCE(
              SUM(
                CASE
                  WHEN
                    cancelled_at
                      IS NULL
                    AND
                    paid_at
                      IS NULL
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
                  THEN
                    amount_centavos
                  ELSE
                    0
                END
              ),
              0
            ) / 100.0
              AS outstanding_balance,

            COALESCE(
              SUM(
                CASE
                  WHEN
                    cancelled_at
                      IS NULL
                    AND
                    (
                      paid_at
                        IS NOT NULL
                      OR
                      UPPER(
                        COALESCE(
                          fine_status,
                          ''
                        )
                      ) =
                        'PAID'
                    )
                  THEN
                    amount_centavos
                  ELSE
                    0
                END
              ),
              0
            ) / 100.0
              AS total_paid

          FROM fines
          WHERE
            student_id = ?
          `,
      )
      .get(studentId);

    const fines = db
      .prepare(
        `
          SELECT
            f.id,
            f.fine_reference,
            vt.violation_name,

            f.amount_centavos
              / 100.0
              AS amount,

            f.remarks,
            f.issued_at,
            f.created_at,
            f.paid_at,
            f.cancelled_at,
            f.cancellation_reason,

            CASE
              WHEN
                f.cancelled_at
                  IS NOT NULL
                OR
                UPPER(
                  COALESCE(
                    f.fine_status,
                    ''
                  )
                ) =
                  'CANCELLED'
              THEN
                'CANCELLED'

              WHEN
                f.paid_at
                  IS NOT NULL
                OR
                UPPER(
                  COALESCE(
                    f.fine_status,
                    ''
                  )
                ) =
                  'PAID'
              THEN
                'PAID'

              WHEN
                UPPER(
                  COALESCE(
                    f.fine_status,
                    ''
                  )
                ) =
                  'WAIVED'
              THEN
                'WAIVED'

              WHEN
                UPPER(
                  COALESCE(
                    f.fine_status,
                    ''
                  )
                ) =
                  'PENDING'
              THEN
                'PENDING'

              ELSE
                'UNPAID'
            END AS status,

            CASE
              WHEN
                officer.id
                  IS NOT NULL
              THEN
                TRIM(
                  officer.first_name
                  || ' ' ||
                  officer.last_name
                )
              ELSE
                'Unknown'
            END AS officer_name

          FROM fines f

          JOIN violation_types vt
            ON
              vt.id =
              f.violation_type_id

          LEFT JOIN users officer
            ON
              officer.id =
              f.recorded_by

          WHERE
            f.student_id = ?

          ORDER BY
            f.created_at DESC,
            f.id DESC

          LIMIT 50
          `,
      )
      .all(studentId);

    return res.json({
      success: true,

      student,

      totals: {
        totalFines: Number(totals.total_fines || 0),

        outstandingBalance: Number(totals.outstanding_balance || 0),

        totalPaid: Number(totals.total_paid || 0),
      },

      fines,
    });
  } catch (error) {
    console.error("Student profile error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load student profile.",

      error: error.message,
    });
  }
});

// ==========================================
// UPDATE STUDENT
// ==========================================

router.put("/:id", requireActive("ADMIN"), async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({
        success: false,

        code: "INVALID_STUDENT_ID",

        message: "Invalid student ID.",
      });
    }

    const existingStudent = db
      .prepare(
        `
          SELECT
            id,
            student_number,
            username,
            account_status,
            profile_picture_uri
          FROM users
          WHERE
            id = ?
            AND role = 'STUDENT'
            AND
            username NOT LIKE
              '__archived_student_%'
          `,
      )
      .get(studentId);

    if (!existingStudent) {
      return res.status(404).json({
        success: false,

        code: "STUDENT_NOT_FOUND",

        message: "Student not found.",
      });
    }

    const {
      username,
      firstName,
      middleName,
      lastName,
      email,
      contactNumber,
      gradeLevel,
      section,
      accountStatus,
    } = req.body;

    if (
      !username ||
      !firstName ||
      !lastName ||
      !email ||
      !contactNumber ||
      !gradeLevel ||
      !section
    ) {
      return res.status(400).json({
        success: false,

        code: "MISSING_FIELDS",

        message: "Please complete all required student information.",
      });
    }

    const normalizedUsername = String(username).trim().toLowerCase();

    const normalizedFirstName = String(firstName).trim();

    const normalizedMiddleName = middleName ? String(middleName).trim() : null;

    const normalizedLastName = String(lastName).trim();

    const normalizedEmail = String(email).trim().toLowerCase();

    const normalizedContactNumber = String(contactNumber).trim();

    const normalizedGradeLevel = String(gradeLevel).trim();

    const normalizedSection = String(section).trim();

    let normalizedStatus = String(accountStatus || "ACTIVE").toUpperCase();

    if (existingStudent.account_status === "LOCKED" && normalizedStatus === "INACTIVE") {
      normalizedStatus = "LOCKED";
    }

    if (!/^[a-z0-9]+$/.test(normalizedUsername)) {
      return res.status(400).json({
        success: false,

        code: "INVALID_USERNAME",

        message: "Username may contain letters and numbers only.",
      });
    }

    if (normalizedUsername.length < 3) {
      return res.status(400).json({
        success: false,

        code: "INVALID_USERNAME",

        message: "Username must contain at least 3 characters.",
      });
    }

    const duplicateUsername = db
      .prepare(
        `
            SELECT id
            FROM users
            WHERE
              LOWER(username) =
                LOWER(?)
              AND id != ?
            `,
      )
      .get(normalizedUsername, studentId);

    if (duplicateUsername) {
      return res.status(409).json({
        success: false,

        code: "USERNAME_EXISTS",

        message: "This username is already being used by another account.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,

        code: "INVALID_EMAIL",

        message: "Please enter a valid email address.",
      });
    }

    const duplicateEmail = db
      .prepare(
        `
            SELECT id
            FROM users
            WHERE
              LOWER(email) =
                LOWER(?)
              AND id != ?
            `,
      )
      .get(normalizedEmail, studentId);

    if (duplicateEmail) {
      return res.status(409).json({
        success: false,

        code: "EMAIL_EXISTS",

        message: "This email address is already being used by another account.",
      });
    }

    if (!/^[0-9]+$/.test(normalizedContactNumber)) {
      return res.status(400).json({
        success: false,

        code: "INVALID_CONTACT_NUMBER",

        message: "Contact Number must contain numbers only.",
      });
    }

    if (
      normalizedContactNumber.length < 10 ||
      normalizedContactNumber.length > 15
    ) {
      return res.status(400).json({
        success: false,

        code: "INVALID_CONTACT_NUMBER",

        message: "Contact Number must contain 10 to 15 digits.",
      });
    }

    if (!["ACTIVE", "INACTIVE", "LOCKED"].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,

        code: "INVALID_ACCOUNT_STATUS",

        message: "Account status must be ACTIVE or INACTIVE.",
      });
    }

    const newPassword = req.body.newPassword ?? "";

    const confirmPassword = req.body.confirmPassword ?? "";

    if (
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return res.status(400).json({
        success: false,

        code: "INVALID_PASSWORD_FIELDS",

        message: "Password fields must contain text.",
      });
    }

    const passwordChanged = newPassword !== "" || confirmPassword !== "";

    let newPasswordHash = null;

    if (passwordChanged) {
      if (!newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,

          code: "PASSWORD_FIELDS_REQUIRED",

          message: "New password and confirmation are required.",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,

          code: "PASSWORD_MISMATCH",

          message: "New password and confirmation do not match.",
        });
      }

      const passwordValidation = validatePasswordPolicy(newPassword);

      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,

          code: passwordValidation.code,

          message: passwordValidation.message,
        });
      }

      newPasswordHash = await bcrypt.hash(newPassword, 10);
    }

    const beforeAccount = studentAccountSnapshot(studentId);

    try {
      db.exec("BEGIN TRANSACTION;");

      const result = db
        .prepare(
          `
            UPDATE users
            SET
              username = ?,

              first_name = ?,
              middle_name = ?,
              last_name = ?,

              email = ?,
              contact_number = ?,

              grade_level = ?,
              section = ?,

              account_status = ?,

              updated_at =
                CURRENT_TIMESTAMP

            WHERE
              id = ?
              AND role = 'STUDENT'
            `,
        )
        .run(
          normalizedUsername,

          normalizedFirstName,
          normalizedMiddleName,
          normalizedLastName,

          normalizedEmail,
          normalizedContactNumber,

          normalizedGradeLevel,
          normalizedSection,

          normalizedStatus,

          studentId,
        );

      if (Number(result.changes) === 0) {
        throw new Error("Student information could not be updated.");
      }

      // Keeps the student record's grade and section the same, and creates
      // the record for an older account that has none.
      ensureStudentRecord(studentId);

      if (newPasswordHash !== null) {
        db.prepare(
          `
            UPDATE users
            SET
              password_hash = ?,
              failed_login_attempts = 0,
              locked_until = NULL,
              lockout_count = 0,
              updated_at =
                CURRENT_TIMESTAMP
            WHERE
              id = ?
              AND role = 'STUDENT'
            `,
        ).run(newPasswordHash, studentId);
      }

      const afterAccount = studentAccountSnapshot(studentId);
      const changes = describeChanges(beforeAccount, afterAccount, STUDENT_FIELDS);

      if (changes.length || newPasswordHash !== null) {
        logActivity({
          actorId: req.account.id,
          action: "STUDENT_EDITED",
          entityType: "USER",
          entityId: studentId,
          description: `Edited student ${afterAccount.name} (${
            existingStudent.student_number || existingStudent.username
          }): ${[changeText(changes), newPasswordHash !== null ? "password reset" : ""]
            .filter(Boolean)
            .join("; ")}.`,
          details: { changes, passwordReset: newPasswordHash !== null },
        });
      }

      db.exec("COMMIT;");
    } catch (transactionError) {
      try {
        db.exec("ROLLBACK;");
      } catch (rollbackError) {
        console.error("Student update rollback error:", rollbackError);
      }

      throw transactionError;
    }

    return res.json({
      success: true,

      message: passwordChanged
        ? "Student information and password updated successfully."
        : "Student information updated successfully.",

      passwordChanged,

      student: {
        id: existingStudent.id,

        studentId: existingStudent.student_number,

        username: normalizedUsername,

        firstName: normalizedFirstName,

        middleName: normalizedMiddleName,

        lastName: normalizedLastName,

        fullName: formatName(
          normalizedFirstName,
          normalizedMiddleName,
          normalizedLastName,
        ),

        email: normalizedEmail,

        contactNumber: normalizedContactNumber,

        gradeLevel: normalizedGradeLevel,

        section: normalizedSection,

        accountStatus: normalizedStatus,

        profilePictureUri: existingStudent.profile_picture_uri,
      },
    });
  } catch (error) {
    if (error instanceof StudentRecordError) {
      return res.status(409).json({
        success: false,

        code: error.code,

        message: `${error.message} The changes were not saved.`,
      });
    }

    console.error("Update student error:", error);

    return res.status(500).json({
      success: false,

      code: "UPDATE_STUDENT_ERROR",

      message: "Failed to update student information.",

      error: error.message,
    });
  }
});

// ==========================================
// DELETE / ARCHIVE INACTIVE STUDENT
// ==========================================

router.delete("/:id", requireActive("ADMIN"), (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({
        success: false,

        code: "INVALID_STUDENT_ID",

        message: "Invalid student ID.",
      });
    }

    const student = db
      .prepare(
        `
          SELECT
            id,
            student_number,
            username,

            first_name,
            middle_name,
            last_name,

            email,
            account_status,
            profile_picture_uri

          FROM users

          WHERE
            id = ?
            AND role = 'STUDENT'
            AND
            username NOT LIKE
              '__archived_student_%'
          `,
      )
      .get(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,

        code: "STUDENT_NOT_FOUND",

        message: "Student not found.",
      });
    }

    const accountStatus = String(student.account_status || "").toUpperCase();

    const canDelete =
      accountStatus === "INACTIVE" || accountStatus === "DEACTIVATED";

    if (!canDelete) {
      return res.status(409).json({
        success: false,

        code: "STUDENT_ACTIVE",

        message:
          "Active students cannot be deleted. Set the student account to Inactive first.",
      });
    }

    const outstandingFineResult = db
      .prepare(
        `
            SELECT
              COUNT(*) AS total,

              COALESCE(
                SUM(
                  amount_centavos
                ),
                0
              ) AS total_centavos

            FROM fines

            WHERE
              student_id = ?
              AND
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
      .get(studentId);

    const outstandingFineCount = Number(outstandingFineResult?.total || 0);

    const outstandingBalance =
      Number(outstandingFineResult?.total_centavos || 0) / 100;

    if (outstandingFineCount > 0 || outstandingBalance > 0) {
      return res.status(409).json({
        success: false,

        code: "STUDENT_HAS_OUTSTANDING_FINES",

        message: `This student cannot be deleted because there are still unpaid or pending fines. Outstanding balance: ₱${outstandingBalance.toFixed(
          2,
        )}.`,

        outstanding: {
          fines: outstandingFineCount,

          balance: outstandingBalance,
        },
      });
    }

    const fineResult = db
      .prepare(
        `
          SELECT COUNT(*) AS total
          FROM fines
          WHERE student_id = ?
          `,
      )
      .get(studentId);

    const fineCount = Number(fineResult?.total || 0);

    const paymentResult = db
      .prepare(
        `
          SELECT COUNT(*) AS total
          FROM payments
          WHERE student_id = ?
          `,
      )
      .get(studentId);

    const paymentCount = Number(paymentResult?.total || 0);

    if (fineCount > 0 || paymentCount > 0) {
      const archiveTimestamp = Date.now();

      const archivedUsername = `${ARCHIVED_USERNAME_PREFIX}${student.id}_${archiveTimestamp}`;

      const archivedEmail = `archived-student-${student.id}-${archiveTimestamp}@smartfine.local`;

      const archiveResult = db
        .prepare(
          `
              UPDATE users
              SET
                username = ?,
                email = ?,
                account_status =
                  'INACTIVE',
                profile_picture_uri =
                  NULL,
                updated_at =
                  CURRENT_TIMESTAMP
              WHERE
                id = ?
                AND role = 'STUDENT'
              `,
        )
        .run(archivedUsername, archivedEmail, studentId);

      if (Number(archiveResult.changes) === 0) {
        return res.status(500).json({
          success: false,

          code: "STUDENT_ARCHIVE_FAILED",

          message: "The student account could not be removed.",
        });
      }

      if (student.profile_picture_uri) {
        deleteProfilePictureFile(student.profile_picture_uri);
      }

      logActivity({
        actorId: req.account.id,
        action: "STUDENT_REMOVED",
        entityType: "USER",
        entityId: student.id,
        description: `Removed student ${formatName(
          student.first_name,
          student.middle_name,
          student.last_name,
        )} (${student.student_number || student.username}). Their ${fineCount} fine record(s) and ${paymentCount} payment record(s) were kept.`,
        details: { fines: fineCount, payments: paymentCount },
      });

      return res.json({
        success: true,

        code: "STUDENT_ARCHIVED",

        archived: true,

        message:
          "Student removed successfully. Historical fine and payment records were preserved.",

        deletedStudent: {
          id: student.id,

          studentId: student.student_number || student.username,

          name: formatName(
            student.first_name,
            student.middle_name,
            student.last_name,
          ),
        },

        preservedRecords: {
          fines: fineCount,

          payments: paymentCount,
        },
      });
    }

    const deleteResult = db
      .prepare(
        `
            DELETE FROM users
            WHERE
              id = ?
              AND role = 'STUDENT'
            `,
      )
      .run(studentId);

    if (Number(deleteResult.changes) === 0) {
      return res.status(404).json({
        success: false,

        code: "STUDENT_NOT_FOUND",

        message: "Student could not be found or deleted.",
      });
    }

    if (student.profile_picture_uri) {
      deleteProfilePictureFile(student.profile_picture_uri);
    }

    logActivity({
      actorId: req.account.id,
      action: "STUDENT_DELETED",
      entityType: "USER",
      entityId: student.id,
      description: `Deleted student ${formatName(
        student.first_name,
        student.middle_name,
        student.last_name,
      )} (${student.student_number || student.username}), who had no fines.`,
    });

    return res.json({
      success: true,

      code: "STUDENT_DELETED",

      archived: false,

      message: "Student deleted successfully.",

      deletedStudent: {
        id: student.id,

        studentId: student.student_number || student.username,

        username: student.username,

        name: formatName(
          student.first_name,
          student.middle_name,
          student.last_name,
        ),
      },
    });
  } catch (error) {
    console.error("Delete student error:", error);

    return res.status(500).json({
      success: false,

      code: "DELETE_STUDENT_ERROR",

      message: "Failed to delete student.",

      error: error.message,
    });
  }
});

// ==========================================
// EXPORT
// ==========================================

module.exports = router;
