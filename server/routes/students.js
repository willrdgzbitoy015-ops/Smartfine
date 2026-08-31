const express = require('express');
const bcrypt = require('bcryptjs');

const router = express.Router();

const db = require('../database/database');

console.log('students.js loaded');

// ==========================================
// GENERATE NEXT STUDENT ID
//
// Example:
// 2026-0001
// 2026-0002
// 2026-0003
// ==========================================

function generateNextStudentId() {
  const currentYear =
    new Date().getFullYear();

  const latestStudent =
    db.prepare(`
      SELECT
        student_number

      FROM users

      WHERE
        role = 'STUDENT'
        AND student_number LIKE ?

      ORDER BY
        student_number DESC

      LIMIT 1
    `).get(
      `${currentYear}-%`
    );

  // ======================================
  // FIRST STUDENT FOR CURRENT YEAR
  // ======================================

  if (
    !latestStudent ||
    !latestStudent.student_number
  ) {
    return `${currentYear}-0001`;
  }

  const parts =
    String(
      latestStudent.student_number
    ).split('-');

  const lastNumber =
    Number(parts[1]) || 0;

  const nextNumber =
    lastNumber + 1;

  const formattedNumber =
    String(nextNumber)
      .padStart(4, '0');

  return `${currentYear}-${formattedNumber}`;
}

// ==========================================
// GENERATE SUGGESTED USERNAME
//
// Will Bitoy
// -> wbitoy
// ==========================================

function generateSuggestedUsername(
  firstName,
  lastName
) {
  const cleanFirstName =
    String(firstName || '')
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ''
      );

  const cleanLastName =
    String(lastName || '')
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ''
      );

  if (
    !cleanFirstName ||
    !cleanLastName
  ) {
    return '';
  }

  return (
    cleanFirstName.charAt(0) +
    cleanLastName
  );
}

// ==========================================
// FORMAT FULL NAME
// ==========================================

