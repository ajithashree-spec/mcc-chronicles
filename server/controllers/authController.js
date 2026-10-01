const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Handle user login, password validation, and JWT generation.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const [rows] = await pool.query(
      `SELECT 
         u.id, 
         u.name, 
         u.email, 
         u.password_hash, 
         u.role, 
         u.department_id, 
         d.name AS department_name, 
         u.is_active
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
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
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'mcc_chronicles_super_secret_jwt_key_2026';
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
    };

    const token = jwt.sign(payload, secret, { expiresIn: '24h' });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        department_name: user.department_name,
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

module.exports = {
  login,
  getMe,
};
