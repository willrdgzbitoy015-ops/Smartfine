const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");

const fs = require("fs");
const path = require("path");

const router = express.Router();

const db = require("../database/database");

console.log("students.js loaded");

// ==========================================
// ARCHIVED STUDENT MARKER
// ==========================================
//
// We keep archived students in the users
// table so old fines/payments still have a
// valid student_id reference.
//
// Archived students are hidden from the
// Students Directory and cannot be edited
// through normal student routes.
// ==========================================

const ARCHIVED_USERNAME_PREFIX = "__archived_student_";

function isArchivedUsername(username) {
  return String(username || "").startsWith(ARCHIVED_USERNAME_PREFIX);
}

// ==========================================
// PROFILE PICTURE UPLOAD DIRECTORY
// ==========================================

const studentProfileUploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "student-profiles",
);

// ==========================================
// CREATE DIRECTORY IF IT DOES NOT EXIST
// ==========================================

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

        ORDER BY
          student_number DESC

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

  const formattedNumber = String(nextNumber).padStart(4, "0");

  return `${currentYear}-${formattedNumber}`;
}

// ==========================================
// GENERATE SUGGESTED USERNAME
// ==========================================

function generateSuggestedUsername(firstName, lastName) {
  const cleanFirstName = String(firstName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const cleanLastName = String(lastName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (!cleanFirstName || !cleanLastName) {
    return "";
  }

  return cleanFirstName.charAt(0) + cleanLastName;
}

// ==========================================
// FORMAT FULL NAME
// ==========================================

function formatName(firstName, middleName, lastName) {
  return [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
}

// ==========================================
// PASSWORD POLICY
//
// Requirements:
// - Minimum 8 characters
// - At least 1 lowercase letter
// - At least 1 uppercase letter
// - At least 1 number
// - At least 1 special character
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
//
// GET /api/students/next-id
// ==========================================

router.get("/next-id", (req, res) => {
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
//
// GET /api/students
// ==========================================

router.get("/", (req, res) => {
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

                      AND
                      f.cancelled_at
                        IS NULL

                      AND
                      UPPER(
                        COALESCE(
                          f.fine_status,
                          'UNPAID'
                        )
                      ) !=
                        'CANCELLED'

                    THEN
                      f.amount_centavos

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
                      f.id IS NOT NULL

                      AND
                      f.cancelled_at
                        IS NULL

                      AND
                      f.paid_at
                        IS NULL

                      AND
                      UPPER(
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

                    THEN
                      f.amount_centavos

                    ELSE
                      0
                  END
                ),
                0
              ) / 100.0
                AS outstanding_balance

            FROM users u

            LEFT JOIN fines f
              ON
                f.student_id =
                u.id

            WHERE
              u.role =
                'STUDENT'

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
// CREATE STUDENT
//
// POST /api/students
// ==========================================

router.post("/", async (req, res) => {
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

    // ====================================
    // REQUIRED FIELDS
    // ====================================

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

    // ====================================
    // NORMALIZE
    // ====================================

    const normalizedFirstName = String(firstName).trim();

    const normalizedMiddleName = middleName ? String(middleName).trim() : null;

    const normalizedLastName = String(lastName).trim();

    const normalizedEmail = String(email).trim().toLowerCase();

    const normalizedContactNumber = String(contactNumber).trim();

    const normalizedGradeLevel = String(gradeLevel).trim();

    const normalizedSection = String(section).trim();

    const normalizedStatus = String(accountStatus || "ACTIVE").toUpperCase();

    const passwordValue = String(password);

    // ====================================
    // USERNAME
    // ====================================

    const suggestedUsername = generateSuggestedUsername(
      normalizedFirstName,
      normalizedLastName,
    );

    const normalizedUsername = String(username || suggestedUsername)
      .trim()
      .toLowerCase();

    if (!normalizedUsername) {
      return res.status(400).json({
        success: false,

        code: "USERNAME_REQUIRED",

        message: "Username is required.",
      });
    }

    const usernamePattern = /^[a-z0-9]+$/;

    if (!usernamePattern.test(normalizedUsername)) {
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

    // ====================================
    // DUPLICATE USERNAME
    // ====================================

    const existingUsername = db
      .prepare(
        `
            SELECT
              id

            FROM users

            WHERE
              LOWER(username)
                =
              LOWER(?)
            `,
      )
      .get(normalizedUsername);

    if (existingUsername) {
      return res.status(409).json({
        success: false,

        code: "USERNAME_EXISTS",

        message:
          "This username is already being used. Please choose another username.",
      });
    }

    // ====================================
    // EMAIL
    // ====================================

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
            SELECT
              id

            FROM users

            WHERE
              LOWER(email)
                =
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

    // ====================================
    // CONTACT NUMBER
    // ====================================

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

    // ====================================
    // CONFIRM PASSWORD
    // ====================================

    const confirmPasswordValue = String(confirmPassword);

    if (passwordValue !== confirmPasswordValue) {
      return res.status(400).json({
        success: false,

        code: "PASSWORD_MISMATCH",

        message: "Password and Confirm Password do not match.",
      });
    }

    // ====================================
    // PASSWORD POLICY
    // ====================================

    const passwordValidation = validatePasswordPolicy(passwordValue);

    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,

        code: passwordValidation.code,

        message: passwordValidation.message,
      });
    }

    // ====================================
    // ACCOUNT STATUS
    // ====================================

    if (normalizedStatus !== "ACTIVE" && normalizedStatus !== "INACTIVE") {
      return res.status(400).json({
        success: false,

        code: "INVALID_ACCOUNT_STATUS",

        message: "Account status must be ACTIVE or INACTIVE.",
      });
    }

    // ====================================
    // GENERATE STUDENT ID
    // ====================================

    const generatedStudentId = generateNextStudentId();

    const existingStudentNumber = db
      .prepare(
        `
            SELECT
              id

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

    // ====================================
    // HASH PASSWORD
    // ====================================

    const passwordHash = await bcrypt.hash(passwordValue, 10);

    // ====================================
    // CREATE STUDENT
    // ====================================

    const result = db
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

              profile_picture_uri
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

              NULL
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

    const createdStudentId = Number(result.lastInsertRowid);

    // ====================================
    // SUCCESS
    // ====================================

    return res.status(201).json({
      success: true,

      message: "Student account created successfully.",

      student: {
        id: createdStudentId,

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
// UPLOAD / CHANGE PROFILE PICTURE
//
// POST /api/students/:id/profile-picture
// ==========================================

router.post("/:id/profile-picture", (req, res) => {
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
                  role =
                    'STUDENT'

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

                AND
                role =
                  'STUDENT'
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
//
// DELETE /api/students/:id/profile-picture
// ==========================================

router.delete("/:id/profile-picture", (req, res) => {
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

              AND
              role =
                'STUDENT'

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

            AND
            role =
              'STUDENT'
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
//
// GET /api/students/:id
// ==========================================

router.get("/:id", (req, res) => {
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

              AND
              role =
                'STUDENT'

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
//
// PUT /api/students/:id
//
// Password change is optional.
// If either password field is used, both are
// required and the full password policy applies.
// ==========================================

router.put("/:id", async (req, res) => {
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

              AND
              role =
                'STUDENT'

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

    // ====================================
    // REQUIRED FIELDS
    // ====================================

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

    // ====================================
    // NORMALIZE
    // ====================================

    const normalizedUsername = String(username).trim().toLowerCase();

    const normalizedFirstName = String(firstName).trim();

    const normalizedMiddleName = middleName ? String(middleName).trim() : null;

    const normalizedLastName = String(lastName).trim();

    const normalizedEmail = String(email).trim().toLowerCase();

    const normalizedContactNumber = String(contactNumber).trim();

    const normalizedGradeLevel = String(gradeLevel).trim();

    const normalizedSection = String(section).trim();

    const normalizedStatus = String(accountStatus || "ACTIVE").toUpperCase();

    // ====================================
    // USERNAME
    // ====================================

    const usernamePattern = /^[a-z0-9]+$/;

    if (!usernamePattern.test(normalizedUsername)) {
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
            SELECT
              id

            FROM users

            WHERE
              LOWER(username)
                =
              LOWER(?)

              AND
              id != ?
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

    // ====================================
    // EMAIL
    // ====================================

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,

        code: "INVALID_EMAIL",

        message: "Please enter a valid email address.",
      });
    }

    const duplicateEmail = db
      .prepare(
        `
            SELECT
              id

            FROM users

            WHERE
              LOWER(email)
                =
              LOWER(?)

              AND
              id != ?
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

    // ====================================
    // CONTACT NUMBER
    // ====================================

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

    // ====================================
    // ACCOUNT STATUS
    // ====================================

    if (normalizedStatus !== "ACTIVE" && normalizedStatus !== "INACTIVE") {
      return res.status(400).json({
        success: false,

        code: "INVALID_ACCOUNT_STATUS",

        message: "Account status must be ACTIVE or INACTIVE.",
      });
    }

    // ====================================
    // OPTIONAL PASSWORD CHANGE
    // ====================================

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
      // ==================================
      // BOTH PASSWORD FIELDS REQUIRED
      // ==================================

      if (!newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,

          code: "PASSWORD_FIELDS_REQUIRED",

          message: "New password and confirmation are required.",
        });
      }

      // ==================================
      // CONFIRM PASSWORD
      // ==================================

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,

          code: "PASSWORD_MISMATCH",

          message: "New password and confirmation do not match.",
        });
      }

      // ==================================
      // PASSWORD POLICY
      // ==================================

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

    // ====================================
    // UPDATE TRANSACTION
    // ====================================

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

                AND
                role =
                  'STUDENT'
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

      // ==================================
      // OPTIONAL PASSWORD UPDATE
      // ==================================

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

                AND
                role =
                  'STUDENT'
              `,
        ).run(newPasswordHash, studentId);
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

    // ====================================
    // SUCCESS
    // ====================================

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
//
// DELETE /api/students/:id
//
// RULES:
//
// ACTIVE
// -> cannot delete
//
// INACTIVE + unpaid/pending fine
// -> cannot delete
//
// INACTIVE + ₱0 outstanding + history
// -> archive student
// -> preserve fines/payments
//
// INACTIVE + no history
// -> permanently delete
// ==========================================

router.delete("/:id", (req, res) => {
  try {
    const studentId = Number(req.params.id);

    // ====================================
    // VALIDATE ID
    // ====================================

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({
        success: false,

        code: "INVALID_STUDENT_ID",

        message: "Invalid student ID.",
      });
    }

    // ====================================
    // FIND STUDENT
    // ====================================

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

              AND
              role =
                'STUDENT'

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

    // ====================================
    // STUDENT MUST BE INACTIVE
    // ====================================

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

    // ====================================
    // CHECK UNPAID / PENDING FINES
    // ====================================

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

    // ====================================
    // BLOCK DELETE IF BALANCE REMAINS
    // ====================================

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

    // ====================================
    // COUNT ALL FINE HISTORY
    // ====================================

    const fineResult = db
      .prepare(
        `
            SELECT
              COUNT(*) AS total

            FROM fines

            WHERE
              student_id = ?
            `,
      )
      .get(studentId);

    const fineCount = Number(fineResult?.total || 0);

    // ====================================
    // COUNT ALL PAYMENT HISTORY
    // ====================================

    const paymentResult = db
      .prepare(
        `
            SELECT
              COUNT(*) AS total

            FROM payments

            WHERE
              student_id = ?
            `,
      )
      .get(studentId);

    const paymentCount = Number(paymentResult?.total || 0);

    // ====================================
    // HAS HISTORICAL RECORDS
    //
    // Archive instead of physically
    // deleting the user row.
    // ====================================

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

                AND
                role =
                  'STUDENT'
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

      // ==================================
      // REMOVE PROFILE PICTURE FILE
      // ==================================

      if (student.profile_picture_uri) {
        deleteProfilePictureFile(student.profile_picture_uri);
      }

      // ==================================
      // ARCHIVE SUCCESS
      // ==================================

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

    // ====================================
    // NO FINES OR PAYMENTS
    //
    // SAFE TO HARD DELETE
    // ====================================

    const deleteResult = db
      .prepare(
        `
            DELETE FROM users

            WHERE
              id = ?

              AND
              role =
                'STUDENT'
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

    // ====================================
    // REMOVE PROFILE PICTURE FILE
    // ====================================

    if (student.profile_picture_uri) {
      deleteProfilePictureFile(student.profile_picture_uri);
    }

    // ====================================
    // HARD DELETE SUCCESS
    // ====================================

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

module.exports = router;
