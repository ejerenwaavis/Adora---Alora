const mongoose = require('mongoose');

const announcementBarSchema = new mongoose.Schema({
  message:         { type: String, required: true },
  linkText:        { type: String },
  linkUrl:         { type: String },
  isActive:        { type: Boolean, default: true },
  // Optional date range — if not set, shows while isActive = true
  startsAt:        { type: Date },
  endsAt:          { type: Date },
  // Style overrides (uses design token variable names or hex)
  backgroundColor: { type: String, default: 'var(--rust)' },
  textColor:       { type: String, default: 'var(--cream)' },
  sortOrder:       { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('AnnouncementBar', announcementBarSchema);
