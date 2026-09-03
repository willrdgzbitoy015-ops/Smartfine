const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = require('../database/database');

const router = express.Router();

const JWT_SECRET =
  'REMOVED';

// ==========================================
// ADMIN PROFILE UPLOAD DIRECTORY
// ==========================================

const adminProfileDirectory =
  path.join(
    __dirname,
    '..',
    'uploads',
    'admin-profiles'
  );

if (
  !fs.existsSync(
    adminProfileDirectory
  )
) {
  fs.mkdirSync(
    adminProfileDirectory,
    {
      recursive: true,
    }
  );
}

// ==========================================
// LOGIN SECURITY SETTINGS
// ==========================================

const MAX_LOGIN_ATTEMPTS = 5;

// Lockout progression:
// 1st lock = 3 minutes
// 2nd lock = 5 minutes
// 3rd lock = 15 minutes
// 4th+ lock = 30 minutes

const LOCKOUT_DURATIONS = [
  3,
  5,
  15,
  30,
];

function getLockoutMinutes(
  lockoutCount
) {
  const index =
    Math.min(
      lockoutCount,
      LOCKOUT_DURATIONS.length -
        1
    );

  return LOCKOUT_DURATIONS[
    index
  ];
}

// ==========================================
// JWT AUTHENTICATION
// ==========================================

function authenticateToken(
  req,
  res,
  next
) {
  try {
    const authorizationHeader =
      req.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith(
        'Bearer '
      )
    ) {
      return res
        .status(401)
        .json({
          success: false,
          code: 'AUTH_REQUIRED',
          message:
            'Authentication is required.',
        });
    }

    const token =
      authorizationHeader.substring(
        7
      );

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.authUser =
      decoded;

    next();
  } catch (error) {
    return res
      .status(401)
      .json({
        success: false,
        code: 'INVALID_TOKEN',
        message:
          'Your session is invalid or has expired.',
      });
  }
}

// ==========================================
// ADMIN ONLY
// ==========================================

function requireAdmin(
  req,
  res,
  next
) {
  const role =
    String(
      req.authUser?.role ||
        ''
    ).toUpperCase();

  if (
    role !==
    'ADMIN'
  ) {
    return res
      .status(403)
      .json({
        success: false,
        code: 'ADMIN_REQUIRED',
        message:
          'Administrator access is required.',
      });
  }

  next();
}

// ==========================================
// GET CURRENT USER
// ==========================================

function getCurrentUser(
  userId
) {
  return db
    .prepare(`
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
    `)
    .get(
      userId
    );
}

// ==========================================
// FORMAT USER
// ==========================================

function formatUser(
  user
) {
  if (
    !user
  ) {
    return null;
  }

  return {
    id:
      Number(
        user.id
      ),

    username:
      user.username,

    firstName:
      user.first_name,

    middleName:
      user.middle_name,

    lastName:
      user.last_name,

    fullName:
      [
        user.first_name,
        user.middle_name,
        user.last_name,
      ]
        .filter(Boolean)
        .join(' '),

    email:
      user.email,

    contactNumber:
      user.contact_number,

    role:
      user.role,

    accountStatus:
      user.account_status,

    isVerified:
      Boolean(
        user.is_verified
      ),

    profilePictureUri:
      user.profile_picture_uri,

    createdAt:
      user.created_at,

    updatedAt:
      user.updated_at,
  };
}

// ==========================================
// DELETE OLD ADMIN PROFILE FILE
// ==========================================

function removeAdminProfileFile(
  profilePictureUri
) {
  try {
    if (
      !profilePictureUri
    ) {
      return;
    }

    if (
      !profilePictureUri.startsWith(
        '/uploads/admin-profiles/'
      )
    ) {
      return;
    }

    const filename =
      path.basename(
        profilePictureUri
      );

    const fullPath =
      path.join(
        adminProfileDirectory,
        filename
      );

    if (
      fs.existsSync(
        fullPath
      )
    ) {
      fs.unlinkSync(
        fullPath
      );
    }
  } catch (error) {
    console.error(
      'Failed to remove old admin profile picture:',
      error
    );
  }
}

// ==========================================
// MULTER STORAGE
// ==========================================

