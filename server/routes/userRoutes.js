const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Super Admin staff listing
router.get('/', verifyToken, requireRole('super_admin'), userController.getAllUsers);

// Profile lookup (self or super_admin)
router.get('/:id', verifyToken, userController.getUserById);

// Staff creation (super_admin only)
router.post('/', verifyToken, requireRole('super_admin'), userController.createUser);

// Profile update (self for bio/name, super_admin for all)
router.put('/:id', verifyToken, userController.updateUser);

// Account activation toggle (super_admin only)
router.patch(
  '/:id/status',
  verifyToken,
  requireRole('super_admin'),
  userController.toggleUserStatus
);

module.exports = router;
