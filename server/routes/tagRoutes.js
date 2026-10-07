const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public route: list all tags with article counts
router.get('/', tagController.getTags);

// Protected route: create a new tag (super_admin, editor)
router.post(
  '/',
  verifyToken,
  requireRole('super_admin', 'editor'),
  tagController.createTag
);

module.exports = router;
