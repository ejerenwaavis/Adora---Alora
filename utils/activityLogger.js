const ActivityLog = require('../models/ActivityLog');

/**
 * Logs an administrative action to the database.
 * @param {ObjectId|String} userId - The ID of the user performing the action
 * @param {String} action - e.g., 'CREATE', 'UPDATE', 'DELETE'
 * @param {String} category - e.g., 'SETTINGS', 'EVENTS', 'FASHION'
 * @param {String} itemAffected - Name or title of the item changed
 * @param {Object} [details] - Optional JSON object with specifics
 */
async function logActivity(userId, action, category, itemAffected, details = null) {
  try {
    if (!userId) return; // Silent skip if no user context
    await ActivityLog.create({
      user: userId,
      action,
      category,
      itemAffected,
      details
    });
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}

module.exports = logActivity;
