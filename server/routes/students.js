const express = require('express');
const router = express.Router();

const db = require('../database/database');

console.log('students.js loaded');

// ==========================================
// GET ALL STUDENTS
// ==========================================

router.get('/', (req, res) => {
  try {
    const students = db.prepare(`
      SELECT
        u.id,

        u.username AS student_id,

        TRIM(
          u.first_name || ' ' ||
          COALESCE(u.middle_name || ' ', '') ||
          u.last_name
        ) AS full_name,

        u.email,

        u.grade_level,
        u.section,

        u.account_status,

        COALESCE(
          SUM(
            CASE
              WHEN f.cancelled_at IS NULL
              THEN f.amount_centavos
              ELSE 0
            END
          ),
          0
        ) / 100.0 AS total_fines,

        COALESCE(
          SUM(
            CASE
              WHEN
                f.cancelled_at IS NULL
                AND f.paid_at IS NULL
              THEN f.amount_centavos
              ELSE 0
            END
          ),
          0
        ) / 100.0 AS outstanding_balance

      FROM users u

      LEFT JOIN fines f
        ON f.student_id = u.id

      WHERE u.role = 'STUDENT'

      GROUP BY
        u.id,
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
      error: error.message,
    });
  }
});

// ==========================================
// GET SINGLE STUDENT PROFILE
// ==========================================

router.get('/:id', (req, res) => {
  try {
    const studentId =
      Number(req.params.id);

    // ======================================
    // VALIDATE STUDENT ID
    // ======================================

    if (
      !Number.isInteger(studentId) ||
      studentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid student ID.',
      });
    }

    // ======================================
    // STUDENT INFORMATION
    // ======================================

    const student = db.prepare(`
      SELECT
        id,

        username AS student_id,

        first_name,
        middle_name,
        last_name,

        TRIM(
          first_name || ' ' ||
          COALESCE(middle_name || ' ', '') ||
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
    `).get(studentId);

    // ======================================
    // STUDENT NOT FOUND
    // ======================================

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          'Student not found.',
      });
    }

    // ======================================
    // STUDENT FINANCIAL TOTALS
    // ======================================

    const totals = db.prepare(`
      SELECT

        COALESCE(
          (
            SELECT
              SUM(f.amount_centavos)

            FROM fines f

            WHERE
              f.student_id = ?
              AND f.cancelled_at IS NULL
          ),
          0
        ) / 100.0 AS total_fines,

        COALESCE(
          (
            SELECT
              SUM(f.amount_centavos)

            FROM fines f

            WHERE
              f.student_id = ?
              AND f.cancelled_at IS NULL
              AND f.paid_at IS NULL
          ),
          0
        ) / 100.0 AS outstanding_balance,

        COALESCE(
          (
            SELECT
              SUM(p.amount_centavos)

            FROM payments p

            WHERE
              p.student_id = ?
              AND UPPER(p.payment_status) = 'PAID'
          ),
          0
        ) / 100.0 AS total_paid
    `).get(
      studentId,
      studentId,
      studentId
    );

    // ======================================
    // RECENT FINES
    // ======================================

    const fines = db.prepare(`
      SELECT
        f.id,

        vt.violation_name,

        f.amount_centavos / 100.0
          AS amount,

        f.issued_at,

        CASE
          WHEN f.paid_at IS NOT NULL
          THEN 'PAID'
          ELSE 'UNPAID'
        END AS status,

        CASE
          WHEN officer.id IS NOT NULL
          THEN TRIM(
            officer.first_name || ' ' ||
            officer.last_name
          )
          ELSE 'Unknown'
        END AS officer_name

      FROM fines f

      JOIN violation_types vt
        ON vt.id =
          f.violation_type_id

      LEFT JOIN users officer
        ON officer.id =
          f.recorded_by

      WHERE
        f.student_id = ?
        AND f.cancelled_at IS NULL

      ORDER BY
        f.issued_at DESC

      LIMIT 10
    `).all(studentId);

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

    return res.status(500).json({
      success: false,
      message:
        'Failed to load student profile.',
      error: error.message,
    });
  }
});

// ==========================================
// DELETE INACTIVE STUDENT
// ==========================================

router.delete('/:id', (req, res) => {
  try {
    const studentId =
      Number(req.params.id);

    // ======================================
    // VALIDATE STUDENT ID
    // ======================================

    if (
      !Number.isInteger(studentId) ||
      studentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_STUDENT_ID',
        message:
          'Invalid student ID.',
      });
    }

    // ======================================
    // FIND STUDENT
    // ======================================

    const student = db.prepare(`
      SELECT
        id,
        username,
        first_name,
        middle_name,
        last_name,
        account_status

      FROM users

      WHERE
        id = ?
        AND role = 'STUDENT'
    `).get(studentId);

    // ======================================
    // STUDENT NOT FOUND
    // ======================================

    if (!student) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        message:
          'Student not found.',
      });
    }

    // ======================================
    // CHECK ACCOUNT STATUS
    // ======================================

    const accountStatus =
      String(
        student.account_status || ''
      ).toUpperCase();

    const canDelete =
      accountStatus === 'INACTIVE' ||
      accountStatus === 'DEACTIVATED';

    // ======================================
    // ACTIVE STUDENT CANNOT BE DELETED
    // ======================================

    if (!canDelete) {
      return res.status(409).json({
        success: false,
        code: 'STUDENT_ACTIVE',
        message:
          'Active students cannot be deleted. Deactivate the student account first.',
      });
    }

    // ======================================
    // CHECK EXISTING FINES
    // ======================================

    const fineResult = db.prepare(`
      SELECT
        COUNT(*) AS total

      FROM fines

      WHERE student_id = ?
    `).get(studentId);

    const fineCount =
      Number(
        fineResult.total
      ) || 0;

    // ======================================
    // CHECK EXISTING PAYMENTS
    // ======================================

    const paymentResult =
      db.prepare(`
        SELECT
          COUNT(*) AS total

        FROM payments

        WHERE student_id = ?
      `).get(studentId);

    const paymentCount =
      Number(
        paymentResult.total
      ) || 0;

    // ======================================
    // DO NOT DELETE SCHOOL RECORD HISTORY
    // ======================================

    if (
      fineCount > 0 ||
      paymentCount > 0
    ) {
      return res.status(409).json({
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

    const result = db.prepare(`
      DELETE FROM users

      WHERE
        id = ?
        AND role = 'STUDENT'
    `).run(studentId);

    // ======================================
    // VERIFY DELETE
    // ======================================

    if (
      Number(
        result.changes
      ) === 0
    ) {
      return res.status(404).json({
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
          student.username,

        name: TRIM_NAME(
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

    return res.status(500).json({
      success: false,
      code: 'DELETE_STUDENT_ERROR',
      message:
        'Failed to delete student.',
      error: error.message,
    });
  }
});

// ==========================================
// FORMAT NAME
// ==========================================

function TRIM_NAME(
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

module.exports = router;