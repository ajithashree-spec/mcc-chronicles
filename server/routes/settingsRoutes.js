const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// 1. DYNAMIC PAGE CONTENT ENDPOINTS (Task Specification)
// Public route to fetch all live page content keys in a single payload
router.get('/public', settingsController.getPageSettings);

// Protected bulk update for live page content (Super Admin only)
router.put(
  '/bulk',
  verifyToken,
  requireRole('super_admin'),
  settingsController.updatePageSettingsBulk
);

// Protected image upload for slideshow, crest, or header seal
router.post(
  '/upload',
  verifyToken,
  requireRole('super_admin'),
  upload.single('image'),
  settingsController.uploadSettingMedia
);

// 2. LEGACY / UTILITY ROUTES (Backward Compatibility)
router.get('/', settingsController.getPublicSettings);
router.get('/:key', settingsController.getSettingByKey);
router.put(
  '/',
  verifyToken,
  requireRole('super_admin'),
  settingsController.updateSettings
);

module.exports = router;
