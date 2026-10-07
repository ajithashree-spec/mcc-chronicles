const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const { verifyToken } = require('../middleware/authMiddleware');

// Protected: Get user's cloud bookmarks
router.get('/', verifyToken, bookmarkController.getUserBookmarks);

// Protected: Toggle bookmark for an article
router.post('/toggle', verifyToken, bookmarkController.toggleBookmark);
router.post('/', verifyToken, bookmarkController.toggleBookmark);

module.exports = router;
