const pool = require('../config/db');

/**
 * Utility to convert text into a URL-friendly slug.
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Swap spaces and underscores to single dash
    .replace(/^-+|-+$/g, ''); // Trim dashes from start/end
}

/**
 * Retrieve all categories with published article counts.
 * Public access.
 */
async function getAllCategories(req, res, next) {
  try {
    const [categories] = await pool.query(
      `SELECT 
         c.id,
         c.name,
         c.slug,
         c.description,
         c.created_at,
         COUNT(a.id) AS article_count
       FROM categories c
       LEFT JOIN articles a ON a.category_id = c.id AND a.status = 'published'
       GROUP BY c.id
       ORDER BY c.name ASC`
    );

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a single category by slug or id with article count.
 * Public access.
 */
async function getCategoryBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const isNumeric = /^\d+$/.test(slug);

    const [rows] = await pool.query(
      `SELECT 
         c.id,
         c.name,
         c.slug,
         c.description,
         c.created_at,
         COUNT(a.id) AS article_count
       FROM categories c
       LEFT JOIN articles a ON a.category_id = c.id AND a.status = 'published'
       WHERE ${isNumeric ? 'c.id = ? OR c.slug = ?' : 'c.slug = ?'}
       GROUP BY c.id
       LIMIT 1`,
      isNumeric ? [slug, slug] : [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
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
 * Create a new category.
 * Protected: super_admin, editor only.
 */
async function createCategory(req, res, next) {
  try {
    const { name, slug, description = null } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required',
      });
    }

    const finalSlug = slug && slug.trim() ? slugify(slug) : slugify(name);

    if (!finalSlug) {
      return res.status(400).json({
        success: false,
        error: 'Unable to generate a valid slug from provided input',
      });
    }

    // Check for slug collision
    const [existing] = await pool.query(
      'SELECT id FROM categories WHERE slug = ? LIMIT 1',
      [finalSlug]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Category slug '${finalSlug}' already exists. Please choose a distinct name or slug.`,
      });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [name.trim(), finalSlug, description ? description.trim() : null]
    );

    const newCategory = {
      id: result.insertId,
      name: name.trim(),
      slug: finalSlug,
      description: description ? description.trim() : null,
    };

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing category.
 * Protected: super_admin, editor only.
 */
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;

    const [existing] = await pool.query(
      'SELECT * FROM categories WHERE id = ? LIMIT 1',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    const currentCat = existing[0];

    // Compute updated slug if name or slug changed
    let updatedSlug = currentCat.slug;
    if (slug !== undefined && slug.trim()) {
      updatedSlug = slugify(slug);
    } else if (name !== undefined && name.trim() && !slug) {
      // Optional: keep original slug unless explicit slug change requested
    }

    // Check slug collision against other categories
    if (updatedSlug !== currentCat.slug) {
      const [duplicate] = await pool.query(
        'SELECT id FROM categories WHERE slug = ? AND id != ? LIMIT 1',
        [updatedSlug, id]
      );

      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Category slug '${updatedSlug}' is already in use by another category`,
        });
      }
    }

    const updatedName = name !== undefined && name.trim() ? name.trim() : currentCat.name;
    const updatedDesc = description !== undefined ? (description ? description.trim() : null) : currentCat.description;

    await pool.query(
      'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?',
      [updatedName, updatedSlug, updatedDesc, id]
    );

    const [updatedRows] = await pool.query(
      'SELECT * FROM categories WHERE id = ? LIMIT 1',
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a category if no articles belong to it.
 * Protected: super_admin only.
 */
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT id, name FROM categories WHERE id = ? LIMIT 1',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    // Referential integrity check
    const [articleRows] = await pool.query(
      'SELECT COUNT(*) as count FROM articles WHERE category_id = ?',
      [id]
    );

    if (articleRows[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category: ${articleRows[0].count} article(s) are assigned to this category. Reassign or remove them first.`,
      });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Category '${existing[0].name}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
