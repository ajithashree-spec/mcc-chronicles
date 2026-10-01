const express = require('express');
const router = express.Router();
const circularController = require('../controllers/circularController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public Routes
router.get('/', circularController.getPublicCirculars);
router.get('/:id', circularController.getCircularById);

// Protected Routes (Super Admin & Editor)
router.post(
  '/',
  verifyToken,
  requireRole('super_admin', 'editor'),
  circularController.createCircular
);

router.put(
  '/:id',
  verifyToken,
  requireRole('super_admin', 'editor'),
  circularController.updateCircular
);

// Protected Route (Super Admin only for deletions)
router.delete(
  '/:id',
  verifyToken,
  requireRole('super_admin'),
  circularController.deleteCircular
);

module.exports = router;
