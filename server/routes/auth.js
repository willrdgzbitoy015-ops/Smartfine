const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const db = require("../database/database");
require("../database/auth-schema");
const otp = require("../security/otp");
const { sendMail } = require("../security/mailer");

const router = express.Router();

const JWT_SECRET = "REMOVED";

// ==========================================
// PASSWORD RESET SETTINGS
// ==========================================

const PASSWORD_RESET_CODE_EXPIRY_MINUTES = 10;
const PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = 10;
const PASSWORD_RESET_RESEND_SECONDS = 60;
const MAX_PASSWORD_RESET_ATTEMPTS = 5;

const passwordResetChallenges = new Map();

// ==========================================
// ADMIN PROFILE UPLOAD DIRECTORY
// ==========================================

const adminProfileDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "admin-profiles",
);

if (!fs.existsSync(adminProfileDirectory)) {
  fs.mkdirSync(adminProfileDirectory, {
    recursive: true,
  });
}

// ==========================================
// LOGIN SECURITY SETTINGS
// ==========================================

// Lock after 3 consecutive failed attempts.
const MAX_LOGIN_ATTEMPTS = 3;

// Progressive lockout:
//
// First lockout  = 30 seconds
// Second lockout = 1 minute
// Third lockout  = 3 minutes
// Fourth+        = 5 minutes
const LOCKOUT_DURATIONS_SECONDS = [30, 60, 180, 300];

function getLockoutSeconds(lockoutCount) {
  const index = Math.min(
    Math.max(0, Number(lockoutCount) || 0),
    LOCKOUT_DURATIONS_SECONDS.length - 1,
  );

  return LOCKOUT_DURATIONS_SECONDS[index];
}

// ==========================================
// PASSWORD POLICY VALIDATION
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
// CLEAN EXPIRED PASSWORD RESET REQUESTS
// ==========================================

function cleanupPasswordResetChallenges() {
  const now = Date.now();

  for (const [challengeId, challenge] of passwordResetChallenges.entries()) {
    const codeExpiry = Number(challenge.codeExpiresAt || 0);
    const resetExpiry = Number(challenge.resetExpiresAt || 0);

    const finalExpiry = Math.max(codeExpiry, resetExpiry);

    if (finalExpiry > 0 && finalExpiry < now) {
      passwordResetChallenges.delete(challengeId);
    }
  }
}

// ==========================================
// CREATE 6-DIGIT VERIFICATION CODE
// ==========================================

function createVerificationCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

// ==========================================
// HASH PASSWORD RESET VALUE
// ==========================================

function hashPasswordResetValue(value, challengeId) {
  return crypto
    .createHash("sha256")
    .update(`${challengeId}:${value}:${JWT_SECRET}`)
    .digest("hex");
}

// ==========================================
// MASK EMAIL
// ==========================================

function maskEmail(email) {
  const normalized = String(email || "").trim();

  const atIndex = normalized.lastIndexOf("@");

  if (atIndex <= 0) {
    return normalized;
  }

  const localPart = normalized.slice(0, atIndex);

  const domain = normalized.slice(atIndex + 1);

  if (localPart.length === 1) {
    return `${localPart[0]}***@${domain}`;
  }

  if (localPart.length <= 4) {
    return (
      `${localPart[0]}` +
      `***` +
      `${localPart[localPart.length - 1]}` +
      `@${domain}`
    );
  }

  return (
    `${localPart.slice(0, 2)}` + `***` + `${localPart.slice(-1)}` + `@${domain}`
  );
}

// ==========================================
// FIND USER FOR PASSWORD RESET
// ==========================================

function findPasswordResetUser(identifier) {
  const normalized = String(identifier || "").trim();

  return db
    .prepare(
      `
      SELECT
        u.id,
        u.username,
        u.student_number,
        u.first_name,
        u.middle_name,
        u.last_name,
        u.email,
        u.password_hash,
        u.role,
        u.account_status,
        fo.employee_number

      FROM users u

      LEFT JOIN fines_officers fo
        ON fo.user_id = u.id

      WHERE
        LOWER(u.username) = LOWER(?)

        OR LOWER(
          COALESCE(
            u.student_number,
            ''
          )
        ) = LOWER(?)

        OR LOWER(
          COALESCE(
            fo.employee_number,
            ''
          )
        ) = LOWER(?)

        OR LOWER(COALESCE(u.email, '')) = LOWER(?)

      ORDER BY (LOWER(u.username) = LOWER(?)) DESC

      LIMIT 1
      `,
    )
    .get(normalized, normalized, normalized, normalized, normalized);
}

// ==========================================
// CREATE EMAIL TRANSPORTER
// ==========================================

// ==========================================
// SEND PASSWORD RESET EMAIL
// ==========================================

