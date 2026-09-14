const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { authenticateToken } = require("./auth");
const db = require("../database/database");

const router = express.Router();

console.log("officers.js loaded");

// ==========================================
// ARCHIVED OFFICER
// ==========================================

const ARCHIVED_OFFICER_USERNAME_PREFIX = "__archived_officer_";

// ==========================================
// OFFICER PROFILE PICTURE DIRECTORY
// ==========================================

const officerProfileUploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "officer-profiles",
);

if (!fs.existsSync(officerProfileUploadDirectory)) {
  fs.mkdirSync(officerProfileUploadDirectory, {
    recursive: true,
  });
}

// ==========================================
// HELPERS
// ==========================================

function formatName(firstName, middleName, lastName) {
  return [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
}

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

function getValidOfficerId(value) {
  const officerId = Number(value);

  if (!Number.isSafeInteger(officerId) || officerId <= 0) {
    return null;
  }

  return officerId;
}

// ==========================================
// FIND ACTIVE / VISIBLE OFFICER PROFILE
// ==========================================

function findOfficerById(officerId) {
  return db
    .prepare(
      `
      SELECT
        u.id,
        u.username,
        u.first_name,
        u.middle_name,
        u.last_name,
        u.email,
        u.contact_number,
        u.account_status,
        u.profile_picture_uri,

        fo.id AS officer_profile_id,
        fo.employee_number,
        fo.assigned_area

      FROM users u

      INNER JOIN fines_officers fo
        ON fo.user_id = u.id

      WHERE
        u.id = ?

        AND u.role = 'FINES_OFFICER'

        AND u.username NOT LIKE
          '__archived_officer_%'
      `,
    )
    .get(officerId);
}

// ==========================================
// DELETE OFFICER PROFILE PICTURE FILE
// ==========================================

function deleteOfficerProfileFile(profilePictureUri) {
  try {
    if (!profilePictureUri) {
      return;
    }

    const normalizedUri = String(profilePictureUri).trim();

    const expectedPrefix = "/uploads/officer-profiles/";

    if (!normalizedUri.startsWith(expectedPrefix)) {
      return;
    }

    const fileName = path.basename(normalizedUri);

    const fullPath = path.join(officerProfileUploadDirectory, fileName);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error("Delete officer profile picture file error:", error);
  }
}

// ==========================================
// DELETE TEMPORARY UPLOAD
// ==========================================

function deleteUploadedFile(file) {
  try {
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch (error) {
    console.error("Delete temporary officer upload error:", error);
  }
}

// ==========================================
// GENERATE NEXT EMPLOYEE NUMBER
// ==========================================

function generateNextEmployeeNumber() {
  const latestOfficer = db
    .prepare(
      `
      SELECT
        employee_number

      FROM fines_officers

      WHERE
        employee_number LIKE 'F%'

      ORDER BY
        CAST(
          SUBSTR(employee_number, 2)
          AS INTEGER
        ) DESC

      LIMIT 1
      `,
    )
    .get();

  if (!latestOfficer?.employee_number) {
    return "F0001";
  }

  const currentNumber =
    Number(String(latestOfficer.employee_number).replace(/^F/i, "")) || 0;

  return `F${String(currentNumber + 1).padStart(4, "0")}`;
}

// ==========================================
// ADMIN AUTHORIZATION FOR OFFICER UPDATES
// ==========================================

function requireActiveAdmin(req, res, next) {
  try {
    const userId = Number(req.authUser?.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,

        code: "INVALID_TOKEN",

        message: "Your session is invalid. Please log in again.",
      });
    }

    const admin = db
      .prepare(
        `
        SELECT
          role,
          account_status

        FROM users

        WHERE id = ?
        `,
      )
      .get(userId);

    if (
      !admin ||
      String(admin.role).toUpperCase() !== "ADMIN" ||
      String(admin.account_status).toUpperCase() !== "ACTIVE"
    ) {
      return res.status(403).json({
        success: false,

        code: "ADMIN_REQUIRED",

        message: "An active Administrator account is required.",
      });
    }

    return next();
  } catch (error) {
    console.error("Officer update authorization error:", error);

    return res.status(500).json({
      success: false,

      code: "AUTHORIZATION_ERROR",

      message: "Unable to verify administrator access.",
    });
  }
}

