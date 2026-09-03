const express = require('express');

const router = express.Router();

const db = require('../database/database');

console.log('reports.js loaded');

// ==========================================
// VALIDATE PAYMENT ID
// ==========================================

function getValidPaymentId(
  value
) {
  const paymentId =
    Number(value);

  if (
    !Number.isInteger(
      paymentId
    ) ||
    paymentId <= 0
  ) {
    return null;
  }

  return paymentId;
}

// ==========================================
// FORMAT PAYMENT ROW
// ==========================================

function formatPaymentRow(
  payment
) {
  return {
    id:
      Number(
        payment.id
      ),

    payment_reference:
      payment.payment_reference,

    payment_method:
      payment.payment_method,

    payment_status:
      payment.payment_status,

    amount_centavos:
      Number(
        payment.amount_centavos ||
          0
      ),

    amount:
      Number(
        payment.amount_centavos ||
          0
      ) / 100,

    student_id:
      Number(
        payment.student_id
      ),

    student_number:
      payment.student_number,

    student_name:
      payment.student_name,

    fine_id:
      Number(
        payment.fine_id
      ),

    fine_reference:
      payment.fine_reference,

    violation_name:
      payment.violation_name ||
      null,

    gateway_transaction_id:
      payment.gateway_transaction_id,

    gateway_reference:
      payment.gateway_reference,

    confirmed_by:
      payment.confirmed_by
        ? Number(
            payment.confirmed_by
          )
        : null,

    confirmed_by_name:
      payment.confirmed_by_name ||
      null,

    payment_notes:
      payment.payment_notes ||
      null,

    created_at:
      payment.created_at,

    confirmed_at:
      payment.confirmed_at,

    paid_at:
      payment.paid_at,

    transaction_date:
      payment.transaction_date,
  };
}

// ==========================================
// GET PAYMENT REPORT
//
// GET /api/reports/payments
//
// SUMMARY:
//
// Total Collected
// -> payment has paid_at
//
// Pending Payments
// -> payment_status = PENDING
//
// Today's Payment
// -> paid_at is today
// ==========================================