async function sendPasswordResetCode(user, verificationCode) {
  const fullName = [user.first_name, user.middle_name, user.last_name]
    .filter(Boolean)
    .join(" ");

  await sendMail({
    to: user.email,

    subject: "SmartFine Password Reset Verification",

    text:
      `Hello ${fullName || user.username},\n\n` +
      `Your SmartFine password reset verification code is:\n\n` +
      `${verificationCode}\n\n` +
      `This code expires in ${PASSWORD_RESET_CODE_EXPIRY_MINUTES} minutes.\n\n` +
      `If you did not request a password reset, you can ignore this message.\n\n` +
      `SmartFine`,

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 520px;
          margin: auto;
          color: #123266;
        "
      >
        <h2
          style="
            color: #173A73;
            margin-bottom: 20px;
          "
        >
          SmartFine
        </h2>

        <p>
          Hello ${fullName || user.username},
        </p>

        <p>
          Use the verification code below
          to reset your SmartFine password.
        </p>

        <div
          style="
            margin: 24px 0;
            padding: 18px;
            background: #F1F4F8;
            border-radius: 8px;
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #173A73;
          "
        >
          ${verificationCode}
        </div>

        <p>
          This verification code expires
          in ${PASSWORD_RESET_CODE_EXPIRY_MINUTES}
          minutes.
        </p>

        <p>
          If you did not request a password
          reset, you can safely ignore this
          email.
        </p>

        <p>
          SmartFine
        </p>
      </div>
    `,
  });
}

// ==========================================
// JWT AUTHENTICATION
// ==========================================

function authenticateToken(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Authentication is required.",
      });
    }

    const token = authorizationHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET);

    req.authUser = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: "INVALID_TOKEN",
      message: "Your session is invalid or has expired.",
    });
  }
}

// ==========================================
// ADMIN ONLY
// ==========================================

function requireAdmin(req, res, next) {
  const role = String(req.authUser?.role || "").toUpperCase();

  if (role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      code: "ADMIN_REQUIRED",
      message: "Administrator access is required.",
    });
  }

  // A deactivated or deleted administrator's session stops working at once.
  const user = db
    .prepare("SELECT role, account_status FROM users WHERE id = ?")
    .get(req.authUser?.userId);

  if (!user || user.role !== "ADMIN" || user.account_status !== "ACTIVE") {
    return res.status(403).json({
      success: false,
      code: "ADMIN_INACTIVE",
      message:
        "This administrator account is no longer active. Please contact another SmartFine administrator.",
    });
  }

  next();
}

// ==========================================
// PERSON NAME
// ==========================================

// Letters (any language), spaces, periods, apostrophes and hyphens.
const NAME_PATTERN = /^\p{L}[\p{L} .'-]*$/u;

// Returns an error response body, or null when the names are valid.
function validatePersonName({ firstName, middleName, lastName }) {
  const checks = [
    ["First name", firstName, true, "INVALID_FIRST_NAME"],
    ["Middle name", middleName, false, "INVALID_MIDDLE_NAME"],
    ["Last name", lastName, true, "INVALID_LAST_NAME"],
  ];

  for (const [label, value, required, code] of checks) {
    if (!value) {
      if (required) {
        return { code, message: `${label} is required.` };
      }

      continue;
    }

    if (value.length < 2 || value.length > 50) {
      return { code, message: `${label} must be 2 to 50 characters.` };
    }

    if (!NAME_PATTERN.test(value)) {
      return {
        code,
        message: `${label} may only contain letters, spaces, periods, apostrophes and hyphens.`,
      };
    }
  }

  return null;
}

// ==========================================
// GET CURRENT USER
// ==========================================

function getCurrentUser(userId) {
  return db
    .prepare(
      `
      SELECT
        id,
        username,
        first_name,
        middle_name,
        last_name,
        email,
        contact_number,
        role,
        account_status,
        is_verified,
        profile_picture_uri,
        created_at,
        updated_at

      FROM users

      WHERE id = ?

      LIMIT 1
      `,
    )
    .get(userId);
}

// ==========================================
// FORMAT USER
// ==========================================

function formatUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: Number(user.id),

    username: user.username,

    firstName: user.first_name,

    middleName: user.middle_name,

    lastName: user.last_name,

    fullName: [user.first_name, user.middle_name, user.last_name]
      .filter(Boolean)
      .join(" "),

    email: user.email,

    contactNumber: user.contact_number,

    role: user.role,

    accountStatus: user.account_status,

    isVerified: Boolean(user.is_verified),

    profilePictureUri: user.profile_picture_uri,

    createdAt: user.created_at,

    updatedAt: user.updated_at,
  };
}

// ==========================================
// DELETE OLD ADMIN PROFILE FILE
// ==========================================

function removeAdminProfileFile(profilePictureUri) {
  try {
    if (!profilePictureUri) {
      return;
    }

    if (!profilePictureUri.startsWith("/uploads/admin-profiles/")) {
      return;
    }

    const filename = path.basename(profilePictureUri);

    const fullPath = path.join(adminProfileDirectory, filename);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error("Failed to remove old admin profile picture:", error);
  }
}

// ==========================================
// MULTER STORAGE
// ==========================================

const profileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, adminProfileDirectory);
  },

  filename: (req, file, callback) => {
    const extension =
      path.extname(file.originalname || "").toLowerCase() || ".jpg";

    const userId = req.authUser?.userId || "admin";

    callback(null, `admin-${userId}-${Date.now()}${extension}`);
  },
});

// ==========================================
// PROFILE FILE FILTER
// ==========================================

const profileUpload = multer({
  storage: profileStorage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only JPG, JPEG, PNG, and WEBP images are allowed."),
      );
    }

    callback(null, true);
  },
});

// ==========================================
// PROFILE UPLOAD MIDDLEWARE
// ==========================================

function uploadProfilePicture(req, res, next) {
  profileUpload.single("profilePicture")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          code: "FILE_TOO_LARGE",
          message: "Profile picture must be 5MB or smaller.",
        });
      }

      return res.status(400).json({
        success: false,
        code: "UPLOAD_ERROR",
        message: error.message,
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        code: "INVALID_IMAGE",
        message: error.message,
      });
    }

    next();
  });
}

// ==========================================
// LOGIN ROUTE
//
// POST /api/auth/login
// ==========================================

// The token and user details a successful sign-in returns.
function buildLoginSuccess(user) {
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },

    JWT_SECRET,

    {
      expiresIn: "8h",
    },
  );

  return {
    success: true,
    message: "Login successful.",

    token,

    user: {
      id: user.id,

      username: user.username,

      firstName: user.first_name,

      middleName: user.middle_name,

      lastName: user.last_name,

      email: user.email,

      contactNumber: user.contact_number,

      profilePictureUri: user.profile_picture_uri,

      role: user.role,
    },
  };
}

router.post(
  "/login",

  async (req, res) => {
    try {
      const { username, password } = req.body;

      // ====================================
      // REQUIRED CREDENTIALS
      // ====================================

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          code: "MISSING_CREDENTIALS",
          message: "Username and password are required.",
        });
      }

      const normalizedUsername = String(username).trim();

      // ====================================
      // FIND ACCOUNT
      // ====================================

      const statement = db.prepare(
        `
          SELECT
            id,
            username,
            first_name,
            middle_name,
            last_name,
            email,
            contact_number,
            profile_picture_uri,
            password_hash,
            role,
            account_status,
            is_verified,
            failed_login_attempts,
            locked_until,
            lockout_count,
            needs_first_login

          FROM users

          WHERE username = ?
             OR LOWER(email) = LOWER(?)

          ORDER BY (username = ?) DESC

          LIMIT 1
          `,
      );

      // The first box accepts the username or the email address.
      const user = statement.get(
        normalizedUsername,
        normalizedUsername,
        normalizedUsername,
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          code: "INVALID_CREDENTIALS",
          message: "Invalid username or password.",
        });
      }

      // ====================================
      // ACCOUNT STATUS
      // ====================================

      const accountStatus = String(user.account_status || "").toUpperCase();

      if (accountStatus === "DEACTIVATED") {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_DEACTIVATED",
          message:
            "This account has been deactivated. Please contact the SmartFine administrator.",
        });
      }

      if (accountStatus === "LOCKED") {
        return res.status(423).json({
          success: false,
          code: "ACCOUNT_LOCKED_BY_ADMIN",
          message:
            "This account has been locked by an administrator. Please contact the SmartFine administrator.",
          lockedByAdmin: true,
        });
      }

      if (accountStatus !== "ACTIVE") {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_UNAVAILABLE",
          message:
            "This account is currently unavailable. Please contact the SmartFine administrator.",
        });
      }

      // ====================================
      // CHECK CURRENT LOCKOUT
      // ====================================

      if (user.locked_until) {
        const lockedUntilTime = new Date(user.locked_until).getTime();

        const currentTime = Date.now();

        if (!Number.isNaN(lockedUntilTime) && lockedUntilTime > currentTime) {
          const remainingMilliseconds = lockedUntilTime - currentTime;

          const remainingSeconds = Math.max(
            1,
            Math.ceil(remainingMilliseconds / 1000),
          );

          return res.status(423).json({
            success: false,
            code: "ACCOUNT_LOCKED",

            message:
              "Too many failed login attempts. This account is temporarily locked.",

            locked: true,

            retryAfterSeconds: remainingSeconds,

            lockoutCount: Number(user.lockout_count) || 0,

            lockedUntil: user.locked_until,
          });
        }

        // Lockout expired.
        // Keep lockout_count so the next
        // lockout becomes longer.

        db.prepare(
          `
          UPDATE users

          SET
            locked_until = NULL,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = ?
          `,
        ).run(user.id);
      }

      // ====================================
      // CHECK PASSWORD
      // ====================================

      const passwordMatches = await bcrypt.compare(
        password,
        user.password_hash,
      );

      // ====================================
      // WRONG PASSWORD
      // ====================================

      if (!passwordMatches) {
        const currentAttempts = Number(user.failed_login_attempts) || 0;

        const newAttempts = currentAttempts + 1;

        // ==================================
        // LOCK AFTER THIRD FAILED ATTEMPT
        // ==================================

        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const currentLockoutCount = Number(user.lockout_count) || 0;

          const lockoutSeconds = getLockoutSeconds(currentLockoutCount);

          const newLockoutCount = currentLockoutCount + 1;

          const lockedUntil = new Date(
            Date.now() + lockoutSeconds * 1000,
          ).toISOString();

          db.prepare(
            `
            UPDATE users

            SET
              failed_login_attempts = 0,
              locked_until = ?,
              lockout_count = ?,
              updated_at = CURRENT_TIMESTAMP

            WHERE id = ?
            `,
          ).run(lockedUntil, newLockoutCount, user.id);

          console.log(
            `Account ${user.username} locked for ${lockoutSeconds} second(s). Lockout count: ${newLockoutCount}`,
          );

          return res.status(423).json({
            success: false,
            code: "ACCOUNT_LOCKED",

            message:
              "Too many failed login attempts. This account is temporarily locked.",

            locked: true,

            retryAfterSeconds: lockoutSeconds,

            lockoutCount: newLockoutCount,

            lockedUntil,
          });
        }

        // ==================================
        // SAVE FAILED ATTEMPT
        // ==================================

        db.prepare(
          `
          UPDATE users

          SET
            failed_login_attempts = ?,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = ?
          `,
        ).run(newAttempts, user.id);

        const attemptsRemaining = MAX_LOGIN_ATTEMPTS - newAttempts;

        console.log(
          `Failed login for ${user.username}. ${attemptsRemaining} attempt(s) remaining.`,
        );

        return res.status(401).json({
          success: false,
          code: "INVALID_CREDENTIALS",
          message: "Invalid username or password.",
          attemptsRemaining,
        });
      }

      // ====================================
      // SUCCESSFUL LOGIN
      //
      // Reset all failed-login history.
      // ====================================

      db.prepare(
        `
        UPDATE users

        SET
          failed_login_attempts = 0,
          locked_until = NULL,
          lockout_count = 0,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
        `,
      ).run(user.id);

      // ====================================
      // FIRST SIGN-IN: VERIFY THE EMAIL FIRST
      //
      // A new account gets no session until its owner proves the email
      // address with a one-time code and chooses their own password.
      // ====================================

      if (Number(user.needs_first_login) === 1) {
        const verificationEmail = String(user.email || "").trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verificationEmail)) {
          return res.status(409).json({
            success: false,
            code: "VERIFICATION_EMAIL_MISSING",
            message:
              "This account has no valid email address to verify. Please contact the SmartFine administrator.",
          });
        }

        try {
          const challenge = await otp.issue({
            userId: user.id,
            purpose: "FIRST_LOGIN",
            targetEmail: verificationEmail,
            name:
              [user.first_name, user.middle_name, user.last_name]
                .filter(Boolean)
                .join(" ") || user.username,
            reuseRecent: true,
          });

          return res.json({
            success: true,
            requiresVerification: true,
            message:
              "We sent a verification code to your email. Enter it to finish setting up your account.",
            ...challenge,
          });
        } catch (error) {
          return otp.sendOtpError(res, error);
        }
      }

      return res.json(buildLoginSuccess(user));
    } catch (error) {
      console.error("Login error:", error);

      return res.status(500).json({
        success: false,
        code: "SERVER_ERROR",
        message: "Internal server error.",
      });
    }
  },
);

// ==========================================
// REQUEST PASSWORD RESET CODE
// ==========================================

router.post(
  "/forgot-password/request",

  async (req, res) => {
    try {
      cleanupPasswordResetChallenges();

      const identifier = String(req.body.identifier || "").trim();

      if (!identifier) {
        return res.status(400).json({
          success: false,
          code: "IDENTIFIER_REQUIRED",
          message: "Please enter your ID or username.",
        });
      }

      const user = findPasswordResetUser(identifier);

      if (!user) {
        return res.status(404).json({
          success: false,
          code: "ACCOUNT_NOT_FOUND",
          message: "No SmartFine account was found using that ID or username.",
        });
      }

      const accountStatus = String(user.account_status || "").toUpperCase();

      if (accountStatus !== "ACTIVE") {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_UNAVAILABLE",
          message:
            "This account is currently unavailable. Please contact the SmartFine administrator.",
        });
      }

      if (!user.email) {
        return res.status(400).json({
          success: false,
          code: "EMAIL_NOT_FOUND",
          message: "This account does not have a registered email address.",
        });
      }

      const challengeId = crypto.randomUUID();

      const verificationCode = createVerificationCode();

      const now = Date.now();

      await sendPasswordResetCode(user, verificationCode);

      passwordResetChallenges.set(challengeId, {
        userId: Number(user.id),

        email: user.email,

        codeHash: hashPasswordResetValue(verificationCode, challengeId),

        codeExpiresAt: now + PASSWORD_RESET_CODE_EXPIRY_MINUTES * 60 * 1000,

        resendAvailableAt: now + PASSWORD_RESET_RESEND_SECONDS * 1000,

        attempts: 0,

        verified: false,

        resetTokenHash: null,

        resetExpiresAt: 0,
      });

      return res.json({
        success: true,
        message: "Verification code sent successfully.",

        challengeId,

        maskedEmail: maskEmail(user.email),

        expiresInSeconds: PASSWORD_RESET_CODE_EXPIRY_MINUTES * 60,

        resendAfterSeconds: PASSWORD_RESET_RESEND_SECONDS,
      });
    } catch (error) {
      console.error("Request password reset error:", error);

      if (error.code === "EMAIL_NOT_CONFIGURED") {
        return res.status(503).json({
          success: false,
          code: "EMAIL_NOT_CONFIGURED",
          message: "Password reset email service is not configured yet.",
        });
      }

      return res.status(500).json({
        success: false,
        code: "PASSWORD_RESET_REQUEST_ERROR",
        message: "Failed to send the password reset verification code.",
      });
    }
  },
);

// ==========================================
// RESEND PASSWORD RESET CODE
// ==========================================

router.post(
  "/forgot-password/resend",

  async (req, res) => {
    try {
      cleanupPasswordResetChallenges();

      const challengeId = String(req.body.challengeId || "").trim();

      const challenge = passwordResetChallenges.get(challengeId);

      if (!challenge) {
        return res.status(400).json({
          success: false,
          code: "RESET_REQUEST_EXPIRED",
          message:
            "Your password reset request has expired. Please start again.",
        });
      }

      const now = Date.now();

      if (now < challenge.resendAvailableAt) {
        const retryAfterSeconds = Math.ceil(
          (challenge.resendAvailableAt - now) / 1000,
        );

        return res.status(429).json({
          success: false,
          code: "RESEND_TOO_SOON",
          message: `Please wait ${retryAfterSeconds} second(s) before requesting another code.`,
          retryAfterSeconds,
        });
      }

      const user = db
        .prepare(
          `
          SELECT
            id,
            username,
            first_name,
            middle_name,
            last_name,
            email

          FROM users

          WHERE id = ?

          LIMIT 1
          `,
        )
        .get(challenge.userId);

      if (!user || !user.email) {
        passwordResetChallenges.delete(challengeId);

        return res.status(404).json({
          success: false,
          code: "ACCOUNT_NOT_FOUND",
          message: "The SmartFine account could not be found.",
        });
      }

      const verificationCode = createVerificationCode();

      await sendPasswordResetCode(user, verificationCode);

      challenge.codeHash = hashPasswordResetValue(
        verificationCode,
        challengeId,
      );

      challenge.codeExpiresAt =
        now + PASSWORD_RESET_CODE_EXPIRY_MINUTES * 60 * 1000;

      challenge.resendAvailableAt = now + PASSWORD_RESET_RESEND_SECONDS * 1000;

      challenge.attempts = 0;

      challenge.verified = false;

      challenge.resetTokenHash = null;

      challenge.resetExpiresAt = 0;

      passwordResetChallenges.set(challengeId, challenge);

      return res.json({
        success: true,
        message: "A new verification code has been sent.",

        maskedEmail: maskEmail(user.email),

        expiresInSeconds: PASSWORD_RESET_CODE_EXPIRY_MINUTES * 60,

        resendAfterSeconds: PASSWORD_RESET_RESEND_SECONDS,
      });
    } catch (error) {
      console.error("Resend password reset code error:", error);

      return res.status(500).json({
        success: false,
        code: "PASSWORD_RESET_RESEND_ERROR",
        message: "Failed to resend the verification code.",
      });
    }
  },
);

// ==========================================
// VERIFY PASSWORD RESET CODE
// ==========================================

router.post(
  "/forgot-password/verify",

  (req, res) => {
    try {
      cleanupPasswordResetChallenges();

      const challengeId = String(req.body.challengeId || "").trim();

      const code = String(req.body.code || "").trim();

      if (!challengeId || !/^[0-9]{6}$/.test(code)) {
        return res.status(400).json({
          success: false,
          code: "INVALID_CODE_FORMAT",
          message: "Please enter the complete 6-digit verification code.",
        });
      }

      const challenge = passwordResetChallenges.get(challengeId);

      if (!challenge) {
        return res.status(400).json({
          success: false,
          code: "RESET_REQUEST_EXPIRED",
          message:
            "Your password reset request has expired. Please start again.",
        });
      }

      if (Date.now() > challenge.codeExpiresAt) {
        passwordResetChallenges.delete(challengeId);

        return res.status(400).json({
          success: false,
          code: "CODE_EXPIRED",
          message:
            "The verification code has expired. Please request a new code.",
        });
      }

      const suppliedCodeHash = hashPasswordResetValue(code, challengeId);

      if (suppliedCodeHash !== challenge.codeHash) {
        challenge.attempts = Number(challenge.attempts || 0) + 1;

        const attemptsRemaining = Math.max(
          0,
          MAX_PASSWORD_RESET_ATTEMPTS - challenge.attempts,
        );

        if (attemptsRemaining <= 0) {
          passwordResetChallenges.delete(challengeId);

          return res.status(400).json({
            success: false,
            code: "TOO_MANY_CODE_ATTEMPTS",
            message:
              "Too many incorrect verification attempts. Please start the password reset again.",
          });
        }

        passwordResetChallenges.set(challengeId, challenge);

        return res.status(400).json({
          success: false,
          code: "INVALID_CODE",
          message: "The verification code is incorrect.",
          attemptsRemaining,
        });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");

      challenge.verified = true;

      challenge.resetTokenHash = hashPasswordResetValue(
        resetToken,
        challengeId,
      );

      challenge.resetExpiresAt =
        Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000;

      passwordResetChallenges.set(challengeId, challenge);

      return res.json({
        success: true,
        message: "Verification successful.",
        resetToken,
        expiresInSeconds: PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * 60,
      });
    } catch (error) {
      console.error("Verify password reset code error:", error);

      return res.status(500).json({
        success: false,
        code: "PASSWORD_RESET_VERIFY_ERROR",
        message: "Failed to verify the password reset code.",
      });
    }
  },
);

// ==========================================
// RESET PASSWORD
// ==========================================

router.post(
  "/forgot-password/reset",

  async (req, res) => {
    try {
      cleanupPasswordResetChallenges();

      const challengeId = String(req.body.challengeId || "").trim();

      const resetToken = String(req.body.resetToken || "").trim();

      const newPassword = String(req.body.newPassword || "");

      const confirmPassword = String(req.body.confirmPassword || "");

      if (!challengeId || !resetToken) {
        return res.status(400).json({
          success: false,
          code: "RESET_AUTH_REQUIRED",
          message: "Password reset verification is required.",
        });
      }

      const challenge = passwordResetChallenges.get(challengeId);

      if (!challenge || !challenge.verified) {
        return res.status(400).json({
          success: false,
          code: "RESET_REQUEST_EXPIRED",
          message: "Your password reset session is invalid or expired.",
        });
      }

      if (Date.now() > challenge.resetExpiresAt) {
        passwordResetChallenges.delete(challengeId);

        return res.status(400).json({
          success: false,
          code: "RESET_TOKEN_EXPIRED",
          message:
            "Your password reset session has expired. Please start again.",
        });
      }

      const suppliedTokenHash = hashPasswordResetValue(resetToken, challengeId);

      if (suppliedTokenHash !== challenge.resetTokenHash) {
        return res.status(403).json({
          success: false,
          code: "INVALID_RESET_TOKEN",
          message: "Password reset authorization is invalid.",
        });
      }

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

      const user = db
        .prepare(
          `
          SELECT
            id,
            password_hash

          FROM users

          WHERE id = ?

          LIMIT 1
          `,
        )
        .get(challenge.userId);

      if (!user) {
        passwordResetChallenges.delete(challengeId);

        return res.status(404).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: "The SmartFine account could not be found.",
        });
      }

      const samePassword = await bcrypt.compare(
        newPassword,
        user.password_hash,
      );

      if (samePassword) {
        return res.status(400).json({
          success: false,
          code: "SAME_PASSWORD",
          message:
            "Your new password must be different from your current password.",
        });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      db.prepare(
        `
        UPDATE users

        SET
          password_hash = ?,
          failed_login_attempts = 0,
          locked_until = NULL,
          lockout_count = 0,
          needs_first_login = 0,
          is_verified = 1,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
        `,
      ).run(passwordHash, user.id);

      passwordResetChallenges.delete(challengeId);

      return res.json({
        success: true,
        message: "Password reset successfully.",
      });
    } catch (error) {
      console.error("Reset password error:", error);

      return res.status(500).json({
        success: false,
        code: "PASSWORD_RESET_ERROR",
        message: "Failed to reset the password.",
      });
    }
  },
);

// ==========================================
// GET CURRENT ADMIN ACCOUNT
// ==========================================

router.get(
  "/me",

  authenticateToken,

  requireAdmin,

  (req, res) => {
    try {
      const user = getCurrentUser(req.authUser.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: "Administrator account not found.",
        });
      }

      return res.json({
        success: true,
        user: formatUser(user),
      });
    } catch (error) {
      console.error("Get current admin error:", error);

      return res.status(500).json({
        success: false,
        code: "SERVER_ERROR",
        message: "Failed to load administrator account.",
      });
    }
  },
);

// ==========================================
// UPDATE CURRENT ADMIN ACCOUNT
// ==========================================

router.put(
  "/me",

  authenticateToken,

  requireAdmin,

  (req, res) => {
    try {
      const userId = req.authUser.userId;

      const currentUser = getCurrentUser(userId);

      if (!currentUser) {
        return res.status(404).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: "Administrator account not found.",
        });
      }

      const username = String(req.body.username ?? currentUser.username).trim();

      const requestedEmail = String(req.body.email ?? currentUser.email ?? "")
        .trim()
        .toLowerCase();

      // Your own email address changes only through Change Email, which sends a
      // code to the new address first.
      if (
        requestedEmail !== String(currentUser.email || "").trim().toLowerCase()
      ) {
        return res.status(400).json({
          success: false,
          code: "EMAIL_CHANGE_REQUIRES_VERIFICATION",
          message:
            "Use Change Email to change your email address. We send a code to the new address to confirm it.",
        });
      }

      const email = String(currentUser.email ?? "").trim();

      const contactNumber = String(
        req.body.contactNumber ?? currentUser.contact_number ?? "",
      ).trim();

      const firstName = String(
        req.body.firstName ?? currentUser.first_name ?? "",
      ).trim();

      const middleName = String(
        req.body.middleName ?? currentUser.middle_name ?? "",
      ).trim();

      const lastName = String(
        req.body.lastName ?? currentUser.last_name ?? "",
      ).trim();

      const nameError = validatePersonName({ firstName, middleName, lastName });

      if (nameError) {
        return res.status(400).json({ success: false, ...nameError });
      }

      if (!username) {
        return res.status(400).json({
          success: false,
          code: "USERNAME_REQUIRED",
          message: "Username is required.",
        });
      }

      if (!email) {
        return res.status(400).json({
          success: false,
          code: "EMAIL_REQUIRED",
          message: "Email address is required.",
        });
      }

      const usernameOwner = db
        .prepare(
          `
          SELECT id

          FROM users

          WHERE
            LOWER(username) = LOWER(?)

            AND id <> ?

          LIMIT 1
          `,
        )
        .get(username, userId);

      if (usernameOwner) {
        return res.status(409).json({
          success: false,
          code: "USERNAME_EXISTS",
          message: "That username is already being used.",
        });
      }

      const emailOwner = db
        .prepare(
          `
          SELECT id

          FROM users

          WHERE
            LOWER(email) = LOWER(?)

            AND id <> ?

          LIMIT 1
          `,
        )
        .get(email, userId);

      if (emailOwner) {
        return res.status(409).json({
          success: false,
          code: "EMAIL_EXISTS",
          message: "That email address is already being used.",
        });
      }

      db.prepare(
        `
        UPDATE users

        SET
          username = ?,
          first_name = ?,
          middle_name = ?,
          last_name = ?,
          email = ?,
          contact_number = ?,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
        `,
      ).run(
        username,
        firstName,
        middleName || null,
        lastName,
        email,
        contactNumber || null,
        userId,
      );

      const updatedUser = getCurrentUser(userId);

      return res.json({
        success: true,
        message: "Account settings updated successfully.",
        user: formatUser(updatedUser),
      });
    } catch (error) {
      console.error("Update admin account error:", error);

      return res.status(500).json({
        success: false,
        code: "SERVER_ERROR",
        message: "Failed to update account settings.",
      });
    }
  },
);

// ==========================================
// CHANGE CURRENT ADMIN PASSWORD
// ==========================================

router.put(
  "/me/password",

  authenticateToken,

  requireAdmin,

  async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          code: "PASSWORD_FIELDS_REQUIRED",
          message:
            "Current password, new password, and password confirmation are required.",
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

      const user = db
        .prepare(
          `
          SELECT
            id,
            password_hash

          FROM users

          WHERE id = ?

          LIMIT 1
          `,
        )
        .get(req.authUser.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: "Administrator account not found.",
        });
      }

      const matches = await bcrypt.compare(currentPassword, user.password_hash);

      if (!matches) {
        return res.status(401).json({
          success: false,
          code: "CURRENT_PASSWORD_INCORRECT",
          message: "Current password is incorrect.",
        });
      }

      const sameAsCurrent = await bcrypt.compare(
        newPassword,
        user.password_hash,
      );

      if (sameAsCurrent) {
        return res.status(400).json({
          success: false,
          code: "SAME_PASSWORD",
          message: "New password must be different from your current password.",
        });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      db.prepare(
        `
        UPDATE users

        SET
          password_hash = ?,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
        `,
      ).run(passwordHash, user.id);

      return res.json({
        success: true,
        message: "Password changed successfully.",
      });
    } catch (error) {
      console.error("Change admin password error:", error);

      return res.status(500).json({
        success: false,
        code: "SERVER_ERROR",
        message: "Failed to change password.",
      });
    }
  },
);

// ==========================================
// UPLOAD / CHANGE ADMIN PROFILE PICTURE
// ==========================================

router.post(
  "/me/profile-picture",

  authenticateToken,

  requireAdmin,

  uploadProfilePicture,

  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          code: "PROFILE_PICTURE_REQUIRED",
          message: "Please select a profile picture.",
        });
      }

      const userId = req.authUser.userId;

      const currentUser = getCurrentUser(userId);

      if (!currentUser) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(404).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: "Administrator account not found.",
        });
      }

      const newProfilePictureUri = `/uploads/admin-profiles/${req.file.filename}`;

      db.prepare(
        `
        UPDATE users

        SET
          profile_picture_uri = ?,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
        `,
      ).run(newProfilePictureUri, userId);

      removeAdminProfileFile(currentUser.profile_picture_uri);

      const updatedUser = getCurrentUser(userId);

      return res.json({
        success: true,
        message: "Profile picture updated successfully.",
        profilePictureUri: newProfilePictureUri,
        user: formatUser(updatedUser),
      });
    } catch (error) {
      console.error("Admin profile picture upload error:", error);

      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {
          // Ignore cleanup failure.
        }
      }

      return res.status(500).json({
        success: false,
        code: "PROFILE_UPLOAD_ERROR",
        message: "Failed to update profile picture.",
      });
    }
  },
);

// ==========================================
// REMOVE ADMIN PROFILE PICTURE
// ==========================================

router.delete(
  "/me/profile-picture",

  authenticateToken,

  requireAdmin,

  (req, res) => {
    try {
      const userId = req.authUser.userId;

      const currentUser = getCurrentUser(userId);

      if (!currentUser) {
        return res.status(404).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: "Administrator account not found.",
        });
      }

      const oldProfilePicture = currentUser.profile_picture_uri;

      db.prepare(
        `
        UPDATE users

        SET
          profile_picture_uri = NULL,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
        `,
      ).run(userId);

      removeAdminProfileFile(oldProfilePicture);

      const updatedUser = getCurrentUser(userId);

      return res.json({
        success: true,
        message: "Profile picture removed successfully.",
        user: formatUser(updatedUser),
      });
    } catch (error) {
      console.error("Remove admin profile picture error:", error);

      return res.status(500).json({
        success: false,
        code: "PROFILE_REMOVE_ERROR",
        message: "Failed to remove profile picture.",
      });
    }
  },
);

// ==========================================
// FINES OFFICER DASHBOARD
// ==========================================

router.get(
  "/officer-dashboard",

  authenticateToken,

  (req, res) => {
    try {
      const userId = Number(req.authUser?.userId);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(401).json({
          success: false,
          message: "Your session is invalid. Please log in again.",
        });
      }

      const officer = getCurrentUser(userId);

      if (!officer) {
        return res.status(401).json({
          success: false,
          message: "Your account could not be found.",
        });
      }

      if (
        String(officer.role || "").toUpperCase() !== "FINES_OFFICER" ||
        String(officer.account_status || "").toUpperCase() !== "ACTIVE"
      ) {
        return res.status(403).json({
          success: false,
          message: "An active Fines Officer account is required.",
        });
      }

      const students = db
        .prepare(
          `
          SELECT
            COUNT(*) AS total

          FROM users

          WHERE
            role = 'STUDENT'

            AND username NOT GLOB
              '__archived_student_*'
          `,
        )
        .get();

      const totals = db
        .prepare(
          `
          SELECT
            COUNT(*) AS finesRecorded,

            COALESCE(
              SUM(
                CASE
                  WHEN
                    DATE(
                      COALESCE(
                        issued_at,
                        created_at
                      ),
                      '+8 hours'
                    )
                    =
                    DATE(
                      'now',
                      '+8 hours'
                    )

                  THEN
                    amount_centavos

                  ELSE
                    0
                END
              ),
              0
            ) AS todayAmountCentavos

          FROM fines

          WHERE
            recorded_by = ?

            AND cancelled_at IS NULL

            AND UPPER(
              COALESCE(
                fine_status,
                'UNPAID'
              )
            ) != 'CANCELLED'
          `,
        )
        .get(userId);

      const activities = db
        .prepare(
          `
          SELECT
            f.id,

            TRIM(
              COALESCE(
                u.first_name,
                ''
              )
              || ' ' ||
              COALESCE(
                u.middle_name || ' ',
                ''
              )
              ||
              COALESCE(
                u.last_name,
                ''
              )
            ) AS studentName,

            u.profile_picture_uri
              AS profilePictureUri,

            vt.violation_name
              AS violationName,

            f.amount_centavos
              AS amountCentavos,

            COALESCE(
              f.issued_at,
              f.created_at
            ) AS recordedAt

          FROM fines f

          INNER JOIN users u
            ON u.id = f.student_id

          LEFT JOIN violation_types vt
            ON vt.id =
              f.violation_type_id

          WHERE
            f.recorded_by = ?

            AND
            f.cancelled_at IS NULL

            AND UPPER(
              COALESCE(
                f.fine_status,
                'UNPAID'
              )
            ) != 'CANCELLED'

          ORDER BY
            DATETIME(
              COALESCE(
                f.issued_at,
                f.created_at
              )
            ) DESC,

            f.id DESC
          `,
        )
        .all(userId);

      return res.json({
        success: true,

        user: formatUser(officer),

        stats: {
          totalStudents: Number(students?.total || 0),

          finesRecorded: Number(totals?.finesRecorded || 0),

          todayAmountCentavos: Number(totals?.todayAmountCentavos || 0),
        },

        activities: activities.map((activity) => ({
          ...activity,

          id: Number(activity.id),

          amountCentavos: Number(activity.amountCentavos || 0),
        })),
      });
    } catch (error) {
      console.error("Officer dashboard error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load the officer dashboard.",
      });
    }
  },
);

// ==========================================
// STUDENT DASHBOARD
// GET /api/auth/student-dashboard
// ==========================================

router.get("/student-dashboard", authenticateToken, (req, res) => {
  try {
    const userId = Number(req.authUser?.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Your session is invalid. Please log in again.",
      });
    }

    const student = getCurrentUser(userId);

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Your account could not be found.",
      });
    }

    if (
      String(student.role).toUpperCase() !== "STUDENT" ||
      String(student.account_status).toUpperCase() !== "ACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message: "An active student account is required.",
      });
    }

    // The student ID comes from the verified token.
    // Clients cannot request another student's dashboard.
    const totals = db
      .prepare(
        `
      SELECT
        COALESCE(SUM(amount_centavos), 0) AS totalAmountCentavos,

        COALESCE(SUM(
          CASE
            WHEN paid_at IS NOT NULL
              OR UPPER(COALESCE(fine_status, 'UNPAID')) = 'PAID'
            THEN amount_centavos
            ELSE 0
          END
        ), 0) AS paidAmountCentavos,

        COALESCE(SUM(
          CASE
            WHEN paid_at IS NULL
              AND UPPER(COALESCE(fine_status, 'UNPAID')) != 'PAID'
            THEN amount_centavos
            ELSE 0
          END
        ), 0) AS outstandingAmountCentavos,

        COALESCE(SUM(
          CASE
            WHEN paid_at IS NULL
              AND UPPER(COALESCE(fine_status, 'UNPAID')) != 'PAID'
            THEN 1
            ELSE 0
          END
        ), 0) AS unpaidCount

      FROM fines
      WHERE student_id = ?
        AND cancelled_at IS NULL
        AND UPPER(COALESCE(fine_status, 'UNPAID')) != 'CANCELLED'
    `,
      )
      .get(userId);

    // Payment activities represent fines marked paid.
    // They are not fabricated payment transactions.
    const activities = db
      .prepare(
        `
      SELECT *
      FROM (
        SELECT
          'fine-' || f.id AS id,
          'FINE' AS type,
          COALESCE(vt.violation_name, 'Fine') AS description,
          f.amount_centavos AS amountCentavos,
          f.created_at AS recordedAt
        FROM fines f
        LEFT JOIN violation_types vt
          ON vt.id = f.violation_type_id
        WHERE f.student_id = ?
          AND f.cancelled_at IS NULL
          AND UPPER(COALESCE(f.fine_status, 'UNPAID')) != 'CANCELLED'

        UNION ALL

        SELECT
          'paid-' || f.id AS id,
          'PAID' AS type,
          COALESCE(vt.violation_name, 'Fine') AS description,
          f.amount_centavos AS amountCentavos,
          f.paid_at AS recordedAt
        FROM fines f
        LEFT JOIN violation_types vt
          ON vt.id = f.violation_type_id
        WHERE f.student_id = ?
          AND f.paid_at IS NOT NULL
          AND f.cancelled_at IS NULL
          AND UPPER(COALESCE(f.fine_status, 'UNPAID')) != 'CANCELLED'
      )
      ORDER BY DATETIME(recordedAt) DESC, id DESC
      LIMIT 6
    `,
      )
      .all(userId, userId);

    return res.json({
      success: true,
      user: formatUser(student),
      stats: {
        totalAmountCentavos: Number(totals.totalAmountCentavos),
        paidAmountCentavos: Number(totals.paidAmountCentavos),
        outstandingAmountCentavos: Number(totals.outstandingAmountCentavos),
        unpaidCount: Number(totals.unpaidCount),
      },
      activities: activities.map((activity) => ({
        ...activity,
        amountCentavos: Number(activity.amountCentavos),
      })),
    });
  } catch (error) {
    console.error("Student dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load your dashboard.",
    });
  }
});
// ==========================================
// EXPORTS
// ==========================================

module.exports = router;

module.exports.authenticateToken = authenticateToken;

module.exports.requireAdmin = requireAdmin;

module.exports.validatePasswordPolicy = validatePasswordPolicy;

module.exports.validatePersonName = validatePersonName;

module.exports.formatUser = formatUser;

module.exports.buildLoginSuccess = buildLoginSuccess;

module.exports.removeAdminProfileFile = removeAdminProfileFile;

// Lets the live-update socket check a sign-in token the same way as the API.
module.exports.verifyAuthToken = (token) => jwt.verify(token, JWT_SECRET);
