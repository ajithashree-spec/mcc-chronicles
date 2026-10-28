const pool = require('../config/db');
const { logActivity } = require('../utils/logger');

/**
 * Retrieve all public page settings from `page_settings`.
 * Public access: GET /api/settings/public
 */
async function getPageSettings(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT `key`, `value` FROM page_settings ORDER BY `key` ASC'
    );

    const settings = {};
    rows.forEach((row) => {
      let parsed = row.value;
      try {
        if (
          (row.value.startsWith('{') && row.value.endsWith('}')) ||
          (row.value.startsWith('[') && row.value.endsWith(']'))
        ) {
          parsed = JSON.parse(row.value);
        }
      } catch {
        parsed = row.value;
      }
      settings[row.key] = parsed;
    });

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update multiple page content settings in bulk.
 * Protected: super_admin / superadmin only.
 * PUT /api/settings/bulk
 */
async function updatePageSettingsBulk(req, res, next) {
  let connection;
  try {
    const updates = req.body.settings || req.body;

    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Settings payload must be a non-empty key-value object',
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const [key, value] of Object.entries(updates)) {
      const cleanKey = String(key).trim();
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      await connection.query(
        `INSERT INTO page_settings (\`key\`, \`value\`)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`,
        [cleanKey, serializedValue]
      );
    }

    await connection.commit();

    // Log administrative action
    logActivity({
      userId: req.user?.id,
      action: 'UPDATE_PAGE_SETTINGS',
      entityType: 'page_settings',
      entityId: null,
      details: { keysUpdated: Object.keys(updates) },
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Page content settings updated successfully',
      settings: updates,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Upload image for slideshow, crest, or header seal via Multer.
 * Protected: super_admin / superadmin only.
 * POST /api/settings/upload
 */
async function uploadSettingMedia(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded or invalid file format.',
      });
    }

    const cleanPath = `/uploads/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      url: cleanPath,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve all site settings as a key-value dictionary (legacy table).
 * Public access: GET /api/settings
 */
async function getPublicSettings(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT setting_key, setting_value FROM site_settings ORDER BY setting_key ASC'
    );

    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a single site setting by its key.
 * Public access: GET /api/settings/:key
 */
async function getSettingByKey(req, res, next) {
  try {
    const { key } = req.params;

    const [rows] = await pool.query(
      'SELECT setting_key, setting_value FROM site_settings WHERE setting_key = ? LIMIT 1',
      [key]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Setting '${key}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      key: rows[0].setting_key,
      value: rows[0].setting_value,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update multiple site settings in bulk (legacy table).
 * Protected: super_admin only.
 * PUT /api/settings
 */
async function updateSettings(req, res, next) {
  let connection;
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Settings payload must be a non-empty key-value object',
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const ALLOWED_SETTING_KEYS = [
      'breaking_ticker_enabled',
      'breaking_ticker_speed',
      'hero_slideshow_mode',
      'departments_count',
      'layout_parity_enforced',
      'contact_email',
      'newsroom_address',
    ];

    for (const [key, value] of Object.entries(updates)) {
      const cleanKey = key.trim();
      if (!ALLOWED_SETTING_KEYS.includes(cleanKey)) {
        continue;
      }
      const sanitizedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await connection.query(
        `INSERT INTO site_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [cleanKey, sanitizedValue]
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Site settings updated successfully',
      updated: updates,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  getPageSettings,
  updatePageSettingsBulk,
  uploadSettingMedia,
  getPublicSettings,
  getSettingByKey,
  updateSettings,
};
