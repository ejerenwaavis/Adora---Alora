const mongoose = require('mongoose');

const waiverVersionSchema = new mongoose.Schema({
  version:     { type: String, required: true, unique: true, trim: true }, // e.g. "2026-09"
  title:       { type: String, required: true, trim: true },
  content:     { type: String, required: true },   // full waiver text in HTML
  isActive:    { type: Boolean, default: true },   // only one active at a time
  publishedAt: { type: Date, default: Date.now },
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Only one waiver version can be active at a time
waiverVersionSchema.pre('save', async function(next) {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  if (typeof next === 'function') next();
});

module.exports = mongoose.model('WaiverVersion', waiverVersionSchema);
