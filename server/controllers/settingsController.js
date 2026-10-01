const pool = require('../config/db');

/**
 * Retrieve all site settings as a key-value dictionary.
 * Public access.
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
 * Public access.
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
 * Update multiple site settings in bulk.
 * Protected: super_admin only.
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

    for (const [key, value] of Object.entries(updates)) {
      const sanitizedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await connection.query(
        `INSERT INTO site_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key.trim(), sanitizedValue]
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
  getPublicSettings,
  getSettingByKey,
  updateSettings,
};