// ==========================================
// PROFILE PICTURE UPLOAD
// ==========================================

const officerProfileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, officerProfileUploadDirectory);
  },

  filename: (req, file, callback) => {
    const officerId = getValidOfficerId(req.params.id) || "unknown";

    let extension = path.extname(file.originalname || "").toLowerCase();

    if (!extension) {
      switch (file.mimetype) {
        case "image/png":
          extension = ".png";
          break;

        case "image/webp":
          extension = ".webp";
          break;

        default:
          extension = ".jpg";
      }
    }

    callback(null, `officer-${officerId}-${Date.now()}${extension}`);
  },
});

// ==========================================
// PROFILE PICTURE FILTER
// ==========================================

function officerProfileFileFilter(req, file, callback) {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error(
      "Only JPG, JPEG, PNG, and WEBP images are allowed.",
    );

    error.code = "INVALID_IMAGE_TYPE";

    return callback(error, false);
  }

  callback(null, true);
}

const uploadOfficerProfile = multer({
  storage: officerProfileStorage,

  fileFilter: officerProfileFileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ==========================================
// HANDLE PROFILE PICTURE UPLOAD
// ==========================================

function handleOfficerProfileUpload(req, res, next) {
  uploadOfficerProfile.single("profilePicture")(req, res, (error) => {
    if (!error) {
      return next();
    }

    console.error("Officer profile upload middleware error:", error);

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,

          code: "PROFILE_PICTURE_TOO_LARGE",

          message: "Profile picture must be 5 MB or smaller.",
        });
      }

      return res.status(400).json({
        success: false,

        code: "PROFILE_PICTURE_UPLOAD_ERROR",

        message: error.message || "Unable to upload profile picture.",
      });
    }

    return res.status(400).json({
      success: false,

      code: error.code || "INVALID_PROFILE_PICTURE",

      message: error.message || "Invalid profile picture.",
    });
  });
}

// ==========================================
// GET NEXT EMPLOYEE NUMBER
// GET /api/officers/next-id
// ==========================================

router.get("/next-id", (req, res) => {
  try {
    return res.json({
      success: true,

      employeeNumber: generateNextEmployeeNumber(),
    });
  } catch (error) {
    console.error("Generate officer number error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to generate officer number.",

      error: error.message,
    });
  }
});

// ==========================================
// GET ALL OFFICERS
// GET /api/officers
//
// Archived officers are excluded.
// ==========================================

router.get("/", (req, res) => {
  try {
    const officers = db
      .prepare(
        `
          SELECT
            u.id,

            fo.id
              AS officer_profile_id,

            fo.employee_number,

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

            u.profile_picture_uri,

            fo.assigned_area,

            u.account_status,

            fo.created_at,
            fo.updated_at,

            COUNT(f.id)
              AS total_fines_recorded

          FROM users u

          INNER JOIN fines_officers fo
            ON fo.user_id = u.id

          LEFT JOIN fines f
            ON f.recorded_by = u.id

          WHERE
            u.role = 'FINES_OFFICER'

            AND u.username NOT LIKE
              '__archived_officer_%'

          GROUP BY
            u.id,

            fo.id,

            fo.employee_number,

            u.username,

            u.first_name,
            u.middle_name,
            u.last_name,

            u.email,
            u.contact_number,

            u.profile_picture_uri,

            fo.assigned_area,

            u.account_status,

            fo.created_at,
            fo.updated_at

          ORDER BY
            u.last_name ASC,
            u.first_name ASC
          `,
      )
      .all();

    return res.json({
      success: true,

      officers,
    });
  } catch (error) {
    console.error("Load officers error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load officers.",

      error: error.message,
    });
  }
});