const profileStorage =
  multer.diskStorage({
    destination:
      (
        req,
        file,
        callback
      ) => {
        callback(
          null,
          adminProfileDirectory
        );
      },

    filename:
      (
        req,
        file,
        callback
      ) => {
        const extension =
          path
            .extname(
              file.originalname ||
                ''
            )
            .toLowerCase() ||
          '.jpg';

        const userId =
          req.authUser?.userId ||
          'admin';

        callback(
          null,
          `admin-${userId}-${Date.now()}${extension}`
        );
      },
  });

// ==========================================
// PROFILE FILE FILTER
// ==========================================

const profileUpload =
  multer({
    storage:
      profileStorage,

    limits: {
      fileSize:
        5 *
        1024 *
        1024,
    },

    fileFilter:
      (
        req,
        file,
        callback
      ) => {
        const allowedMimeTypes =
          [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
          ];

        if (
          !allowedMimeTypes.includes(
            file.mimetype
          )
        ) {
          return callback(
            new Error(
              'Only JPG, JPEG, PNG, and WEBP images are allowed.'
            )
          );
        }

        callback(
          null,
          true
        );
      },
  });

// ==========================================
// PROFILE UPLOAD MIDDLEWARE
// ==========================================

function uploadProfilePicture(
  req,
  res,
  next
) {
  profileUpload.single(
    'profilePicture'
  )(
    req,
    res,
    (error) => {
      if (
        error instanceof
        multer.MulterError
      ) {
        if (
          error.code ===
          'LIMIT_FILE_SIZE'
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              code:
                'FILE_TOO_LARGE',

              message:
                'Profile picture must be 5MB or smaller.',
            });
        }

        return res
          .status(400)
          .json({
            success:
              false,

            code:
              'UPLOAD_ERROR',

            message:
              error.message,
          });
      }

      if (
        error
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            code:
              'INVALID_IMAGE',

            message:
              error.message,
          });
      }

      next();
    }
  );
}

// ==========================================
// LOGIN ROUTE
// ==========================================