function formatName(
  firstName,
  middleName,
  lastName
) {
  return [
    firstName,
    middleName,
    lastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

// ==========================================
// GET NEXT STUDENT ID
//
// GET /api/students/next-id
// ==========================================

router.get(
  '/next-id',
  (req, res) => {
    try {
      const studentId =
        generateNextStudentId();

      return res.json({
        success: true,
        studentId,
      });
    } catch (error) {
      console.error(
        'Generate Student ID error:',
        error
      );

      return res.status(500).json({
        success: false,

        message:
          'Failed to generate Student ID.',

        error:
          error.message,
      });
    }
  }
);

// ==========================================
// GET ALL STUDENTS
//
// GET /api/students
// ==========================================

router.get('/', (req, res) => {
  try {
    const students =
      db.prepare(`
        SELECT
          u.id,

          COALESCE(
            u.student_number,
            u.username
          ) AS student_id,

          u.username,

          TRIM(
            u.first_name || ' ' ||
            COALESCE(
              u.middle_name || ' ',
              ''
            ) ||
            u.last_name
          ) AS full_name,

          u.email,

          u.grade_level,
          u.section,

          u.account_status,

          COALESCE(
            SUM(
              CASE
                WHEN
                  f.cancelled_at IS NULL
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
                  f.cancelled_at IS NULL
                  AND f.paid_at IS NULL
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
          ON f.student_id = u.id

        WHERE
          u.role = 'STUDENT'

        GROUP BY
          u.id,
          u.student_number,
          u.username,
          u.first_name,
          u.middle_name,
          u.last_name,
          u.email,
          u.grade_level,
          u.section,
          u.account_status

        ORDER BY
          u.last_name ASC,
          u.first_name ASC
      `).all();

    return res.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error(
      'Load students error:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        'Failed to load students.',

      error:
        error.message,
    });
  }
});

// ==========================================
// CREATE NEW STUDENT
//
// POST /api/students
//
// ACCOUNT STATUS:
// ACTIVE
// INACTIVE
// ==========================================

router.post(
  '/',
  async (req, res) => {
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

        accountStatus,
      } = req.body;

      // ======================================
      // REQUIRED FIELDS
      // ======================================

      if (
        !firstName ||
        !lastName ||
        !email ||
        !contactNumber ||
        !gradeLevel ||
        !section ||
        !password
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'MISSING_FIELDS',

            message:
              'Please complete all required student information.',
          });
      }

      // ======================================
      // NORMALIZE VALUES
      // ======================================

      const normalizedFirstName =
        String(firstName).trim();

      const normalizedMiddleName =
        middleName
          ? String(
              middleName
            ).trim()
          : null;

      const normalizedLastName =
        String(lastName).trim();

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const normalizedContactNumber =
        String(
          contactNumber
        ).trim();

      const normalizedGradeLevel =
        String(
          gradeLevel
        ).trim();

      const normalizedSection =
        String(section).trim();

      const normalizedStatus =
        String(
          accountStatus ||
            'ACTIVE'
        ).toUpperCase();

      const passwordValue =
        String(password);

      // ======================================
      // USERNAME
      //
      // Will Bitoy -> wbitoy
      //
      // Frontend may still edit username.
      // ======================================

      const suggestedUsername =
        generateSuggestedUsername(
          normalizedFirstName,
          normalizedLastName
        );

      const normalizedUsername =
        String(
          username ||
            suggestedUsername
        )
          .trim()
          .toLowerCase();

      // ======================================
      // USERNAME REQUIRED
      // ======================================

      if (!normalizedUsername) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'USERNAME_REQUIRED',

            message:
              'Username is required.',
          });
      }

      // ======================================
      // USERNAME VALIDATION
      //
      // ALPHANUMERIC ONLY
      // ======================================

      const usernamePattern =
        /^[a-z0-9]+$/;

      if (
        !usernamePattern.test(
          normalizedUsername
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_USERNAME',

            message:
              'Username may contain letters and numbers only.',
          });
      }

      // ======================================
      // DUPLICATE USERNAME
      // ======================================

      const existingUsername =
        db.prepare(`
          SELECT
            id

          FROM users

          WHERE
            LOWER(username)
              =
            LOWER(?)
        `).get(
          normalizedUsername
        );

      if (existingUsername) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'USERNAME_EXISTS',

            message:
              'This username is already being used. Please choose another username.',
          });
      }

      // ======================================
      // EMAIL VALIDATION
      // ======================================

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          normalizedEmail
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_EMAIL',

            message:
              'Please enter a valid email address.',
          });
      }

      // ======================================
      // DUPLICATE EMAIL
      // ======================================

      const existingEmail =
        db.prepare(`
          SELECT
            id

          FROM users

          WHERE
            LOWER(email)
              =
            LOWER(?)
        `).get(
          normalizedEmail
        );

      if (existingEmail) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'EMAIL_EXISTS',

            message:
              'This email address is already being used.',
          });
      }

      // ======================================
      // PASSWORD VALIDATION
      //
      // REQUIRED:
      // - 8+ characters
      // - at least 1 letter
      // - at least 1 number
      // - at least 1 special character
      // ======================================

      if (
        passwordValue.length < 8
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'WEAK_PASSWORD',

            message:
              'Password must contain at least 8 characters.',
          });
      }

      const hasLetter =
        /[A-Za-z]/.test(
          passwordValue
        );

      const hasNumber =
        /[0-9]/.test(
          passwordValue
        );

      const hasSpecialCharacter =
        /[^A-Za-z0-9\s]/.test(
          passwordValue
        );

      if (!hasLetter) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'PASSWORD_LETTER_REQUIRED',

            message:
              'Password must contain at least one letter.',
          });
      }

      if (!hasNumber) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'PASSWORD_NUMBER_REQUIRED',

            message:
              'Password must contain at least one number.',
          });
      }

      if (
        !hasSpecialCharacter
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'PASSWORD_SPECIAL_CHARACTER_REQUIRED',

            message:
              'Password must contain at least one special character such as !, @, #, $, %, or &.',
          });
      }

      // ======================================
      // ACCOUNT STATUS
      //
      // IMPORTANT:
      // ACTIVE or INACTIVE only
      // ======================================

      if (
        normalizedStatus !==
          'ACTIVE' &&
        normalizedStatus !==
          'INACTIVE'
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_ACCOUNT_STATUS',

            message:
              'Account status must be ACTIVE or INACTIVE.',
          });
      }

      // ======================================
      // GENERATE STUDENT ID
      // ======================================

      const generatedStudentId =
        generateNextStudentId();

      // ======================================
      // CHECK STUDENT ID
      // ======================================

      const existingStudentNumber =
        db.prepare(`
          SELECT
            id

          FROM users

          WHERE
            student_number = ?
        `).get(
          generatedStudentId
        );

      if (
        existingStudentNumber
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'STUDENT_ID_EXISTS',

            message:
              'The generated Student ID already exists. Please try again.',
          });
      }

      // ======================================
      // HASH PASSWORD
      // ======================================

      const passwordHash =
        await bcrypt.hash(
          passwordValue,
          10
        );

      // ======================================
      // INSERT STUDENT
      // ======================================

      const result =
        db.prepare(`
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
            section
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
            ?
          )
        `).run(
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
          normalizedSection
        );

      // ======================================
      // SUCCESS
      // ======================================

      return res
        .status(201)
        .json({
          success: true,

          message:
            'Student account created successfully.',

          student: {
            id:
              Number(
                result.lastInsertRowid
              ),

            studentId:
              generatedStudentId,

            username:
              normalizedUsername,

            firstName:
              normalizedFirstName,

            middleName:
              normalizedMiddleName,

            lastName:
              normalizedLastName,

            email:
              normalizedEmail,

            contactNumber:
              normalizedContactNumber,

            gradeLevel:
              normalizedGradeLevel,

            section:
              normalizedSection,

            accountStatus:
              normalizedStatus,

            role:
              'STUDENT',
          },
        });
    } catch (error) {
      console.error(
        'Create student error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          code:
            'CREATE_STUDENT_ERROR',

          message:
            'Failed to create student account.',

          error:
            error.message,
        });
    }
  }
);

