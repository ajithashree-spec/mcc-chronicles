const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Protected dashboard analytics route (accessible to all editorial and staff roles)
router.get(
  '/dashboard',
  verifyToken,
  requireRole('super_admin', 'editor', 'reporter', 'faculty'),
  analyticsController.getDashboardStats
);

module.exports = router;