router.post(
  '/login',
  async (
    req,
    res
  ) => {
    try {
      const {
        username,
        password,
      } =
        req.body;

      // ======================================
      // VALIDATE INPUT
      // ======================================

      if (
        !username ||
        !password
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            code:
              'MISSING_CREDENTIALS',

            message:
              'Username and password are required.',
          });
      }

      const normalizedUsername =
        String(
          username
        ).trim();

      // ======================================
      // FIND USER
      // ======================================

      const statement =
        db.prepare(`
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
            lockout_count
          FROM users
          WHERE username = ?
        `);

      const user =
        statement.get(
          normalizedUsername
        );

      // ======================================
      // USERNAME DOES NOT EXIST
      // ======================================

      if (
        !user
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            code:
              'INVALID_CREDENTIALS',

            message:
              'Invalid username or password.',
          });
      }

      // ======================================
      // CHECK ACCOUNT STATUS
      // ======================================

      const accountStatus =
        String(
          user.account_status ||
            ''
        ).toUpperCase();

      if (
        accountStatus ===
        'DEACTIVATED'
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            code:
              'ACCOUNT_DEACTIVATED',

            message:
              'This account has been deactivated. Please contact the SmartFine administrator.',
          });
      }

      if (
        accountStatus !==
        'ACTIVE'
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            code:
              'ACCOUNT_UNAVAILABLE',

            message:
              'This account is currently unavailable. Please contact the SmartFine administrator.',
          });
      }

      // ======================================
      // CHECK IF ACCOUNT IS LOCKED
      // ======================================

      if (
        user.locked_until
      ) {
        const lockedUntilTime =
          new Date(
            user.locked_until
          ).getTime();

        const currentTime =
          Date.now();

        if (
          !Number.isNaN(
            lockedUntilTime
          ) &&
          lockedUntilTime >
            currentTime
        ) {
          const remainingMilliseconds =
            lockedUntilTime -
            currentTime;

          const remainingSeconds =
            Math.max(
              1,
              Math.ceil(
                remainingMilliseconds /
                  1000
              )
            );

          const remainingMinutes =
            Math.max(
              1,
              Math.ceil(
                remainingMilliseconds /
                  60000
              )
            );

          return res
            .status(423)
            .json({
              success:
                false,

              code:
                'ACCOUNT_LOCKED',

              message:
                `This account is temporarily locked. ` +
                `Please try again in approximately ${remainingMinutes} minute(s).`,

              locked:
                true,

              retryAfterSeconds:
                remainingSeconds,

              retryAfterMinutes:
                remainingMinutes,

              lockedUntil:
                user.locked_until,
            });
        }

        // Lock expired.

        db.prepare(`
          UPDATE users
          SET
            locked_until = NULL,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          user.id
        );
      }

      // ======================================
      // VERIFY PASSWORD
      // ======================================

      const passwordMatches =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      // ======================================
      // INCORRECT PASSWORD
      // ======================================

      if (
        !passwordMatches
      ) {
        const currentAttempts =
          Number(
            user.failed_login_attempts
          ) || 0;

        const newAttempts =
          currentAttempts +
          1;

        // ====================================
        // MAXIMUM ATTEMPTS
        // ====================================

        if (
          newAttempts >=
          MAX_LOGIN_ATTEMPTS
        ) {
          const currentLockoutCount =
            Number(
              user.lockout_count
            ) || 0;

          const lockoutMinutes =
            getLockoutMinutes(
              currentLockoutCount
            );

          const newLockoutCount =
            currentLockoutCount +
            1;

          const lockedUntil =
            new Date(
              Date.now() +
                lockoutMinutes *
                  60 *
                  1000
            ).toISOString();

          db.prepare(`
            UPDATE users
            SET
              failed_login_attempts = 0,
              locked_until = ?,
              lockout_count = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(
            lockedUntil,
            newLockoutCount,
            user.id
          );

          console.log(
            `Account ${user.username} locked for ${lockoutMinutes} minute(s). Lockout count: ${newLockoutCount}`
          );

          return res
            .status(423)
            .json({
              success:
                false,

              code:
                'ACCOUNT_LOCKED',

              message:
                `Too many failed login attempts. ` +
                `Your account has been temporarily locked for ${lockoutMinutes} minute(s).`,

              locked:
                true,

              lockoutMinutes,

              lockoutCount:
                newLockoutCount,

              lockedUntil,
            });
        }

        // ====================================
        // WRONG PASSWORD BUT NOT LOCKED
        // ====================================

        db.prepare(`
          UPDATE users
          SET
            failed_login_attempts = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          newAttempts,
          user.id
        );

        const attemptsRemaining =
          MAX_LOGIN_ATTEMPTS -
          newAttempts;

        console.log(
          `Failed login for ${user.username}. ${attemptsRemaining} attempt(s) remaining.`
        );

        return res
          .status(401)
          .json({
            success:
              false,

            code:
              'INVALID_CREDENTIALS',

            message:
              'Invalid username or password.',

            attemptsRemaining,
          });
      }

      // ======================================
      // SUCCESSFUL LOGIN
      // ======================================

      db.prepare(`
        UPDATE users
        SET
          failed_login_attempts = 0,
          locked_until = NULL,
          lockout_count = 0,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        user.id
      );

      // ======================================
      // CREATE JWT
      // ======================================

      const token =
        jwt.sign(
          {
            userId:
              user.id,

            username:
              user.username,

            role:
              user.role,
          },

          JWT_SECRET,

          {
            expiresIn:
              '8h',
          }
        );

      // ======================================
      // LOGIN RESPONSE
      // ======================================

      return res.json({
        success:
          true,

        message:
          'Login successful.',

        token,

        user: {
          id:
            user.id,

          username:
            user.username,

          firstName:
            user.first_name,

          middleName:
            user.middle_name,

          lastName:
            user.last_name,

          email:
            user.email,

          contactNumber:
            user.contact_number,

          profilePictureUri:
            user.profile_picture_uri,

          role:
            user.role,
        },
      });
    } catch (error) {
      console.error(
        'Login error:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          code:
            'SERVER_ERROR',

          message:
            'Internal server error.',
        });
    }
  }
);

// ==========================================
// GET CURRENT ADMIN ACCOUNT
//
// GET /api/auth/me
// ==========================================

router.get(
  '/me',

  authenticateToken,

  requireAdmin,

  (
    req,
    res
  ) => {
    try {
      const user =
        getCurrentUser(
          req.authUser.userId
        );

      if (
        !user
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            code:
              'USER_NOT_FOUND',

            message:
              'Administrator account not found.',
          });
      }

      return res.json({
        success:
          true,

        user:
          formatUser(
            user
          ),
      });
    } catch (error) {
      console.error(
        'Get current admin error:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          code:
            'SERVER_ERROR',

          message:
            'Failed to load administrator account.',
        });
    }
  }
);

