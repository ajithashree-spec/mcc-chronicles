const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Authenticated user profile & security (Task 89)
// Note: /profile and /change-password MUST precede /:id routes
router.put('/profile', verifyToken, userController.updateProfile);
router.put('/change-password', verifyToken, userController.changePassword);

// Super Admin staff listing (Task 90)
router.get('/', verifyToken, requireRole('super_admin'), userController.getAllUsers);

// Staff creation (super_admin only, Task 90)
router.post('/', verifyToken, requireRole('super_admin'), userController.createUser);

// Profile lookup (self or super_admin)
router.get('/:id', verifyToken, userController.getUserById);

// Staff update (super_admin or self)
router.put('/:id', verifyToken, requireRole('super_admin'), userController.updateUser);

// Staff deletion (super_admin only, Task 90)
router.delete('/:id', verifyToken, requireRole('super_admin'), userController.deleteUser);

// Account activation toggle (super_admin only)
router.patch(
  '/:id/status',
  verifyToken,
  requireRole('super_admin'),
  userController.toggleUserStatus
);

module.exports = router;
