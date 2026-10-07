const pool = require('../config/db');
const { logActivity } = require('../utils/logger');

/**
 * Escapes a value into RFC 4180 compliant CSV field representation.
 * @param {any} value
 * @returns {string}
 */
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '""';
  }
  let str;
  if (value instanceof Date) {
    str = value.toISOString();
  } else {
    str = String(value);
  }
  // Double-quote escaping
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Full Database JSON Backup Snapshot.
 * Protected: super_admin only.
 */
async function exportDataJSON(req, res, next) {
  try {
    // Query each core table in parallel or sequence
    const [siteSettings] = await pool.query('SELECT * FROM site_settings');
    const [departments] = await pool.query('SELECT * FROM departments ORDER BY id ASC');
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY id ASC');

    // Securely omit password_hash from users export
    const [users] = await pool.query(
      `SELECT 
         id, 
         name, 
         email, 
         role, 
         department_id, 
         avatar_url, 
         bio, 
         is_active, 
         created_at, 
         updated_at 
       FROM users 
       ORDER BY id ASC`
    );

    const [articles] = await pool.query('SELECT * FROM articles ORDER BY id ASC');
    const [comments] = await pool.query('SELECT * FROM comments ORDER BY id ASC');
    const [circulars] = await pool.query('SELECT * FROM circulars ORDER BY id ASC');
    const [galleries] = await pool.query('SELECT * FROM galleries ORDER BY id ASC');
    const [activityLogs] = await pool.query('SELECT * FROM activity_logs ORDER BY id ASC');
    const [subscribers] = await pool.query('SELECT * FROM subscribers ORDER BY id ASC');
    const [contactMessages] = await pool.query('SELECT * FROM contact_messages ORDER BY id ASC');

    const now = new Date();
    const formattedTimestamp = now.toISOString().replace(/[:.]/g, '-');

    const backupPayload = {
      success: true,
      timestamp: now.toISOString(),
      version: '1.0.0',
      database: 'mcc_chronicles',
      counts: {
        site_settings: siteSettings.length,
        departments: departments.length,
        categories: categories.length,
        users: users.length,
        articles: articles.length,
        comments: comments.length,
        circulars: circulars.length,
        galleries: galleries.length,
        activity_logs: activityLogs.length,
        subscribers: subscribers.length,
        contact_messages: contactMessages.length,
      },
      tables: {
        site_settings: siteSettings,
        departments,
        categories,
        users,
        articles,
        comments,
        circulars,
        galleries,
        activity_logs: activityLogs,
        subscribers,
        contact_messages: contactMessages,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="mcc-chronicles-backup-${formattedTimestamp}.json"`
    );

    // Record security audit log for database snapshot download
    logActivity({
      userId: req.user?.id,
      action: 'BACKUP_EXPORT_JSON',
      entityType: 'backup',
      details: { format: 'json', tables: Object.keys(backupPayload.tables) },
      req,
    });

    return res.status(200).json(backupPayload);
  } catch (error) {
    next(error);
  }
}

/**
 * Export Articles to standard RFC 4180 CSV format.
 * Protected: super_admin, editor.
 */
async function exportArticlesCSV(req, res, next) {
  try {
    const [articles] = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.slug,
        COALESCE(c.name, 'Uncategorized') AS category_name,
        COALESCE(d.name, 'General') AS department_name,
        COALESCE(u.name, 'Unknown') AS author_name,
        a.status,
        a.views_count,
        a.published_at,
        a.created_at
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
    `);

    const headers = [
      'ID',
      'Title',
      'Slug',
      'Category',
      'Department',
      'Author',
      'Status',
      'Views',
      'Published At',
    ];

    const rows = [headers.map(escapeCSV).join(',')];

    for (const article of articles) {
      const row = [
        escapeCSV(article.id),
        escapeCSV(article.title),
        escapeCSV(article.slug),
        escapeCSV(article.category_name),
        escapeCSV(article.department_name),
        escapeCSV(article.author_name),
        escapeCSV(article.status),
        escapeCSV(article.views_count),
        escapeCSV(article.published_at ? new Date(article.published_at).toISOString() : ''),
      ];
      rows.push(row.join(','));
    }

    const csvContent = rows.join('\r\n');
    const formattedTimestamp = new Date().toISOString().replace(/[:.]/g, '-');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="mcc-articles-${formattedTimestamp}.csv"`
    );

    // Record security audit log for CSV export
    logActivity({
      userId: req.user?.id,
      action: 'BACKUP_EXPORT_CSV',
      entityType: 'articles',
      details: { format: 'csv', count: articles.length },
      req,
    });

    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  exportDataJSON,
  exportArticlesCSV,
};
