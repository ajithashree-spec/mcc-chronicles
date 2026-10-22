const pool = require('../config/db');
const { logActivity } = require('../utils/logger');
const sseService = require('./sseService');

let cronInterval = null;

/**
 * Scans for scheduled articles whose scheduled_at <= NOW()
 * and transitions them to 'published' with published_at = NOW().
 * @returns {Promise<number>} Number of published articles
 */
async function processScheduledArticles() {
  try {
    // Retrieve articles about to be published so we have metadata for SSE broadcast
    const [dueArticles] = await pool.query(
      `SELECT id, title, slug, cover_image, scheduled_at 
       FROM articles 
       WHERE status = 'scheduled' AND scheduled_at <= NOW()`
    );

    const [result] = await pool.query(
      `UPDATE articles 
       SET status = 'published', published_at = NOW() 
       WHERE status = 'scheduled' AND scheduled_at <= NOW()`
    );

    const affectedRows = result.affectedRows || 0;
    if (affectedRows > 0) {
      console.log(`[CRON] Auto-published ${affectedRows} scheduled articles`);
      logActivity({
        userId: null,
        action: 'ARTICLE_AUTO_PUBLISH',
        entityType: 'article',
        entityId: null,
        details: `Auto-published ${affectedRows} scheduled dispatches`,
      });

      // Broadcast published dispatches via SSE
      for (const art of dueArticles) {
        try {
          sseService.broadcast('dispatch:published', {
            id: art.id,
            title: art.title,
            slug: art.slug,
            category: 'Campus Gazette',
            published_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('[CRON] Failed to broadcast dispatch via SSE:', e.message);
        }
      }
    }
    return affectedRows;
  } catch (error) {
    console.error('[CRON ERROR] Error processing scheduled articles:', error.message);
    return 0;
  }
}

/**
 * Prunes activity logs older than a given number of days (default 90 days).
 * Task 118: Database Log Maintenance Cron.
 * @param {number} days - Threshold age in days
 * @returns {Promise<number>} Number of pruned rows
 */
async function pruneOldActivityLogs(days = 90) {
  try {
    const [result] = await pool.query(
      `DELETE FROM activity_logs 
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    const deletedCount = result.affectedRows || 0;
    if (deletedCount > 0) {
      console.log(`[CRON] Pruned ${deletedCount} activity logs older than ${days} days`);
      logActivity({
        userId: null,
        action: 'LOGS_PRUNED',
        entityType: 'system',
        entityId: null,
        details: `Pruned ${deletedCount} activity log rows older than ${days} days`,
      });
    }
    return deletedCount;
  } catch (error) {
    console.error('[CRON ERROR] Error pruning old activity logs:', error.message);
    return 0;
  }
}

let logPruneInterval = null;

/**
 * Initializes background cron schedule runner (checks every 60s for publishing, daily for logs).
 */
function initCronScheduler(intervalMs = 60000) {
  if (cronInterval) return;

  // Run initial checks
  processScheduledArticles();
  pruneOldActivityLogs(90);

  cronInterval = setInterval(() => {
    processScheduledArticles();
  }, intervalMs);

  // Daily log cleanup interval (every 24 hours)
  const dailyMs = 24 * 60 * 60 * 1000;
  logPruneInterval = setInterval(() => {
    pruneOldActivityLogs(90);
  }, dailyMs);

  if (cronInterval.unref) {
    cronInterval.unref();
  }
  if (logPruneInterval.unref) {
    logPruneInterval.unref();
  }

  console.log('[CRON] Scheduled article auto-publisher & daily log maintenance engine initialized');
}

/**
 * Stops cron timers (useful for clean teardown during test suites)
 */
function stopCronScheduler() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
  }
  if (logPruneInterval) {
    clearInterval(logPruneInterval);
    logPruneInterval = null;
  }
}

module.exports = {
  initCronScheduler,
  processScheduledArticles,
  pruneOldActivityLogs,
  stopCronScheduler,
};