// ==========================================
// GET SINGLE STUDENT PROFILE
//
// GET /api/students/:id
//
// IMPORTANT:
// MUST STAY BELOW /next-id
// ==========================================

router.get(
  '/:id',
  (req, res) => {
    try {
      const studentId =
        Number(
          req.params.id
        );

      // ======================================
      // VALIDATE DATABASE ID
      // ======================================

      if (
        !Number.isInteger(
          studentId
        ) ||
        studentId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              'Invalid student ID.',
          });
      }

      // ======================================
      // STUDENT INFORMATION
      // ======================================

      const student =
        db.prepare(`
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

            account_status

          FROM users

          WHERE
            id = ?
            AND role = 'STUDENT'
        `).get(
          studentId
        );

      // ======================================
      // STUDENT NOT FOUND
      // ======================================

      if (!student) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              'Student not found.',
          });
      }

      // ======================================
      // STUDENT FINANCIAL TOTALS
      // ======================================

      const totals =
        db.prepare(`
          SELECT

            COALESCE(
              (
                SELECT
                  SUM(
                    f.amount_centavos
                  )

                FROM fines f

                WHERE
                  f.student_id = ?

                  AND
                  f.cancelled_at
                    IS NULL
              ),
              0
            ) / 100.0
              AS total_fines,

            COALESCE(
              (
                SELECT
                  SUM(
                    f.amount_centavos
                  )

                FROM fines f

                WHERE
                  f.student_id = ?

                  AND
                  f.cancelled_at
                    IS NULL

                  AND
                  f.paid_at
                    IS NULL
              ),
              0
            ) / 100.0
              AS outstanding_balance,

            COALESCE(
              (
                SELECT
                  SUM(
                    p.amount_centavos
                  )

                FROM payments p

                WHERE
                  p.student_id = ?

                  AND
                  UPPER(
                    p.payment_status
                  ) = 'PAID'
              ),
              0
            ) / 100.0
              AS total_paid
        `).get(
          studentId,
          studentId,
          studentId
        );

      // ======================================
      // RECENT FINES
      // ======================================

      const fines =
        db.prepare(`
          SELECT
            f.id,

            vt.violation_name,

            f.amount_centavos
              / 100.0
              AS amount,

            f.issued_at,

            CASE
              WHEN
                f.paid_at
                  IS NOT NULL
              THEN
                'PAID'

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

            AND
            f.cancelled_at
              IS NULL

          ORDER BY
            f.issued_at DESC

          LIMIT 10
        `).all(
          studentId
        );

      // ======================================
      // RESPONSE
      // ======================================

      return res.json({
        success: true,

        student,

        totals: {
          totalFines:
            totals.total_fines,

          outstandingBalance:
            totals.outstanding_balance,

          totalPaid:
            totals.total_paid,
        },

        fines,
      });
    } catch (error) {
      console.error(
        'Student profile error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            'Failed to load student profile.',

          error:
            error.message,
        });
    }
  }
);

// ==========================================
// UPDATE STUDENT INFORMATION
//
// PUT /api/students/:id
//
// EDITABLE:
// username
// first name
// middle name
// last name
// email
// contact number
// grade
// section
// account status
//
// NOT EDITABLE:
// student_number / Student ID
// ==========================================

