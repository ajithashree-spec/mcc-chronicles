const pool = require('../config/db');
const { logActivity } = require('../utils/logger');

/**
 * Retrieve article assignments list.
 * Protected: editors & super_admin see all; reporters see their assignments.
 */
async function getAssignments(req, res, next) {
  try {
    const isEditorial = ['super_admin', 'editor'].includes(req.user.role);
    const { status, assigned_to } = req.query;

    const whereClauses = [];
    const queryParams = [];

    if (!isEditorial) {
      whereClauses.push('aa.assigned_to = ?');
      queryParams.push(req.user.id);
    } else {
      if (assigned_to) {
        whereClauses.push('aa.assigned_to = ?');
        queryParams.push(assigned_to);
      }
    }

    if (status) {
      whereClauses.push('aa.status = ?');
      queryParams.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT 
        aa.id,
        aa.title,
        aa.brief,
        aa.assigned_to,
        u_to.name AS assigned_to_name,
        u_to.email AS assigned_to_email,
        aa.assigned_by,
        u_by.name AS assigned_by_name,
        aa.department_id,
        d.name AS department_name,
        d.code AS department_code,
        aa.deadline,
        aa.status,
        aa.created_at
      FROM article_assignments aa
      LEFT JOIN users u_to ON aa.assigned_to = u_to.id
      LEFT JOIN users u_by ON aa.assigned_by = u_by.id
      LEFT JOIN departments d ON aa.department_id = d.id
      ${whereSql}
      ORDER BY aa.created_at DESC
    `;

    const [rows] = await pool.query(sql, queryParams);

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
 * Create a new assignment brief for a reporter.
 * Protected: super_admin, editor.
 */
async function createAssignment(req, res, next) {
  try {
    const assignedBy = req.user.id;
    const { title, brief, assigned_to, department_id, deadline } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Assignment title / story lead is required',
      });
    }

    if (!brief || !brief.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Editorial assignment brief is required',
      });
    }

    const assignedToId = assigned_to ? parseInt(assigned_to, 10) : null;
    const deptId = department_id ? parseInt(department_id, 10) : null;
    const deadlineVal = deadline || null;

    const [result] = await pool.query(
      `INSERT INTO article_assignments (
        title, brief, assigned_to, assigned_by, department_id, deadline, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'assigned')`,
      [title.trim(), brief.trim(), assignedToId, assignedBy, deptId, deadlineVal]
    );

    const [createdRows] = await pool.query(
      `SELECT 
        aa.id, aa.title, aa.brief, aa.assigned_to, u_to.name AS assigned_to_name,
        aa.assigned_by, u_by.name AS assigned_by_name, aa.department_id, d.name AS department_name,
        aa.deadline, aa.status, aa.created_at
       FROM article_assignments aa
       LEFT JOIN users u_to ON aa.assigned_to = u_to.id
       LEFT JOIN users u_by ON aa.assigned_by = u_by.id
       LEFT JOIN departments d ON aa.department_id = d.id
       WHERE aa.id = ? LIMIT 1`,
      [result.insertId]
    );

    await logActivity({
      userId: assignedBy,
      action: 'ASSIGNMENT_CREATE',
      entityType: 'assignment',
      entityId: result.insertId,
      details: { title: title.trim(), assigned_to: assignedToId },
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Editorial assignment dispatched successfully',
      data: createdRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Transition assignment lifecycle status.
 * Protected: verifyToken.
 * Reporter can transition to 'accepted', 'submitted'.
 * Editors can transition to 'completed', 'cancelled', 'assigned', etc.
 */
async function updateAssignmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['assigned', 'accepted', 'submitted', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const [existing] = await pool.query(
      'SELECT * FROM article_assignments WHERE id = ? LIMIT 1',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found',
      });
    }

    const assignment = existing[0];
    const isEditorial = ['super_admin', 'editor'].includes(req.user.role);
    const isAssignee = req.user.id === assignment.assigned_to;

    if (!isEditorial && !isAssignee) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to update this assignment',
      });
    }

    if (!isEditorial) {
      // Reporter can only accept or submit
      if (!['accepted', 'submitted'].includes(status)) {
        return res.status(403).json({
          success: false,
          error: "Reporters can only mark assignments as 'accepted' or 'submitted'",
        });
      }
    }

    await pool.query('UPDATE article_assignments SET status = ? WHERE id = ?', [status, id]);

    const [updatedRows] = await pool.query(
      `SELECT 
        aa.id, aa.title, aa.brief, aa.assigned_to, u_to.name AS assigned_to_name,
        aa.assigned_by, u_by.name AS assigned_by_name, aa.status, aa.deadline, aa.created_at
       FROM article_assignments aa
       LEFT JOIN users u_to ON aa.assigned_to = u_to.id
       LEFT JOIN users u_by ON aa.assigned_by = u_by.id
       WHERE aa.id = ? LIMIT 1`,
      [id]
    );

    await logActivity({
      userId: req.user.id,
      action: 'ASSIGNMENT_STATUS_UPDATE',
      entityType: 'assignment',
      entityId: id,
      details: { title: assignment.title, previous_status: assignment.status, new_status: status },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Assignment status updated to '${status}'`,
      data: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAssignments,
  createAssignment,
  updateAssignmentStatus,
};
