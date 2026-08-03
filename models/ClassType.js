const mongoose = require('mongoose');

// A class TYPE is the template — e.g. "Reformer Pilates", "Mat Pilates"
// Actual scheduled sessions use ClassSession (which references this)
const classTypeSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  slug:             { type: String, required: true, unique: true, lowercase: true },
  description:      { type: String },
  shortDescription: { type: String },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all-levels'],
    default: 'all-levels',
  },
  durationMinutes:  { type: Number, required: true },
  maxCapacity:      { type: Number, required: true },
  equipment:        [{ type: String }],     // e.g. ["Reformer", "Mat", "Ring"]
  coverImage:       { type: String },
  isActive:         { type: Boolean, default: true },
  sortOrder:        { type: Number, default: 0 },
  // Pricing (kobo — Paystack uses smallest currency unit, ₦1 = 100 kobo)
  singleClassPriceKobo: { type: Number },
  creditCost:       { type: Number, default: 1 }, // credits deducted per booking
}, { timestamps: true });

module.exports = mongoose.model('ClassType', classTypeSchema);