router.put(
  '/:id',
  (req, res) => {
    try {
      const studentId =
        Number(
          req.params.id
        );

      // ======================================
      // VALIDATE DATABASE ID
      // ======================================

      if (
        !Number.isInteger(
          studentId
        ) ||
        studentId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_STUDENT_ID',

            message:
              'Invalid student ID.',
          });
      }

      // ======================================
      // FIND EXISTING STUDENT
      // ======================================

      const existingStudent =
        db.prepare(`
          SELECT
            id,
            student_number,
            username,
            account_status

          FROM users

          WHERE
            id = ?
            AND role = 'STUDENT'
        `).get(
          studentId
        );

      if (!existingStudent) {
        return res
          .status(404)
          .json({
            success: false,

            code:
              'STUDENT_NOT_FOUND',

            message:
              'Student not found.',
          });
      }

      // ======================================
      // REQUEST DATA
      // ======================================

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

      // ======================================
      // REQUIRED FIELDS
      // ======================================

      if (
        !username ||
        !firstName ||
        !lastName ||
        !email ||
        !contactNumber ||
        !gradeLevel ||
        !section
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'MISSING_FIELDS',

            message:
              'Please complete all required student information.',
          });
      }

      // ======================================
      // NORMALIZE VALUES
      // ======================================

      const normalizedUsername =
        String(username)
          .trim()
          .toLowerCase();

      const normalizedFirstName =
        String(firstName)
          .trim();

      const normalizedMiddleName =
        middleName
          ? String(
              middleName
            ).trim()
          : null;

      const normalizedLastName =
        String(lastName)
          .trim();

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const normalizedContactNumber =
        String(
          contactNumber
        ).trim();

      const normalizedGradeLevel =
        String(
          gradeLevel
        ).trim();

      const normalizedSection =
        String(section)
          .trim();

      const normalizedStatus =
        String(
          accountStatus ||
            'ACTIVE'
        ).toUpperCase();

      // ======================================
      // USERNAME VALIDATION
      // ======================================

      const usernamePattern =
        /^[a-z0-9]+$/;

      if (
        !usernamePattern.test(
          normalizedUsername
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_USERNAME',

            message:
              'Username may contain letters and numbers only.',
          });
      }

      // ======================================
      // DUPLICATE USERNAME
      //
      // IGNORE CURRENT STUDENT
      // ======================================

      const duplicateUsername =
        db.prepare(`
          SELECT
            id

          FROM users

          WHERE
            LOWER(username)
              =
            LOWER(?)

            AND id != ?
        `).get(
          normalizedUsername,
          studentId
        );

      if (duplicateUsername) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'USERNAME_EXISTS',

            message:
              'This username is already being used by another account.',
          });
      }

      // ======================================
      // EMAIL VALIDATION
      // ======================================

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          normalizedEmail
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_EMAIL',

            message:
              'Please enter a valid email address.',
          });
      }

      // ======================================
      // DUPLICATE EMAIL
      //
      // IGNORE CURRENT STUDENT
      // ======================================

      const duplicateEmail =
        db.prepare(`
          SELECT
            id

          FROM users

          WHERE
            LOWER(email)
              =
            LOWER(?)

            AND id != ?
        `).get(
          normalizedEmail,
          studentId
        );

      if (duplicateEmail) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'EMAIL_EXISTS',

            message:
              'This email address is already being used by another account.',
          });
      }

      // ======================================
      // ACCOUNT STATUS
      //
      // FIX:
      // ACTIVE
      // INACTIVE
      // ======================================

      if (
        normalizedStatus !==
          'ACTIVE' &&
        normalizedStatus !==
          'INACTIVE'
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_ACCOUNT_STATUS',

            message:
              'Account status must be ACTIVE or INACTIVE.',
          });
      }

      // ======================================
      // UPDATE STUDENT
      //
      // student_number IS NOT UPDATED.
      // ======================================

      const result =
        db.prepare(`
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
        `).run(
          normalizedUsername,

          normalizedFirstName,
          normalizedMiddleName,
          normalizedLastName,

          normalizedEmail,
          normalizedContactNumber,

          normalizedGradeLevel,
          normalizedSection,

          normalizedStatus,

          studentId
        );

      // ======================================
      // VERIFY UPDATE
      // ======================================

      if (
        Number(
          result.changes
        ) === 0
      ) {
        return res
          .status(404)
          .json({
            success: false,

            code:
              'STUDENT_NOT_UPDATED',

            message:
              'Student information could not be updated.',
          });
      }

      // ======================================
      // SUCCESS
      // ======================================

      return res.json({
        success: true,

        message:
          'Student information updated successfully.',

        student: {
          id:
            existingStudent.id,

          studentId:
            existingStudent.student_number,

          username:
            normalizedUsername,

          firstName:
            normalizedFirstName,

          middleName:
            normalizedMiddleName,

          lastName:
            normalizedLastName,

          email:
            normalizedEmail,

          contactNumber:
            normalizedContactNumber,

          gradeLevel:
            normalizedGradeLevel,

          section:
            normalizedSection,

          accountStatus:
            normalizedStatus,
        },
      });
    } catch (error) {
      console.error(
        'Update student error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          code:
            'UPDATE_STUDENT_ERROR',

          message:
            'Failed to update student information.',

          error:
            error.message,
        });
    }
  }
);

