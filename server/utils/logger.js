const pool = require('../config/db');

/**
 * Extracts the client IP address from the Express request object.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extractIp(req) {
  if (!req) return null;
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    const firstIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
    if (firstIp) return firstIp.slice(0, 45);
  }
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
  if (!ip) return null;

  // Clean up IPv6 IPv4-mapped address e.g. ::ffff:127.0.0.1 -> 127.0.0.1
  const cleanIp = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  return cleanIp.slice(0, 45);
}

/**
 * Log an activity to the activity_logs table asynchronously.
 * Designed not to crash or block the calling request handler.
 *
 * @param {Object} params
 * @param {number|null} [params.userId] - User ID performing the action
 * @param {number|null} [params.user_id] - Snake_case alias for userId
 * @param {string} params.action - Action identifier (e.g. 'LOGIN', 'ARTICLE_PUBLISH')
 * @param {string|null} [params.entityType] - Entity type (e.g. 'article', 'user')
 * @param {string|null} [params.entity_type] - Snake_case alias for entityType
 * @param {number|null} [params.entityId] - ID of the target entity
 * @param {number|null} [params.entity_id] - Snake_case alias for entityId
 * @param {any} [params.details] - JSON object, array, or string details
 * @param {import('express').Request} [params.req] - Express request object for IP and fallback user
 * @param {string} [params.ipAddress] - Explicit IP override
 * @returns {Promise<any>}
 */
function logActivity({
  userId,
  user_id,
  action,
  entityType,
  entity_type,
  entityId,
  entity_id,
  details,
  req,
  ipAddress,
  ip_address,
} = {}) {
  // Return promise so caller may optionally await, but internal catch prevents unhandled rejection
  return (async () => {
    let finalUserId = null;
    let finalAction = 'UNKNOWN';
    let finalEntityType = null;
    let finalEntityId = null;
    let finalDetails = null;
    let finalIp = null;

    try {
      finalUserId = userId !== undefined ? userId : (user_id !== undefined ? user_id : (req?.user?.id || null));
      finalAction = action ? String(action).trim().toUpperCase() : 'UNKNOWN';
      finalEntityType = entityType || entity_type || null;
      finalEntityId = entityId !== undefined ? entityId : (entity_id !== undefined ? entity_id : null);

      if (details !== undefined && details !== null) {
        if (typeof details === 'object') {
          try {
            finalDetails = JSON.stringify(details);
          } catch {
            finalDetails = String(details);
          }
        } else {
          finalDetails = String(details);
        }
      }

      finalIp = ipAddress || ip_address || extractIp(req);

      const [result] = await pool.query(
        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [finalUserId, finalAction, finalEntityType, finalEntityId, finalDetails, finalIp]
      );

      return result;
    } catch (error) {
      // If foreign key fails because user_id does not exist in users table (e.g. synthetic test token), retry with NULL
      if ((error.errno === 1452 || error.code === 'ER_NO_REFERENCED_ROW_2') && finalUserId) {
        try {
          const fallbackDetails = finalDetails ? `${finalDetails} (unreferenced_user_id: ${finalUserId})` : `(unreferenced_user_id: ${finalUserId})`;
          const [retryResult] = await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [null, finalAction, finalEntityType, finalEntityId, fallbackDetails, finalIp]
          );
          return retryResult;
        } catch (retryError) {
          console.error('[ACTIVITY_LOGGER_ERROR]: Retry failed:', retryError.message);
        }
      }
      console.error('[ACTIVITY_LOGGER_ERROR]: Failed to record activity log:', error.message);
      return null;
    }
  })();
}

module.exports = {
  logActivity,
  extractIp,
};