// ==========================================
// UPDATE CURRENT ADMIN ACCOUNT
//
// PUT /api/auth/me
//
// Editable:
// username
// email
// contactNumber
// ==========================================

router.put(
  '/me',

  authenticateToken,

  requireAdmin,

  (
    req,
    res
  ) => {
    try {
      const userId =
        req.authUser.userId;

      const currentUser =
        getCurrentUser(
          userId
        );

      if (
        !currentUser
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            code:
              'USER_NOT_FOUND',

            message:
              'Administrator account not found.',
          });
      }

      const username =
        String(
          req.body.username ??
            currentUser.username
        ).trim();

      const email =
        String(
          req.body.email ??
            currentUser.email ??
            ''
        ).trim();

      const contactNumber =
        String(
          req.body.contactNumber ??
            currentUser.contact_number ??
            ''
        ).trim();

      // ======================================
      // VALIDATION
      // ======================================

      if (
        !username
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            code:
              'USERNAME_REQUIRED',

            message:
              'Username is required.',
          });
      }

      if (
        !email
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            code:
              'EMAIL_REQUIRED',

            message:
              'Email address is required.',
          });
      }

      // ======================================
      // USERNAME DUPLICATE CHECK
      // ======================================

      const usernameOwner =
        db.prepare(`
          SELECT id
          FROM users
          WHERE LOWER(username) = LOWER(?)
            AND id <> ?
          LIMIT 1
        `).get(
          username,
          userId
        );

      if (
        usernameOwner
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            code:
              'USERNAME_EXISTS',

            message:
              'That username is already being used.',
          });
      }

      // ======================================
      // EMAIL DUPLICATE CHECK
      // ======================================

      const emailOwner =
        db.prepare(`
          SELECT id
          FROM users
          WHERE LOWER(email) = LOWER(?)
            AND id <> ?
          LIMIT 1
        `).get(
          email,
          userId
        );

      if (
        emailOwner
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            code:
              'EMAIL_EXISTS',

            message:
              'That email address is already being used.',
          });
      }

      // ======================================
      // UPDATE
      // ======================================

      db.prepare(`
        UPDATE users
        SET
          username = ?,
          email = ?,
          contact_number = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        username,
        email,
        contactNumber ||
          null,
        userId
      );

      const updatedUser =
        getCurrentUser(
          userId
        );

      return res.json({
        success:
          true,

        message:
          'Account settings updated successfully.',

        user:
          formatUser(
            updatedUser
          ),
      });
    } catch (error) {
      console.error(
        'Update admin account error:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          code:
            'SERVER_ERROR',

          message:
            'Failed to update account settings.',
        });
    }
  }
);

// ==========================================
// CHANGE CURRENT ADMIN PASSWORD
//
// PUT /api/auth/me/password
// ==========================================

router.put(
  '/me/password',

  authenticateToken,

  requireAdmin,

  async (
    req,
    res
  ) => {
    try {
      const {
        currentPassword,
        newPassword,
        confirmPassword,
      } =
        req.body;

      // ======================================
      // VALIDATE
      // ======================================

      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            code:
              'PASSWORD_FIELDS_REQUIRED',

            message:
              'Current password, new password, and password confirmation are required.',
          });
      }

      if (
        String(
          newPassword
        ).length <
        8
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            code:
              'PASSWORD_TOO_SHORT',

            message:
              'New password must contain at least 8 characters.',
          });
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            code:
              'PASSWORD_MISMATCH',

            message:
              'New password and confirmation do not match.',
          });
      }

      // ======================================
      // LOAD PASSWORD HASH
      // ======================================

      const user =
        db.prepare(`
          SELECT
            id,
            password_hash
          FROM users
          WHERE id = ?
          LIMIT 1
        `).get(
          req.authUser.userId
        );

      if (
        !user
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            code:
              'USER_NOT_FOUND',

            message:
              'Administrator account not found.',
          });
      }

      // ======================================
      // VERIFY CURRENT PASSWORD
      // ======================================

      const matches =
        await bcrypt.compare(
          currentPassword,
          user.password_hash
        );

      if (
        !matches
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            code:
              'CURRENT_PASSWORD_INCORRECT',

            message:
              'Current password is incorrect.',
          });
      }

      // ======================================
      // PREVENT SAME PASSWORD
      // ======================================

      const sameAsCurrent =
        await bcrypt.compare(
          newPassword,
          user.password_hash
        );

      if (
        sameAsCurrent
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            code:
              'SAME_PASSWORD',

            message:
              'New password must be different from your current password.',
          });
      }

      // ======================================
      // HASH NEW PASSWORD
      // ======================================

      const passwordHash =
        await bcrypt.hash(
          newPassword,
          10
        );

      db.prepare(`
        UPDATE users
        SET
          password_hash = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        passwordHash,
        user.id
      );

      return res.json({
        success:
          true,

        message:
          'Password changed successfully.',
      });
    } catch (error) {
      console.error(
        'Change admin password error:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          code:
            'SERVER_ERROR',

          message:
            'Failed to change password.',
        });
    }
  }
);

