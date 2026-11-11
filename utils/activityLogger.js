const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const { logError } = require('./errorLogger');

/**
 * Centralized non-blocking activity logger.
 * Accepts either:
 *   logActivity({ req, action, category, itemAffected, description, entityModel, entityId, details })
 * or legacy positional arguments:
 *   logActivity(userId, action, category, itemAffected, details)
 */
async function logActivityEntry({
  req = null,
  user = null,
  performedBy = null,
  action,
  category = 'general',
  itemAffected = '',
  description = '',
  entityModel = '',
  entityId = null,
  details = null
} = {}) {
  try {
    const safeAction = action ? String(action).trim() : '';
    if (!safeAction) return null;

    const performerId =
      performedBy ||
      user ||
      req?.user?._id ||
      req?.user?.id ||
      null;

    const detailsSummary =
      typeof details === 'string'
        ? details.trim()
        : details && typeof details === 'object' && details.summary
          ? String(details.summary).trim()
          : '';

    const cleanDescription =
      (description && String(description).trim()) ||
      detailsSummary ||
      '';

    const cleanItemAffected =
      (itemAffected && String(itemAffected).trim()) ||
      cleanDescription ||
      (entityModel ? `${entityModel}${entityId ? ` #${entityId}` : ''}` : 'System Record');

    const normalizedDetails =
      typeof details === 'string' ? { summary: details } : details;

    return await ActivityLog.create({
      user: performerId,
      performedBy: performerId,
      action: safeAction,
      category: (category && String(category).trim()) || 'general',
      itemAffected: cleanItemAffected,
      description: cleanDescription || cleanItemAffected,
      entityModel: (entityModel && String(entityModel).trim()) || '',
      entityId: entityId || null,
      details: normalizedDetails || null
    });
  } catch (err) {
    console.error(`[ActivityLog Warning] Failed to log ${action}:`, err.message);
    logError({
      level: 'warn',
      source: 'activity_logger',
      message: `ActivityLog write failed for action "${action}": ${err.message}`,
      error: err,
      context: { action, category, itemAffected, entityModel, entityId }
    }).catch(() => {});
    return null;
  }
}

async function logActivity(userOrPayload, action, category, itemAffected, details = null) {
  if (
    userOrPayload &&
    typeof userOrPayload === 'object' &&
    !mongoose.Types.ObjectId.isValid(userOrPayload) &&
    (userOrPayload.action || userOrPayload.req || userOrPayload.performedBy)
  ) {
    return logActivityEntry(userOrPayload);
  }

  return logActivityEntry({
    user: userOrPayload || null,
    performedBy: userOrPayload || null,
    action,
    category: category || 'general',
    itemAffected: itemAffected || 'System Record',
    description:
      typeof details === 'string'
        ? details
        : (itemAffected || ''),
    details
  });
}

logActivity.entry = logActivityEntry;
module.exports = logActivity;
