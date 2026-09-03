const mongoose = require('mongoose');

const waiverRecordSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  waiverVersion: { type: String, required: true },
  waiverText:    { type: String, required: true },  // snapshot of exact text signed
  signedAt:      { type: Date, default: Date.now },
  ipAddress:     { type: String, required: true },
  userAgent:     { type: String },
  method:        { type: String, default: 'electronic' },
  memberName:    { type: String },   // denormalised for legal readability
  memberEmail:   { type: String },   // denormalised for legal readability
}, { timestamps: false });

module.exports = mongoose.model('WaiverRecord', waiverRecordSchema);
