const pool = require('../config/db');

/**
 * Retrieve public gallery items with optional filters and pagination.
 * Public access.
 */
async function getPublicGalleries(req, res, next) {
  try {
    const {
      is_featured_carousel,
      event_name,
      department_id,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = [];
    const queryParams = [];

    if (is_featured_carousel !== undefined) {
      whereClauses.push('g.is_featured_carousel = ?');
      queryParams.push(is_featured_carousel === 'true' || is_featured_carousel === '1' ? 1 : 0);
    }

    if (event_name && event_name.trim()) {
      whereClauses.push('(g.event_name = ? OR g.event_name LIKE ?)');
      queryParams.push(event_name.trim(), `%${event_name.trim()}%`);
    }

    if (department_id) {
      whereClauses.push('g.department_id = ?');
      queryParams.push(department_id);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total matches
    const countSql = `SELECT COUNT(*) AS total FROM galleries g ${whereSql}`;
    const [countRows] = await pool.query(countSql, queryParams);
    const total = countRows[0].total;

    // Fetch records
    const selectSql = `
      SELECT 
        g.id,
        g.title,
        g.description,
        g.image_url,
        g.caption,
        g.event_name,
        g.department_id,
        d.name AS department_name,
        d.code AS department_code,
        g.uploaded_by,
        u.name AS uploader_name,
        u.email AS uploader_email,
        g.is_featured_carousel,
        g.created_at
      FROM galleries g
      LEFT JOIN departments d ON d.id = g.department_id
      LEFT JOIN users u ON u.id = g.uploaded_by
      ${whereSql}
      ORDER BY g.created_at DESC, g.id DESC
      LIMIT ? OFFSET ?
    `;

    const [items] = await pool.query(selectSql, [...queryParams, limitNum, offset]);

    return res.status(200).json({
      success: true,
      count: items.length,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
      data: items,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a single gallery item by ID.
 * Public access.
 */
async function getGalleryById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT 
        g.id,
        g.title,
        g.description,
        g.image_url,
        g.caption,
        g.event_name,
        g.department_id,
        d.name AS department_name,
        d.code AS department_code,
        g.uploaded_by,
        u.name AS uploader_name,
        u.email AS uploader_email,
        g.is_featured_carousel,
        g.created_at
      FROM galleries g
      LEFT JOIN departments d ON d.id = g.department_id
      LEFT JOIN users u ON u.id = g.uploaded_by
      WHERE g.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
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
 * Create a new gallery item.
 * Protected: super_admin, editor, reporter.
 */
async function createGalleryItem(req, res, next) {
  try {
    const {
      title,
      description = null,
      image_url,
      caption = null,
      event_name = null,
      department_id = null,
      is_featured_carousel = false,
    } = req.body;

    if (!title || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Title and image_url are required fields',
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

    const uploadedBy = req.user && req.user.id ? req.user.id : null;

    const [result] = await pool.query(
      `INSERT INTO galleries (
        title, description, image_url, caption, event_name, department_id, uploaded_by, is_featured_carousel
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description,
        image_url.trim(),
        caption,
        event_name ? event_name.trim() : null,
        department_id || null,
        uploadedBy,
        Boolean(is_featured_carousel),
      ]
    );

    const [createdRows] = await pool.query(
      `SELECT 
        g.id,
        g.title,
        g.description,
        g.image_url,
        g.caption,
        g.event_name,
        g.department_id,
        d.name AS department_name,
        d.code AS department_code,
        g.uploaded_by,
        u.name AS uploader_name,
        u.email AS uploader_email,
        g.is_featured_carousel,
        g.created_at
      FROM galleries g
      LEFT JOIN departments d ON d.id = g.department_id
      LEFT JOIN users u ON u.id = g.uploaded_by
      WHERE g.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Gallery item added successfully',
      data: createdRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing gallery item.
 * Protected: super_admin, editor.
 */
async function updateGalleryItem(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM galleries WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
      });
    }

    const current = existing[0];
    const {
      title,
      description,
      image_url,
      caption,
      event_name,
      department_id,
      is_featured_carousel,
    } = req.body;

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
    const updatedDescription = description !== undefined ? description : current.description;
    const updatedImageUrl = image_url !== undefined ? image_url.trim() : current.image_url;
    const updatedCaption = caption !== undefined ? caption : current.caption;
    const updatedEventName = event_name !== undefined ? (event_name ? event_name.trim() : null) : current.event_name;
    const updatedDepartmentId = department_id !== undefined ? (department_id || null) : current.department_id;
    const updatedIsFeatured = is_featured_carousel !== undefined ? Boolean(is_featured_carousel) : current.is_featured_carousel;

    await pool.query(
      `UPDATE galleries SET
        title = ?,
        description = ?,
        image_url = ?,
        caption = ?,
        event_name = ?,
        department_id = ?,
        is_featured_carousel = ?
      WHERE id = ?`,
      [
        updatedTitle,
        updatedDescription,
        updatedImageUrl,
        updatedCaption,
        updatedEventName,
        updatedDepartmentId,
        updatedIsFeatured,
        id,
      ]
    );

    const [updatedRows] = await pool.query(
      `SELECT 
        g.id,
        g.title,
        g.description,
        g.image_url,
        g.caption,
        g.event_name,
        g.department_id,
        d.name AS department_name,
        d.code AS department_code,
        g.uploaded_by,
        u.name AS uploader_name,
        u.email AS uploader_email,
        g.is_featured_carousel,
        g.created_at
      FROM galleries g
      LEFT JOIN departments d ON d.id = g.department_id
      LEFT JOIN users u ON u.id = g.uploaded_by
      WHERE g.id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Gallery item updated successfully',
      data: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a gallery item.
 * Protected: super_admin, editor.
 */
async function deleteGalleryItem(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, title FROM galleries WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
      });
    }

    await pool.query('DELETE FROM galleries WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Gallery item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublicGalleries,
  getGalleryById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
};
