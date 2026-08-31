const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../database/database');

const router = express.Router();

const JWT_SECRET = 'REMOVED';

// ==========================================
// LOGIN SECURITY SETTINGS
// ==========================================

const MAX_LOGIN_ATTEMPTS = 5;

// Lockout progression:
// 1st lock = 3 minutes
// 2nd lock = 5 minutes
// 3rd lock = 15 minutes
// 4th+ lock = 30 minutes
const LOCKOUT_DURATIONS = [3, 5, 15, 30];

function getLockoutMinutes(lockoutCount) {
  const index = Math.min(
    lockoutCount,
    LOCKOUT_DURATIONS.length - 1
  );

  return LOCKOUT_DURATIONS[index];
}

// ==========================================
// LOGIN ROUTE
// ==========================================

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // ==========================================
    // VALIDATE INPUT
    // ==========================================

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_CREDENTIALS',
        message:
          'Username and password are required.',
      });
    }

    const normalizedUsername =
      String(username).trim();

    // ==========================================
    // FIND USER
    // ==========================================

    const statement = db.prepare(`
      SELECT
        id,
        username,
        first_name,
        middle_name,
        last_name,
        email,
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

    const user = statement.get(
      normalizedUsername
    );

    // ==========================================
    // USERNAME DOES NOT EXIST
    // ==========================================

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message:
          'Invalid username or password.',
      });
    }

    // ==========================================
    // CHECK ACCOUNT STATUS
    // ==========================================

    const accountStatus =
      String(
        user.account_status || ''
      ).toUpperCase();

    if (accountStatus === 'DEACTIVATED') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_DEACTIVATED',
        message:
          'This account has been deactivated. Please contact the SmartFine administrator.',
      });
    }

    if (accountStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_UNAVAILABLE',
        message:
          'This account is currently unavailable. Please contact the SmartFine administrator.',
      });
    }

    // ==========================================
    // CHECK IF ACCOUNT IS CURRENTLY LOCKED
    // ==========================================

    if (user.locked_until) {
      const lockedUntilTime =
        new Date(
          user.locked_until
        ).getTime();

      const currentTime = Date.now();

      // Still locked
      if (
        !Number.isNaN(lockedUntilTime) &&
        lockedUntilTime > currentTime
      ) {
        const remainingMilliseconds =
          lockedUntilTime - currentTime;

        const remainingSeconds =
          Math.max(
            1,
            Math.ceil(
              remainingMilliseconds / 1000
            )
          );

        const remainingMinutes =
          Math.max(
            1,
            Math.ceil(
              remainingMilliseconds / 60000
            )
          );

        return res.status(423).json({
          success: false,
          code: 'ACCOUNT_LOCKED',
          message:
            `This account is temporarily locked. ` +
            `Please try again in approximately ${remainingMinutes} minute(s).`,
          locked: true,
          retryAfterSeconds:
            remainingSeconds,
          retryAfterMinutes:
            remainingMinutes,
          lockedUntil:
            user.locked_until,
        });
      }

      // Lock already expired.
      // Clear locked_until so user can try again.
      db.prepare(`
        UPDATE users
        SET
          locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(user.id);
    }

    // ==========================================
    // VERIFY PASSWORD
    // ==========================================

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    // ==========================================
    // INCORRECT PASSWORD
    // ==========================================

    if (!passwordMatches) {
      const currentAttempts =
        Number(
          user.failed_login_attempts
        ) || 0;

      const newAttempts =
        currentAttempts + 1;

      // ==========================================
      // REACHED MAXIMUM ATTEMPTS
      // ==========================================

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
          currentLockoutCount + 1;

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

        return res.status(423).json({
          success: false,
          code: 'ACCOUNT_LOCKED',
          message:
            `Too many failed login attempts. ` +
            `Your account has been temporarily locked for ${lockoutMinutes} minute(s).`,
          locked: true,
          lockoutMinutes,
          lockoutCount:
            newLockoutCount,
          lockedUntil,
        });
      }

      // ==========================================
      // WRONG PASSWORD BUT NOT LOCKED YET
      // ==========================================

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

      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message:
          'Invalid username or password.',
        attemptsRemaining,
      });
    }

    // ==========================================
    // SUCCESSFUL LOGIN
    // ==========================================

    // Reset login security information after
    // the user successfully logs in.
    db.prepare(`
      UPDATE users
      SET
        failed_login_attempts = 0,
        locked_until = NULL,
        lockout_count = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(user.id);

    // ==========================================
    // CREATE JWT
    // ==========================================

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: '8h',
      }
    );

    // ==========================================
    // LOGIN SUCCESS RESPONSE
    // ==========================================

    return res.json({
      success: true,
      message:
        'Login successful.',
      token,
      user: {
        id: user.id,
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
        role:
          user.role,
      },
    });
  } catch (error) {
    console.error(
      'Login error:',
      error
    );

    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message:
        'Internal server error.',
    });
  }
});

module.exports = router;