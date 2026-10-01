const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken, requireRole, optionalAuth } = require('../middleware/authMiddleware');

// Public route to fetch approved comments (or all for editors with token)
router.get('/article/:articleId', optionalAuth, commentController.getCommentsByArticle);

// Public route to submit a reader comment
router.post('/', commentController.createComment);

// Protected routes (Super Admin & Editor)
router.patch(
  '/:id/status',
  verifyToken,
  requireRole('super_admin', 'editor'),
  commentController.updateCommentStatus
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('super_admin', 'editor'),
  commentController.deleteComment
);

module.exports = router;
