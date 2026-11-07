-- SmartFine database structure (tables, indexes and triggers only; no data).
-- Used by server/init-db.js to create a new, empty server/database/smartfine.db.
-- Exported from the working database; the backend adds any missing columns
-- and tables itself when it starts.

PRAGMA foreign_keys = ON;

-- table: users
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    username TEXT NOT NULL UNIQUE,

    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,

    email TEXT UNIQUE,
    contact_number TEXT,

    password_hash TEXT NOT NULL,

    role TEXT NOT NULL
        CHECK (
            role IN (
                'ADMIN',
                'FINES_OFFICER',
                'STUDENT'
            )
        ),

    account_status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (
            account_status IN (
                'ACTIVE',
                'INACTIVE',
                'LOCKED'
            )
        ),

    is_verified INTEGER NOT NULL DEFAULT 0
        CHECK (is_verified IN (0, 1)),

    failed_login_attempts INTEGER NOT NULL DEFAULT 0,

    locked_until TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
, lockout_count INTEGER NOT NULL DEFAULT 0, grade_level TEXT, section TEXT, student_number TEXT, profile_picture_uri TEXT, needs_first_login INTEGER NOT NULL DEFAULT 0);

-- table: students
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL UNIQUE,

    student_number TEXT NOT NULL UNIQUE,

    grade_level TEXT,
    section TEXT,

    date_of_birth TEXT,

    qr_token TEXT NOT NULL UNIQUE,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- table: fines_officers
CREATE TABLE fines_officers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL UNIQUE,

    employee_number TEXT NOT NULL UNIQUE,

    assigned_area TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- table: violation_types
CREATE TABLE violation_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    violation_code TEXT NOT NULL UNIQUE,

    violation_name TEXT NOT NULL UNIQUE,

    description TEXT,

    amount_centavos INTEGER NOT NULL
        CHECK (amount_centavos >= 0),

    is_active INTEGER NOT NULL DEFAULT 1
        CHECK (is_active IN (0, 1)),

    created_by INTEGER,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- table: payments
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    payment_reference TEXT NOT NULL UNIQUE,

    fine_id INTEGER NOT NULL,

    student_id INTEGER NOT NULL,

    amount_centavos INTEGER NOT NULL
        CHECK (amount_centavos > 0),

    payment_method TEXT NOT NULL
        CHECK (
            payment_method IN (
                'CASH',
                'GCASH'
            )
        ),

    payment_status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (
            payment_status IN (
                'PENDING',
                'SUCCESS',
                'FAILED',
                'CANCELLED'
            )
        ),

    gateway_transaction_id TEXT,

    gateway_reference TEXT,

    confirmed_by INTEGER,

    payment_notes TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    confirmed_at TEXT,
    paid_at TEXT,

    FOREIGN KEY (fine_id)
        REFERENCES fines(id),

    FOREIGN KEY (student_id)
        REFERENCES students(id),

    FOREIGN KEY (confirmed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- table: notifications
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    notification_type TEXT NOT NULL
        CHECK (
            notification_type IN (
                'FINE',
                'PAYMENT',
                'ACCOUNT',
                'SYSTEM'
            )
        ),

    title TEXT NOT NULL,

    message TEXT NOT NULL,

    related_fine_id INTEGER,

    related_payment_id INTEGER,

    is_read INTEGER NOT NULL DEFAULT 0
        CHECK (is_read IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (related_fine_id)
        REFERENCES fines(id)
        ON DELETE SET NULL,

    FOREIGN KEY (related_payment_id)
        REFERENCES payments(id)
        ON DELETE SET NULL
);

-- table: password_reset_codes
CREATE TABLE password_reset_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    code_hash TEXT NOT NULL,

    expires_at TEXT NOT NULL,

    is_used INTEGER NOT NULL DEFAULT 0
        CHECK (is_used IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- table: audit_logs
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER,

    action TEXT NOT NULL,

    entity_type TEXT,

    entity_id INTEGER,

    description TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, actor_name TEXT, actor_role TEXT, category TEXT, related_fine_id INTEGER, details_json TEXT, ip_address TEXT, result TEXT, module TEXT,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- table: fines
CREATE TABLE fines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    fine_reference TEXT NOT NULL UNIQUE,

    student_id INTEGER NOT NULL,

    violation_type_id INTEGER NOT NULL,

    recorded_by INTEGER NOT NULL,

    amount_centavos INTEGER NOT NULL
        CHECK(amount_centavos >= 0),

    remarks TEXT,

    evidence_uri TEXT,

    fine_status TEXT NOT NULL
        DEFAULT 'UNPAID'
        CHECK(
            fine_status IN (
                'UNPAID',
                'PENDING',
                'PAID',
                'WAIVED',
                'CANCELLED'
            )
        ),

    issued_at TEXT NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    paid_at TEXT,

    cancelled_at TEXT,

    cancelled_by INTEGER,

    cancellation_reason TEXT,

    created_at TEXT NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES users(id),

    FOREIGN KEY (violation_type_id)
        REFERENCES violation_types(id),

    FOREIGN KEY (recorded_by)
        REFERENCES users(id),

    FOREIGN KEY (cancelled_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- table: system_settings
CREATE TABLE system_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),

  school_name TEXT NOT NULL DEFAULT '',

  academic_year TEXT NOT NULL DEFAULT '',

  system_name TEXT NOT NULL DEFAULT 'SmartFine',

  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- table: student_fine_reads
CREATE TABLE student_fine_reads (
  student_id INTEGER NOT NULL,
  fine_id INTEGER NOT NULL,
  read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, fine_id)
);

-- table: payment_events
CREATE TABLE payment_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      payment_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,

      actor_user_id INTEGER,
      gateway_event_id TEXT,

      details_json TEXT,

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (payment_id)
        REFERENCES payments(id),

      FOREIGN KEY (actor_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

-- table: refunds
CREATE TABLE refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    refund_reference TEXT NOT NULL UNIQUE,
    payment_id INTEGER NOT NULL REFERENCES payments(id),
    fine_id INTEGER NOT NULL REFERENCES fines(id),
    student_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    amount_centavos INTEGER NOT NULL CHECK (amount_centavos > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'GCASH')),
    reason_code TEXT NOT NULL
      CHECK (reason_code IN ('WRONG_FINE', 'DUPLICATE', 'OTHER')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'REQUESTED'
      CHECK (status IN (
        'REQUESTED', 'WITHDRAWN', 'REJECTED',
        'PROCESSING', 'SUCCEEDED', 'FAILED'
      )),
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TEXT,
    review_note TEXT,
    gateway_refund_id TEXT,
    gateway_status TEXT,
    failure_reason TEXT,
    completed_at TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- table: fine_evidence
CREATE TABLE fine_evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fine_id INTEGER NOT NULL REFERENCES fines(id),
    file_name TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL
      CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- A removed photo keeps its row and file, so the removal stays visible.
    removed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    removed_at TEXT
  );

-- table: otp_challenges
CREATE TABLE otp_challenges (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL CHECK (purpose IN ('FIRST_LOGIN', 'EMAIL_CHANGE')),
    target_email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    send_count INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    resend_available_at INTEGER NOT NULL,
    verified_at INTEGER,
    step_token_hash TEXT,
    used_at INTEGER
  );

-- table: user_sessions
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    last_activity_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    ended_at INTEGER,
    end_reason TEXT
  );

