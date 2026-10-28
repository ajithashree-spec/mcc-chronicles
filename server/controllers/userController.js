const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { logActivity } = require('../utils/logger');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['super_admin', 'superadmin', 'editor', 'admin', 'reporter', 'faculty'];

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
      whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)');
      const term = `%${search.trim()}%`;
      queryParams.push(term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT 
        u.id, 
        u.name, 
        u.username,
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

    const isSuperAdmin = ['super_admin', 'superadmin'].includes(req.user.role);
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
         u.username,
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
      username,
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

    if (!password || password.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 4 characters long',
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Allowed roles: ${VALID_ROLES.join(', ')}`,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = (username && username.trim().toLowerCase()) || normalizedEmail.split('@')[0];

    // Check duplicate email or username
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [normalizedEmail, normalizedUsername]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address or username already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, username, email, password, password_hash, role, department_id, bio, avatar_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        name.trim(),
        normalizedUsername,
        normalizedEmail,
        passwordHash,
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
        username: normalizedUsername,
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

    const isSuperAdmin = ['super_admin', 'superadmin'].includes(req.user.role);
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
    const { name, username, email, password, role, department_id, bio, avatar_url, is_active } = req.body;

    let updatedName = current.name;
    if (name !== undefined && name.trim()) updatedName = name.trim();

    let updatedUsername = current.username;
    if (username !== undefined && username.trim()) {
      const normUsername = username.trim().toLowerCase();
      if (normUsername !== current.username) {
        const [duplicate] = await pool.query(
          'SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1',
          [normUsername, targetId]
        );
        if (duplicate.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'Username is already in use by another account',
          });
        }
        updatedUsername = normUsername;
      }
    }

    let updatedBio = current.bio;
    if (bio !== undefined) updatedBio = bio ? bio.trim() : null;

    let updatedAvatar = current.avatar_url;
    if (avatar_url !== undefined) updatedAvatar = avatar_url ? avatar_url.trim() : null;

    let updatedPasswordHash = current.password_hash;
    if (password && password.trim().length >= 4) {
      updatedPasswordHash = await bcrypt.hash(password.trim(), 10);
    }

    let updatedEmail = current.email;
    let updatedRole = current.role;
    let updatedDept = current.department_id;
    let updatedActive = current.is_active;

    // Only super_admin can change role, department, active status, or email
    if (isSuperAdmin) {
      if (email && email.trim()) {
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
         name = ?, username = ?, email = ?, password = ?, password_hash = ?, role = ?,
         department_id = ?, bio = ?, avatar_url = ?, is_active = ?
       WHERE id = ?`,
      [
        updatedName,
        updatedUsername,
        updatedEmail,
        updatedPasswordHash,
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
         u.id, u.name, u.username, u.email, u.role, u.department_id,
         d.name AS department_name, u.avatar_url, u.bio,
         u.is_active, u.updated_at
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ? LIMIT 1`,
      [targetId]
    );

    return res.status(200).json({
      success: true,
      message: 'User credentials and profile updated successfully',
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

/**
 * Update authenticated user's profile (name, bio, avatar_url).
 * Protected: verifyToken.
 */
async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, username, bio, avatar_url } = req.body;

    const [existing] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let updatedName = existing[0].name;
    if (name !== undefined && name.trim()) updatedName = name.trim();

    let updatedUsername = existing[0].username;
    if (username !== undefined && username.trim()) {
      const normUsername = username.trim().toLowerCase();
      if (normUsername !== existing[0].username) {
        const [duplicate] = await pool.query(
          'SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1',
          [normUsername, userId]
        );
        if (duplicate.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'Username is already taken by another account',
          });
        }
        updatedUsername = normUsername;
      }
    }

    let updatedBio = existing[0].bio;
    if (bio !== undefined) updatedBio = bio ? bio.trim() : null;

    let updatedAvatar = existing[0].avatar_url;
    if (avatar_url !== undefined) updatedAvatar = avatar_url ? avatar_url.trim() : null;

    await pool.query(
      'UPDATE users SET name = ?, username = ?, bio = ?, avatar_url = ? WHERE id = ?',
      [updatedName, updatedUsername, updatedBio, updatedAvatar, userId]
    );

    const [updatedRows] = await pool.query(
      `SELECT u.id, u.name, u.username, u.email, u.role, u.department_id, d.name AS department_name,
              u.avatar_url, u.bio, u.is_active, u.created_at, u.updated_at
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ? LIMIT 1`,
      [userId]
    );

    await logActivity({
      userId,
      action: 'PROFILE_UPDATE',
      entityType: 'user',
      entityId: userId,
      details: { name: updatedName, username: updatedUsername },
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change authenticated user's password.
 * Protected: verifyToken.
 */
async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password is required',
      });
    }

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 4 characters long',
      });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password and confirmation do not match. You must type the new password twice identically.',
      });
    }

    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect current password. Password change denied.',
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ?, password_hash = ? WHERE id = ?', [newHash, newHash, userId]);

    await logActivity({
      userId,
      action: 'PASSWORD_CHANGE',
      entityType: 'user',
      entityId: userId,
      details: 'User successfully updated security password',
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Security password changed successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a user/staff account.
 * Protected: super_admin only. Prevents self-deletion.
 */
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const targetId = parseInt(id, 10);

    if (req.user.id === targetId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own administrative account',
      });
    }

    const [existing] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1', [
      targetId,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const deletedUser = existing[0];
    await pool.query('DELETE FROM users WHERE id = ?', [targetId]);

    await logActivity({
      userId: req.user.id,
      action: 'USER_DELETE',
      entityType: 'user',
      entityId: targetId,
      details: { name: deletedUser.name, email: deletedUser.email, role: deletedUser.role },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Staff account '${deletedUser.name}' removed successfully`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change Admin account password (Super Admin).
 * Strictly requires correctly entering Admin's existing password,
 * plus typing new password twice.
 */
async function changeAdminPassword(req, res, next) {
  try {
    const isSuperAdmin = ['super_admin', 'superadmin'].includes(req.user.role);
    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only Super Admin can change Admin credentials',
      });
    }

    const { targetUserId, targetUsername, existingPassword, newPassword, confirmPassword } = req.body;

    if (!existingPassword) {
      return res.status(400).json({
        success: false,
        error: 'Existing Admin password is required',
      });
    }

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 4 characters long',
      });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password and confirmation do not match. You must type the new password twice identically.',
      });
    }

    // Find target admin user
    let adminUser = null;
    if (targetUserId) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [targetUserId]);
      if (rows.length > 0) adminUser = rows[0];
    } else if (targetUsername) {
      const [rows] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1', [targetUsername.toLowerCase(), targetUsername.toLowerCase()]);
      if (rows.length > 0) adminUser = rows[0];
    } else {
      const [rows] = await pool.query("SELECT * FROM users WHERE username = 'admin' OR id = 1 LIMIT 1");
      if (rows.length > 0) adminUser = rows[0];
    }

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: 'Admin account not found',
      });
    }

    // Verify existing password for Admin
    const isMatch = await bcrypt.compare(existingPassword, adminUser.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect existing password for Admin account. Password change denied.',
      });
    }

    // Hash and update new password
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ?, password_hash = ? WHERE id = ?', [newHash, newHash, adminUser.id]);

    await logActivity({
      userId: req.user.id,
      action: 'ADMIN_PASSWORD_CHANGE',
      entityType: 'user',
      entityId: adminUser.id,
      details: `Super Admin changed password for Admin account '@${adminUser.username || adminUser.email}'`,
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Password for Admin account (@${adminUser.username || adminUser.email}) updated successfully!`,
      data: {
        id: adminUser.id,
        username: adminUser.username,
        name: adminUser.name,
      },
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
  updateProfile,
  changePassword,
  changeAdminPassword,
  deleteUser,
};
