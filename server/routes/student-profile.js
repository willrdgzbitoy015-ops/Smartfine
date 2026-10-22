const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const db = require("../database/database");
const { authenticateToken } = require("./auth");

const router = express.Router();

const photoDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "student-profiles",
);
const photoPrefix = "/uploads/student-profiles/";

const imageExtensions = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 0,
  },
  fileFilter(req, file, callback) {
    const allowed = Boolean(imageExtensions[file.mimetype]);

    callback(
      allowed ? null : new Error("Only JPG, PNG, and WEBP images are allowed."),
      allowed,
    );
  },
}).single("profilePicture");

router.use(authenticateToken);

router.use((req, res, next) => {
  try {
    const userId = Number(req.authUser?.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Your session is invalid. Please log in again.",
      });
    }

    const student = db
      .prepare(
        `
        SELECT id
        FROM users
        WHERE id = ?
          AND role = 'STUDENT'
          AND account_status = 'ACTIVE'
        LIMIT 1
        `,
      )
      .get(userId);

    if (!student) {
      return res.status(403).json({
        success: false,
        message: "An active Student account is required.",
      });
    }

    req.studentProfileUserId = userId;
    next();
  } catch (error) {
    console.error("Student profile authorization failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify your account.",
    });
  }
});

function getStudentProfile(userId) {
  const student = db
    .prepare(
      `
      SELECT
        id,
        username,
        student_number,
        first_name,
        middle_name,
        last_name,
        email,
        contact_number,
        profile_picture_uri,
        grade_level,
        section
      FROM users
      WHERE id = ?
        AND role = 'STUDENT'
        AND account_status = 'ACTIVE'
      LIMIT 1
      `,
    )
    .get(userId);

  if (!student) return null;

  const fullName = [student.first_name, student.middle_name, student.last_name]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");

  return {
    id: Number(student.id),
    username: student.username || "",
    studentId: String(student.student_number || student.username || "").trim(),
    firstName: student.first_name || "",
    middleName: student.middle_name || "",
    lastName: student.last_name || "",
    fullName: fullName || student.username || "",
    email: student.email || "",
    contactNumber: student.contact_number || "",
    profilePictureUri: student.profile_picture_uri || null,
    gradeLevel: student.grade_level || "",
    section: student.section || "",
    role: "STUDENT",
  };
}

function validateNewPassword(password) {
  if (password.length < 8) {
    return "New password must contain at least 8 characters.";
  }
  if (!/[A-Z]/.test(password)) {
    return "New password must contain at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "New password must contain at least one lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "New password must contain at least one number.";
  }
  if (!/[^A-Za-z0-9\s]/.test(password)) {
    return "New password must contain at least one special character.";
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    return "Password must not exceed 72 bytes.";
  }
  return null;
}

function actualImageExtension(bytes) {
  if (
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  ) {
    return ".jpg";
  }

  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return ".png";
  }

  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return ".webp";
  }

  return null;
}

function removeFile(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Student photo cleanup failed:", error);
    }
  }
}

// GET /api/student-profile/me
router.get("/me", (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const user = getStudentProfile(req.studentProfileUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Load student profile failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your profile.",
    });
  }
});

// PUT /api/student-profile/me
router.put("/me", (req, res) => {
  try {
    const current = getStudentProfile(req.studentProfileUserId);

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    const body = req.body || {};
    const firstName = String(body.firstName ?? current.firstName).trim();
    const middleName = String(body.middleName ?? current.middleName).trim();
    const lastName = String(body.lastName ?? current.lastName).trim();
    const requestedEmail = String(body.email ?? current.email)
      .trim()
      .toLowerCase();

    // Your own email address changes only through Change Email, which sends a
    // code to the new address first.
    if (
      requestedEmail !== String(current.email || "").trim().toLowerCase()
    ) {
      return res.status(400).json({
        success: false,
        code: "EMAIL_CHANGE_REQUIRES_VERIFICATION",
        message:
          "Use Change Email to change your email address. We send a code to the new address to confirm it.",
      });
    }

    const email = String(current.email ?? "")
      .trim()
      .toLowerCase();
    const contactNumber = String(
      body.contactNumber ?? current.contactNumber,
    ).trim();

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required.",
      });
    }

    if (
      firstName.length > 100 ||
      middleName.length > 100 ||
      lastName.length > 100 ||
      email.length > 254 ||
      contactNumber.length > 30
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more fields are too long.",
      });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (contactNumber && !/^\+?[0-9 ()-]{7,30}$/.test(contactNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid contact number.",
      });
    }

    if (email) {
      const duplicate = db
        .prepare(
          `
          SELECT id
          FROM users
          WHERE id != ?
            AND LOWER(email) = LOWER(?)
          LIMIT 1
          `,
        )
        .get(req.studentProfileUserId, email);

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "That email is already used by another account.",
        });
      }
    }

    const result = db
      .prepare(
        `
        UPDATE users
        SET first_name = ?,
            middle_name = ?,
            last_name = ?,
            email = ?,
            contact_number = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND role = 'STUDENT'
          AND account_status = 'ACTIVE'
        `,
      )
      .run(
        firstName,
        middleName || null,
        lastName,
        email || null,
        contactNumber || null,
        req.studentProfileUserId,
      );

    if (Number(result.changes) !== 1) {
      return res.status(409).json({
        success: false,
        message: "Your account is no longer available.",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: getStudentProfile(req.studentProfileUserId),
    });
  } catch (error) {
    console.error("Update student profile failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save your profile.",
    });
  }
});

