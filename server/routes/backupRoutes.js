const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

/**
 * Backup and Export routes
 */

// GET /api/backup/export/json - Full database JSON backup (super_admin only)
router.get(
  '/export/json',
  verifyToken,
  requireRole('super_admin'),
  backupController.exportDataJSON
);

// GET /api/backup/export/articles/csv - Articles CSV export (super_admin, editor)
router.get(
  '/export/articles/csv',
  verifyToken,
  requireRole('super_admin', 'editor'),
  backupController.exportArticlesCSV
);

module.exports = router;
