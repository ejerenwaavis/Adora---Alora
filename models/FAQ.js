const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question:  { type: String, required: true, trim: true },
  answer:    { type: String, required: true },
  category:  { type: String },   // "Booking", "Classes", "Café", "Venue Hire", "General"
  // Which pages to display this FAQ on — multiple pages can share the same FAQ
  pages:     [{ type: String }], // e.g. ["visit", "movement", "venue-hire"]
  sortOrder: { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('FAQ', faqSchema);
