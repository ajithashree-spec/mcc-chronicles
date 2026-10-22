const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const sseService = require('../services/sseService');

/**
 * Enhanced Health Probe & Diagnostics Endpoint (Task 136).
 * Returns server uptime, memory usage, MySQL connection status, active SSE connections, and API version.
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = null;

  try {
    const [rows] = await pool.query('SELECT 1 as alive');
    if (rows && rows.length > 0) {
      dbStatus = 'connected';
      dbLatencyMs = Date.now() - startTime;
    }
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }

  const mem = process.memoryUsage();
  const formatMb = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';

  const isHealthy = dbStatus === 'connected';

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'The MCC Chronicles API Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'production',
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    memoryUsage: {
      rss: formatMb(mem.rss),
      heapTotal: formatMb(mem.heapTotal),
      heapUsed: formatMb(mem.heapUsed),
      external: formatMb(mem.external),
    },
    realtime: {
      activeSseClients: sseService.getClientCount(),
    },
  });
});

module.exports = router;
