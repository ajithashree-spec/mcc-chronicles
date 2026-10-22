const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriberController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public Subscription & Unsubscription Endpoints
router.post('/', subscriberController.subscribe);
router.get('/unsubscribe/:token', subscriberController.unsubscribe);

// Protected Admin/Editor Management Endpoints
router.get(
  '/',
  verifyToken,
  requireRole('super_admin', 'editor'),
  subscriberController.getSubscribers
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('super_admin'),
  subscriberController.deleteSubscriber
);

// Protected: Dispatch Morning Quadrangle Digest (Task 105)
router.post(
  '/dispatch-digest',
  verifyToken,
  requireRole('super_admin', 'editor'),
  subscriberController.dispatchDigest
);

module.exports = router;
