const pool = require('../config/db');

/**
 * Controller to retrieve activity audit logs with filters and pagination.
 * Protected: super_admin only.
 */
async function getAuditLogs(req, res, next) {
  try {
    const {
      action,
      user_id,
      userId,
      entity_type,
      entityType,
      limit,
      page,
      search,
    } = req.query;

    const whereClauses = [];
    const queryParams = [];

    // Filter by action (e.g. 'LOGIN', 'ARTICLE_PUBLISH')
    if (action && action.trim()) {
      whereClauses.push('UPPER(al.action) = UPPER(?)');
      queryParams.push(action.trim());
    }

    // Filter by user ID
    const targetUserId = user_id || userId;
    if (targetUserId) {
      whereClauses.push('al.user_id = ?');
      queryParams.push(Number(targetUserId));
    }

    // Filter by entity type (e.g. 'article', 'user', 'setting')
    const targetEntityType = entity_type || entityType;
    if (targetEntityType && targetEntityType.trim()) {
      whereClauses.push('LOWER(al.entity_type) = LOWER(?)');
      queryParams.push(targetEntityType.trim());
    }

    // Optional text search in details or action
    if (search && search.trim()) {
      whereClauses.push('(al.action LIKE ? OR al.details LIKE ? OR al.ip_address LIKE ?)');
      const term = `%${search.trim()}%`;
      queryParams.push(term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total matching logs for pagination metadata
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM activity_logs al ${whereSql}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Fetch audit logs joining user information
    const dataParams = [...queryParams, limitNum, offset];
    const [logs] = await pool.query(
      `SELECT 
        al.id,
        al.user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.ip_address,
        al.created_at,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereSql}
      ORDER BY al.created_at DESC, al.id DESC
      LIMIT ? OFFSET ?`,
      dataParams
    );

    return res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to retrieve a single audit log by ID.
 * Protected: super_admin only.
 */
async function getAuditLogById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT 
        al.id,
        al.user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.ip_address,
        al.created_at,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = ?
      LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Audit log entry not found',
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

module.exports = {
  getAuditLogs,
  getAuditLogById,
};