// ==========================================
// CREATE OFFICER
// POST /api/officers
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

      assignedArea,

      password,

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
      !assignedArea ||
      !password
    ) {
      return res.status(400).json({
        success: false,

        code: "MISSING_FIELDS",

        message: "Please complete all required officer information.",
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

    const normalizedAssignedArea = String(assignedArea).trim();

    const normalizedStatus = String(accountStatus || "ACTIVE").toUpperCase();

    const passwordValue = String(password);

    const suggestedUsername = generateSuggestedUsername(
      normalizedFirstName,
      normalizedLastName,
    );

    const normalizedUsername = String(username || suggestedUsername)
      .trim()
      .toLowerCase();

    // ====================================
    // USERNAME
    // ====================================

    if (!normalizedUsername) {
      return res.status(400).json({
        success: false,

        code: "USERNAME_REQUIRED",

        message: "Username is required.",
      });
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

    const existingUsername = db
      .prepare(
        `
            SELECT
              id

            FROM users

            WHERE
              LOWER(username) =
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
    // NAME VALIDATION
    // ====================================

    if (normalizedFirstName.length < 2) {
      return res.status(400).json({
        success: false,

        code: "INVALID_FIRST_NAME",

        message: "First Name must contain at least 2 characters.",
      });
    }

    if (normalizedLastName.length < 2) {
      return res.status(400).json({
        success: false,

        code: "INVALID_LAST_NAME",

        message: "Last Name must contain at least 2 characters.",
      });
    }

    // ====================================
    // EMAIL
    // ====================================

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
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
    // ASSIGNED AREA
    // ====================================

    if (normalizedAssignedArea.length < 2) {
      return res.status(400).json({
        success: false,

        code: "INVALID_ASSIGNED_AREA",

        message: "Please enter a valid assigned area.",
      });
    }

    // ====================================
    // STATUS
    // ====================================

    if (normalizedStatus !== "ACTIVE" && normalizedStatus !== "INACTIVE") {
      return res.status(400).json({
        success: false,

        code: "INVALID_ACCOUNT_STATUS",

        message: "Account status must be ACTIVE or INACTIVE.",
      });
    }

    // ====================================
    // PASSWORD
    // ====================================

    if (passwordValue.length < 8) {
      return res.status(400).json({
        success: false,

        code: "WEAK_PASSWORD",

        message: "Password must contain at least 8 characters.",
      });
    }

    if (!/[A-Za-z]/.test(passwordValue)) {
      return res.status(400).json({
        success: false,

        code: "PASSWORD_LETTER_REQUIRED",

        message: "Password must contain at least one letter.",
      });
    }

    if (!/[0-9]/.test(passwordValue)) {
      return res.status(400).json({
        success: false,

        code: "PASSWORD_NUMBER_REQUIRED",

        message: "Password must contain at least one number.",
      });
    }

    if (!/[^A-Za-z0-9\s]/.test(passwordValue)) {
      return res.status(400).json({
        success: false,

        code: "PASSWORD_SPECIAL_REQUIRED",

        message:
          "Password must contain at least one special character such as !, @, #, $, %, or &.",
      });
    }

    // ====================================
    // EMPLOYEE NUMBER
    // ====================================

    const employeeNumber = generateNextEmployeeNumber();

    const existingEmployeeNumber = db
      .prepare(
        `
            SELECT
              id

            FROM fines_officers

            WHERE
              employee_number = ?
            `,
      )
      .get(employeeNumber);

    if (existingEmployeeNumber) {
      return res.status(409).json({
        success: false,

        code: "EMPLOYEE_NUMBER_EXISTS",

        message:
          "The generated employee number already exists. Please reload and try again.",
      });
    }

    // ====================================
    // PASSWORD HASH
    // ====================================

    const passwordHash = await bcrypt.hash(passwordValue, 10);

    let createdUserId = null;

    // ====================================
    // CREATE TRANSACTION
    // ====================================

    try {
      db.exec("BEGIN TRANSACTION;");

      const userResult = db
        .prepare(
          `
              INSERT INTO users (
                username,

                first_name,
                middle_name,
                last_name,

                email,

                contact_number,

                password_hash,

                role,

                account_status,

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

                'FINES_OFFICER',

                ?,

                NULL
              )
              `,
        )
        .run(
          normalizedUsername,

          normalizedFirstName,
          normalizedMiddleName,
          normalizedLastName,

          normalizedEmail,

          normalizedContactNumber,

          passwordHash,

          normalizedStatus,
        );

      createdUserId = Number(userResult.lastInsertRowid);

      db.prepare(
        `
            INSERT INTO fines_officers (
              user_id,

              employee_number,

              assigned_area
            )

            VALUES (
              ?,
              ?,
              ?
            )
            `,
      ).run(
        createdUserId,

        employeeNumber,

        normalizedAssignedArea,
      );

      db.exec("COMMIT;");
    } catch (transactionError) {
      try {
        db.exec("ROLLBACK;");
      } catch (rollbackError) {
        console.error("Officer rollback error:", rollbackError);
      }

      throw transactionError;
    }

    const fullName = formatName(
      normalizedFirstName,
      normalizedMiddleName,
      normalizedLastName,
    );

    return res.status(201).json({
      success: true,

      message: "Officer account created successfully.",

      officer: {
        id: createdUserId,

        employeeNumber,

        employee_number: employeeNumber,

        username: normalizedUsername,

        firstName: normalizedFirstName,

        first_name: normalizedFirstName,

        middleName: normalizedMiddleName,

        middle_name: normalizedMiddleName,

        lastName: normalizedLastName,

        last_name: normalizedLastName,

        fullName,

        full_name: fullName,

        email: normalizedEmail,

        contactNumber: normalizedContactNumber,

        contact_number: normalizedContactNumber,

        assignedArea: normalizedAssignedArea,

        assigned_area: normalizedAssignedArea,

        accountStatus: normalizedStatus,

        account_status: normalizedStatus,

        profile_picture_uri: null,

        role: "FINES_OFFICER",
      },
    });
  } catch (error) {
    console.error("Create officer error:", error);

    return res.status(500).json({
      success: false,

      code: "CREATE_OFFICER_ERROR",

      message: "Failed to create officer account.",

      error: error.message,
    });
  }
});

// ==========================================
// UPLOAD / CHANGE OFFICER PROFILE PICTURE
// POST /api/officers/:id/profile-picture
// ==========================================

router.post(
  "/:id/profile-picture",

  handleOfficerProfileUpload,

  (req, res) => {
    const officerId = getValidOfficerId(req.params.id);

    if (officerId === null) {
      deleteUploadedFile(req.file);

      return res.status(400).json({
        success: false,

        code: "INVALID_OFFICER_ID",

        message: "Invalid officer ID.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,

        code: "PROFILE_PICTURE_REQUIRED",

        message: "Please select a profile picture.",
      });
    }

    try {
      const officer = findOfficerById(officerId);

      if (!officer) {
        deleteUploadedFile(req.file);

        return res.status(404).json({
          success: false,

          code: "OFFICER_NOT_FOUND",

          message: "Officer not found.",
        });
      }

      const oldProfilePictureUri = officer.profile_picture_uri;

      const newProfilePictureUri = `/uploads/officer-profiles/${req.file.filename}`;

      db.prepare(
        `
          UPDATE users

          SET
            profile_picture_uri = ?,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE
            id = ?

            AND role =
              'FINES_OFFICER'
          `,
      ).run(
        newProfilePictureUri,

        officerId,
      );

      if (
        oldProfilePictureUri &&
        oldProfilePictureUri !== newProfilePictureUri
      ) {
        deleteOfficerProfileFile(oldProfilePictureUri);
      }

      return res.json({
        success: true,

        message: "Officer profile picture updated successfully.",

        profile_picture_uri: newProfilePictureUri,

        officer: {
          id: officerId,

          profile_picture_uri: newProfilePictureUri,
        },
      });
    } catch (error) {
      deleteUploadedFile(req.file);

      console.error("Upload officer profile picture error:", error);

      return res.status(500).json({
        success: false,

        code: "OFFICER_PROFILE_UPLOAD_ERROR",

        message: "Failed to update officer profile picture.",

        error: error.message,
      });
    }
  },
);

// ==========================================
// REMOVE OFFICER PROFILE PICTURE
// DELETE /api/officers/:id/profile-picture
// ==========================================

router.delete("/:id/profile-picture", (req, res) => {
  try {
    const officerId = getValidOfficerId(req.params.id);

    if (officerId === null) {
      return res.status(400).json({
        success: false,

        code: "INVALID_OFFICER_ID",

        message: "Invalid officer ID.",
      });
    }

    const officer = findOfficerById(officerId);

    if (!officer) {
      return res.status(404).json({
        success: false,

        code: "OFFICER_NOT_FOUND",

        message: "Officer not found.",
      });
    }

    const oldProfilePictureUri = officer.profile_picture_uri;

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

            AND role =
              'FINES_OFFICER'
          `,
    ).run(officerId);

    if (oldProfilePictureUri) {
      deleteOfficerProfileFile(oldProfilePictureUri);
    }

    return res.json({
      success: true,

      message: oldProfilePictureUri
        ? "Officer profile picture removed successfully."
        : "Officer does not have a profile picture.",

      officer: {
        id: officerId,

        profile_picture_uri: null,
      },
    });
  } catch (error) {
    console.error("Remove officer profile picture error:", error);

    return res.status(500).json({
      success: false,

      code: "REMOVE_OFFICER_PROFILE_ERROR",

      message: "Failed to remove officer profile picture.",

      error: error.message,
    });
  }
});

// ==========================================
// GET SINGLE OFFICER
// GET /api/officers/:id
//
// FIX:
// Active Fine Records now excludes:
// - paid fines
// - cancelled fines
// - waived fines
//
// Recent fine status also uses paid_at
// and cancelled_at as source of truth.
// ==========================================

router.get("/:id", (req, res) => {
  try {
    const officerId = getValidOfficerId(req.params.id);

    if (officerId === null) {
      return res.status(400).json({
        success: false,

        code: "INVALID_OFFICER_ID",

        message: "Invalid officer ID.",
      });
    }

    const officer = db
      .prepare(
        `
            SELECT
              u.id,

              fo.id
                AS officer_profile_id,

              fo.employee_number,

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

              u.profile_picture_uri,

              fo.assigned_area,

              u.account_status,

              fo.created_at,

              fo.updated_at

            FROM users u

            INNER JOIN fines_officers fo
              ON fo.user_id = u.id

            WHERE
              u.id = ?

              AND u.role =
                'FINES_OFFICER'

              AND u.username NOT LIKE
                '__archived_officer_%'
            `,
      )
      .get(officerId);

    if (!officer) {
      return res.status(404).json({
        success: false,

        code: "OFFICER_NOT_FOUND",

        message: "Officer not found.",
      });
    }

    // ====================================
    // FINE STATISTICS
    // ====================================

    const fineStats = db
      .prepare(
        `
            SELECT
              COUNT(*)
                AS total_fines,

              COALESCE(
                SUM(
                  CASE
                    WHEN
                      cancelled_at
                        IS NULL

                      AND paid_at
                        IS NULL

                      AND UPPER(
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

                    THEN 1

                    ELSE 0
                  END
                ),
                0
              ) AS active_fines

            FROM fines

            WHERE
              recorded_by = ?
            `,
      )
      .get(officerId);

    // ====================================
    // RECENT FINES
    // ====================================

    const recentFines = db
      .prepare(
        `
            SELECT
              f.id,

              f.fine_reference,

              f.amount_centavos
                / 100.0
                AS amount,

              f.issued_at,

              CASE
                WHEN
                  f.cancelled_at
                    IS NOT NULL

                  OR UPPER(
                    COALESCE(
                      f.fine_status,
                      ''
                    )
                  ) = 'CANCELLED'

                THEN 'CANCELLED'

                WHEN
                  f.paid_at
                    IS NOT NULL

                  OR UPPER(
                    COALESCE(
                      f.fine_status,
                      ''
                    )
                  ) = 'PAID'

                THEN 'PAID'

                WHEN
                  UPPER(
                    COALESCE(
                      f.fine_status,
                      ''
                    )
                  ) = 'WAIVED'

                THEN 'WAIVED'

                WHEN
                  UPPER(
                    COALESCE(
                      f.fine_status,
                      ''
                    )
                  ) = 'PENDING'

                THEN 'PENDING'

                ELSE 'UNPAID'
              END AS fine_status,

              TRIM(
                student.first_name || ' ' ||
                COALESCE(
                  student.middle_name || ' ',
                  ''
                ) ||
                student.last_name
              ) AS student_name,

              COALESCE(
                student.student_number,
                student.username
              ) AS student_number,

              vt.violation_name

            FROM fines f

            INNER JOIN users student
              ON
                student.id =
                f.student_id

            INNER JOIN violation_types vt
              ON
                vt.id =
                f.violation_type_id

            WHERE
              f.recorded_by = ?

            ORDER BY
              f.issued_at DESC,
              f.id DESC

            LIMIT 10
            `,
      )
      .all(officerId);

    return res.json({
      success: true,

      officer,

      stats: {
        totalFines: Number(fineStats.total_fines || 0),

        activeFines: Number(fineStats.active_fines || 0),
      },

      recentFines,
    });
  } catch (error) {
    console.error("Officer profile error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load officer profile.",

      error: error.message,
    });
  }
});

