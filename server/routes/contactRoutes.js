const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public Reader Submission
router.post('/', contactController.submitContactMessage);

// Protected Editorial / Admin Operations
router.get(
  '/',
  verifyToken,
  requireRole('super_admin', 'editor'),
  contactController.getContactMessages
);

router.get(
  '/:id',
  verifyToken,
  requireRole('super_admin', 'editor'),
  contactController.getContactMessageById
);

router.patch(
  '/:id',
  verifyToken,
  requireRole('super_admin', 'editor'),
  contactController.updateContactMessage
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('super_admin'),
  contactController.deleteContactMessage
);

module.exports = router;