// ==========================================
// UPLOAD / CHANGE ADMIN PROFILE PICTURE
//
// POST /api/auth/me/profile-picture
//
// FormData field:
// profilePicture
// ==========================================

router.post(
  '/me/profile-picture',

  authenticateToken,

  requireAdmin,

  uploadProfilePicture,

  (
    req,
    res
  ) => {
    try {
      if (
        !req.file
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            code:
              'PROFILE_PICTURE_REQUIRED',

            message:
              'Please select a profile picture.',
          });
      }

      const userId =
        req.authUser.userId;

      const currentUser =
        getCurrentUser(
          userId
        );

      if (
        !currentUser
      ) {
        if (
          req.file?.path &&
          fs.existsSync(
            req.file.path
          )
        ) {
          fs.unlinkSync(
            req.file.path
          );
        }

        return res
          .status(404)
          .json({
            success:
              false,

            code:
              'USER_NOT_FOUND',

            message:
              'Administrator account not found.',
          });
      }

      const newProfilePictureUri =
        `/uploads/admin-profiles/${req.file.filename}`;

      // ======================================
      // UPDATE DATABASE
      // ======================================

      db.prepare(`
        UPDATE users
        SET
          profile_picture_uri = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        newProfilePictureUri,
        userId
      );

      // ======================================
      // REMOVE OLD FILE
      // ======================================

      removeAdminProfileFile(
        currentUser.profile_picture_uri
      );

      const updatedUser =
        getCurrentUser(
          userId
        );

      return res.json({
        success:
          true,

        message:
          'Profile picture updated successfully.',

        profilePictureUri:
          newProfilePictureUri,

        user:
          formatUser(
            updatedUser
          ),
      });
    } catch (error) {
      console.error(
        'Admin profile picture upload error:',
        error
      );

      if (
        req.file?.path &&
        fs.existsSync(
          req.file.path
        )
      ) {
        try {
          fs.unlinkSync(
            req.file.path
          );
        } catch {
          // Ignore cleanup failure.
        }
      }

      return res
        .status(500)
        .json({
          success:
            false,

          code:
            'PROFILE_UPLOAD_ERROR',

          message:
            'Failed to update profile picture.',
        });
    }
  }
);

// ==========================================
// REMOVE ADMIN PROFILE PICTURE
//
// DELETE /api/auth/me/profile-picture
// ==========================================

router.delete(
  '/me/profile-picture',

  authenticateToken,

  requireAdmin,

  (
    req,
    res
  ) => {
    try {
      const userId =
        req.authUser.userId;

      const currentUser =
        getCurrentUser(
          userId
        );

      if (
        !currentUser
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            code:
              'USER_NOT_FOUND',

            message:
              'Administrator account not found.',
          });
      }

      const oldProfilePicture =
        currentUser.profile_picture_uri;

      // ======================================
      // REMOVE FROM DATABASE
      // ======================================

      db.prepare(`
        UPDATE users
        SET
          profile_picture_uri = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        userId
      );

      // ======================================
      // REMOVE PHYSICAL FILE
      // ======================================

      removeAdminProfileFile(
        oldProfilePicture
      );

      const updatedUser =
        getCurrentUser(
          userId
        );

      return res.json({
        success:
          true,

        message:
          'Profile picture removed successfully.',

        user:
          formatUser(
            updatedUser
          ),
      });
    } catch (error) {
      console.error(
        'Remove admin profile picture error:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          code:
            'PROFILE_REMOVE_ERROR',

          message:
            'Failed to remove profile picture.',
        });
    }
  }
);

module.exports =
  router;