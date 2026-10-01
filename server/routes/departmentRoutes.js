const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public Routes
router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);

// Protected Routes (Super Admin only)
router.post(
  '/',
  verifyToken,
  requireRole('super_admin'),
  departmentController.createDepartment
);

router.put(
  '/:id',
  verifyToken,
  requireRole('super_admin'),
  departmentController.updateDepartment
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('super_admin'),
  departmentController.deleteDepartment
);

module.exports = router;
