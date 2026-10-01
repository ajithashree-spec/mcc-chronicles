const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public route to retrieve all site settings as dictionary
router.get('/', settingsController.getPublicSettings);

// Public route to retrieve a specific setting
router.get('/:key', settingsController.getSettingByKey);

// Protected route to update site settings (Super Admin only)
router.put(
  '/',
  verifyToken,
  requireRole('super_admin'),
  settingsController.updateSettings
);

module.exports = router;
