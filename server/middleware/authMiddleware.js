const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token from Authorization header.
 * Attaches decoded user payload ({ id, email, role, department_id }) to req.user.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied: No token provided or token malformed',
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'mcc_chronicles_super_secret_jwt_key_2026';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({
          success: false,
          error: 'Token expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token',
      });
    }

    req.user = decoded;
    next();
  });
}

/**
 * Middleware factory for role-based access control.
 * @param {...string} roles - Allowed roles (e.g., 'super_admin', 'editor', 'reporter', 'faculty')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const userRole = req.user.role;

    // Super Admin has master governance access across all administrative endpoints
    if (userRole === 'superadmin' || userRole === 'super_admin') {
      return next();
    }

    // Normalize roles to support both 'admin' and 'editor' as editorial desk handles
    const normalizedAllowed = roles.flatMap((r) => {
      if (r === 'editor' || r === 'admin') return ['editor', 'admin'];
      if (r === 'super_admin' || r === 'superadmin') return ['super_admin', 'superadmin'];
      return [r];
    });

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to access this resource',
      });
    }

    next();
  };
}

/**
 * Optional authentication middleware.
 * If token is present and valid, attaches req.user; otherwise continues as anonymous guest.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'mcc_chronicles_super_secret_jwt_key_2026';

  jwt.verify(token, secret, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded;
    }
    next();
  });
}

module.exports = {
  verifyToken,
  requireRole,
  optionalAuth,
};