-- index: idx_users_username
CREATE INDEX idx_users_username
ON users(username);

-- index: idx_users_role
CREATE INDEX idx_users_role
ON users(role);

-- index: idx_students_student_number
CREATE INDEX idx_students_student_number
ON students(student_number);

-- index: idx_students_qr_token
CREATE INDEX idx_students_qr_token
ON students(qr_token);

-- index: idx_payments_fine
CREATE INDEX idx_payments_fine
ON payments(fine_id);

-- index: idx_payments_status
CREATE INDEX idx_payments_status
ON payments(payment_status);

-- index: idx_notifications_user
CREATE INDEX idx_notifications_user
ON notifications(user_id);

-- index: idx_notifications_read
CREATE INDEX idx_notifications_read
ON notifications(is_read);

-- index: idx_audit_logs_user
CREATE INDEX idx_audit_logs_user
ON audit_logs(user_id);

-- index: idx_users_student_number
CREATE UNIQUE INDEX idx_users_student_number
ON users(student_number);

-- index: idx_fines_student
CREATE INDEX idx_fines_student
ON fines(student_id);

-- index: idx_fines_recorded_by
CREATE INDEX idx_fines_recorded_by
ON fines(recorded_by);

-- index: idx_fines_status
CREATE INDEX idx_fines_status
ON fines(fine_status);

-- index: idx_payment_events_payment_id
CREATE INDEX idx_payment_events_payment_id
    ON payment_events(payment_id);

-- index: idx_payment_events_gateway_event_id
CREATE UNIQUE INDEX idx_payment_events_gateway_event_id
    ON payment_events(gateway_event_id)
    WHERE gateway_event_id IS NOT NULL;

-- index: idx_notifications_recipient_unread
CREATE INDEX idx_notifications_recipient_unread
  ON notifications(user_id, is_read, notification_type);

