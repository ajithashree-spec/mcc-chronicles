const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { logActivity } = require('../utils/logger');

/**
 * Handle user login, password validation, and JWT generation.
 */
async function login(req, res, next) {
  try {
    const identifier = (req.body.username || req.body.email || req.body.identifier || '').trim().toLowerCase();
    const password = req.body.password;
    const portal = (req.body.portal || '').trim().toLowerCase(); // 'admin' | 'superadmin'

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username/email and password are required',
      });
    }

    const [rows] = await pool.query(
      `SELECT 
         u.id, 
         u.name, 
         u.username, 
         u.email, 
         u.password,
         u.password_hash, 
         u.role, 
         u.department_id, 
         d.name AS department_name, 
         u.is_active
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.username = ? OR u.email = ? OR u.name = ? OR (u.username = 'superadmin' AND ? = 'root')
       LIMIT 1`,
      [identifier, identifier, identifier, identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username/email or password',
      });
    }

    const user = rows[0];

    // Check account active state
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated. Please contact the administrator.',
      });
    }

    // Verify password hash
    const storedHash = user.password || user.password_hash;
    let isMatch = await bcrypt.compare(password, storedHash);

    // Initial fallback for default accounts if still using default uncustomized passwords
    if (!isMatch && (user.username === 'superadmin' || user.username === 'admin')) {
      if (password === 'root') {
        const matchesDefaultSuper = await bcrypt.compare('superadmin', storedHash);
        const matchesDefaultAdmin = await bcrypt.compare('admin', storedHash);
        const matchesDefaultRoot = await bcrypt.compare('root', storedHash);
        if (matchesDefaultSuper || matchesDefaultAdmin || matchesDefaultRoot) isMatch = true;
      } else if (password === 'superadmin' && user.username === 'superadmin') {
        const matchesDefaultRoot = await bcrypt.compare('root', storedHash);
        if (matchesDefaultRoot) isMatch = true;
      } else if (password === 'admin' && user.username === 'admin') {
        const matchesDefaultRoot = await bcrypt.compare('root', storedHash);
        if (matchesDefaultRoot) isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username/email or password',
      });
    }

    // Standardize role mapping for superadmin user based on requested portal or default
    let effectiveRole = user.role;
    if (user.username === 'superadmin' || user.email === 'superadmin@mcc.edu.in' || identifier === 'root' || user.email === 'root') {
      if (portal === 'admin') {
        effectiveRole = 'admin';
      } else {
        effectiveRole = 'superadmin';
      }
    } else if (['superadmin', 'super_admin'].includes(user.role) && portal === 'admin') {
      effectiveRole = 'admin';
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'mcc_chronicles_super_secret_jwt_key_2026';
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: effectiveRole,
      department_id: user.department_id,
      portal: portal || (['superadmin', 'super_admin'].includes(effectiveRole) ? 'superadmin' : 'admin'),
    };

    const token = jwt.sign(payload, secret, { expiresIn: '24h' });

    // Asynchronously log authentication audit event
    logActivity({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'user',
      entityId: user.id,
      details: { username: user.username, email: user.email, role: effectiveRole, name: user.name, portal },
      req,
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: effectiveRole,
        department_id: user.department_id,
        department_name: user.department_name,
        portal: portal || (['superadmin', 'super_admin'].includes(effectiveRole) ? 'superadmin' : 'admin'),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return currently authenticated user profile from token.
 */
async function getMe(req, res, next) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
         u.id, 
         u.name, 
         u.username,
         u.email, 
         u.role, 
         u.department_id, 
         d.name AS department_name, 
         u.avatar_url, 
         u.bio, 
         u.is_active, 
         u.created_at
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify Super Admin password on demand and return upgraded credentials.
 * If password is correct, gives access to the Super Admin console.
 */
async function verifySuperAdmin(req, res, next) {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Super Admin password is required to unlock access',
      });
    }

    // Retrieve Super Admin account (root or superadmin role)
    const [rows] = await pool.query(
      `SELECT * FROM users WHERE username = 'root' OR email = 'root' OR role IN ('super_admin', 'superadmin') ORDER BY (username = 'root') DESC, id DESC LIMIT 1`
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Super Admin account not found in database',
      });
    }

    const superUser = rows[0];
    const isMatch = await bcrypt.compare(password, superUser.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect Super Admin password. Access denied.',
      });
    }

    // Generate authenticated Super Admin token
    const secret = process.env.JWT_SECRET || 'mcc_chronicles_super_secret_jwt_key_2026';
    const payload = {
      id: superUser.id,
      username: superUser.username,
      email: superUser.email,
      role: 'superadmin',
      department_id: superUser.department_id,
      portal: 'superadmin',
    };
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });

    logActivity({
      userId: superUser.id,
      action: 'SUPERADMIN_UNLOCK',
      entityType: 'user',
      entityId: superUser.id,
      details: 'Super Admin access unlocked via password verification',
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Super Admin access granted successfully!',
      token,
      user: {
        id: superUser.id,
        name: superUser.name,
        username: superUser.username,
        email: superUser.email,
        role: 'superadmin',
        department_id: superUser.department_id,
        avatar_url: superUser.avatar_url,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Unified Password Change Endpoint (Task: Standardize Passwords)
 * Protected: verifyToken.
 * Accepts { targetRole, currentPassword, newPassword, confirmPassword }
 */
async function changePasswordUnified(req, res, next) {
  try {
    const username = req.body.username || req.body.targetRole;
    const currentPassword = req.body.currentPassword || req.body.existingPassword;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required.',
        error: 'Current password is required.',
      });
    }

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 4 characters long.',
        error: 'New password must be at least 4 characters long.',
      });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match.',
        error: 'New passwords do not match.',
      });
    }

    // Determine target user by username, email, or role
    let targetUser = null;
    const targetIdentifier = (username || '').trim().toLowerCase();

    if (targetIdentifier) {
      const [rows] = await pool.query(
        `SELECT * FROM users 
         WHERE username = ? OR email = ? OR role = ?
            OR (username = 'superadmin' AND ? = 'super_admin')
            OR (username = 'superadmin' AND ? = 'root')
         ORDER BY (username = ?) DESC, id DESC LIMIT 1`,
        [targetIdentifier, targetIdentifier, targetIdentifier, targetIdentifier, targetIdentifier, targetIdentifier]
      );
      if (rows.length > 0) targetUser = rows[0];
    }

    if (!targetUser && req.user?.id) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.id]);
      if (rows.length > 0) targetUser = rows[0];
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user account not found.',
        error: 'Target user account not found.',
      });
    }

    // Verify current password against database hash using bcrypt.compare
    const storedHash = targetUser.password || targetUser.password_hash;
    let isMatch = await bcrypt.compare(currentPassword, storedHash);

    // Initial fallback for default accounts if still using default uncustomized passwords
    if (!isMatch && (targetUser.username === 'superadmin' || targetUser.username === 'admin')) {
      if (currentPassword === 'root') {
        const matchesDefaultSuper = await bcrypt.compare('superadmin', storedHash);
        const matchesDefaultAdmin = await bcrypt.compare('admin', storedHash);
        const matchesDefaultRoot = await bcrypt.compare('root', storedHash);
        if (matchesDefaultSuper || matchesDefaultAdmin || matchesDefaultRoot) isMatch = true;
      } else if (currentPassword === 'superadmin' && targetUser.username === 'superadmin') {
        const matchesDefaultRoot = await bcrypt.compare('root', storedHash);
        if (matchesDefaultRoot) isMatch = true;
      } else if (currentPassword === 'admin' && targetUser.username === 'admin') {
        const matchesDefaultRoot = await bcrypt.compare('root', storedHash);
        if (matchesDefaultRoot) isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
        error: 'Current password is incorrect.',
      });
    }

    // Hash the new password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = ?, password_hash = ? WHERE id = ?',
      [hashedPassword, hashedPassword, targetUser.id]
    );

    logActivity({
      userId: req.user?.id || targetUser.id,
      action: 'PASSWORD_CHANGE',
      entityType: 'user',
      entityId: targetUser.id,
      details: `Password updated for @${targetUser.username} (${targetUser.role})`,
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. Please log in with your new password.',
      data: {
        userId: targetUser.id,
        username: targetUser.username,
        role: targetUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getMe,
  verifySuperAdmin,
  changePasswordUnified,
};