// ==========================================
// UPDATE OFFICER
// PUT /api/officers/:id
//
// Requires an active Admin account.
// Employee number and picture are preserved.
// Blank password fields preserve password.
// ==========================================

router.put(
  "/:id",

  authenticateToken,

  requireActiveAdmin,

  async (req, res) => {
    try {
      const officerId = getValidOfficerId(req.params.id);

      if (officerId === null) {
        return res.status(400).json({
          success: false,

          code: "INVALID_OFFICER_ID",

          message: "Invalid officer ID.",
        });
      }

      const existingOfficer = findOfficerById(officerId);

      if (!existingOfficer) {
        return res.status(404).json({
          success: false,

          code: "OFFICER_NOT_FOUND",

          message: "Officer not found.",
        });
      }

      const {
        username,

        firstName,

        middleName,

        lastName,

        email,

        contactNumber,

        assignedArea,

        accountStatus,
      } = req.body;

      // ====================================
      // REQUIRED
      // ====================================

      if (
        !username ||
        !firstName ||
        !lastName ||
        !email ||
        !contactNumber ||
        !assignedArea
      ) {
        return res.status(400).json({
          success: false,

          code: "MISSING_FIELDS",

          message: "Please complete all required officer information.",
        });
      }

      // ====================================
      // NORMALIZE
      // ====================================

      const normalizedUsername = String(username).trim().toLowerCase();

      const normalizedFirstName = String(firstName).trim();

      const normalizedMiddleName = middleName
        ? String(middleName).trim()
        : null;

      const normalizedLastName = String(lastName).trim();

      const normalizedEmail = String(email).trim().toLowerCase();

      const normalizedContactNumber = String(contactNumber).trim();

      const normalizedAssignedArea = String(assignedArea).trim();

      const normalizedStatus = String(accountStatus || "ACTIVE").toUpperCase();

      // ====================================
      // USERNAME
      // ====================================

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

      // ====================================
      // NAME
      // ====================================

      if (normalizedFirstName.length < 2) {
        return res.status(400).json({
          success: false,

          code: "INVALID_FIRST_NAME",

          message: "First Name must contain at least 2 characters.",
        });
      }

      if (normalizedLastName.length < 2) {
        return res.status(400).json({
          success: false,

          code: "INVALID_LAST_NAME",

          message: "Last Name must contain at least 2 characters.",
        });
      }

      // ====================================
      // DUPLICATE USERNAME
      // ====================================

      const duplicateUsername = db
        .prepare(
          `
            SELECT
              id

            FROM users

            WHERE
              LOWER(username) =
                LOWER(?)

              AND id != ?
            `,
        )
        .get(
          normalizedUsername,

          officerId,
        );

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
            SELECT
              id

            FROM users

            WHERE
              LOWER(email) =
                LOWER(?)

              AND id != ?
            `,
        )
        .get(
          normalizedEmail,

          officerId,
        );

      if (duplicateEmail) {
        return res.status(409).json({
          success: false,

          code: "EMAIL_EXISTS",

          message:
            "This email address is already being used by another account.",
        });
      }

      // ====================================
      // CONTACT
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
      // ASSIGNED AREA
      // ====================================

      if (normalizedAssignedArea.length < 2) {
        return res.status(400).json({
          success: false,

          code: "INVALID_ASSIGNED_AREA",

          message: "Please enter a valid assigned area.",
        });
      }

      // ====================================
      // STATUS
      // ====================================

      if (normalizedStatus !== "ACTIVE" && normalizedStatus !== "INACTIVE") {
        return res.status(400).json({
          success: false,

          code: "INVALID_ACCOUNT_STATUS",

          message: "Account status must be ACTIVE or INACTIVE.",
        });
      }

      // ====================================
      // OPTIONAL PASSWORD
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
        if (newPassword !== confirmPassword) {
          return res.status(400).json({
            success: false,

            code: "PASSWORD_MISMATCH",

            message: "New password and confirmation do not match.",
          });
        }

        if (
          newPassword.length < 8 ||
          !/[A-Za-z]/.test(newPassword) ||
          !/[0-9]/.test(newPassword) ||
          !/[^A-Za-z0-9\s]/.test(newPassword)
        ) {
          return res.status(400).json({
            success: false,

            code: "WEAK_PASSWORD",

            message:
              "Password must contain at least 8 characters, a letter, a number, and a special character.",
          });
        }

        newPasswordHash = await bcrypt.hash(newPassword, 10);
      }

      // ====================================
      // UPDATE TRANSACTION
      // ====================================

      try {
        db.exec("BEGIN TRANSACTION;");

        const updateResult = db
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

                account_status = ?,

                updated_at =
                  CURRENT_TIMESTAMP

              WHERE
                id = ?

                AND role =
                  'FINES_OFFICER'
              `,
          )
          .run(
            normalizedUsername,

            normalizedFirstName,

            normalizedMiddleName,

            normalizedLastName,

            normalizedEmail,

            normalizedContactNumber,

            normalizedStatus,

            officerId,
          );

        if (Number(updateResult.changes) !== 1) {
          throw new Error("The officer account could not be updated.");
        }

        const profileResult = db
          .prepare(
            `
              UPDATE fines_officers

              SET
                assigned_area = ?,

                updated_at =
                  CURRENT_TIMESTAMP

              WHERE
                user_id = ?
              `,
          )
          .run(
            normalizedAssignedArea,

            officerId,
          );

        if (Number(profileResult.changes) !== 1) {
          throw new Error("The officer profile could not be updated.");
        }

        // ==================================
        // OPTIONAL PASSWORD
        // ==================================

        if (newPasswordHash !== null) {
          db.prepare(
            `
              UPDATE users

              SET
                password_hash = ?,

                failed_login_attempts =
                  0,

                locked_until =
                  NULL,

                lockout_count =
                  0,

                updated_at =
                  CURRENT_TIMESTAMP

              WHERE
                id = ?

                AND role =
                  'FINES_OFFICER'
              `,
          ).run(
            newPasswordHash,

            officerId,
          );
        }

        db.exec("COMMIT;");
      } catch (transactionError) {
        try {
          db.exec("ROLLBACK;");
        } catch (rollbackError) {
          console.error("Officer update rollback error:", rollbackError);
        }

        throw transactionError;
      }

      // ====================================
      // SUCCESS
      // ====================================

      const fullName = formatName(
        normalizedFirstName,
        normalizedMiddleName,
        normalizedLastName,
      );

      return res.json({
        success: true,

        message: passwordChanged
          ? "Officer information and password updated successfully."
          : "Officer information updated successfully.",

        passwordChanged,

        officer: {
          id: officerId,

          employeeNumber: existingOfficer.employee_number,

          employee_number: existingOfficer.employee_number,

          username: normalizedUsername,

          firstName: normalizedFirstName,

          first_name: normalizedFirstName,

          middleName: normalizedMiddleName,

          middle_name: normalizedMiddleName,

          lastName: normalizedLastName,

          last_name: normalizedLastName,

          fullName,

          full_name: fullName,

          email: normalizedEmail,

          contactNumber: normalizedContactNumber,

          contact_number: normalizedContactNumber,

          assignedArea: normalizedAssignedArea,

          assigned_area: normalizedAssignedArea,

          accountStatus: normalizedStatus,

          account_status: normalizedStatus,

          profile_picture_uri: existingOfficer.profile_picture_uri,
        },
      });
    } catch (error) {
      console.error("Update officer error:", error);

      return res.status(500).json({
        success: false,

        code: "UPDATE_OFFICER_ERROR",

        message: "Failed to update officer information.",
      });
    }
  },
);