router.get(
  '/payments',
  (req, res) => {
    try {
      // ======================================
      // SUMMARY
      // ======================================

      const summary =
        db.prepare(`
          SELECT

            COALESCE(
              SUM(
                CASE

                  WHEN
                    paid_at IS NOT NULL

                  THEN
                    amount_centavos

                  ELSE
                    0

                END
              ),
              0
            )
              AS total_collected_centavos,

            COALESCE(
              SUM(
                CASE

                  WHEN
                    UPPER(
                      COALESCE(
                        payment_status,
                        ''
                      )
                    ) = 'PENDING'

                  THEN
                    amount_centavos

                  ELSE
                    0

                END
              ),
              0
            )
              AS pending_payments_centavos,

            COALESCE(
              SUM(
                CASE

                  WHEN
                    paid_at IS NOT NULL

                    AND

                    DATE(
                      paid_at,
                      'localtime'
                    )
                      =
                    DATE(
                      'now',
                      'localtime'
                    )

                  THEN
                    amount_centavos

                  ELSE
                    0

                END
              ),
              0
            )
              AS today_payment_centavos,

            COUNT(
              CASE

                WHEN
                  paid_at IS NOT NULL

                THEN
                  1

              END
            )
              AS total_collected_count,

            COUNT(
              CASE

                WHEN
                  UPPER(
                    COALESCE(
                      payment_status,
                      ''
                    )
                  ) = 'PENDING'

                THEN
                  1

              END
            )
              AS pending_payment_count,

            COUNT(
              CASE

                WHEN
                  paid_at IS NOT NULL

                  AND

                  DATE(
                    paid_at,
                    'localtime'
                  )
                    =
                  DATE(
                    'now',
                    'localtime'
                  )

                THEN
                  1

              END
            )
              AS today_payment_count

          FROM payments
        `).get();

      // ======================================
      // TRANSACTIONS
      // ======================================

      const transactions =
        db.prepare(`
          SELECT
            p.id,

            p.payment_reference,

            p.fine_id,

            p.student_id,

            p.amount_centavos,

            p.payment_method,

            p.payment_status,

            p.gateway_transaction_id,

            p.gateway_reference,

            p.confirmed_by,

            p.payment_notes,

            p.created_at,

            p.confirmed_at,

            p.paid_at,

            COALESCE(
              p.paid_at,
              p.confirmed_at,
              p.created_at
            )
              AS transaction_date,

            f.fine_reference,

            vt.violation_name,

            COALESCE(
              student.student_number,
              student.username
            )
              AS student_number,

            TRIM(
              student.first_name
              || ' '
              ||
              COALESCE(
                student.middle_name
                  || ' ',
                ''
              )
              ||
              student.last_name
            )
              AS student_name,

            CASE

              WHEN
                confirmer.id IS NOT NULL

              THEN
                TRIM(
                  confirmer.first_name
                  || ' '
                  ||
                  COALESCE(
                    confirmer.middle_name
                      || ' ',
                    ''
                  )
                  ||
                  confirmer.last_name
                )

              ELSE
                NULL

            END
              AS confirmed_by_name

          FROM payments p

          LEFT JOIN fines f
            ON
              f.id =
              p.fine_id

          LEFT JOIN violation_types vt
            ON
              vt.id =
              f.violation_type_id

          LEFT JOIN users student
            ON
              student.id =
              p.student_id

          LEFT JOIN users confirmer
            ON
              confirmer.id =
              p.confirmed_by

          ORDER BY
            COALESCE(
              p.paid_at,
              p.confirmed_at,
              p.created_at
            ) DESC,

            p.id DESC
        `).all();

      // ======================================
      // VALUES
      // ======================================

      const totalCollectedCentavos =
        Number(
          summary
            .total_collected_centavos ||
            0
        );

      const pendingPaymentsCentavos =
        Number(
          summary
            .pending_payments_centavos ||
            0
        );

      const todayPaymentCentavos =
        Number(
          summary
            .today_payment_centavos ||
            0
        );

      // ======================================
      // RESPONSE
      // ======================================

      return res.json({
        success:
          true,

        summary: {
          totalCollectedCentavos,

          totalCollected:
            totalCollectedCentavos /
            100,

          pendingPaymentsCentavos,

          pendingPayments:
            pendingPaymentsCentavos /
            100,

          todayPaymentCentavos,

          todayPayment:
            todayPaymentCentavos /
            100,

          totalCollectedCount:
            Number(
              summary
                .total_collected_count ||
                0
            ),

          pendingPaymentCount:
            Number(
              summary
                .pending_payment_count ||
                0
            ),

          todayPaymentCount:
            Number(
              summary
                .today_payment_count ||
                0
            ),
        },

        transactions:
          transactions.map(
            formatPaymentRow
          ),

        totalTransactions:
          transactions.length,
      });
    } catch (error) {
      console.error(
        'Payment reports error:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          code:
            'PAYMENT_REPORT_ERROR',

          message:
            'Failed to load payment reports.',

          error:
            error.message,
        });
    }
  }
);

// ==========================================
// GET DETAILED PAYMENT REPORT
//
// GET /api/reports/payments/:id
//
// Uses payments.id
//
// This endpoint is used by:
//
// /admin/reports/[id]
//
// Includes:
// - Transaction reference
// - Student
// - Amount
// - Payment method
// - Payment status
// - Fine reference
// - Violation
// - Gateway references
// - Cashier confirmation
// - Date and time
// ==========================================

