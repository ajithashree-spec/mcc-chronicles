const pool = require('../config/db');

// Basic email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Retrieve comments for a specific article.
 * Public readers receive approved comments; editors/admins can view all.
 */
async function getCommentsByArticle(req, res, next) {
  try {
    const { articleId } = req.params;
    const { status } = req.query;

    if (!articleId) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required',
      });
    }

    const isEditorial = req.user && ['super_admin', 'editor'].includes(req.user.role);
    const whereClauses = ['article_id = ?'];
    const queryParams = [articleId];

    if (isEditorial && status === 'all') {
      // No status filter for editors inspecting all
    } else if (isEditorial && status && ['pending', 'approved', 'spam'].includes(status)) {
      whereClauses.push('status = ?');
      queryParams.push(status);
    } else {
      // Public default: approved comments only
      whereClauses.push("(status = 'approved' OR is_approved = 1)");
    }

    const [comments] = await pool.query(
      `SELECT 
         id,
         article_id,
         author_name,
         author_email,
         content,
         status,
         is_approved,
         created_at
       FROM comments
       WHERE ${whereClauses.join(' AND ')}
       ORDER BY created_at DESC`,
      queryParams
    );

    return res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit a reader comment on a published article.
 * Public access.
 */
async function createComment(req, res, next) {
  try {
    const { article_id, author_name, author_email, content } = req.body;

    if (!article_id) {
      return res.status(400).json({ success: false, error: 'Article ID is required' });
    }

    if (!author_name || !author_name.trim()) {
      return res.status(400).json({ success: false, error: 'Your name is required' });
    }

    if (!author_email || !EMAIL_REGEX.test(author_email.trim())) {
      return res.status(400).json({ success: false, error: 'A valid email address is required' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Comment text is required' });
    }

    // Verify article exists and is published
    const [articleRows] = await pool.query(
      "SELECT id, status FROM articles WHERE id = ? LIMIT 1",
      [article_id]
    );

    if (articleRows.length === 0 || articleRows[0].status !== 'published') {
      return res.status(404).json({
        success: false,
        error: 'Article not found or not open for comments',
      });
    }

    // Default status is 'approved' for seamless campus discussion
    const defaultStatus = 'approved';
    const isApproved = 1;

    const [result] = await pool.query(
      `INSERT INTO comments (article_id, author_name, author_email, content, is_approved, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        article_id,
        author_name.trim(),
        author_email.trim().toLowerCase(),
        content.trim(),
        isApproved,
        defaultStatus,
      ]
    );

    const [newCommentRows] = await pool.query(
      'SELECT id, article_id, author_name, author_email, content, status, is_approved, created_at FROM comments WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Comment submitted successfully',
      data: newCommentRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Moderate comment status (approved, pending, rejected, spam).
 * Protected: super_admin, editor only.
 */
async function updateCommentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['approved', 'pending', 'rejected', 'spam'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed values: ${validStatuses.join(', ')}`,
      });
    }

    const [existing] = await pool.query('SELECT * FROM comments WHERE id = ? LIMIT 1', [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    const isApproved = status === 'approved' ? 1 : 0;

    try {
      await pool.query(
        'UPDATE comments SET status = ?, is_approved = ? WHERE id = ?',
        [status, isApproved, id]
      );
    } catch (dbErr) {
      // If DB enum does not include 'rejected' yet, fallback gracefully to 'spam'
      const fallbackStatus = status === 'rejected' ? 'spam' : status;
      await pool.query(
        'UPDATE comments SET status = ?, is_approved = ? WHERE id = ?',
        [fallbackStatus, isApproved, id]
      );
    }

    const [updatedRows] = await pool.query(
      'SELECT id, article_id, author_name, author_email, content, status, is_approved, created_at FROM comments WHERE id = ?',
      [id]
    );

    return res.status(200).json({
      success: true,
      message: `Comment status updated to '${status}'`,
      data: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve all comments across all articles for editorial moderation.
 * Protected: super_admin, editor only.
 */
async function getAllComments(req, res, next) {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = [];
    const queryParams = [];

    if (status && status !== 'all') {
      if (status === 'rejected') {
        whereClauses.push("(c.status = 'rejected' OR c.status = 'spam' OR c.is_approved = 0)");
      } else {
        whereClauses.push('c.status = ?');
        queryParams.push(status);
      }
    }

    if (search && search.trim()) {
      whereClauses.push('(c.content LIKE ? OR c.author_name LIKE ? OR c.author_email LIKE ? OR a.title LIKE ?)');
      const term = `%${search.trim()}%`;
      queryParams.push(term, term, term, term);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM comments c LEFT JOIN articles a ON c.article_id = a.id ${whereSQL}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;

    const [rows] = await pool.query(
      `SELECT 
         c.id,
         c.article_id,
         c.author_name,
         c.author_email,
         c.content,
         c.status,
         c.is_approved,
         c.created_at,
         a.title as article_title,
         a.slug as article_slug
       FROM comments c
       LEFT JOIN articles a ON c.article_id = a.id
       ${whereSQL}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      total,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a comment.
 * Protected: super_admin, editor only.
 */
async function deleteComment(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM comments WHERE id = ? LIMIT 1', [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    await pool.query('DELETE FROM comments WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCommentsByArticle,
  getAllComments,
  createComment,
  updateCommentStatus,
  deleteComment,
};
