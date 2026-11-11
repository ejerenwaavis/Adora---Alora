const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: false,
    default: 'OPERATIONS',
    trim: true
  },
  itemAffected: {
    type: String,
    required: false,
    default: 'System Record',
    trim: true
  },
  description: {
    type: String,
    required: false,
    default: '',
    trim: true
  },
  entityModel: {
    type: String,
    required: false,
    default: '',
    trim: true
  },
  entityId: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: null
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

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
