const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The clerk/admin who did the action
  action: { type: String, required: true }, // e.g., 'class_checkin', 'cafe_seated'
  
  entityModel: { type: String }, // e.g., 'Booking', 'CafeReservation'
  entityId:    { type: mongoose.Schema.Types.ObjectId },
  
  description: { type: String, required: true },
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
