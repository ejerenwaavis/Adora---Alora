const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  perkStatus: {
    type: String,
    enum: ['pending', 'perk_granted', 'contacted'],
    default: 'pending',
  },
  perkNotes: {
    type: String,
    default: '',
    trim: true,
  },
  source: {
    type: String,
    default: 'coming_soon_page',
    trim: true,
  },
  ipAddress: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Waitlist', waitlistSchema);
