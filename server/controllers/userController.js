const bcrypt = require('bcrypt');
const pool = require('../config/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['super_admin', 'editor', 'reporter', 'faculty'];

/**
 * Retrieve all users with optional filtering.
 * Protected: super_admin only.
 */
async function getAllUsers(req, res, next) {
  try {
    const { role, department_id, is_active, search } = req.query;

    const whereClauses = [];
    const queryParams = [];

    if (role && VALID_ROLES.includes(role)) {
      whereClauses.push('u.role = ?');
      queryParams.push(role);
    }

    if (department_id) {
      whereClauses.push('u.department_id = ?');
      queryParams.push(department_id);
    }

    if (is_active !== undefined) {
      whereClauses.push('u.is_active = ?');
      queryParams.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }

    if (search && search.trim()) {
      whereClauses.push('(u.name LIKE ? OR u.email LIKE ?)');
      const term = `%${search.trim()}%`;
      queryParams.push(term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.department_id, 
        d.name AS department_name,
        d.code AS department_code,
        u.avatar_url, 
        u.bio, 
        u.is_active, 
        u.created_at, 
        u.updated_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ${whereSql}
      ORDER BY u.created_at DESC
    `;

    const [users] = await pool.query(sql, queryParams);

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a user by ID.
 * Protected: self or super_admin.
 */
async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const targetId = parseInt(id, 10);

    const isSuperAdmin = req.user.role === 'super_admin';
    const isSelf = req.user.id === targetId;

    if (!isSuperAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to view this profile',
      });
    }

    const [rows] = await pool.query(
      `SELECT 
         u.id, 
         u.name, 
         u.email, 
         u.role, 
         u.department_id, 
         d.name AS department_name,
         d.code AS department_code,
         u.avatar_url, 
         u.bio, 
         u.is_active, 
         u.created_at, 
         u.updated_at
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?
       LIMIT 1`,
      [targetId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
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
 * Create a new user/staff member.
 * Protected: super_admin only.
 */
async function createUser(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      role = 'reporter',
      department_id = null,
      bio = null,
      avatar_url = null,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required' });
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'A valid email address is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Allowed roles: ${VALID_ROLES.join(', ')}`,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate email
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [
      normalizedEmail,
    ]);

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department_id, bio, avatar_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        name.trim(),
        normalizedEmail,
        passwordHash,
        role,
        department_id || null,
        bio ? bio.trim() : null,
        avatar_url ? avatar_url.trim() : null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail,
        role,
        department_id: department_id || null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user details.
 * Protected: super_admin (full access) or self (profile only).
 */
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const targetId = parseInt(id, 10);

    const isSuperAdmin = req.user.role === 'super_admin';
    const isSelf = req.user.id === targetId;

    if (!isSuperAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to update this account',
      });
    }

    const [existing] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [targetId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const current = existing[0];
    const { name, email, password, role, department_id, bio, avatar_url, is_active } = req.body;

    let updatedName = current.name;
    if (name !== undefined && name.trim()) updatedName = name.trim();

    let updatedBio = current.bio;
    if (bio !== undefined) updatedBio = bio ? bio.trim() : null;

    let updatedAvatar = current.avatar_url;
    if (avatar_url !== undefined) updatedAvatar = avatar_url ? avatar_url.trim() : null;

    let updatedPasswordHash = current.password_hash;
    if (password && password.trim().length >= 6) {
      updatedPasswordHash = await bcrypt.hash(password.trim(), 10);
    }

    let updatedEmail = current.email;
    let updatedRole = current.role;
    let updatedDept = current.department_id;
    let updatedActive = current.is_active;

    // Only super_admin can change role, department, active status, or email
    if (isSuperAdmin) {
      if (email && EMAIL_REGEX.test(email.trim())) {
        const normEmail = email.trim().toLowerCase();
        if (normEmail !== current.email) {
          const [duplicate] = await pool.query(
            'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1',
            [normEmail, targetId]
          );
          if (duplicate.length > 0) {
            return res.status(409).json({
              success: false,
              error: 'Email is already in use by another account',
            });
          }
          updatedEmail = normEmail;
        }
      }

      if (role && VALID_ROLES.includes(role)) {
        updatedRole = role;
      }

      if (department_id !== undefined) {
        updatedDept = department_id || null;
      }

      if (is_active !== undefined) {
        if (isSelf && !is_active) {
          return res.status(400).json({
            success: false,
            error: 'Cannot deactivate your own account',
          });
        }
        updatedActive = is_active ? 1 : 0;
      }
    }

    await pool.query(
      `UPDATE users SET
         name = ?, email = ?, password_hash = ?, role = ?,
         department_id = ?, bio = ?, avatar_url = ?, is_active = ?
       WHERE id = ?`,
      [
        updatedName,
        updatedEmail,
        updatedPasswordHash,
        updatedRole,
        updatedDept,
        updatedBio,
        updatedAvatar,
        updatedActive,
        targetId,
      ]
    );

    const [updatedRows] = await pool.query(
      `SELECT 
         u.id, u.name, u.email, u.role, u.department_id,
         d.name AS department_name, u.avatar_url, u.bio,
         u.is_active, u.updated_at
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ? LIMIT 1`,
      [targetId]
    );

    return res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle or set account activation status.
 * Protected: super_admin only.
 */
async function toggleUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const targetId = parseInt(id, 10);

    if (req.user.id === targetId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot alter activation status of your own account',
      });
    }

    const [existing] = await pool.query('SELECT id, name, is_active FROM users WHERE id = ? LIMIT 1', [
      targetId,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const current = existing[0];
    const newStatus =
      req.body.is_active !== undefined
        ? req.body.is_active
          ? 1
          : 0
        : current.is_active
        ? 0
        : 1;

    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, targetId]);

    return res.status(200).json({
      success: true,
      message: `Account for '${current.name}' ${newStatus ? 'activated' : 'deactivated'} successfully`,
      is_active: newStatus,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
};
