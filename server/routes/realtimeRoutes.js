const express = require('express');
const router = express.Router();
const sseService = require('../services/sseService');

/**
 * Public SSE endpoint for real-time broadsheet dispatches and circular alerts.
 * GET /api/realtime/stream
 */
router.get('/stream', (req, res) => {
  sseService.addClient(req, res);
});

/**
 * Diagnostic status endpoint for connection health.
 * GET /api/realtime/status
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    activeClients: sseService.getClientCount(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Development / test broadcast trigger.
 * POST /api/realtime/test-broadcast
 */
router.post('/test-broadcast', (req, res) => {
  const { event = 'dispatch:published', data } = req.body;
  const payload = data || {
    id: 999,
    title: 'Test Live Dispatch Broadcast',
    slug: 'test-live-dispatch-broadcast',
    category: 'Breaking News',
    published_at: new Date().toISOString(),
  };

  sseService.broadcast(event, payload);

  res.status(200).json({
    success: true,
    message: 'Broadcast dispatched to active listeners',
    event,
    recipients: sseService.getClientCount(),
  });
});

module.exports = router;
