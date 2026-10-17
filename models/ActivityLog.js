const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'ARCHIVE', 'LOGIN'],
    required: true
  },
  category: {
    type: String,
    enum: ['SETTINGS', 'EVENTS', 'FASHION', 'MENU', 'CLASSES', 'USERS', 'VENUE', 'AUTH'],
    required: true
  },
  itemAffected: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '90d' // Automatically delete after 90 days
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
