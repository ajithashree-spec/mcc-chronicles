const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');

// Public News Syndication Endpoints
router.get('/rss', feedController.getRSSFeed);
router.get('/atom', feedController.getAtomFeed);

module.exports = router;
