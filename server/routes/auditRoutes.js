const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

/**
 * Audit routes - Protected strictly for super_admin.
 */

// GET /api/audit - List audit logs with filters and pagination
router.get('/', verifyToken, requireRole('super_admin'), auditController.getAuditLogs);

// GET /api/audit/:id - Retrieve single audit log by ID
router.get('/:id', verifyToken, requireRole('super_admin'), auditController.getAuditLogById);

module.exports = router;
