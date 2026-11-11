const ActivityLog = require('../models/ActivityLog');
const { logError } = require('./errorLogger');

/**
 * Non-blocking helper to record an administrative or clerk action using a payload object.
 * Guarantees logging never throws or crashes the parent API response.
 */
async function logActivityEntry({
  user = null,
  action,
  category = 'OPERATIONS',
  itemAffected = '',
  description = '',
  entityModel = '',
  entityId = null,
  details = null
} = {}) {
  try {
    if (!action) return null;

    const cleanDescription = (description && String(description).trim()) || '';
    const cleanItemAffected =
      (itemAffected && String(itemAffected).trim()) ||
      cleanDescription ||
      (entityModel ? `${entityModel}${entityId ? ` #${entityId}` : ''}` : 'System Record');

    return await ActivityLog.create({
      user: user || null,
      action: String(action).trim(),
      category: (category && String(category).trim()) || 'OPERATIONS',
      itemAffected: cleanItemAffected,
      description: cleanDescription || cleanItemAffected,
      entityModel: (entityModel && String(entityModel).trim()) || '',
      entityId: entityId || null,
      details
    });
  } catch (err) {
    console.error('Failed to write activity log:', err);
    logError({
      level: 'warn',
      source: 'activity_logger',
      message: `ActivityLog write failed for action "${action}": ${err.message}`,
      error: err,
      context: { user, action, category, itemAffected, entityModel, entityId }
    }).catch(() => {});
    return null;
  }
}

/**
 * Legacy positional helper signature preserved for CMS / User routes.
 * @param {ObjectId|String} userId
 * @param {String} action
 * @param {String} category
 * @param {String} itemAffected
 * @param {Object} [details]
 */
async function logActivity(userId, action, category, itemAffected, details = null) {
  if (!userId) return null;
  return logActivityEntry({
    user: userId,
    action,
    category: category || 'OPERATIONS',
    itemAffected: itemAffected || 'System Record',
    description: itemAffected || '',
    details
  });
}

logActivity.entry = logActivityEntry;
module.exports = logActivity;
