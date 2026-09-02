const express = require('express');

const router = express.Router();

const db = require('../database/database');

console.log('fines.js loaded');

// ==========================================
// FORMAT FULL NAME
// ==========================================

function formatFullName(
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
// GENERATE FINE REFERENCE
//
// Example:
//
// F-2026-0001
// F-2026-0002
// F-2026-0003
// ==========================================

function generateFineReference() {
  const currentYear =
    new Date().getFullYear();

  const prefix =
    `F-${currentYear}-`;

  const latestFine =
    db.prepare(`
      SELECT
        fine_reference

      FROM fines

      WHERE
        fine_reference LIKE ?

      ORDER BY
        fine_reference DESC

      LIMIT 1
    `).get(
      `${prefix}%`
    );

  if (
    !latestFine ||
    !latestFine.fine_reference
  ) {
    return `${prefix}0001`;
  }

  const reference =
    String(
      latestFine.fine_reference
    );

  const parts =
    reference.split('-');

  const lastNumber =
    Number(
      parts[
        parts.length - 1
      ]
    ) || 0;

  const nextNumber =
    lastNumber + 1;

  const formattedNumber =
    String(nextNumber)
      .padStart(
        4,
        '0'
      );

  return `${prefix}${formattedNumber}`;
}

// ==========================================
// GET STUDENT OPTIONS
//
// GET /api/fines/options/students
//
// Used by Add Fine form.
// Only active students are returned.
// ==========================================

router.get(
  '/options/students',
  (req, res) => {
    try {
      const students =
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

            grade_level,
            section

          FROM users

          WHERE
            role = 'STUDENT'

            AND UPPER(
              account_status
            ) = 'ACTIVE'

          ORDER BY
            last_name ASC,
            first_name ASC
        `).all();

      return res.json({
        success: true,
        students,
      });
    } catch (error) {
      console.error(
        'Load fine student options error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            'Failed to load student options.',

          error:
            error.message,
        });
    }
  }
);

// ==========================================
// GET VIOLATION TYPE OPTIONS
//
// GET /api/fines/options/violations
//
// Only active violation types.
// ==========================================

router.get(
  '/options/violations',
  (req, res) => {
    try {
      const violations =
        db.prepare(`
          SELECT
            id,

            violation_code,
            violation_name,
            description,

            amount_centavos,

            amount_centavos
              / 100.0
              AS amount

          FROM violation_types

          WHERE
            is_active = 1

          ORDER BY
            violation_name ASC
        `).all();

      return res.json({
        success: true,
        violations,
      });
    } catch (error) {
      console.error(
        'Load violation options error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            'Failed to load violation types.',

          error:
            error.message,
        });
    }
  }
);

// ==========================================
// GET OFFICER OPTIONS
//
// GET /api/fines/options/officers
//
// FINES_OFFICER is the normal role.
// ADMIN is also included for development
// and administrative recording.
// ==========================================

router.get(
  '/options/officers',
  (req, res) => {
    try {
      const officers =
        db.prepare(`
          SELECT
            id,

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

            role

          FROM users

          WHERE
            role IN (
              'FINES_OFFICER',
              'ADMIN'
            )

            AND UPPER(
              account_status
            ) = 'ACTIVE'

          ORDER BY
            last_name ASC,
            first_name ASC
        `).all();

      return res.json({
        success: true,
        officers,
      });
    } catch (error) {
      console.error(
        'Load officer options error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            'Failed to load officer options.',

          error:
            error.message,
        });
    }
  }
);

// ==========================================
// GET ALL FINES
//
// GET /api/fines
//
// Optional query parameters:
//
// ?search=Juan
// ?status=UNPAID
// ?violationTypeId=1
// ==========================================

router.get(
  '/',
  (req, res) => {
    try {
      const search =
        String(
          req.query.search || ''
        )
          .trim()
          .toLowerCase();

      const status =
        String(
          req.query.status || ''
        )
          .trim()
          .toUpperCase();

      const violationTypeId =
        Number(
          req.query
            .violationTypeId
        );

      const fines =
        db.prepare(`
          SELECT
            f.id,

            f.fine_reference,

            f.student_id,

            COALESCE(
              student.student_number,
              student.username
            ) AS student_number,

            student.username
              AS student_username,

            TRIM(
              student.first_name || ' ' ||
              COALESCE(
                student.middle_name || ' ',
                ''
              ) ||
              student.last_name
            ) AS student_name,

            f.violation_type_id,

            vt.violation_code,
            vt.violation_name,

            f.amount_centavos,

            f.amount_centavos
              / 100.0
              AS amount,

            f.remarks,

            f.recorded_by
              AS officer_id,

            CASE
              WHEN
                officer.id IS NOT NULL
              THEN
                TRIM(
                  officer.first_name || ' ' ||
                  COALESCE(
                    officer.middle_name || ' ',
                    ''
                  ) ||
                  officer.last_name
                )

              ELSE
                'Unknown'
            END
              AS officer_name,

            f.issued_at,
            f.paid_at,

            f.cancelled_at,
            f.cancellation_reason,

            CASE
              WHEN
                f.cancelled_at
                  IS NOT NULL
              THEN
                'CANCELLED'

              WHEN
                f.paid_at
                  IS NOT NULL
              THEN
                'PAID'

              ELSE
                'UNPAID'
            END
              AS status

          FROM fines f

          JOIN users student
            ON
              student.id =
              f.student_id

          JOIN violation_types vt
            ON
              vt.id =
              f.violation_type_id

          LEFT JOIN users officer
            ON
              officer.id =
              f.recorded_by

          ORDER BY
            f.issued_at DESC,
            f.id DESC
        `).all();

      // ======================================
      // APPLY OPTIONAL FILTERS
      // ======================================

      const filteredFines =
        fines.filter(
          (fine) => {
            if (search) {
              const searchable =
                [
                  fine.fine_reference,
                  fine.student_number,
                  fine.student_username,
                  fine.student_name,
                  fine.violation_name,
                  fine.officer_name,
                ]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase();

              if (
                !searchable.includes(
                  search
                )
              ) {
                return false;
              }
            }

            if (
              status &&
              status !== 'ALL'
            ) {
              if (
                String(
                  fine.status
                ).toUpperCase() !==
                status
              ) {
                return false;
              }
            }

            if (
              Number.isInteger(
                violationTypeId
              ) &&
              violationTypeId > 0
            ) {
              if (
                Number(
                  fine.violation_type_id
                ) !==
                violationTypeId
              ) {
                return false;
              }
            }

            return true;
          }
        );

      return res.json({
        success: true,

        fines:
          filteredFines,
      });
    } catch (error) {
      console.error(
        'Load fines error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            'Failed to load fines.',

          error:
            error.message,
        });
    }
  }
);

// ==========================================
// CREATE NEW FINE
//
// POST /api/fines
//
// BODY:
//
// {
//   "studentId": 5,
//   "violationTypeId": 1,
//   "recordedBy": 2,
//   "remarks": "Optional note",
//   "issuedAt": "2026-09-02"
// }
//
// IMPORTANT:
//
// Amount is taken directly from
// violation_types.amount_centavos.
//
// The frontend does NOT decide the amount.
// ==========================================

router.post(
  '/',
  (req, res) => {
    try {
      const {
        studentId,
        violationTypeId,
        recordedBy,
        remarks,
        issuedAt,
      } = req.body;

      const normalizedStudentId =
        Number(studentId);

      const normalizedViolationTypeId =
        Number(
          violationTypeId
        );

      const normalizedRecordedBy =
        Number(recordedBy);

      const normalizedRemarks =
        remarks
          ? String(
              remarks
            ).trim()
          : null;

      const normalizedIssuedAt =
        issuedAt
          ? String(
              issuedAt
            ).trim()
          : null;

      // ======================================
      // REQUIRED FIELDS
      // ======================================

      if (
        !Number.isInteger(
          normalizedStudentId
        ) ||
        normalizedStudentId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_STUDENT',

            message:
              'Please select a valid student.',
          });
      }

      if (
        !Number.isInteger(
          normalizedViolationTypeId
        ) ||
        normalizedViolationTypeId <=
          0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_VIOLATION_TYPE',

            message:
              'Please select a valid violation type.',
          });
      }

      if (
        !Number.isInteger(
          normalizedRecordedBy
        ) ||
        normalizedRecordedBy <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_OFFICER',

            message:
              'Please select a valid officer.',
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
          normalizedStudentId
        );

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

      if (
        String(
          student.account_status ||
            ''
        ).toUpperCase() !==
        'ACTIVE'
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'STUDENT_INACTIVE',

            message:
              'A new fine cannot be issued to an inactive student account.',
          });
      }

      // ======================================
      // FIND VIOLATION TYPE
      // ======================================

      const violation =
        db.prepare(`
          SELECT
            id,

            violation_code,
            violation_name,

            amount_centavos,

            is_active

          FROM violation_types

          WHERE
            id = ?
        `).get(
          normalizedViolationTypeId
        );

      if (!violation) {
        return res
          .status(404)
          .json({
            success: false,

            code:
              'VIOLATION_NOT_FOUND',

            message:
              'Violation type not found.',
          });
      }

      if (
        Number(
          violation.is_active
        ) !== 1
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'VIOLATION_INACTIVE',

            message:
              'This violation type is currently inactive.',
          });
      }

      // ======================================
      // FIND OFFICER
      // ======================================

      const officer =
        db.prepare(`
          SELECT
            id,

            first_name,
            middle_name,
            last_name,

            role,
            account_status

          FROM users

          WHERE
            id = ?

            AND role IN (
              'FINES_OFFICER',
              'ADMIN'
            )
        `).get(
          normalizedRecordedBy
        );

      if (!officer) {
        return res
          .status(404)
          .json({
            success: false,

            code:
              'OFFICER_NOT_FOUND',

            message:
              'Officer not found.',
          });
      }

      if (
        String(
          officer.account_status ||
            ''
        ).toUpperCase() !==
        'ACTIVE'
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'OFFICER_INACTIVE',

            message:
              'The selected officer account is inactive.',
          });
      }

      // ======================================
      // GENERATE FINE REFERENCE
      // ======================================

      const fineReference =
        generateFineReference();

      // ======================================
      // CHECK REFERENCE
      // ======================================

      const existingReference =
        db.prepare(`
          SELECT
            id

          FROM fines

          WHERE
            fine_reference = ?
        `).get(
          fineReference
        );

      if (
        existingReference
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'FINE_REFERENCE_EXISTS',

            message:
              'Generated Fine ID already exists. Please try again.',
          });
      }

      // ======================================
      // INSERT FINE
      // ======================================

      const result =
        db.prepare(`
          INSERT INTO fines (
            fine_reference,

            student_id,
            violation_type_id,
            recorded_by,

            amount_centavos,

            remarks,

            issued_at
          )

          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,

            COALESCE(
              ?,
              CURRENT_TIMESTAMP
            )
          )
        `).run(
          fineReference,

          normalizedStudentId,
          normalizedViolationTypeId,
          normalizedRecordedBy,

          violation.amount_centavos,

          normalizedRemarks,

          normalizedIssuedAt
        );

      // ======================================
      // SUCCESS
      // ======================================

      return res
        .status(201)
        .json({
          success: true,

          message:
            'Fine recorded successfully.',

          fine: {
            id:
              Number(
                result.lastInsertRowid
              ),

            fineReference,

            studentId:
              normalizedStudentId,

            studentNumber:
              student.student_number ||
              student.username,

            studentName:
              formatFullName(
                student.first_name,
                student.middle_name,
                student.last_name
              ),

            violationTypeId:
              violation.id,

            violationCode:
              violation.violation_code,

            violationName:
              violation.violation_name,

            amountCentavos:
              violation.amount_centavos,

            amount:
              Number(
                violation.amount_centavos
              ) / 100,

            recordedBy:
              officer.id,

            officerName:
              formatFullName(
                officer.first_name,
                officer.middle_name,
                officer.last_name
              ),

            remarks:
              normalizedRemarks,

            issuedAt:
              normalizedIssuedAt,

            status:
              'UNPAID',
          },
        });
    } catch (error) {
      console.error(
        'Create fine error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          code:
            'CREATE_FINE_ERROR',

          message:
            'Failed to record fine.',

          error:
            error.message,
        });
    }
  }
);

// ==========================================
// GET SINGLE FINE
//
// GET /api/fines/:id
//
// IMPORTANT:
// Keep this below /options routes.
// ==========================================

router.get(
  '/:id',
  (req, res) => {
    try {
      const fineId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          fineId
        ) ||
        fineId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_FINE_ID',

            message:
              'Invalid fine ID.',
          });
      }

      const fine =
        db.prepare(`
          SELECT
            f.id,

            f.fine_reference,

            f.student_id,

            COALESCE(
              student.student_number,
              student.username
            ) AS student_number,

            student.username
              AS student_username,

            student.first_name
              AS student_first_name,

            student.middle_name
              AS student_middle_name,

            student.last_name
              AS student_last_name,

            TRIM(
              student.first_name || ' ' ||
              COALESCE(
                student.middle_name || ' ',
                ''
              ) ||
              student.last_name
            ) AS student_name,

            student.grade_level,
            student.section,

            f.violation_type_id,

            vt.violation_code,
            vt.violation_name,
            vt.description
              AS violation_description,

            f.amount_centavos,

            f.amount_centavos
              / 100.0
              AS amount,

            f.remarks,

            f.recorded_by
              AS officer_id,

            CASE
              WHEN
                officer.id IS NOT NULL
              THEN
                TRIM(
                  officer.first_name || ' ' ||
                  COALESCE(
                    officer.middle_name || ' ',
                    ''
                  ) ||
                  officer.last_name
                )

              ELSE
                'Unknown'
            END
              AS officer_name,

            f.issued_at,
            f.paid_at,

            f.cancelled_at,
            f.cancelled_by,
            f.cancellation_reason,

            f.created_at,
            f.updated_at,

            CASE
              WHEN
                f.cancelled_at
                  IS NOT NULL
              THEN
                'CANCELLED'

              WHEN
                f.paid_at
                  IS NOT NULL
              THEN
                'PAID'

              ELSE
                'UNPAID'
            END
              AS status

          FROM fines f

          JOIN users student
            ON
              student.id =
              f.student_id

          JOIN violation_types vt
            ON
              vt.id =
              f.violation_type_id

          LEFT JOIN users officer
            ON
              officer.id =
              f.recorded_by

          WHERE
            f.id = ?
        `).get(
          fineId
        );

      if (!fine) {
        return res
          .status(404)
          .json({
            success: false,

            code:
              'FINE_NOT_FOUND',

            message:
              'Fine not found.',
          });
      }

      return res.json({
        success: true,
        fine,
      });
    } catch (error) {
      console.error(
        'Load fine details error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            'Failed to load fine details.',

          error:
            error.message,
        });
    }
  }
);

// ==========================================
// UPDATE FINE
//
// PUT /api/fines/:id
//
// Paid or cancelled fines cannot be edited.
// ==========================================

router.put(
  '/:id',
  (req, res) => {
    try {
      const fineId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          fineId
        ) ||
        fineId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_FINE_ID',

            message:
              'Invalid fine ID.',
          });
      }

      const existingFine =
        db.prepare(`
          SELECT
            id,
            fine_reference,

            paid_at,
            cancelled_at

          FROM fines

          WHERE
            id = ?
        `).get(
          fineId
        );

      if (!existingFine) {
        return res
          .status(404)
          .json({
            success: false,

            code:
              'FINE_NOT_FOUND',

            message:
              'Fine not found.',
          });
      }

      if (
        existingFine.cancelled_at
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'FINE_CANCELLED',

            message:
              'Cancelled fines cannot be edited.',
          });
      }

      if (
        existingFine.paid_at
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'FINE_ALREADY_PAID',

            message:
              'Paid fines cannot be edited.',
          });
      }

      const {
        studentId,
        violationTypeId,
        recordedBy,
        remarks,
        issuedAt,
      } = req.body;

      const normalizedStudentId =
        Number(studentId);

      const normalizedViolationTypeId =
        Number(
          violationTypeId
        );

      const normalizedRecordedBy =
        Number(recordedBy);

      const normalizedRemarks =
        remarks
          ? String(
              remarks
            ).trim()
          : null;

      const normalizedIssuedAt =
        issuedAt
          ? String(
              issuedAt
            ).trim()
          : null;

      // ======================================
      // VALIDATE STUDENT
      // ======================================

      const student =
        db.prepare(`
          SELECT
            id

          FROM users

          WHERE
            id = ?
            AND role = 'STUDENT'
        `).get(
          normalizedStudentId
        );

      if (!student) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_STUDENT',

            message:
              'Please select a valid student.',
          });
      }

      // ======================================
      // VALIDATE VIOLATION
      // ======================================

      const violation =
        db.prepare(`
          SELECT
            id,
            amount_centavos,
            is_active

          FROM violation_types

          WHERE
            id = ?
        `).get(
          normalizedViolationTypeId
        );

      if (!violation) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_VIOLATION_TYPE',

            message:
              'Please select a valid violation type.',
          });
      }

      if (
        Number(
          violation.is_active
        ) !== 1
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'VIOLATION_INACTIVE',

            message:
              'The selected violation type is inactive.',
          });
      }

      // ======================================
      // VALIDATE OFFICER
      // ======================================

      const officer =
        db.prepare(`
          SELECT
            id

          FROM users

          WHERE
            id = ?

            AND role IN (
              'FINES_OFFICER',
              'ADMIN'
            )
        `).get(
          normalizedRecordedBy
        );

      if (!officer) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_OFFICER',

            message:
              'Please select a valid officer.',
          });
      }

      // ======================================
      // UPDATE
      // ======================================

      const result =
        db.prepare(`
          UPDATE fines

          SET
            student_id = ?,

            violation_type_id = ?,

            recorded_by = ?,

            amount_centavos = ?,

            remarks = ?,

            issued_at =
              COALESCE(
                ?,
                issued_at
              ),

            updated_at =
              CURRENT_TIMESTAMP

          WHERE
            id = ?
        `).run(
          normalizedStudentId,

          normalizedViolationTypeId,

          normalizedRecordedBy,

          violation.amount_centavos,

          normalizedRemarks,

          normalizedIssuedAt,

          fineId
        );

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
              'FINE_NOT_UPDATED',

            message:
              'Fine could not be updated.',
          });
      }

      return res.json({
        success: true,

        message:
          'Fine updated successfully.',

        fine: {
          id:
            fineId,

          fineReference:
            existingFine.fine_reference,
        },
      });
    } catch (error) {
      console.error(
        'Update fine error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          code:
            'UPDATE_FINE_ERROR',

          message:
            'Failed to update fine.',

          error:
            error.message,
        });
    }
  }
);

// ==========================================
// MARK FINE AS PAID
//
// PATCH /api/fines/:id/mark-paid
//
// TEMPORARY:
//
// This updates fines.paid_at.
//
// Later, when we build the Payments
// module, payment confirmation should
// create/update the payments table too.
// ==========================================

router.patch(
  '/:id/mark-paid',
  (req, res) => {
    try {
      const fineId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          fineId
        ) ||
        fineId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_FINE_ID',

            message:
              'Invalid fine ID.',
          });
      }

      const fine =
        db.prepare(`
          SELECT
            id,

            fine_reference,

            paid_at,
            cancelled_at

          FROM fines

          WHERE
            id = ?
        `).get(
          fineId
        );

      if (!fine) {
        return res
          .status(404)
          .json({
            success: false,

            code:
              'FINE_NOT_FOUND',

            message:
              'Fine not found.',
          });
      }

      if (
        fine.cancelled_at
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'FINE_CANCELLED',

            message:
              'A cancelled fine cannot be marked as paid.',
          });
      }

      if (fine.paid_at) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'FINE_ALREADY_PAID',

            message:
              'This fine is already marked as paid.',
          });
      }

      const paidAt =
        req.body &&
        req.body.paidAt
          ? String(
              req.body.paidAt
            ).trim()
          : null;

      const result =
        db.prepare(`
          UPDATE fines

          SET
            paid_at =
              COALESCE(
                ?,
                CURRENT_TIMESTAMP
              ),

            updated_at =
              CURRENT_TIMESTAMP

          WHERE
            id = ?

            AND paid_at
              IS NULL

            AND cancelled_at
              IS NULL
        `).run(
          paidAt,
          fineId
        );

      if (
        Number(
          result.changes
        ) === 0
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'FINE_NOT_MARKED_PAID',

            message:
              'Fine could not be marked as paid.',
          });
      }

      return res.json({
        success: true,

        message:
          'Fine marked as paid successfully.',

        fine: {
          id:
            fine.id,

          fineReference:
            fine.fine_reference,

          status:
            'PAID',
        },
      });
    } catch (error) {
      console.error(
        'Mark fine paid error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          code:
            'MARK_FINE_PAID_ERROR',

          message:
            'Failed to mark fine as paid.',

          error:
            error.message,
        });
    }
  }
);

// ==========================================
// CANCEL / DELETE FINE
//
// DELETE /api/fines/:id
//
// IMPORTANT:
//
// We do NOT physically remove fines.
//
// Instead:
// cancelled_at
// cancelled_by
// cancellation_reason
//
// are filled in so SmartFine keeps
// historical records.
// ==========================================

router.delete(
  '/:id',
  (req, res) => {
    try {
      const fineId =
        Number(
          req.params.id
        );

      const {
        cancelledBy,
        cancellationReason,
      } = req.body || {};

      const normalizedCancelledBy =
        Number(
          cancelledBy
        );

      const normalizedReason =
        cancellationReason
          ? String(
              cancellationReason
            ).trim()
          : null;

      if (
        !Number.isInteger(
          fineId
        ) ||
        fineId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_FINE_ID',

            message:
              'Invalid fine ID.',
          });
      }

      if (
        !Number.isInteger(
          normalizedCancelledBy
        ) ||
        normalizedCancelledBy <=
          0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_CANCELLED_BY',

            message:
              'A valid administrator or officer is required to cancel this fine.',
          });
      }

      // ======================================
      // FIND FINE
      // ======================================

      const fine =
        db.prepare(`
          SELECT
            id,

            fine_reference,

            paid_at,
            cancelled_at

          FROM fines

          WHERE
            id = ?
        `).get(
          fineId
        );

      if (!fine) {
        return res
          .status(404)
          .json({
            success: false,

            code:
              'FINE_NOT_FOUND',

            message:
              'Fine not found.',
          });
      }

      if (
        fine.cancelled_at
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'FINE_ALREADY_CANCELLED',

            message:
              'This fine is already cancelled.',
          });
      }

      if (fine.paid_at) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'PAID_FINE_CANNOT_BE_CANCELLED',

            message:
              'A paid fine cannot be cancelled from the Fines module.',
          });
      }

      // ======================================
      // VALIDATE USER CANCELLING FINE
      // ======================================

      const cancelledByUser =
        db.prepare(`
          SELECT
            id,
            role,
            account_status

          FROM users

          WHERE
            id = ?

            AND role IN (
              'ADMIN',
              'FINES_OFFICER'
            )
        `).get(
          normalizedCancelledBy
        );

      if (
        !cancelledByUser
      ) {
        return res
          .status(403)
          .json({
            success: false,

            code:
              'INVALID_CANCEL_USER',

            message:
              'Only an administrator or fines officer can cancel a fine.',
          });
      }

      // ======================================
      // CANCEL
      // ======================================

      const result =
        db.prepare(`
          UPDATE fines

          SET
            cancelled_at =
              CURRENT_TIMESTAMP,

            cancelled_by = ?,

            cancellation_reason = ?,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE
            id = ?

            AND cancelled_at
              IS NULL
        `).run(
          normalizedCancelledBy,

          normalizedReason,

          fineId
        );

      if (
        Number(
          result.changes
        ) === 0
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'FINE_NOT_CANCELLED',

            message:
              'Fine could not be cancelled.',
          });
      }

      return res.json({
        success: true,

        message:
          'Fine cancelled successfully.',

        fine: {
          id:
            fine.id,

          fineReference:
            fine.fine_reference,

          status:
            'CANCELLED',
        },
      });
    } catch (error) {
      console.error(
        'Cancel fine error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          code:
            'CANCEL_FINE_ERROR',

          message:
            'Failed to cancel fine.',

          error:
            error.message,
        });
    }
  }
);

// ==========================================
// CANCEL FINE
//
// PATCH /api/fines/:id/cancel
//
// Cancels an UNPAID fine.
// The fine is NOT deleted.
//
// Saves:
// - fine_status = CANCELLED
// - cancelled_at
// - cancelled_by
// - cancellation_reason
// ==========================================

router.patch(
  '/:id/cancel',
  (req, res) => {
    try {
      const fineId =
        Number(
          req.params.id
        );

      // ======================================
      // VALIDATE FINE ID
      // ======================================

      if (
        !Number.isInteger(
          fineId
        ) ||
        fineId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'INVALID_FINE_ID',

            message:
              'Invalid fine ID.',
          });
      }

      // ======================================
      // REQUEST BODY
      // ======================================

      const cancellationReason =
        String(
          req.body
            ?.cancellationReason ||
            ''
        ).trim();

      const cancelledByValue =
        req.body?.cancelledBy;

      // ======================================
      // CANCELLATION REASON REQUIRED
      // ======================================

      if (
        cancellationReason.length <
        3
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'CANCELLATION_REASON_REQUIRED',

            message:
              'Please provide a cancellation reason.',
          });
      }

      if (
        cancellationReason.length >
        500
      ) {
        return res
          .status(400)
          .json({
            success: false,

            code:
              'CANCELLATION_REASON_TOO_LONG',

            message:
              'Cancellation reason must not exceed 500 characters.',
          });
      }

      // ======================================
      // CANCELLED BY
      //
      // Nullable for now in case the
      // frontend has no stored userId.
      // ======================================

      let cancelledBy =
        null;

      if (
        cancelledByValue !==
          undefined &&
        cancelledByValue !==
          null &&
        cancelledByValue !==
          ''
      ) {
        const parsedUserId =
          Number(
            cancelledByValue
          );

        if (
          !Number.isInteger(
            parsedUserId
          ) ||
          parsedUserId <= 0
        ) {
          return res
            .status(400)
            .json({
              success: false,

              code:
                'INVALID_CANCELLED_BY',

              message:
                'Invalid cancelling user ID.',
            });
        }

        // ====================================
        // VERIFY USER EXISTS
        // ====================================

        const cancellingUser =
          db.prepare(`
            SELECT
              id,
              role

            FROM users

            WHERE id = ?
          `).get(
            parsedUserId
          );

        if (
          !cancellingUser
        ) {
          return res
            .status(400)
            .json({
              success: false,

              code:
                'CANCELLING_USER_NOT_FOUND',

              message:
                'The cancelling user could not be found.',
            });
        }

        cancelledBy =
          parsedUserId;
      }

      // ======================================
      // FIND FINE
      // ======================================

      const fine =
        db.prepare(`
          SELECT
            id,
            fine_reference,
            fine_status,
            paid_at,
            cancelled_at

          FROM fines

          WHERE id = ?
        `).get(
          fineId
        );

      if (!fine) {
        return res
          .status(404)
          .json({
            success: false,

            code:
              'FINE_NOT_FOUND',

            message:
              'Fine not found.',
          });
      }

      // ======================================
      // CURRENT STATUS
      // ======================================

      const currentStatus =
        String(
          fine.fine_status ||
            ''
        ).toUpperCase();

      // ======================================
      // ALREADY CANCELLED
      // ======================================

      if (
        fine.cancelled_at ||
        currentStatus ===
          'CANCELLED'
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'FINE_ALREADY_CANCELLED',

            message:
              'This fine has already been cancelled.',
          });
      }

      // ======================================
      // PAID FINE CANNOT BE CANCELLED
      // ======================================

      if (
        fine.paid_at ||
        currentStatus ===
          'PAID'
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              'PAID_FINE_CANNOT_BE_CANCELLED',

            message:
              'A paid fine cannot be cancelled.',
          });
      }

      // ======================================
      // CANCEL FINE
      // ======================================

      const result =
        db.prepare(`
          UPDATE fines

          SET
            fine_status =
              'CANCELLED',

            cancelled_at =
              CURRENT_TIMESTAMP,

            cancelled_by = ?,

            cancellation_reason = ?,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE
            id = ?

            AND paid_at
              IS NULL

            AND cancelled_at
              IS NULL
        `).run(
          cancelledBy,
          cancellationReason,
          fineId
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
          .status(409)
          .json({
            success: false,

            code:
              'FINE_NOT_CANCELLED',

            message:
              'The fine could not be cancelled.',
          });
      }

      // ======================================
      // GET UPDATED FINE
      // ======================================

      const updatedFine =
        db.prepare(`
          SELECT
            id,
            fine_reference,
            fine_status,
            cancelled_at,
            cancelled_by,
            cancellation_reason

          FROM fines

          WHERE id = ?
        `).get(
          fineId
        );

      // ======================================
      // SUCCESS
      // ======================================

      return res.json({
        success: true,

        message:
          'Fine cancelled successfully.',

        fine: {
          id:
            updatedFine.id,

          fineReference:
            updatedFine.fine_reference,

          status:
            updatedFine.fine_status,

          cancelledAt:
            updatedFine.cancelled_at,

          cancelledBy:
            updatedFine.cancelled_by,

          cancellationReason:
            updatedFine.cancellation_reason,
        },
      });
    } catch (error) {
      console.error(
        'Cancel fine error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          code:
            'CANCEL_FINE_ERROR',

          message:
            'Failed to cancel fine.',

          error:
            error.message,
        });
    }
  }
);

module.exports = router;