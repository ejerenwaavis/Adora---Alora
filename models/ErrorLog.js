const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['error', 'warn', 'fatal'],
    default: 'error'
  },
  source: {
    type: String,
    default: 'server',
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  stack: {
    type: String,
    default: ''
  },
  method: {
    type: String,
    default: ''
  },
  path: {
    type: String,
    default: ''
  },
  statusCode: {
    type: Number,
    default: 500
  },
  userEmail: {
    type: String,
    default: ''
  },
  userRole: {
    type: String,
    default: ''
  },
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' // Automatically purge developer error logs older than 30 days
  }
});

errorLogSchema.index({ createdAt: -1 });
errorLogSchema.index({ level: 1, createdAt: -1 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);
