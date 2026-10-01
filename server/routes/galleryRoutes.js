const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public Routes
router.get('/', galleryController.getPublicGalleries);
router.get('/:id', galleryController.getGalleryById);

// Protected Routes
router.post(
  '/',
  verifyToken,
  requireRole('super_admin', 'editor', 'reporter'),
  galleryController.createGalleryItem
);

router.put(
  '/:id',
  verifyToken,
  requireRole('super_admin', 'editor'),
  galleryController.updateGalleryItem
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('super_admin', 'editor'),
  galleryController.deleteGalleryItem
);

module.exports = router;