// ==========================================
// DELETE / ARCHIVE OFFICER
// DELETE /api/officers/:id
//
// RULES:
//
// ACTIVE:
// Cannot be removed.
//
// INACTIVE + unresolved fine:
// Cannot be removed.
//
// INACTIVE + only resolved fine history:
// Archive officer but preserve users.id
// so fines.recorded_by remains valid.
//
// INACTIVE + no fine history:
// Permanently delete officer.
// ==========================================

router.delete("/:id", (req, res) => {
  try {
    const officerId = getValidOfficerId(req.params.id);

    // ====================================
    // ID
    // ====================================

    if (officerId === null) {
      return res.status(400).json({
        success: false,

        code: "INVALID_OFFICER_ID",

        message: "Invalid officer ID.",
      });
    }

    // ====================================
    // OFFICER
    // ====================================

    const officer = findOfficerById(officerId);

    if (!officer) {
      return res.status(404).json({
        success: false,

        code: "OFFICER_NOT_FOUND",

        message: "Officer not found.",
      });
    }

    // ====================================
    // MUST BE INACTIVE
    // ====================================

    const status = String(officer.account_status || "").toUpperCase();

    if (status !== "INACTIVE") {
      return res.status(409).json({
        success: false,

        code: "OFFICER_ACTIVE",

        message:
          "Active officers cannot be removed. Edit the officer and set the account status to Inactive first.",
      });
    }

    // ====================================
    // CHECK UNRESOLVED FINES
    // ====================================

    const activeFineResult = db
      .prepare(
        `
            SELECT
              COUNT(*) AS total

            FROM fines

            WHERE
              recorded_by = ?

              AND cancelled_at
                IS NULL

              AND paid_at
                IS NULL

              AND UPPER(
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
      .get(officerId);

    const activeFineCount = Number(activeFineResult?.total || 0);

    if (activeFineCount > 0) {
      return res.status(409).json({
        success: false,

        code: "OFFICER_HAS_ACTIVE_FINES",

        message:
          "This officer cannot be removed because there are still unpaid or pending fine records. Resolve those fines first.",

        records: {
          activeFines: activeFineCount,
        },
      });
    }

    // ====================================
    // COUNT ALL HISTORICAL FINES
    // ====================================

    const fineResult = db
      .prepare(
        `
            SELECT
              COUNT(*) AS total

            FROM fines

            WHERE
              recorded_by = ?
            `,
      )
      .get(officerId);

    const fineCount = Number(fineResult?.total || 0);

    // ====================================
    // HAS HISTORY
    //
    // ARCHIVE INSTEAD OF DELETE.
    // ====================================

    if (fineCount > 0) {
      const archiveTimestamp = Date.now();

      const archivedUsername = `${ARCHIVED_OFFICER_USERNAME_PREFIX}${officer.id}_${archiveTimestamp}`;

      const archivedEmail = `archived-officer-${officer.id}-${archiveTimestamp}@smartfine.local`;

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

                AND role =
                  'FINES_OFFICER'
              `,
        )
        .run(
          archivedUsername,

          archivedEmail,

          officerId,
        );

      if (Number(archiveResult.changes) === 0) {
        return res.status(500).json({
          success: false,

          code: "OFFICER_ARCHIVE_FAILED",

          message: "The officer account could not be removed.",
        });
      }

      // ==================================
      // DELETE OLD PROFILE FILE
      // ==================================

      if (officer.profile_picture_uri) {
        deleteOfficerProfileFile(officer.profile_picture_uri);
      }

      return res.json({
        success: true,

        code: "OFFICER_ARCHIVED",

        archived: true,

        message:
          "Officer removed successfully. Historical fine records were preserved.",

        deletedOfficer: {
          id: officer.id,

          employeeNumber: officer.employee_number,

          name: formatName(
            officer.first_name,
            officer.middle_name,
            officer.last_name,
          ),
        },

        preservedRecords: {
          fines: fineCount,
        },
      });
    }

    // ====================================
    // NO FINE HISTORY
    //
    // SAFE TO PERMANENTLY DELETE.
    // ====================================

    const result = db
      .prepare(
        `
            DELETE FROM users

            WHERE
              id = ?

              AND role =
                'FINES_OFFICER'
            `,
      )
      .run(officerId);

    if (Number(result.changes) === 0) {
      return res.status(404).json({
        success: false,

        code: "OFFICER_NOT_DELETED",

        message: "Officer could not be deleted.",
      });
    }

    if (officer.profile_picture_uri) {
      deleteOfficerProfileFile(officer.profile_picture_uri);
    }

    return res.json({
      success: true,

      code: "OFFICER_DELETED",

      archived: false,

      message: "Officer deleted successfully.",

      deletedOfficer: {
        id: officer.id,

        employeeNumber: officer.employee_number,

        username: officer.username,

        name: formatName(
          officer.first_name,
          officer.middle_name,
          officer.last_name,
        ),
      },
    });
  } catch (error) {
    console.error("Delete officer error:", error);

    return res.status(500).json({
      success: false,

      code: "DELETE_OFFICER_ERROR",

      message: "Failed to remove officer.",

      error: error.message,
    });
  }
});

module.exports = router;
