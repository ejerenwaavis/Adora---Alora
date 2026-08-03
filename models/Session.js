const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refreshToken: { type: String, required: true, unique: true },
  userAgent:    { type: String },
  ipAddress:    { type: String },
  expiresAt:    { type: Date, required: true },
  isRevoked:    { type: Boolean, default: false },
}, { timestamps: true });

// Auto-delete expired sessions via MongoDB TTL index
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1 });

module.exports = mongoose.model('Session', sessionSchema);
