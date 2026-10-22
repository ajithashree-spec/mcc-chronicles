const crypto = require('crypto');
const pool = require('../config/db');
const { logActivity } = require('../utils/logger');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly'];

/**
 * Public endpoint to subscribe to the newsletter.
 * Handles both new subscriptions and reactivations.
 */
async function subscribe(req, res, next) {
  try {
    const { email, name, frequency } = req.body;

    if (!email || !EMAIL_REGEX.test(String(email).trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = name ? String(name).trim().slice(0, 150) : null;
    const cleanFrequency = VALID_FREQUENCIES.includes(frequency) ? frequency : 'weekly';
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    const [result] = await pool.query(
      `INSERT INTO subscribers (email, name, frequency, is_active, unsubscribe_token, subscribed_at, unsubscribed_at)
       VALUES (?, ?, ?, TRUE, ?, CURRENT_TIMESTAMP, NULL)
       ON DUPLICATE KEY UPDATE
         name = COALESCE(VALUES(name), name),
         frequency = VALUES(frequency),
         is_active = TRUE,
         unsubscribed_at = NULL`,
      [cleanEmail, cleanName, cleanFrequency, unsubscribeToken]
    );

    // Record audit activity
    logActivity({
      action: 'NEWSLETTER_SUBSCRIBE',
      entityType: 'subscriber',
      entityId: result.insertId || null,
      details: { email: cleanEmail, frequency: cleanFrequency },
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Subscribed to newsletter successfully',
      data: {
        email: cleanEmail,
        name: cleanName,
        frequency: cleanFrequency,
        unsubscribe_token: unsubscribeToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Public endpoint to unsubscribe via unique token.
 */
async function unsubscribe(req, res, next) {
  try {
    const { token } = req.params;

    if (!token || token.length < 16) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or malformed unsubscribe token',
      });
    }

    const [rows] = await pool.query(
      'SELECT id, email, is_active FROM subscribers WHERE unsubscribe_token = ? LIMIT 1',
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired unsubscribe link',
      });
    }

    const subscriber = rows[0];

    await pool.query(
      'UPDATE subscribers SET is_active = FALSE, unsubscribed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [subscriber.id]
    );

    // Record audit activity
    logActivity({
      action: 'NEWSLETTER_UNSUBSCRIBE',
      entityType: 'subscriber',
      entityId: subscriber.id,
      details: { email: subscriber.email },
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'You have been successfully unsubscribed from the MCC Chronicles newsletter.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Protected endpoint to list subscribers with filters & pagination.
 * Roles: super_admin, editor.
 */
async function getSubscribers(req, res, next) {
  try {
    const { is_active, frequency, search, page, limit } = req.query;

    const whereClauses = [];
    const queryParams = [];

    if (is_active !== undefined) {
      whereClauses.push('is_active = ?');
      queryParams.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }

    if (frequency && VALID_FREQUENCIES.includes(frequency)) {
      whereClauses.push('frequency = ?');
      queryParams.push(frequency);
    }

    if (search && search.trim()) {
      whereClauses.push('(email LIKE ? OR name LIKE ?)');
      const term = `%${search.trim()}%`;
      queryParams.push(term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM subscribers ${whereSql}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const [rows] = await pool.query(
      `SELECT 
         id, 
         email, 
         name, 
         frequency, 
         is_active, 
         unsubscribe_token, 
         subscribed_at, 
         unsubscribed_at 
       FROM subscribers 
       ${whereSql} 
       ORDER BY subscribed_at DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Protected endpoint to delete a subscriber record completely.
 * Role: super_admin only.
 */
async function deleteSubscriber(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT id, email FROM subscribers WHERE id = ? LIMIT 1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Subscriber not found',
      });
    }

    const sub = rows[0];
    await pool.query('DELETE FROM subscribers WHERE id = ?', [id]);

    logActivity({
      userId: req.user?.id,
      action: 'NEWSLETTER_DELETE_SUBSCRIBER',
      entityType: 'subscriber',
      entityId: Number(id),
      details: { email: sub.email },
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Subscriber removed successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Protected endpoint to compile and dispatch the Morning Quadrangle Digest.
 * Roles: super_admin, editor. (Task 105)
 */
async function dispatchDigest(req, res, next) {
  try {
    const { generateDigestHtml } = require('../services/newsletterService');

    // Fetch latest published articles
    const [articles] = await pool.query(
      `SELECT a.id, a.title, a.slug, a.summary, a.content, a.cover_image,
              c.name AS category_name, u.name AS author_name, a.published_at
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.status = 'published'
       ORDER BY a.published_at DESC, a.id DESC
       LIMIT 5`
    );

    // Fetch active circulars
    const [circulars] = await pool.query(
      `SELECT id, title, circular_number FROM circulars WHERE is_active = true ORDER BY is_pinned DESC, publish_date DESC LIMIT 3`
    );

    // Count active subscribers
    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM subscribers WHERE is_active = 1'
    );
    const recipientsCount = countRows[0]?.total || 0;

    const digestHtml = generateDigestHtml({
      articles,
      circulars,
    });

    await logActivity({
      userId: req.user ? req.user.id : null,
      action: 'NEWSLETTER_DISPATCH',
      entityType: 'newsletter',
      entityId: null,
      details: {
        recipients_count: recipientsCount,
        articles_count: articles.length,
        circulars_count: circulars.length,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Morning Quadrangle Digest compiled and dispatched to ${recipientsCount} active subscribers`,
      recipientsCount,
      articlesCount: articles.length,
      circularsCount: circulars.length,
      digestHtml,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  subscribe,
  unsubscribe,
  getSubscribers,
  deleteSubscriber,
  dispatchDigest,
};
