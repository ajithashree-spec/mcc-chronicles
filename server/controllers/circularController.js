const pool = require('../config/db');

/**
 * Retrieve public circulars.
 * Public access.
 * Query active circulars (is_active = true) ordered by is_pinned DESC, publish_date DESC.
 * Supports query filters: target_audience, department_id, limit.
 * Joins departments (departments.name AS department_name).
 */
async function getPublicCirculars(req, res, next) {
  try {
    const { target_audience, department_id, limit } = req.query;

    let query = `
      SELECT 
        c.id,
        c.title,
        c.circular_number,
        c.content,
        c.attachment_url,
        c.department_id,
        d.name AS department_name,
        c.target_audience,
        c.is_pinned,
        c.is_active,
        c.publish_date,
        c.created_at,
        c.updated_at
      FROM circulars c
      LEFT JOIN departments d ON d.id = c.department_id
      WHERE c.is_active = true
    `;
    const params = [];

    if (target_audience) {
      query += ` AND (c.target_audience = ? OR c.target_audience = 'all')`;
      params.push(target_audience);
    }

    if (department_id) {
      query += ` AND c.department_id = ?`;
      params.push(department_id);
    }

    query += ` ORDER BY c.is_pinned DESC, c.publish_date DESC, c.id DESC`;

    if (limit && !isNaN(parseInt(limit, 10)) && parseInt(limit, 10) > 0) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit, 10));
    }

    const [circulars] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: circulars.length,
      data: circulars,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a circular by ID.
 * Public access.
 */
async function getCircularById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT 
        c.id,
        c.title,
        c.circular_number,
        c.content,
        c.attachment_url,
        c.department_id,
        d.name AS department_name,
        c.target_audience,
        c.is_pinned,
        c.is_active,
        c.publish_date,
        c.created_at,
        c.updated_at
      FROM circulars c
      LEFT JOIN departments d ON d.id = c.department_id
      WHERE c.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Circular not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new circular.
 * Protected: super_admin, editor.
 */
async function createCircular(req, res, next) {
  try {
    const {
      title,
      circular_number,
      content = null,
      attachment_url = null,
      department_id = null,
      target_audience = 'all',
      is_pinned = false,
      is_active = true,
      publish_date,
    } = req.body;

    if (!title || !circular_number || !publish_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, circular_number, and publish_date are required fields',
      });
    }

    // Check if circular_number already exists
    const [existing] = await pool.query(
      'SELECT id FROM circulars WHERE circular_number = ?',
      [circular_number.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Circular number "${circular_number}" already exists`,
      });
    }

    // Validate department_id if provided
    if (department_id) {
      const [dept] = await pool.query('SELECT id FROM departments WHERE id = ?', [department_id]);
      if (dept.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department_id: department does not exist',
        });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO circulars (
        title, circular_number, content, attachment_url, department_id,
        target_audience, is_pinned, is_active, publish_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        circular_number.trim(),
        content,
        attachment_url,
        department_id || null,
        target_audience,
        Boolean(is_pinned),
        is_active !== undefined ? Boolean(is_active) : true,
        publish_date,
      ]
    );

    const [createdRows] = await pool.query(
      `SELECT 
        c.id,
        c.title,
        c.circular_number,
        c.content,
        c.attachment_url,
        c.department_id,
        d.name AS department_name,
        c.target_audience,
        c.is_pinned,
        c.is_active,
        c.publish_date,
        c.created_at,
        c.updated_at
      FROM circulars c
      LEFT JOIN departments d ON d.id = c.department_id
      WHERE c.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Circular published successfully',
      data: createdRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing circular.
 * Protected: super_admin, editor.
 */
async function updateCircular(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM circulars WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Circular not found',
      });
    }

    const current = existing[0];
    const {
      title,
      circular_number,
      content,
      attachment_url,
      department_id,
      target_audience,
      is_pinned,
      is_active,
      publish_date,
    } = req.body;

    // Check duplicate circular_number if changed
    if (circular_number && circular_number.trim() !== current.circular_number) {
      const [dup] = await pool.query(
        'SELECT id FROM circulars WHERE circular_number = ? AND id != ?',
        [circular_number.trim(), id]
      );
      if (dup.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Circular number "${circular_number}" already in use by another circular`,
        });
      }
    }

    // Validate department_id if provided and not null
    if (department_id !== undefined && department_id !== null) {
      const [dept] = await pool.query('SELECT id FROM departments WHERE id = ?', [department_id]);
      if (dept.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department_id: department does not exist',
        });
      }
    }

    const updatedTitle = title !== undefined ? title.trim() : current.title;
    const updatedCircularNumber = circular_number !== undefined ? circular_number.trim() : current.circular_number;
    const updatedContent = content !== undefined ? content : current.content;
    const updatedAttachmentUrl = attachment_url !== undefined ? attachment_url : current.attachment_url;
    const updatedDepartmentId = department_id !== undefined ? (department_id || null) : current.department_id;
    const updatedTargetAudience = target_audience !== undefined ? target_audience : current.target_audience;
    const updatedIsPinned = is_pinned !== undefined ? Boolean(is_pinned) : current.is_pinned;
    const updatedIsActive = is_active !== undefined ? Boolean(is_active) : current.is_active;
    const updatedPublishDate = publish_date !== undefined ? publish_date : current.publish_date;

    await pool.query(
      `UPDATE circulars SET
        title = ?,
        circular_number = ?,
        content = ?,
        attachment_url = ?,
        department_id = ?,
        target_audience = ?,
        is_pinned = ?,
        is_active = ?,
        publish_date = ?
      WHERE id = ?`,
      [
        updatedTitle,
        updatedCircularNumber,
        updatedContent,
        updatedAttachmentUrl,
        updatedDepartmentId,
        updatedTargetAudience,
        updatedIsPinned,
        updatedIsActive,
        updatedPublishDate,
        id,
      ]
    );

    const [updatedRows] = await pool.query(
      `SELECT 
        c.id,
        c.title,
        c.circular_number,
        c.content,
        c.attachment_url,
        c.department_id,
        d.name AS department_name,
        c.target_audience,
        c.is_pinned,
        c.is_active,
        c.publish_date,
        c.created_at,
        c.updated_at
      FROM circulars c
      LEFT JOIN departments d ON d.id = c.department_id
      WHERE c.id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Circular updated successfully',
      data: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a circular.
 * Protected: super_admin.
 */
async function deleteCircular(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, title, circular_number FROM circulars WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Circular not found',
      });
    }

    await pool.query('DELETE FROM circulars WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Circular deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublicCirculars,
  getCircularById,
  createCircular,
  updateCircular,
  deleteCircular,
};
