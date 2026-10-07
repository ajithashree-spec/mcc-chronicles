const pool = require('../config/db');
const { logActivity, extractIp } = require('../utils/logger');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_CATEGORIES = [
  'editorial_tip',
  'general_inquiry',
  'correction',
  'grievance',
  'event_coverage',
];
const VALID_STATUSES = ['unread', 'read', 'in_progress', 'resolved', 'archived'];

/**
 * Public endpoint to submit contact inquiries or editorial tips.
 */
async function submitContactMessage(req, res, next) {
  try {
    const { name, email, subject, category, message } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    if (!email || !EMAIL_REGEX.test(String(email).trim().toLowerCase())) {
      return res.status(400).json({ success: false, error: 'A valid email address is required' });
    }
    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ success: false, error: 'Subject is required' });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    const cleanName = String(name).trim().slice(0, 150);
    const cleanEmail = String(email).trim().toLowerCase().slice(0, 255);
    const cleanSubject = String(subject).trim().slice(0, 255);
    const cleanCategory = VALID_CATEGORIES.includes(category) ? category : 'general_inquiry';
    const cleanMessage = String(message).trim();
    const clientIp = extractIp(req);

    const [result] = await pool.query(
      `INSERT INTO contact_messages (name, email, subject, category, message, status, ip_address)
       VALUES (?, ?, ?, ?, ?, 'unread', ?)`,
      [cleanName, cleanEmail, cleanSubject, cleanCategory, cleanMessage, clientIp]
    );

    logActivity({
      action: 'CONTACT_SUBMIT',
      entityType: 'contact_message',
      entityId: result.insertId,
      details: { email: cleanEmail, subject: cleanSubject, category: cleanCategory },
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. The MCC Chronicles editorial team will review it.',
      data: {
        id: result.insertId,
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        category: cleanCategory,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Protected endpoint to list contact messages with filters and pagination.
 * Roles: super_admin, editor.
 */
async function getContactMessages(req, res, next) {
  try {
    const { status, category, search, page, limit } = req.query;

    const whereClauses = [];
    const queryParams = [];

    if (status && VALID_STATUSES.includes(status)) {
      whereClauses.push('status = ?');
      queryParams.push(status);
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      whereClauses.push('category = ?');
      queryParams.push(category);
    }

    if (search && search.trim()) {
      whereClauses.push('(name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)');
      const term = `%${search.trim()}%`;
      queryParams.push(term, term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM contact_messages ${whereSql}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const [rows] = await pool.query(
      `SELECT 
         id, 
         name, 
         email, 
         subject, 
         category, 
         message, 
         status, 
         admin_notes, 
         ip_address, 
         created_at, 
         updated_at 
       FROM contact_messages 
       ${whereSql} 
       ORDER BY created_at DESC 
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
 * Protected endpoint to get a single message and automatically mark it 'read' if 'unread'.
 * Roles: super_admin, editor.
 */
async function getContactMessageById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM contact_messages WHERE id = ? LIMIT 1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      });
    }

    const msg = rows[0];

    // Automatically mark as 'read' on inspection if it was unread
    if (msg.status === 'unread') {
      await pool.query(
        "UPDATE contact_messages SET status = 'read' WHERE id = ?",
        [id]
      );
      msg.status = 'read';
    }

    return res.status(200).json({
      success: true,
      data: msg,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Protected endpoint to update message status and admin notes.
 * Roles: super_admin, editor.
 */
async function updateContactMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    const updates = [];
    const params = [];

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
        });
      }
      updates.push('status = ?');
      params.push(status);
    }

    if (admin_notes !== undefined) {
      updates.push('admin_notes = ?');
      params.push(admin_notes ? String(admin_notes) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update',
      });
    }

    params.push(id);

    const [result] = await pool.query(
      `UPDATE contact_messages SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      });
    }

    const [updatedRows] = await pool.query(
      'SELECT * FROM contact_messages WHERE id = ? LIMIT 1',
      [id]
    );

    logActivity({
      userId: req.user?.id,
      action: 'CONTACT_MESSAGE_UPDATE',
      entityType: 'contact_message',
      entityId: Number(id),
      details: { status, has_admin_notes: admin_notes !== undefined },
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Contact message updated successfully',
      data: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Protected endpoint to delete a contact message.
 * Role: super_admin only.
 */
async function deleteContactMessage(req, res, next) {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM contact_messages WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      });
    }

    logActivity({
      userId: req.user?.id,
      action: 'CONTACT_MESSAGE_DELETE',
      entityType: 'contact_message',
      entityId: Number(id),
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Contact message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitContactMessage,
  getContactMessages,
  getContactMessageById,
  updateContactMessage,
  deleteContactMessage,
};
