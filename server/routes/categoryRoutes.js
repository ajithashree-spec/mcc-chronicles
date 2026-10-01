const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public Routes
router.get('/', categoryController.getAllCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

// Protected Routes (Super Admin & Editor)
router.post(
  '/',
  verifyToken,
  requireRole('super_admin', 'editor'),
  categoryController.createCategory
);

router.put(
  '/:id',
  verifyToken,
  requireRole('super_admin', 'editor'),
  categoryController.updateCategory
);

// Protected Route (Super Admin only for deletions)
router.delete(
  '/:id',
  verifyToken,
  requireRole('super_admin'),
  categoryController.deleteCategory
);

module.exports = router;