// ==========================================
// DELETE INACTIVE STUDENT
//
// DELETE /api/students/:id
// ==========================================

router.delete(
  '/:id',
  (req, res) => {
    try {
      const studentId =
        Number(
          req.params.id
        );

      // ======================================
      // VALIDATE ID
      // ======================================

      if (
        !Number.isInteger(
          studentId
        ) ||
        studentId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_STUDENT_ID',

            message:
              'Invalid student ID.',
          });
      }

      // ======================================
      // FIND STUDENT
      // ======================================

      const student =
        db.prepare(`
          SELECT
            id,

            student_number,
            username,

            first_name,
            middle_name,
            last_name,

            account_status

          FROM users

          WHERE
            id = ?
            AND role = 'STUDENT'
        `).get(
          studentId
        );

      // ======================================
      // STUDENT NOT FOUND
      // ======================================

      if (!student) {
        return res
          .status(404)
          .json({
            success: false,

            code:
              'STUDENT_NOT_FOUND',

            message:
              'Student not found.',
          });
      }

      // ======================================
      // CHECK STATUS
      // ======================================

      const accountStatus =
        String(
          student.account_status ||
            ''
        ).toUpperCase();

      // ======================================
      // ALLOW OLD DEACTIVATED RECORDS TOO
      // ======================================

      const canDelete =
        accountStatus ===
          'INACTIVE' ||
        accountStatus ===
          'DEACTIVATED';

      // ======================================
      // ACTIVE CANNOT BE DELETED
      // ======================================

      if (!canDelete) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'STUDENT_ACTIVE',

            message:
              'Active students cannot be deleted. Set the student account to Inactive first.',
          });
      }

      // ======================================
      // CHECK FINES
      // ======================================

      const fineResult =
        db.prepare(`
          SELECT
            COUNT(*) AS total

          FROM fines

          WHERE
            student_id = ?
        `).get(
          studentId
        );

      const fineCount =
        Number(
          fineResult.total
        ) || 0;

      // ======================================
      // CHECK PAYMENTS
      // ======================================

      const paymentResult =
        db.prepare(`
          SELECT
            COUNT(*) AS total

          FROM payments

          WHERE
            student_id = ?
        `).get(
          studentId
        );

      const paymentCount =
        Number(
          paymentResult.total
        ) || 0;

      // ======================================
      // PRESERVE SCHOOL RECORD HISTORY
      // ======================================

      if (
        fineCount > 0 ||
        paymentCount > 0
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'STUDENT_HAS_RECORDS',

            message:
              'This student cannot be permanently deleted because the account already has fine or payment records. Keep the account inactive to preserve SmartFine history.',

            records: {
              fines:
                fineCount,

              payments:
                paymentCount,
            },
          });
      }

      // ======================================
      // DELETE STUDENT
      // ======================================

      const result =
        db.prepare(`
          DELETE FROM users

          WHERE
            id = ?
            AND role = 'STUDENT'
        `).run(
          studentId
        );

      // ======================================
      // VERIFY DELETE
      // ======================================

      if (
        Number(
          result.changes
        ) === 0
      ) {
        return res
          .status(404)
          .json({
            success: false,

            code:
              'STUDENT_NOT_FOUND',

            message:
              'Student could not be found or deleted.',
          });
      }

      // ======================================
      // SUCCESS
      // ======================================

      return res.json({
        success: true,

        message:
          'Student deleted successfully.',

        deletedStudent: {
          id:
            student.id,

          studentId:
            student.student_number ||
            student.username,

          username:
            student.username,

          name:
            formatName(
              student.first_name,
              student.middle_name,
              student.last_name
            ),
        },
      });
    } catch (error) {
      console.error(
        'Delete student error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          code:
            'DELETE_STUDENT_ERROR',

          message:
            'Failed to delete student.',

          error:
            error.message,
        });
    }
  }
);

module.exports = router;