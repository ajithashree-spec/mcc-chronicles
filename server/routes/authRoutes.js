const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Optional token verification middleware (allows both token-based and direct credential verification)
const optionalVerifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const secret = process.env.JWT_SECRET || 'mcc_chronicles_super_secret_jwt_key_2026';
      req.user = jwt.verify(token, secret);
    } catch (err) {
      // Token expired or invalid, proceed to body-based credential verification
    }
  }
  next();
};

// Public login route
router.post('/login', authController.login);

// Verify Super Admin password challenge & grant elevated access
router.post('/verify-superadmin', authController.verifySuperAdmin);

// Protected current user profile route
router.get('/me', verifyToken, authController.getMe);

// Dynamic password change endpoints (accepts PUT and POST)
router.put('/change-password', optionalVerifyToken, authController.changePasswordUnified);
router.post('/change-password', optionalVerifyToken, authController.changePasswordUnified);

module.exports = router;
