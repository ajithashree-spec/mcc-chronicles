const pool = require('../config/db');

/**
 * Helper to generate URL-safe slug from a string.
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Retrieve all tags with their associated article counts.
 * Public access.
 */
async function getTags(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.slug,
        t.created_at,
        COUNT(at.article_id) AS article_count
      FROM tags t
      LEFT JOIN article_tags at ON t.id = at.tag_id
      GROUP BY t.id, t.name, t.slug, t.created_at
      ORDER BY article_count DESC, t.name ASC
    `);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new tag taxonomy.
 * Protected: super_admin, editor only.
 */
async function createTag(req, res, next) {
  try {
    const { name, slug } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Tag name is required',
      });
    }

    const cleanName = name.trim();
    const cleanSlug = slug && slug.trim() ? slugify(slug.trim()) : slugify(cleanName);

    // Check if tag already exists
    const [existing] = await pool.query(
      'SELECT id, name, slug FROM tags WHERE name = ? OR slug = ? LIMIT 1',
      [cleanName, cleanSlug]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Tag with this name or slug already exists',
        data: existing[0],
      });
    }

    const [result] = await pool.query(
      'INSERT INTO tags (name, slug) VALUES (?, ?)',
      [cleanName, cleanSlug]
    );

    const [newTag] = await pool.query(
      'SELECT id, name, slug, created_at FROM tags WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: {
        ...newTag[0],
        article_count: 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTags,
  createTag,
};
