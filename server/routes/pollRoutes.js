const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public: fetch the active campus opinion poll with results
router.get('/active', pollController.getActivePoll);

// Public: cast vote on a poll (IP deduplicated)
router.post('/:id/vote', pollController.votePoll);

// Protected: create new poll (super_admin, editor)
router.post(
  '/',
  verifyToken,
  requireRole('super_admin', 'editor'),
  pollController.createPoll
);

module.exports = router;
