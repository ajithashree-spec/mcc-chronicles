const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { verifyToken, requireRole, optionalAuth } = require('../middleware/authMiddleware');

// Public listing with optional user context for previewing drafts
router.get('/', optionalAuth, articleController.getAllArticles);

// Public single article retrieval with optional auth
router.get('/:slugOrId', optionalAuth, articleController.getArticleBySlugOrId);

// Protected: create article (Staff)
router.post(
  '/',
  verifyToken,
  requireRole('super_admin', 'editor', 'reporter', 'faculty'),
  articleController.createArticle
);

// Protected: update article (Super Admin, Editor, or Author)
router.put('/:id', verifyToken, articleController.updateArticle);

// Protected: delete article (Super Admin & Editor)
router.delete(
  '/:id',
  verifyToken,
  requireRole('super_admin', 'editor'),
  articleController.deleteArticle
);

module.exports = router;