// PUT /api/student-profile/me/password
router.put("/me/password", async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string" ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete all password fields.",
      });
    }

    if (Buffer.byteLength(currentPassword, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        message: "Current password is invalid.",
      });
    }

    const passwordError = validateNewPassword(newPassword);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match.",
      });
    }

    const student = db
      .prepare(
        `
        SELECT password_hash
        FROM users
        WHERE id = ?
          AND role = 'STUDENT'
          AND account_status = 'ACTIVE'
        LIMIT 1
        `,
      )
      .get(req.studentProfileUserId);

    if (!student?.password_hash) {
      return res.status(404).json({
        success: false,
        message: "Student account not found.",
      });
    }

    const correctPassword = await bcrypt.compare(
      currentPassword,
      student.password_hash,
    );

    if (!correctPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    if (await bcrypt.compare(newPassword, student.password_hash)) {
      return res.status(400).json({
        success: false,
        message: "Choose a password different from your current password.",
      });
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    const result = db
      .prepare(
        `
        UPDATE users
        SET password_hash = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND password_hash = ?
          AND role = 'STUDENT'
          AND account_status = 'ACTIVE'
        `,
      )
      .run(newHash, req.studentProfileUserId, student.password_hash);

    if (Number(result.changes) !== 1) {
      return res.status(409).json({
        success: false,
        message: "Your password changed during this request. Try again.",
      });
    }

    return res.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Change student password failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change your password.",
    });
  }
});

// POST /api/student-profile/me/profile-picture
router.post("/me/profile-picture", (req, res) => {
  uploadPhoto(req, res, (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        message:
          uploadError.code === "LIMIT_FILE_SIZE"
            ? "Profile picture must be 5 MB or smaller."
            : uploadError.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a profile picture.",
      });
    }

    const extension = actualImageExtension(req.file.buffer);

    if (!extension || extension !== imageExtensions[req.file.mimetype]) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid JPG, PNG, or WEBP image.",
      });
    }

    let savedPath;
    let committed = false;

    try {
      const current = db
        .prepare(
          `
          SELECT profile_picture_uri
          FROM users
          WHERE id = ?
            AND role = 'STUDENT'
            AND account_status = 'ACTIVE'
          LIMIT 1
          `,
        )
        .get(req.studentProfileUserId);

      if (!current) {
        return res.status(403).json({
          success: false,
          message: "Your student account is no longer available.",
        });
      }

      fs.mkdirSync(photoDirectory, { recursive: true });

      const filename =
        `student-${req.studentProfileUserId}-` +
        `${crypto.randomUUID()}${extension}`;

      savedPath = path.join(photoDirectory, filename);
      fs.writeFileSync(savedPath, req.file.buffer, { flag: "wx" });

      const uri = photoPrefix + filename;

      const result = db
        .prepare(
          `
          UPDATE users
          SET profile_picture_uri = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND role = 'STUDENT'
            AND account_status = 'ACTIVE'
          `,
        )
        .run(uri, req.studentProfileUserId);

      if (Number(result.changes) !== 1) {
        throw new Error("Student photo update affected no account.");
      }

      committed = true;

      // Remove only older files created by this student endpoint.
      const oldUri = current.profile_picture_uri;

      if (typeof oldUri === "string" && oldUri.startsWith(photoPrefix)) {
        const oldName = oldUri.slice(photoPrefix.length);
        const ownedFile = new RegExp(
          `^student-${req.studentProfileUserId}-` +
            `[0-9a-f-]+\\.(jpg|png|webp)$`,
        );

        if (ownedFile.test(oldName)) {
          const stillUsed = db
            .prepare(
              `
              SELECT id
              FROM users
              WHERE profile_picture_uri = ?
              LIMIT 1
              `,
            )
            .get(oldUri);

          if (!stillUsed) {
            removeFile(path.join(photoDirectory, oldName));
          }
        }
      }

      return res.json({
        success: true,
        message: "Profile picture updated successfully.",
        profilePictureUri: uri,
      });
    } catch (error) {
      console.error("Student photo upload failed:", error);

      if (savedPath && !committed) {
        removeFile(savedPath);
      }

      if (committed) {
        return res.json({
          success: true,
          message: "Profile picture updated successfully.",
          profilePictureUri: photoPrefix + path.basename(savedPath),
        });
      }

      return res.status(500).json({
        success: false,
        message: "Unable to save your profile picture. Please try again.",
      });
    }
  });
});

module.exports = router;
