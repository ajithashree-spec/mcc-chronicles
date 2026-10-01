const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Public cross-resource search
router.get('/', searchController.globalSearch);

module.exports = router;
