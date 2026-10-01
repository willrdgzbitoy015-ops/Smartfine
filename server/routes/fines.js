const express = require("express");
const router = express.Router();
const db = require("../database/database");
const { notifyFineCancelled } = require("../database/notifications");
const { authenticateToken } = require("./auth");
console.log("fines.js loaded");
const studentFineReadsAlreadyExisted = Boolean(
  db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'student_fine_reads'",
    )
    .get(),
);
db.exec(`CREATE TABLE IF NOT EXISTS student_fine_reads (
  student_id INTEGER NOT NULL,
  fine_id INTEGER NOT NULL,
  read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, fine_id)
);`);
if (!studentFineReadsAlreadyExisted) {
  db.prepare(
    `
    INSERT OR IGNORE INTO student_fine_reads (student_id, fine_id)
    SELECT student_id, id FROM fines
  `,
  ).run();
}
// Cancel an unpaid fine and close its outstanding cashier request in one
// transaction. Successful payments and other fines' requests are untouched.
function cancelFineAndCashRequest(fineId, cancelledBy, cancellationReason) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = db
      .prepare(
        `UPDATE fines
         SET fine_status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP,
             cancelled_by = ?, cancellation_reason = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND paid_at IS NULL AND cancelled_at IS NULL`,
      )
      .run(cancelledBy, cancellationReason, fineId);
    if (Number(result.changes) !== 1) {
      db.exec("ROLLBACK");
      return result;
    }
    // Keep a history entry for each request closed by this cancellation.
    db.prepare(
      `INSERT INTO payment_events (payment_id, event_type, actor_user_id)
      SELECT id, 'CASH_REQUEST_CANCELLED', ?
      FROM payments
      WHERE fine_id = ? AND payment_method = 'CASH'
        AND payment_status = 'PENDING'`,
    ).run(cancelledBy, fineId);
    const requests = db
      .prepare(
        `UPDATE payments
        SET payment_status = 'CANCELLED'
        WHERE fine_id = ? AND payment_method = 'CASH'
          AND payment_status = 'PENDING'`,
      )
      .run(fineId);
    // A cancelled request no longer requires attention in the Admin inbox.
    db.prepare(
      `UPDATE notifications
      SET is_read = 1
      WHERE notification_type = 'PAYMENT' AND is_read = 0
        AND title = 'Cashier Payment Requested'
        AND related_payment_id IN (
          SELECT id FROM payments
          WHERE fine_id = ? AND payment_method = 'CASH'
            AND payment_status = 'CANCELLED'
        )`,
    ).run(fineId);
    notifyFineCancelled(
      fineId,
      cancelledBy,
      cancellationReason,
      Number(requests.changes),
    );
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
// Only an active Admin or Fines Officer may cancel a fine. The canceller is
// taken from the signed-in token, not from the request body.
function requireActiveFineManager(req, res, next) {
  try {
    const userId = Number(req.authUser?.userId);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Please sign in again.",
      });
    }
    const user = db
      .prepare("SELECT id, role, account_status FROM users WHERE id = ?")
      .get(userId);
    if (
      !user ||
      !["ADMIN", "FINES_OFFICER"].includes(user.role) ||
      user.account_status !== "ACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        code: "INVALID_CANCEL_USER",
        message:
          "Only an active administrator or fines officer can cancel a fine.",
      });
    }
    req.cancellingUserId = userId;
    next();
  } catch (error) {
    console.error("Cancel fine authorization error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not verify your account.",
    });
  }
}
const canCancelFines = [authenticateToken, requireActiveFineManager];
function formatFullName(firstName, middleName, lastName) {
  return [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
}
function generateFineReference() {
  const currentYear = new Date().getFullYear();
  const prefix = `F-${currentYear}-`;
  const latestFine = db
    .prepare(
      `
      SELECT fine_reference
      FROM fines
      WHERE fine_reference LIKE ?
      ORDER BY fine_reference DESC
      LIMIT 1
      `,
    )
    .get(`${prefix}%`);
  if (!latestFine || !latestFine.fine_reference) {
    return `${prefix}0001`;
  }
  const parts = String(latestFine.fine_reference).split("-");
  const lastNumber = Number(parts[parts.length - 1]) || 0;
  const nextNumber = String(lastNumber + 1).padStart(4, "0");
  return `${prefix}${nextNumber}`;
}
function generateViolationCode() {
  const rows = db
    .prepare(
      `
      SELECT violation_code
      FROM violation_types
      WHERE UPPER(violation_code) LIKE 'V%'
      `,
    )
    .all();
  let highestNumber = 0;
  for (const row of rows) {
    const match = String(row.violation_code || "")
      .trim()
      .toUpperCase()
      .match(/^V(\d+)$/);
    if (!match) {
      continue;
    }
    const numericPart = Number(match[1]);
    if (Number.isSafeInteger(numericPart) && numericPart > highestNumber) {
      highestNumber = numericPart;
    }
  }
  return `V${String(highestNumber + 1).padStart(3, "0")}`;
}
function requireAdmin(req, res, next) {
  const role = String(req.authUser?.role || "")
    .trim()
    .toUpperCase();
  if (role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      code: "ADMIN_REQUIRED",
      message: "Only an administrator can manage fine types.",
    });
  }
  next();
}
function normalizeViolationName(value) {
  return String(value || "").trim();
}
function normalizeDescription(value) {
  const text = String(value || "").trim();
  return text || null;
}
function pesoToCentavos(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  const centavos = Math.round(amount * 100);
  if (!Number.isSafeInteger(centavos) || centavos <= 0) {
    return null;
  }
  return centavos;
}
function normalizeActiveFlag(value, fallback = 1) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const normalized = String(value).trim().toUpperCase();
  if (
    value === true ||
    value === 1 ||
    value === "1" ||
    normalized === "ACTIVE" ||
    normalized === "TRUE"
  ) {
    return 1;
  }
  if (
    value === false ||
    value === 0 ||
    value === "0" ||
    normalized === "INACTIVE" ||
    normalized === "FALSE"
  ) {
    return 0;
  }
  return null;
}
function getViolationMaintenanceRow(id) {
  return db
    .prepare(
      `
      SELECT
        id,
        violation_code,
        violation_name,
        description,
        amount_centavos,
        amount_centavos / 100.0 AS amount,
        is_active
      FROM violation_types
      WHERE id = ?
      `,
    )
    .get(id);
}
function validateViolationMaintenanceInput(body, existing = null) {
  const violationName = normalizeViolationName(
    body?.violationName ?? body?.violation_name ?? existing?.violation_name,
  );
  const description = normalizeDescription(
    body?.description ?? existing?.description,
  );
  let amountValue;
  if (body?.amount !== undefined) {
    amountValue = body.amount;
  } else if (body?.amountCentavos !== undefined) {
    amountValue = Number(body.amountCentavos) / 100;
  } else if (body?.amount_centavos !== undefined) {
    amountValue = Number(body.amount_centavos) / 100;
  } else if (existing) {
    amountValue = Number(existing.amount_centavos) / 100;
  }
  const amountCentavos = pesoToCentavos(amountValue);
  const isActive = normalizeActiveFlag(
    body?.isActive ?? body?.is_active,
    existing ? Number(existing.is_active) : 1,
  );
  if (!violationName) {
    return {
      error: "Fine type name is required.",
    };
  }
  if (violationName.length > 120) {
    return {
      error: "Fine type name must not exceed 120 characters.",
    };
  }
  if (description && description.length > 500) {
    return {
      error: "Description must not exceed 500 characters.",
    };
  }
  if (amountCentavos === null) {
    return {
      error: "Fine amount must be greater than zero.",
    };
  }
  if (isActive === null) {
    return {
      error: "Status must be Active or Inactive.",
    };
  }
  return {
    value: {
      violationName,
      description,
      amountCentavos,
      isActive,
    },
  };
}
router.get("/options/students", (req, res) => {
  try {
    const students = db
      .prepare(
        `
        SELECT
          id,
          COALESCE(student_number, username) AS student_id,
          username,
          first_name,
          middle_name,
          last_name,
          TRIM(
            first_name || ' ' ||
            COALESCE(middle_name || ' ', '') ||
            last_name
          ) AS full_name,
          grade_level,
          section
        FROM users
        WHERE role = 'STUDENT'
          AND UPPER(account_status) = 'ACTIVE'
        ORDER BY last_name ASC, first_name ASC
        `,
      )
      .all();
    return res.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error("Load fine student options error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load student options.",
      error: error.message,
    });
  }
});
router.get("/options/violations", (req, res) => {
  try {
    const violations = db
      .prepare(
        `
        SELECT
          id,
          violation_code,
          violation_name,
          description,
          amount_centavos,
          amount_centavos / 100.0 AS amount
        FROM violation_types
        WHERE is_active = 1
        ORDER BY violation_name ASC
        `,
      )
      .all();
    return res.json({
      success: true,
      violations,
    });
  } catch (error) {
    console.error("Load violation options error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load violation types.",
      error: error.message,
    });
  }
});
router.get(
  "/maintenance/violation-types",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    try {
      const violations = db
        .prepare(
          `
          SELECT
            id,
            violation_code,
            violation_name,
            description,
            amount_centavos,
            amount_centavos / 100.0 AS amount,
            is_active
          FROM violation_types
          ORDER BY violation_code ASC
          `,
        )
        .all();
      return res.json({
        success: true,
        violations,
        nextCode: generateViolationCode(),
      });
    } catch (error) {
      console.error("Load fine type maintenance error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load fine types.",
        error: error.message,
      });
    }
  },
);
router.post(
  "/maintenance/violation-types",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    try {
      const validation = validateViolationMaintenanceInput(req.body);
      if (validation.error) {
        return res.status(400).json({
          success: false,
          code: "INVALID_FINE_TYPE",
          message: validation.error,
        });
      }
      const { violationName, description, amountCentavos, isActive } =
        validation.value;
      const duplicateName = db
        .prepare(
          `
          SELECT
            id,
            violation_name
          FROM violation_types
          WHERE LOWER(violation_name) = LOWER(?)
          LIMIT 1
          `,
        )
        .get(violationName);
      if (duplicateName) {
        return res.status(409).json({
          success: false,
          code: "FINE_TYPE_NAME_EXISTS",
          message: "That fine type name already exists.",
        });
      }
      const violationCode = generateViolationCode();
      const result = db
        .prepare(
          `
          INSERT INTO violation_types (
            violation_code,
            violation_name,
            description,
            amount_centavos,
            is_active
          )
          VALUES (?, ?, ?, ?, ?)
          `,
        )
        .run(
          violationCode,
          violationName,
          description,
          amountCentavos,
          isActive,
        );
      const violation = getViolationMaintenanceRow(
        Number(result.lastInsertRowid),
      );
      return res.status(201).json({
        success: true,
        message: `Fine type ${violationCode} added successfully.`,
        violation,
        nextCode: generateViolationCode(),
      });
    } catch (error) {
      console.error("Create fine type error:", error);
      return res.status(500).json({
        success: false,
        code: "CREATE_FINE_TYPE_ERROR",
        message: "Failed to add fine type.",
        error: error.message,
      });
    }
  },
);
router.put(
  "/maintenance/violation-types/:id",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    try {
      const violationId = Number(req.params.id);
      if (!Number.isInteger(violationId) || violationId <= 0) {
        return res.status(400).json({
          success: false,
          code: "INVALID_FINE_TYPE_ID",
          message: "Invalid fine type ID.",
        });
      }
      const existing = getViolationMaintenanceRow(violationId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          code: "FINE_TYPE_NOT_FOUND",
          message: "Fine type not found.",
        });
      }
      const validation = validateViolationMaintenanceInput(req.body, existing);
      if (validation.error) {
        return res.status(400).json({
          success: false,
          code: "INVALID_FINE_TYPE",
          message: validation.error,
        });
      }
      const { violationName, description, amountCentavos, isActive } =
        validation.value;
      const duplicateName = db
        .prepare(
          `
          SELECT
            id,
            violation_name
          FROM violation_types
          WHERE id != ?
            AND LOWER(violation_name) = LOWER(?)
          LIMIT 1
          `,
        )
        .get(violationId, violationName);
      if (duplicateName) {
        return res.status(409).json({
          success: false,
          code: "FINE_TYPE_NAME_EXISTS",
          message: "That fine type name already exists.",
        });
      }
      const result = db
        .prepare(
          `
          UPDATE violation_types
          SET
            violation_name = ?,
            description = ?,
            amount_centavos = ?,
            is_active = ?
          WHERE id = ?
          `,
        )
        .run(violationName, description, amountCentavos, isActive, violationId);
      if (Number(result.changes) === 0) {
        return res.status(404).json({
          success: false,
          code: "FINE_TYPE_NOT_UPDATED",
          message: "Fine type could not be updated.",
        });
      }
      return res.json({
        success: true,
        message: "Fine type updated successfully.",
        violation: getViolationMaintenanceRow(violationId),
        nextCode: generateViolationCode(),
      });
    } catch (error) {
      console.error("Update fine type error:", error);
      return res.status(500).json({
        success: false,
        code: "UPDATE_FINE_TYPE_ERROR",
        message: "Failed to update fine type.",
        error: error.message,
      });
    }
  },
);
router.patch(
  "/maintenance/violation-types/:id/status",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    try {
      const violationId = Number(req.params.id);
      if (!Number.isInteger(violationId) || violationId <= 0) {
        return res.status(400).json({
          success: false,
          code: "INVALID_FINE_TYPE_ID",
          message: "Invalid fine type ID.",
        });
      }
      const existing = getViolationMaintenanceRow(violationId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          code: "FINE_TYPE_NOT_FOUND",
          message: "Fine type not found.",
        });
      }
      const isActive = normalizeActiveFlag(req.body?.isActive, null);
      if (isActive === null) {
        return res.status(400).json({
          success: false,
          code: "INVALID_FINE_TYPE_STATUS",
          message: "Status must be Active or Inactive.",
        });
      }
      db.prepare(
        `
        UPDATE violation_types
        SET is_active = ?
        WHERE id = ?
        `,
      ).run(isActive, violationId);
      return res.json({
        success: true,
        message:
          isActive === 1
            ? "Fine type activated successfully."
            : "Fine type deactivated successfully.",
        violation: getViolationMaintenanceRow(violationId),
        nextCode: generateViolationCode(),
      });
    } catch (error) {
      console.error("Update fine type status error:", error);
      return res.status(500).json({
        success: false,
        code: "UPDATE_FINE_TYPE_STATUS_ERROR",
        message: "Failed to update fine type status.",
        error: error.message,
      });
    }
  },
);
router.get("/options/officers", (req, res) => {
  try {
    const officers = db
      .prepare(
        `
        SELECT
          id,
          username,
          first_name,
          middle_name,
          last_name,
          TRIM(
            first_name || ' ' ||
            COALESCE(middle_name || ' ', '') ||
            last_name
          ) AS full_name,
          role
        FROM users
        WHERE role IN ('FINES_OFFICER', 'ADMIN')
          AND UPPER(account_status) = 'ACTIVE'
        ORDER BY last_name ASC, first_name ASC
        `,
      )
      .all();
    return res.json({
      success: true,
      officers,
    });
  } catch (error) {
    console.error("Load officer options error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load officer options.",
      error: error.message,
    });
  }
});
router.get("/", (req, res) => {
  try {
    const search = String(req.query.search || "")
      .trim()
      .toLowerCase();
    const status = String(req.query.status || "")
      .trim()
      .toUpperCase();
    const violationTypeId = Number(req.query.violationTypeId);
    const fines = db
      .prepare(
        `
        SELECT
          f.id,
          f.fine_reference,
          f.student_id,
          COALESCE(
            student.student_number,
            student.username
          ) AS student_number,
          student.username AS student_username,
          TRIM(
            student.first_name || ' ' ||
            COALESCE(student.middle_name || ' ', '') ||
            student.last_name
          ) AS student_name,
          f.violation_type_id,
          vt.violation_code,
          vt.violation_name,
          f.amount_centavos,
          f.amount_centavos / 100.0 AS amount,
          f.remarks,
          f.recorded_by AS officer_id,
          CASE
            WHEN officer.id IS NOT NULL THEN
              TRIM(
                officer.first_name || ' ' ||
                COALESCE(officer.middle_name || ' ', '') ||
                officer.last_name
              )
            ELSE 'Unknown'
          END AS officer_name,
          f.issued_at,
          f.created_at,
          f.created_at AS recordedAt,
          f.paid_at,
          f.cancelled_at,
          f.cancellation_reason,
          CASE
            WHEN f.cancelled_at IS NOT NULL THEN 'CANCELLED'
            WHEN f.paid_at IS NOT NULL THEN 'PAID'
            ELSE 'UNPAID'
          END AS status
        FROM fines f
        JOIN users student
          ON student.id = f.student_id
        JOIN violation_types vt
          ON vt.id = f.violation_type_id
        LEFT JOIN users officer
          ON officer.id = f.recorded_by
        ORDER BY f.issued_at DESC, f.id DESC
        `,
      )
      .all();
    const filteredFines = fines.filter((fine) => {
      if (search) {
        const searchable = [
          fine.fine_reference,
          fine.student_number,
          fine.student_username,
          fine.student_name,
          fine.violation_name,
          fine.officer_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(search)) {
          return false;
        }
      }
      if (
        status &&
        status !== "ALL" &&
        String(fine.status).toUpperCase() !== status
      ) {
        return false;
      }
      if (
        Number.isInteger(violationTypeId) &&
        violationTypeId > 0 &&
        Number(fine.violation_type_id) !== violationTypeId
      ) {
        return false;
      }
      return true;
    });
    return res.json({
      success: true,
      fines: filteredFines,
    });
  } catch (error) {
    console.error("Load fines error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load fines.",
      error: error.message,
    });
  }
});
router.post("/", (req, res) => {
  try {
    const { studentId, violationTypeId, recordedBy, remarks, issuedAt } =
      req.body;
    const normalizedStudentId = Number(studentId);
    const normalizedViolationTypeId = Number(violationTypeId);
    const normalizedRecordedBy = Number(recordedBy);
    const normalizedRemarks = remarks ? String(remarks).trim() : null;
    const normalizedIssuedAt = issuedAt ? String(issuedAt).trim() : null;
    if (!Number.isInteger(normalizedStudentId) || normalizedStudentId <= 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_STUDENT",
        message: "Please select a valid student.",
      });
    }
    if (
      !Number.isInteger(normalizedViolationTypeId) ||
      normalizedViolationTypeId <= 0
    ) {
      return res.status(400).json({
        success: false,
        code: "INVALID_VIOLATION_TYPE",
        message: "Please select a valid violation type.",
      });
    }
    if (!Number.isInteger(normalizedRecordedBy) || normalizedRecordedBy <= 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OFFICER",
        message: "Please select a valid officer.",
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
          account_status
        FROM users
        WHERE id = ?
          AND role = 'STUDENT'
        `,
      )
      .get(normalizedStudentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        code: "STUDENT_NOT_FOUND",
        message: "Student not found.",
      });
    }
    if (String(student.account_status || "").toUpperCase() !== "ACTIVE") {
      return res.status(409).json({
        success: false,
        code: "STUDENT_INACTIVE",
        message: "A new fine cannot be issued to an inactive student account.",
      });
    }
    const violation = db
      .prepare(
        `
        SELECT
          id,
          violation_code,
          violation_name,
          amount_centavos,
          is_active
        FROM violation_types
        WHERE id = ?
        `,
      )
      .get(normalizedViolationTypeId);
    if (!violation) {
      return res.status(404).json({
        success: false,
        code: "VIOLATION_NOT_FOUND",
        message: "Violation type not found.",
      });
    }
    if (Number(violation.is_active) !== 1) {
      return res.status(409).json({
        success: false,
        code: "VIOLATION_INACTIVE",
        message: "This violation type is currently inactive.",
      });
    }
    const officer = db
      .prepare(
        `
        SELECT
          id,
          first_name,
          middle_name,
          last_name,
          role,
          account_status
        FROM users
        WHERE id = ?
          AND role IN ('FINES_OFFICER', 'ADMIN')
        `,
      )
      .get(normalizedRecordedBy);
    if (!officer) {
      return res.status(404).json({
        success: false,
        code: "OFFICER_NOT_FOUND",
        message: "Officer not found.",
      });
    }
    if (String(officer.account_status || "").toUpperCase() !== "ACTIVE") {
      return res.status(409).json({
        success: false,
        code: "OFFICER_INACTIVE",
        message: "The selected officer account is inactive.",
      });
    }
    const fineReference = generateFineReference();
    const existingReference = db
      .prepare(
        `
        SELECT id
        FROM fines
        WHERE fine_reference = ?
        `,
      )
      .get(fineReference);
    if (existingReference) {
      return res.status(409).json({
        success: false,
        code: "FINE_REFERENCE_EXISTS",
        message: "Generated Fine ID already exists. Please try again.",
      });
    }
    const result = db
      .prepare(
        `
        INSERT INTO fines (
          fine_reference,
          student_id,
          violation_type_id,
          recorded_by,
          amount_centavos,
          remarks,
          issued_at,
          created_at
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          COALESCE(?, CURRENT_TIMESTAMP),
          CURRENT_TIMESTAMP
        )
        `,
      )
      .run(
        fineReference,
        normalizedStudentId,
        normalizedViolationTypeId,
        normalizedRecordedBy,
        violation.amount_centavos,
        normalizedRemarks,
        normalizedIssuedAt,
      );
    const fineId = Number(result.lastInsertRowid);
    const savedFineTimes = db
      .prepare(
        `
        SELECT
          issued_at,
          created_at
        FROM fines
        WHERE id = ?
        `,
      )
      .get(fineId);
    return res.status(201).json({
      success: true,
      message: "Fine recorded successfully.",
      fine: {
        id: fineId,
        fineReference,
        studentId: normalizedStudentId,
        studentNumber: student.student_number || student.username,
        studentName: formatFullName(
          student.first_name,
          student.middle_name,
          student.last_name,
        ),
        violationTypeId: violation.id,
        violationCode: violation.violation_code,
        violationName: violation.violation_name,
        amountCentavos: violation.amount_centavos,
        amount: Number(violation.amount_centavos) / 100,
        recordedBy: officer.id,
        officerName: formatFullName(
          officer.first_name,
          officer.middle_name,
          officer.last_name,
        ),
        remarks: normalizedRemarks,
        issuedAt: savedFineTimes.issued_at,
        recordedAt: savedFineTimes.created_at,
        status: "UNPAID",
      },
    });
  } catch (error) {
    console.error("Create fine error:", error);
    return res.status(500).json({
      success: false,
      code: "CREATE_FINE_ERROR",
      message: "Failed to record fine.",
      error: error.message,
    });
  }
});
router.get("/:id", (req, res, next) => {
  if (req.params.id === "my-fines") {
    return next("route");
  }
  try {
    const fineId = Number(req.params.id);
    if (!Number.isInteger(fineId) || fineId <= 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_FINE_ID",
        message: "Invalid fine ID.",
      });
    }
    const fine = db
      .prepare(
        `
        SELECT
          f.id,
          f.fine_reference,
          f.student_id,
          COALESCE(
            student.student_number,
            student.username
          ) AS student_number,
          student.username AS student_username,
          student.first_name AS student_first_name,
          student.middle_name AS student_middle_name,
          student.last_name AS student_last_name,
          TRIM(
            student.first_name || ' ' ||
            COALESCE(student.middle_name || ' ', '') ||
            student.last_name
          ) AS student_name,
          student.grade_level,
          student.section,
          f.violation_type_id,
          vt.violation_code,
          vt.violation_name,
          vt.description AS violation_description,
          f.amount_centavos,
          f.amount_centavos / 100.0 AS amount,
          f.remarks,
          f.recorded_by AS officer_id,
          CASE
            WHEN officer.id IS NOT NULL THEN
              TRIM(
                officer.first_name || ' ' ||
                COALESCE(officer.middle_name || ' ', '') ||
                officer.last_name
              )
            ELSE 'Unknown'
          END AS officer_name,
          f.issued_at,
          f.paid_at,
          f.cancelled_at,
          f.cancelled_by,
          f.cancellation_reason,
          f.created_at,
          f.created_at AS recordedAt,
          f.updated_at,
          cash_request.payment_reference AS cash_request_reference,
          cash_request.payment_status AS cash_request_status,
          CASE
            WHEN f.cancelled_at IS NOT NULL THEN 'CANCELLED'
            WHEN f.paid_at IS NOT NULL THEN 'PAID'
            ELSE 'UNPAID'
          END AS status
        FROM fines f
        JOIN users student
          ON student.id = f.student_id
        JOIN violation_types vt
          ON vt.id = f.violation_type_id
        LEFT JOIN users officer
          ON officer.id = f.recorded_by
        LEFT JOIN payments cash_request
          ON cash_request.id = (
            SELECT p.id
            FROM payments p
            WHERE p.fine_id = f.id
              AND p.payment_method = 'CASH'
            ORDER BY p.id DESC
            LIMIT 1
          )
        WHERE f.id = ?
        `,
      )
      .get(fineId);
    if (!fine) {
      return res.status(404).json({
        success: false,
        code: "FINE_NOT_FOUND",
        message: "Fine not found.",
      });
    }
    return res.json({
      success: true,
      fine,
    });
  } catch (error) {
    console.error("Load fine details error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load fine details.",
      error: error.message,
    });
  }
});
router.put("/:id", (req, res) => {
  try {
    const fineId = Number(req.params.id);
    if (!Number.isInteger(fineId) || fineId <= 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_FINE_ID",
        message: "Invalid fine ID.",
      });
    }
    const existingFine = db
      .prepare(
        `
        SELECT
          id,
          fine_reference,
          paid_at,
          cancelled_at
        FROM fines
        WHERE id = ?
        `,
      )
      .get(fineId);
    if (!existingFine) {
      return res.status(404).json({
        success: false,
        code: "FINE_NOT_FOUND",
        message: "Fine not found.",
      });
    }
    if (existingFine.cancelled_at) {
      return res.status(409).json({
        success: false,
        code: "FINE_CANCELLED",
        message: "Cancelled fines cannot be edited.",
      });
    }
    if (existingFine.paid_at) {
      return res.status(409).json({
        success: false,
        code: "FINE_ALREADY_PAID",
        message: "Paid fines cannot be edited.",
      });
    }
    // A pending request was made for the current student and amount.
    const pendingPayment = db
      .prepare(
        `SELECT id FROM payments
         WHERE fine_id = ? AND payment_status = 'PENDING'
         LIMIT 1`,
      )
      .get(fineId);
    if (pendingPayment) {
      return res.status(409).json({
        success: false,
        code: "FINE_PAYMENT_PENDING",
        message:
          "This fine has a pending cashier request. Record the cash payment or cancel the fine before editing it.",
      });
    }
    const { studentId, violationTypeId, recordedBy, remarks, issuedAt } =
      req.body;
    const normalizedStudentId = Number(studentId);
    const normalizedViolationTypeId = Number(violationTypeId);
    const normalizedRecordedBy = Number(recordedBy);
    const normalizedRemarks = remarks ? String(remarks).trim() : null;
    const normalizedIssuedAt = issuedAt ? String(issuedAt).trim() : null;
    const student = db
      .prepare(
        `
        SELECT id
        FROM users
        WHERE id = ?
          AND role = 'STUDENT'
        `,
      )
      .get(normalizedStudentId);
    if (!student) {
      return res.status(400).json({
        success: false,
        code: "INVALID_STUDENT",
        message: "Please select a valid student.",
      });
    }
    const violation = db
      .prepare(
        `
        SELECT
          id,
          amount_centavos,
          is_active
        FROM violation_types
        WHERE id = ?
        `,
      )
      .get(normalizedViolationTypeId);
    if (!violation) {
      return res.status(400).json({
        success: false,
        code: "INVALID_VIOLATION_TYPE",
        message: "Please select a valid violation type.",
      });
    }
    if (Number(violation.is_active) !== 1) {
      return res.status(409).json({
        success: false,
        code: "VIOLATION_INACTIVE",
        message: "The selected violation type is inactive.",
      });
    }
    const officer = db
      .prepare(
        `
        SELECT id
        FROM users
        WHERE id = ?
          AND role IN ('FINES_OFFICER', 'ADMIN')
        `,
      )
      .get(normalizedRecordedBy);
    if (!officer) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OFFICER",
        message: "Please select a valid officer.",
      });
    }
    const result = db
      .prepare(
        `
        UPDATE fines
        SET
          student_id = ?,
          violation_type_id = ?,
          recorded_by = ?,
          amount_centavos = ?,
          remarks = ?,
          issued_at = COALESCE(?, issued_at),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
      )
      .run(
        normalizedStudentId,
        normalizedViolationTypeId,
        normalizedRecordedBy,
        violation.amount_centavos,
        normalizedRemarks,
        normalizedIssuedAt,
        fineId,
      );
    if (Number(result.changes) === 0) {
      return res.status(404).json({
        success: false,
        code: "FINE_NOT_UPDATED",
        message: "Fine could not be updated.",
      });
    }
    return res.json({
      success: true,
      message: "Fine updated successfully.",
      fine: {
        id: fineId,
        fineReference: existingFine.fine_reference,
      },
    });
  } catch (error) {
    console.error("Update fine error:", error);
    return res.status(500).json({
      success: false,
      code: "UPDATE_FINE_ERROR",
      message: "Failed to update fine.",
      error: error.message,
    });
  }
});
// Retired: it marked fines Paid with no login, payment record, or notices.
// Admins record cash through POST /api/payments/cash-collections/:fineId.
router.patch("/:id/mark-paid", (req, res) => {
  return res.status(410).json({
    success: false,
    code: "MARK_PAID_RETIRED",
    message:
      "Marking a fine paid directly is no longer supported. Use Record Cash Payment.",
  });
});
router.delete("/:id", canCancelFines, (req, res) => {
  try {
    const fineId = Number(req.params.id);
    const { cancellationReason } = req.body || {};
    const normalizedReason = cancellationReason
      ? String(cancellationReason).trim()
      : null;
    if (!Number.isInteger(fineId) || fineId <= 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_FINE_ID",
        message: "Invalid fine ID.",
      });
    }
    const fine = db
      .prepare(
        `
        SELECT
          id,
          fine_reference,
          paid_at,
          cancelled_at
        FROM fines
        WHERE id = ?
        `,
      )
      .get(fineId);
    if (!fine) {
      return res.status(404).json({
        success: false,
        code: "FINE_NOT_FOUND",
        message: "Fine not found.",
      });
    }
    if (fine.cancelled_at) {
      return res.status(409).json({
        success: false,
        code: "FINE_ALREADY_CANCELLED",
        message: "This fine is already cancelled.",
      });
    }
    if (fine.paid_at) {
      return res.status(409).json({
        success: false,
        code: "PAID_FINE_CANNOT_BE_CANCELLED",
        message: "A paid fine cannot be cancelled from the Fines module.",
      });
    }
    const result = cancelFineAndCashRequest(
      fineId,
      req.cancellingUserId,
      normalizedReason,
    );
    if (Number(result.changes) === 0) {
      return res.status(409).json({
        success: false,
        code: "FINE_NOT_CANCELLED",
        message: "Fine could not be cancelled.",
      });
    }
    return res.json({
      success: true,
      message: "Fine cancelled successfully.",
      fine: {
        id: fine.id,
        fineReference: fine.fine_reference,
        status: "CANCELLED",
      },
    });
  } catch (error) {
    console.error("Cancel fine error:", error);
    return res.status(500).json({
      success: false,
      code: "CANCEL_FINE_ERROR",
      message: "Failed to cancel fine.",
      error: error.message,
    });
  }
});
router.patch("/:id/cancel", canCancelFines, (req, res) => {
  try {
    const fineId = Number(req.params.id);
    if (!Number.isInteger(fineId) || fineId <= 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_FINE_ID",
        message: "Invalid fine ID.",
      });
    }
    const cancellationReason = String(
      req.body?.cancellationReason || "",
    ).trim();
    if (cancellationReason.length < 3) {
      return res.status(400).json({
        success: false,
        code: "CANCELLATION_REASON_REQUIRED",
        message: "Please provide a cancellation reason.",
      });
    }
    if (cancellationReason.length > 500) {
      return res.status(400).json({
        success: false,
        code: "CANCELLATION_REASON_TOO_LONG",
        message: "Cancellation reason must not exceed 500 characters.",
      });
    }
    const fine = db
      .prepare(
        `
        SELECT
          id,
          fine_reference,
          fine_status,
          paid_at,
          cancelled_at
        FROM fines
        WHERE id = ?
        `,
      )
      .get(fineId);
    if (!fine) {
      return res.status(404).json({
        success: false,
        code: "FINE_NOT_FOUND",
        message: "Fine not found.",
      });
    }
    const currentStatus = String(fine.fine_status || "").toUpperCase();
    if (fine.cancelled_at || currentStatus === "CANCELLED") {
      return res.status(409).json({
        success: false,
        code: "FINE_ALREADY_CANCELLED",
        message: "This fine has already been cancelled.",
      });
    }
    if (fine.paid_at || currentStatus === "PAID") {
      return res.status(409).json({
        success: false,
        code: "PAID_FINE_CANNOT_BE_CANCELLED",
        message: "A paid fine cannot be cancelled.",
      });
    }
    const result = cancelFineAndCashRequest(
      fineId,
      req.cancellingUserId,
      cancellationReason,
    );
    if (Number(result.changes) === 0) {
      return res.status(409).json({
        success: false,
        code: "FINE_NOT_CANCELLED",
        message: "The fine could not be cancelled.",
      });
    }
    const updatedFine = db
      .prepare(
        `
        SELECT
          id,
          fine_reference,
          fine_status,
          cancelled_at,
          cancelled_by,
          cancellation_reason
        FROM fines
        WHERE id = ?
        `,
      )
      .get(fineId);
    return res.json({
      success: true,
      message: "Fine cancelled successfully.",
      fine: {
        id: updatedFine.id,
        fineReference: updatedFine.fine_reference,
        status: updatedFine.fine_status,
        cancelledAt: updatedFine.cancelled_at,
        cancelledBy: updatedFine.cancelled_by,
        cancellationReason: updatedFine.cancellation_reason,
      },
    });
  } catch (error) {
    console.error("Cancel fine error:", error);
    return res.status(500).json({
      success: false,
      code: "CANCEL_FINE_ERROR",
      message: "Failed to cancel fine.",
      error: error.message,
    });
  }
});
router.post("/my-fines/:id/read", authenticateToken, (req, res) => {
  try {
    const studentId = Number(req.authUser?.userId);
    const fineId = Number(req.params.id);
    if (!Number.isSafeInteger(studentId) || studentId <= 0) {
      return res
        .status(401)
        .json({ success: false, message: "Please sign in again." });
    }
    if (!Number.isSafeInteger(fineId) || fineId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid fine ID." });
    }
    const student = db
      .prepare("SELECT id, role, account_status FROM users WHERE id = ?")
      .get(studentId);
    if (
      !student ||
      String(student.role).toUpperCase() !== "STUDENT" ||
      String(student.account_status).toUpperCase() !== "ACTIVE"
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "An active student account is required.",
        });
    }
    const fine = db
      .prepare(
        `SELECT id FROM fines
      WHERE id = ? AND student_id = ? AND cancelled_at IS NULL
      AND UPPER(COALESCE(fine_status, '')) <> 'CANCELLED'`,
      )
      .get(fineId, studentId);
    if (!fine)
      return res
        .status(404)
        .json({ success: false, message: "Fine not found." });
    db.prepare(
      `INSERT INTO student_fine_reads (student_id, fine_id)
      VALUES (?, ?) ON CONFLICT(student_id, fine_id) DO NOTHING`,
    ).run(studentId, fineId);
    const read = db
      .prepare(
        `SELECT read_at AS readAt FROM student_fine_reads
      WHERE student_id = ? AND fine_id = ?`,
      )
      .get(studentId, fineId);
    return res.json({
      success: true,
      fineId,
      isRead: true,
      readAt: read.readAt,
    });
  } catch (error) {
    console.error("Mark fine as read failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to update fine status." });
  }
});
router.get("/my-fines", authenticateToken, (req, res) => {
  try {
    const studentId = Number(req.authUser?.userId);
    if (!Number.isSafeInteger(studentId) || studentId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Please sign in again.",
      });
    }
    const student = db
      .prepare(
        `
        SELECT id, role, account_status
        FROM users
        WHERE id = ?
      `,
      )
      .get(studentId);
    if (
      !student ||
      String(student.role).toUpperCase() !== "STUDENT" ||
      String(student.account_status).toUpperCase() !== "ACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message: "An active student account is required.",
      });
    }
    const rows = db
      .prepare(
        `
        SELECT
          f.id,
          f.fine_reference AS fineReference,
          COALESCE(vt.violation_name, 'Violation') AS violationName,
          f.amount_centavos AS amountCentavos,
          f.created_at AS recordedAt,
          f.paid_at AS paidAt,
          f.remarks,
          sfr.read_at AS readAt,
          CASE WHEN sfr.read_at IS NULL THEN 0 ELSE 1 END AS isRead,
          CASE
            WHEN f.paid_at IS NOT NULL
              OR UPPER(COALESCE(f.fine_status, '')) = 'PAID'
              THEN 'PAID'
            WHEN UPPER(COALESCE(f.fine_status, '')) = 'PENDING'
              THEN 'PENDING'
            ELSE 'UNPAID'
          END AS status
        FROM fines f
        LEFT JOIN violation_types vt
          ON vt.id = f.violation_type_id
        LEFT JOIN student_fine_reads sfr
          ON sfr.fine_id = f.id AND sfr.student_id = f.student_id
        WHERE f.student_id = ?
          AND f.cancelled_at IS NULL
          AND UPPER(COALESCE(f.fine_status, '')) <> 'CANCELLED'
        ORDER BY datetime(f.created_at) DESC, f.id DESC
      `,
      )
      .all(studentId);
    const fines = rows.map((fine) => ({
      ...fine,
      id: Number(fine.id),
      amountCentavos: Number(fine.amountCentavos),
    }));
    const outstandingAmountCentavos = fines.reduce(
      (total, fine) =>
        fine.status !== "PAID" ? total + fine.amountCentavos : total,
      0,
    );
    const payableAmountCentavos = fines.reduce(
      (total, fine) =>
        fine.status === "UNPAID" ? total + fine.amountCentavos : total,
      0,
    );
    // Listed separately so totals and dashboard counts stay unchanged while
    // the student can still see that a cancelled fine needs no payment.
    const cancelledFines = db
      .prepare(
        `
        SELECT
          f.id,
          f.fine_reference AS fineReference,
          COALESCE(vt.violation_name, 'Violation') AS violationName,
          f.amount_centavos AS amountCentavos,
          f.created_at AS recordedAt,
          f.cancelled_at AS cancelledAt,
          (
            SELECT p.payment_reference
            FROM payments p
            WHERE p.fine_id = f.id
              AND p.payment_method = 'CASH'
              AND p.payment_status = 'CANCELLED'
            ORDER BY p.id DESC
            LIMIT 1
          ) AS cancelledCashRequestReference
        FROM fines f
        LEFT JOIN violation_types vt
          ON vt.id = f.violation_type_id
        WHERE f.student_id = ?
          AND (
            f.cancelled_at IS NOT NULL
            OR UPPER(COALESCE(f.fine_status, '')) = 'CANCELLED'
          )
        ORDER BY datetime(COALESCE(f.cancelled_at, f.created_at)) DESC, f.id DESC
      `,
      )
      .all(studentId)
      .map((fine) => ({
        ...fine,
        id: Number(fine.id),
        amountCentavos: Number(fine.amountCentavos),
        status: "CANCELLED",
      }));
    return res.json({
      success: true,
      fines,
      cancelledFines,
      summary: {
        outstandingAmountCentavos,
        payableAmountCentavos,
      },
    });
  } catch (error) {
    console.error("GET /api/fines/my-fines failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load your fines. Please try again.",
    });
  }
});
// One of the signed-in student's fines, including cancelled ones, so a
// notification can open the record it describes.
router.get("/my-fines/:id", authenticateToken, (req, res) => {
  try {
    const studentId = Number(req.authUser?.userId);
    const fineId = Number(req.params.id);
    if (!Number.isSafeInteger(studentId) || studentId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Please sign in again.",
      });
    }
    if (!Number.isSafeInteger(fineId) || fineId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid fine ID." });
    }
    const student = db
      .prepare("SELECT role, account_status FROM users WHERE id = ?")
      .get(studentId);
    if (
      !student ||
      String(student.role).toUpperCase() !== "STUDENT" ||
      String(student.account_status).toUpperCase() !== "ACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message: "An active student account is required.",
      });
    }
    const fine = db
      .prepare(
        `
        SELECT
          f.id,
          f.fine_reference AS fineReference,
          COALESCE(vt.violation_name, 'Violation') AS violationName,
          f.amount_centavos AS amountCentavos,
          f.created_at AS recordedAt,
          f.paid_at AS paidAt,
          f.cancelled_at AS cancelledAt,
          f.remarks,
          CASE
            WHEN f.cancelled_at IS NOT NULL
              OR UPPER(COALESCE(f.fine_status, '')) = 'CANCELLED'
              THEN 'CANCELLED'
            WHEN f.paid_at IS NOT NULL
              OR UPPER(COALESCE(f.fine_status, '')) = 'PAID'
              THEN 'PAID'
            WHEN UPPER(COALESCE(f.fine_status, '')) = 'PENDING'
              THEN 'PENDING'
            ELSE 'UNPAID'
          END AS status,
          CASE WHEN sfr.read_at IS NULL THEN 0 ELSE 1 END AS isRead,
          cash_request.payment_reference AS cashRequestReference,
          cash_request.payment_status AS cashRequestStatus
        FROM fines f
        LEFT JOIN violation_types vt
          ON vt.id = f.violation_type_id
        LEFT JOIN student_fine_reads sfr
          ON sfr.fine_id = f.id AND sfr.student_id = f.student_id
        LEFT JOIN payments cash_request
          ON cash_request.id = (
            SELECT p.id
            FROM payments p
            WHERE p.fine_id = f.id
              AND p.payment_method = 'CASH'
            ORDER BY p.id DESC
            LIMIT 1
          )
        WHERE f.id = ? AND f.student_id = ?
      `,
      )
      .get(fineId, studentId);
    if (!fine) {
      return res.status(404).json({
        success: false,
        message: "This fine is no longer available on your account.",
      });
    }
    return res.json({
      success: true,
      fine: {
        ...fine,
        id: Number(fine.id),
        amountCentavos: Number(fine.amountCentavos),
        isRead: Number(fine.isRead) === 1,
      },
    });
  } catch (error) {
    console.error("GET /api/fines/my-fines/:id failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load this fine. Please try again.",
    });
  }
});
module.exports = router;
