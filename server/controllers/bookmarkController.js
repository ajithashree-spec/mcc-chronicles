const pool = require('../config/db');

/**
 * Toggle article bookmark status for authenticated user.
 * Protected: verifyToken.
 */
async function toggleBookmark(req, res, next) {
  try {
    const userId = req.user.id;
    const articleId = req.body.articleId || req.body.article_id || req.params.articleId;

    if (!articleId) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required to bookmark dispatch',
      });
    }

    // Verify article exists
    const [articleRows] = await pool.query('SELECT id, title FROM articles WHERE id = ? LIMIT 1', [
      articleId,
    ]);

    if (articleRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Article not found in broadsheet archives',
      });
    }

    // Check if already bookmarked
    const [existing] = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id = ? AND article_id = ? LIMIT 1',
      [userId, articleId]
    );

    if (existing.length > 0) {
      // Remove bookmark
      await pool.query('DELETE FROM bookmarks WHERE id = ?', [existing[0].id]);
      return res.status(200).json({
        success: true,
        bookmarked: false,
        message: 'Dispatch removed from personal cloud dossier',
        articleId: parseInt(articleId, 10),
      });
    } else {
      // Insert bookmark
      await pool.query('INSERT INTO bookmarks (user_id, article_id) VALUES (?, ?)', [
        userId,
        articleId,
      ]);
      return res.status(201).json({
        success: true,
        bookmarked: true,
        message: 'Dispatch saved to personal cloud dossier',
        articleId: parseInt(articleId, 10),
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve all cloud bookmarks for authenticated user.
 * Protected: verifyToken.
 */
async function getUserBookmarks(req, res, next) {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        b.id AS bookmark_id,
        b.created_at AS bookmarked_at,
        a.id,
        a.title,
        a.slug,
        a.summary,
        a.cover_image,
        a.status,
        a.published_at,
        a.created_at,
        c.name AS category_name,
        c.slug AS category_slug,
        u.name AS author_name
      FROM bookmarks b
      JOIN articles a ON b.article_id = a.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `;

    const [rows] = await pool.query(sql, [userId]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  toggleBookmark,
  getUserBookmarks,
};
