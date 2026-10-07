const pool = require('../config/db');
const { logActivity } = require('../utils/logger');

let cronInterval = null;

/**
 * Scans for scheduled articles whose scheduled_at <= NOW()
 * and transitions them to 'published' with published_at = NOW().
 * @returns {Promise<number>} Number of published articles
 */
async function processScheduledArticles() {
  try {
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
    }
    return affectedRows;
  } catch (error) {
    console.error('[CRON ERROR] Error processing scheduled articles:', error.message);
    return 0;
  }
}

/**
 * Initializes background cron schedule runner (checks every 60s).
 */
function initCronScheduler(intervalMs = 60000) {
  if (cronInterval) return;

  // Run initial check
  processScheduledArticles();

  cronInterval = setInterval(() => {
    processScheduledArticles();
  }, intervalMs);

  if (cronInterval.unref) {
    cronInterval.unref();
  }

  console.log('[CRON] Scheduled article auto-publisher engine initialized (polling every 60s)');
}

/**
 * Stops cron timer (useful for clean teardown during test suites)
 */
function stopCronScheduler() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
  }
}

module.exports = {
  initCronScheduler,
  processScheduledArticles,
  stopCronScheduler,
};
