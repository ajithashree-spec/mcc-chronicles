const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public login route
router.post('/login', authController.login);

// Protected current user profile route
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