router.get(
  '/payments/:id',
  (req, res) => {
    try {
      const paymentId =
        getValidPaymentId(
          req.params.id
        );

      // ======================================
      // VALIDATE ID
      // ======================================

      if (
        paymentId ===
        null
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            code:
              'INVALID_PAYMENT_ID',

            message:
              'Invalid payment transaction ID.',
          });
      }

      // ======================================
      // PAYMENT
      // ======================================

      const payment =
        db.prepare(`
          SELECT
            p.id,

            p.payment_reference,

            p.fine_id,

            p.student_id,

            p.amount_centavos,

            p.payment_method,

            p.payment_status,

            p.gateway_transaction_id,

            p.gateway_reference,

            p.confirmed_by,

            p.payment_notes,

            p.created_at,

            p.confirmed_at,

            p.paid_at,

            COALESCE(
              p.paid_at,
              p.confirmed_at,
              p.created_at
            )
              AS transaction_date,

            f.fine_reference,

            f.fine_status,

            f.issued_at
              AS fine_issued_at,

            vt.violation_code,

            vt.violation_name,

            COALESCE(
              student.student_number,
              student.username
            )
              AS student_number,

            student.username
              AS student_username,

            student.first_name
              AS student_first_name,

            student.middle_name
              AS student_middle_name,

            student.last_name
              AS student_last_name,

            TRIM(
              student.first_name
              || ' '
              ||
              COALESCE(
                student.middle_name
                  || ' ',
                ''
              )
              ||
              student.last_name
            )
              AS student_name,

            CASE

              WHEN
                confirmer.id IS NOT NULL

              THEN
                TRIM(
                  confirmer.first_name
                  || ' '
                  ||
                  COALESCE(
                    confirmer.middle_name
                      || ' ',
                    ''
                  )
                  ||
                  confirmer.last_name
                )

              ELSE
                NULL

            END
              AS confirmed_by_name,

            confirmer.username
              AS confirmed_by_username,

            confirmer.role
              AS confirmed_by_role

          FROM payments p

          LEFT JOIN fines f
            ON
              f.id =
              p.fine_id

          LEFT JOIN violation_types vt
            ON
              vt.id =
              f.violation_type_id

          LEFT JOIN users student
            ON
              student.id =
              p.student_id

          LEFT JOIN users confirmer
            ON
              confirmer.id =
              p.confirmed_by

          WHERE
            p.id = ?

          LIMIT 1
        `).get(
          paymentId
        );

      // ======================================
      // NOT FOUND
      // ======================================

      if (
        !payment
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            code:
              'PAYMENT_NOT_FOUND',

            message:
              'Payment transaction not found.',
          });
      }

      // ======================================
      // PAYMENT METHOD
      // ======================================

      const normalizedMethod =
        String(
          payment.payment_method ||
            ''
        )
          .trim()
          .toUpperCase();

      // ======================================
      // PAYMENT STATUS
      // ======================================

      const normalizedStatus =
        String(
          payment.payment_status ||
            'PENDING'
        )
          .trim()
          .toUpperCase();

      // ======================================
      // PAYMENT METHOD DISPLAY
      // ======================================

      let paymentMethodLabel =
        payment.payment_method ||
        'Not specified';

      if (
        normalizedMethod ===
          'CASHIER' ||
        normalizedMethod ===
          'CASH' ||
        normalizedMethod ===
          'PAY_AT_CASHIER'
      ) {
        paymentMethodLabel =
          'Pay at Cashier';
      } else if (
        normalizedMethod ===
        'GCASH'
      ) {
        paymentMethodLabel =
          'GCash';
      }

      // ======================================
      // STATUS DISPLAY
      // ======================================

      let paymentStatusLabel =
        'Pending';

      if (
        normalizedStatus ===
          'PAID' ||
        payment.paid_at
      ) {
        paymentStatusLabel =
          'Paid';
      } else if (
        normalizedStatus ===
        'CANCELLED'
      ) {
        paymentStatusLabel =
          'Cancelled';
      } else if (
        normalizedStatus ===
        'FAILED'
      ) {
        paymentStatusLabel =
          'Failed';
      }

      // ======================================
      // REFERENCE NUMBER
      //
      // Online payment:
      // gateway_reference or gateway transaction
      //
      // Cashier:
      // payment_reference
      // ======================================

      const referenceNumber =
        payment.gateway_reference ||
        payment.gateway_transaction_id ||
        payment.payment_reference;

      // ======================================
      // CASHIER PAYMENT
      // ======================================

      const isCashierPayment =
        normalizedMethod ===
          'CASHIER' ||
        normalizedMethod ===
          'CASH' ||
        normalizedMethod ===
          'PAY_AT_CASHIER';

      // ======================================
      // TRANSACTION MESSAGE
      // ======================================

      let statusMessage =
        'This payment is currently pending.';

      if (
        isCashierPayment
      ) {
        if (
          payment.paid_at ||
          normalizedStatus ===
            'PAID'
        ) {
          if (
            payment.confirmed_by_name
          ) {
            statusMessage =
              `This payment was received and confirmed at the cashier by ${payment.confirmed_by_name}.`;
          } else {
            statusMessage =
              'This payment was received and confirmed at the cashier.';
          }
        } else if (
          normalizedStatus ===
          'CANCELLED'
        ) {
          statusMessage =
            'This cashier payment request was cancelled.';
        } else {
          statusMessage =
            'Waiting for payment and confirmation at the cashier.';
        }
      } else {
        if (
          payment.paid_at ||
          normalizedStatus ===
            'PAID'
        ) {
          statusMessage =
            'This payment was completed successfully.';
        } else if (
          normalizedStatus ===
          'CANCELLED'
        ) {
          statusMessage =
            'This payment transaction was cancelled.';
        } else if (
          normalizedStatus ===
          'FAILED'
        ) {
          statusMessage =
            'This payment transaction was not completed successfully.';
        } else {
          statusMessage =
            'This payment transaction is awaiting completion.';
        }
      }

      // ======================================
      // RESPONSE
      // ======================================

      return res.json({
        success:
          true,

        payment: {
          id:
            Number(
              payment.id
            ),

          payment_reference:
            payment.payment_reference,

          payment_method:
            payment.payment_method,

          payment_method_label:
            paymentMethodLabel,

          payment_status:
            payment.payment_status,

          payment_status_label:
            paymentStatusLabel,

          is_cashier_payment:
            isCashierPayment,

          amount_centavos:
            Number(
              payment.amount_centavos ||
                0
            ),

          amount:
            Number(
              payment.amount_centavos ||
                0
            ) / 100,

          // ==================================
          // REFERENCES
          // ==================================

          reference_number:
            referenceNumber,

          gateway_transaction_id:
            payment.gateway_transaction_id,

          gateway_reference:
            payment.gateway_reference,

          // ==================================
          // STUDENT
          // ==================================

          student_id:
            Number(
              payment.student_id
            ),

          student_number:
            payment.student_number,

          student_username:
            payment.student_username,

          student_first_name:
            payment.student_first_name,

          student_middle_name:
            payment.student_middle_name,

          student_last_name:
            payment.student_last_name,

          student_name:
            payment.student_name,

          // ==================================
          // FINE
          // ==================================

          fine_id:
            Number(
              payment.fine_id
            ),

          fine_reference:
            payment.fine_reference,

          fine_status:
            payment.fine_status,

          fine_issued_at:
            payment.fine_issued_at,

          violation_code:
            payment.violation_code,

          violation_name:
            payment.violation_name,

          // ==================================
          // CASHIER / CONFIRMATION
          // ==================================

          confirmed_by:
            payment.confirmed_by
              ? Number(
                  payment.confirmed_by
                )
              : null,

          confirmed_by_name:
            payment.confirmed_by_name,

          confirmed_by_username:
            payment.confirmed_by_username,

          confirmed_by_role:
            payment.confirmed_by_role,

          payment_notes:
            payment.payment_notes,

          // ==================================
          // DATES
          // ==================================

          created_at:
            payment.created_at,

          confirmed_at:
            payment.confirmed_at,

          paid_at:
            payment.paid_at,

          transaction_date:
            payment.transaction_date,

          // ==================================
          // DISPLAY MESSAGE
          // ==================================

          status_message:
            statusMessage,
        },
      });
    } catch (error) {
      console.error(
        'Detailed payment report error:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          code:
            'PAYMENT_REPORT_DETAIL_ERROR',

          message:
            'Failed to load payment transaction details.',

          error:
            error.message,
        });
    }
  }
);

module.exports = router;