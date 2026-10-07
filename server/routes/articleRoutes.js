const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const commentController = require('../controllers/commentController');
const { verifyToken, requireRole, optionalAuth } = require('../middleware/authMiddleware');

// Public listing with optional user context for previewing drafts
router.get('/', optionalAuth, articleController.getAllArticles);

// Public route for /slug/:slug
router.get('/slug/:slug', optionalAuth, (req, res, next) => {
  req.params.slugOrId = req.params.slug;
  return articleController.getArticleBySlugOrId(req, res, next);
});

// Comments sub-routes on article
router.get('/:id/comments', optionalAuth, (req, res, next) => {
  req.params.articleId = req.params.id;
  return commentController.getCommentsByArticle(req, res, next);
});

router.post('/:id/comments', (req, res, next) => {
  req.body.article_id = req.body.article_id || req.params.id;
  return commentController.createComment(req, res, next);
});

// Protected: retrieve editorial revision history (Super Admin & Editor)
router.get(
  '/:id/revisions',
  verifyToken,
  requireRole('super_admin', 'editor'),
  articleController.getArticleRevisions
);

// Protected: trigger auto-publisher for scheduled articles (Super Admin, Task 95)
router.post(
  '/process-scheduled',
  verifyToken,
  requireRole('super_admin'),
  articleController.processScheduled
);

// Public single article retrieval with optional auth
router.get('/:slugOrId', optionalAuth, articleController.getArticleBySlugOrId);

// Protected: quick status transition (Super Admin, Editor, Author, Task 94 & 96)
router.patch('/:id/status', verifyToken, articleController.updateArticleStatus);

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
