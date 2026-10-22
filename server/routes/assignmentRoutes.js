const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Protected: Get list of assignments (Editorial or assigned to user)
router.get('/', verifyToken, assignmentController.getAssignments);
router.get('/my', verifyToken, assignmentController.getAssignments);

// Protected: Create new assignment (Editors & Super Admin only)
router.post(
  '/',
  verifyToken,
  requireRole('super_admin', 'editor'),
  assignmentController.createAssignment
);

// Protected: Update assignment status (Reporter or Editor)
router.patch('/:id/status', verifyToken, assignmentController.updateAssignmentStatus);

module.exports = router;
