const express = require('express');

const db = require('../database/database');
const { changeText, describeChanges, logActivity } = require('../database/activity-log');

const router = express.Router();

console.log('settings.js loaded');

// The shared sign-in and administrator checks (routes/auth.js): they also
// write refused requests to the Log Trail.
const { authenticateToken, requireAdmin } = require('./auth');

// ==========================================
// FORMAT SETTINGS
// ==========================================

function formatSettings(
  settings
) {
  if (
    !settings
  ) {
    return null;
  }

  return {
    id:
      Number(
        settings.id
      ),

    schoolName:
      settings.school_name ||
      '',

    academicYear:
      settings.academic_year ||
      '',

    systemName:
      settings.system_name ||
      'SmartFine',

    updatedAt:
      settings.updated_at ||
      null,
  };
}

// ==========================================
// GET SETTINGS ROW
// ==========================================

function getSettings() {
  return db
    .prepare(`
      SELECT
        id,
        school_name,
        academic_year,
        system_name,
        updated_at
      FROM system_settings
      WHERE id = 1
      LIMIT 1
    `)
    .get();
}

// ==========================================
// GET SYSTEM SETTINGS
//
// GET /api/settings
// ==========================================

router.get(
  '/',

  authenticateToken,

  requireAdmin,

  (
    req,
    res
  ) => {
    try {
      let settings =
        getSettings();

      // ======================================
      // SAFETY:
      // CREATE DEFAULT ROW IF MISSING
      // ======================================

      if (
        !settings
      ) {
        db.prepare(`
          INSERT INTO system_settings (
            id,
            school_name,
            academic_year,
            system_name
          )
          VALUES (
            1,
            '',
            '',
            'SmartFine'
          )
        `).run();

        settings =
          getSettings();
      }

      return res.json({
        success: true,

        settings:
          formatSettings(
            settings
          ),
      });
    } catch (error) {
      console.error(
        'Get system settings error:',
        error
      );

      return res.status(500).json({
        success: false,
        code:
          'SYSTEM_SETTINGS_ERROR',
        message:
          'Failed to load system settings.',
      });
    }
  }
);

// ==========================================
// UPDATE SYSTEM SETTINGS
//
// PUT /api/settings
//
// Body:
// {
//   schoolName,
//   academicYear,
//   systemName
// }
// ==========================================

router.put(
  '/',

  authenticateToken,

  requireAdmin,

  (
    req,
    res
  ) => {
    try {
      const schoolName =
        String(
          req.body.schoolName ??
            ''
        ).trim();

      const academicYear =
        String(
          req.body.academicYear ??
            ''
        ).trim();

      const systemName =
        String(
          req.body.systemName ??
            'SmartFine'
        ).trim();

      // ======================================
      // VALIDATION
      // ======================================

      if (
        !schoolName
      ) {
        return res.status(400).json({
          success: false,
          code:
            'SCHOOL_NAME_REQUIRED',
          message:
            'School name is required.',
        });
      }

      if (
        !academicYear
      ) {
        return res.status(400).json({
          success: false,
          code:
            'ACADEMIC_YEAR_REQUIRED',
          message:
            'Academic year is required.',
        });
      }

      if (
        !systemName
      ) {
        return res.status(400).json({
          success: false,
          code:
            'SYSTEM_NAME_REQUIRED',
          message:
            'System name is required.',
        });
      }

      if (
        schoolName.length >
        150
      ) {
        return res.status(400).json({
          success: false,
          code:
            'SCHOOL_NAME_TOO_LONG',
          message:
            'School name is too long.',
        });
      }

      if (
        academicYear.length >
        50
      ) {
        return res.status(400).json({
          success: false,
          code:
            'ACADEMIC_YEAR_TOO_LONG',
          message:
            'Academic year is too long.',
        });
      }

      if (
        systemName.length >
        100
      ) {
        return res.status(400).json({
          success: false,
          code:
            'SYSTEM_NAME_TOO_LONG',
          message:
            'System name is too long.',
        });
      }

      // ======================================
      // UPDATE SETTINGS
      // ======================================

      const existingSettings =
        getSettings();

      if (
        existingSettings
      ) {
        db.prepare(`
          UPDATE system_settings
          SET
            school_name = ?,
            academic_year = ?,
            system_name = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `).run(
          schoolName,
          academicYear,
          systemName
        );
      } else {
        db.prepare(`
          INSERT INTO system_settings (
            id,
            school_name,
            academic_year,
            system_name,
            updated_at
          )
          VALUES (
            1,
            ?,
            ?,
            ?,
            CURRENT_TIMESTAMP
          )
        `).run(
          schoolName,
          academicYear,
          systemName
        );
      }

      const updatedSettings =
        getSettings();

      const settingChanges = describeChanges(
        {
          school: existingSettings?.school_name || '',
          year: existingSettings?.academic_year || '',
          system: existingSettings?.system_name || '',
        },
        { school: schoolName, year: academicYear, system: systemName },
        { school: 'school name', year: 'academic year', system: 'system name' },
      );

      if (settingChanges.length) {
        logActivity({
          actorId: Number(req.authUser.userId),
          action: 'SETTINGS_UPDATED',
          entityType: 'SETTINGS',
          entityId: 1,
          description: `Changed the system settings: ${changeText(settingChanges)}.`,
          details: { changes: settingChanges },
        });
      }

      return res.json({
        success: true,

        message:
          'System settings updated successfully.',

        settings:
          formatSettings(
            updatedSettings
          ),
      });
    } catch (error) {
      console.error(
        'Update system settings error:',
        error
      );

      return res.status(500).json({
        success: false,
        code:
          'SYSTEM_SETTINGS_UPDATE_ERROR',
        message:
          'Failed to update system settings.',
      });
    }
  }
);

module.exports =
  router;