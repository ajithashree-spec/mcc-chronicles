const pool = require('../config/db');

/**
 * Global cross-resource search across Articles, Circulars, and Departments.
 * Public access.
 */
async function globalSearch(req, res, next) {
  try {
    const { q, type = 'all', limit = 10 } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query "q" must be provided and contain at least 2 characters',
      });
    }

    const searchTerm = q.trim();
    const searchPattern = `%${searchTerm}%`;
    const searchLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    const searchType = (type || 'all').toLowerCase();
    const searchAll = searchType === 'all';

    let articles = [];
    let circulars = [];
    let departments = [];

    // 1. Articles Search
    if (searchAll || searchType === 'articles') {
      const [articleRows] = await pool.query(
        `SELECT 
          a.id,
          a.title,
          a.slug,
          a.summary,
          a.summary AS excerpt,
          a.cover_image,
          a.published_at,
          c.name AS category_name,
          c.slug AS category_slug,
          d.name AS department_name
        FROM articles a
        LEFT JOIN categories c ON c.id = a.category_id
        LEFT JOIN departments d ON d.id = a.department_id
        WHERE a.status = 'published'
          AND (a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)
        ORDER BY a.published_at DESC, a.id DESC
        LIMIT ?`,
        [searchPattern, searchPattern, searchPattern, searchLimit]
      );
      articles = articleRows;
    }

    // 2. Circulars Search
    if (searchAll || searchType === 'circulars') {
      const [circularRows] = await pool.query(
        `SELECT 
          c.id,
          c.title,
          c.circular_number,
          c.publish_date,
          c.attachment_url,
          c.target_audience,
          c.is_pinned,
          d.name AS department_name
        FROM circulars c
        LEFT JOIN departments d ON d.id = c.department_id
        WHERE c.is_active = true
          AND (c.title LIKE ? OR c.circular_number LIKE ? OR c.content LIKE ?)
        ORDER BY c.is_pinned DESC, c.publish_date DESC, c.id DESC
        LIMIT ?`,
        [searchPattern, searchPattern, searchPattern, searchLimit]
      );
      circulars = circularRows;
    }

    // 3. Departments Search
    if (searchAll || searchType === 'departments') {
      const [departmentRows] = await pool.query(
        `SELECT 
          d.id,
          d.name,
          d.code,
          d.stream,
          d.head_of_department,
          d.contact_email
        FROM departments d
        WHERE d.name LIKE ? OR d.code LIKE ? OR d.head_of_department LIKE ?
        ORDER BY d.name ASC
        LIMIT ?`,
        [searchPattern, searchPattern, searchPattern, searchLimit]
      );
      departments = departmentRows;
    }

    const totalMatches = articles.length + circulars.length + departments.length;

    return res.status(200).json({
      success: true,
      query: searchTerm,
      type: searchType,
      totalMatches,
      results: {
        articles,
        circulars,
        departments,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  globalSearch,
};
