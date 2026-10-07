const express = require('express');
const router = express.Router();
const sitemapController = require('../controllers/sitemapController');

// Public XML Sitemap
router.get('/', sitemapController.getSitemap);
router.get('/sitemap.xml', sitemapController.getSitemap);

module.exports = router;