-- index: idx_refunds_one_open_per_payment
CREATE UNIQUE INDEX idx_refunds_one_open_per_payment
    ON refunds(payment_id)
    WHERE status IN ('REQUESTED', 'PROCESSING', 'SUCCEEDED');

-- index: idx_refunds_gateway_refund_id
CREATE UNIQUE INDEX idx_refunds_gateway_refund_id
    ON refunds(gateway_refund_id)
    WHERE gateway_refund_id IS NOT NULL;

-- index: idx_refunds_status
CREATE INDEX idx_refunds_status ON refunds(status);

-- index: idx_refunds_fine
CREATE INDEX idx_refunds_fine ON refunds(fine_id);

-- index: idx_refunds_student
CREATE INDEX idx_refunds_student ON refunds(student_user_id);

-- index: idx_fine_evidence_fine
CREATE INDEX idx_fine_evidence_fine ON fine_evidence(fine_id);

-- index: idx_audit_logs_category
CREATE INDEX idx_audit_logs_category ON audit_logs(category);

-- index: idx_audit_logs_fine
CREATE INDEX idx_audit_logs_fine ON audit_logs(related_fine_id);

-- index: idx_otp_user_purpose
CREATE INDEX idx_otp_user_purpose ON otp_challenges(user_id, purpose);

-- index: idx_user_sessions_user
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id, ended_at);

-- index: idx_audit_logs_result
CREATE INDEX idx_audit_logs_result ON audit_logs(result);

-- trigger: audit_logs_no_edit
CREATE TRIGGER audit_logs_no_edit
  BEFORE UPDATE OF action, entity_type, entity_id, description, created_at,
    actor_name, actor_role, category, related_fine_id, details_json,
    ip_address, result, module ON audit_logs
  BEGIN
    SELECT RAISE(ABORT, 'Log entries cannot be changed.');
  END;

-- trigger: audit_logs_no_relink
CREATE TRIGGER audit_logs_no_relink
  BEFORE UPDATE OF user_id ON audit_logs
  WHEN NEW.user_id IS NOT NULL
  BEGIN
    SELECT RAISE(ABORT, 'Log entries cannot be changed.');
  END;

-- trigger: audit_logs_no_delete
CREATE TRIGGER audit_logs_no_delete
  BEFORE DELETE ON audit_logs
  BEGIN
    SELECT RAISE(ABORT, 'Log entries cannot be deleted.');
  END;

-- trigger: notify_admins_when_officer_records_fine
CREATE TRIGGER notify_admins_when_officer_records_fine
  AFTER INSERT ON fines
  WHEN EXISTS (
    SELECT 1
    FROM users
    WHERE id = NEW.recorded_by
      AND role = 'FINES_OFFICER'
  )
  BEGIN
    INSERT INTO notifications (
      user_id,
      notification_type,
      title,
      message,
      related_fine_id
    )
    SELECT
      admin.id,
      'FINE',
      'New Fine Recorded',
      TRIM(
        student.first_name || ' ' ||
        COALESCE(student.middle_name || ' ', '') ||
        student.last_name
      ) ||
      ' was issued ' ||
      violation.violation_name ||
      ' — ' ||
      printf('₱%.2f', NEW.amount_centavos / 100.0) ||
      ' by Officer ' ||
      TRIM(
        officer.first_name || ' ' ||
        COALESCE(officer.middle_name || ' ', '') ||
        officer.last_name
      ) ||
      '.',
      NEW.id
    FROM users AS admin
    JOIN users AS student
      ON student.id = NEW.student_id
    JOIN users AS officer
      ON officer.id = NEW.recorded_by
    JOIN violation_types AS violation
      ON violation.id = NEW.violation_type_id
    WHERE admin.role = 'ADMIN'
      AND admin.account_status = 'ACTIVE';
  END;

-- trigger: notify_student_when_fine_recorded
CREATE TRIGGER notify_student_when_fine_recorded
  AFTER INSERT ON fines
  BEGIN
    INSERT INTO notifications (
      user_id,
      notification_type,
      title,
      message,
      related_fine_id
    )
    SELECT
      student.id,
      'FINE',
      'New Fine Issued',
      violation.violation_name ||
      ' — ' ||
      printf('₱%.2f', NEW.amount_centavos / 100.0) ||
      ' was recorded on your account (' ||
      NEW.fine_reference ||
      ').',
      NEW.id
    FROM users AS student
    JOIN violation_types AS violation
      ON violation.id = NEW.violation_type_id
    WHERE student.id = NEW.student_id
      AND student.role = 'STUDENT'
      AND student.account_status = 'ACTIVE';
  END;
