const mongoose = require('mongoose');

const venueEnquirySchema = new mongoose.Schema({
  // ── Contact ──
  firstName:    { type: String, required: true, trim: true },
  lastName:     { type: String, required: true, trim: true },
  email:        { type: String, required: true, lowercase: true, trim: true },
  phone:        { type: String },
  organisation: { type: String },

  // ── Event details ──
  eventType:         { type: String, required: true },
  preferredDate:     { type: Date, required: true },
  alternativeDate:   { type: Date },
  preferredStartTime:{ type: String },
  preferredEndTime:  { type: String },
  guestCount:        { type: Number, required: true },
  spacePreference: {
    type: String,
    enum: ['loft', 'cafe', 'not_sure'],
    required: true,
  },
  seatingStyle:     { type: String },
  cateringRequired: { type: Boolean, default: false },
  avRequired:       { type: Boolean, default: false },
  description:      { type: String },

  // ── Admin pipeline ──
  status: {
    type: String,
    enum: ['new', 'viewed', 'quoted', 'confirmed', 'declined'],
    default: 'new',
  },
  adminNotes:  { type: String },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  quotedAt:    { type: Date },
  confirmedAt: { type: Date },

  // ── Source tracking ──
  source: { type: String, default: 'website' },
}, { timestamps: true });

venueEnquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('VenueEnquiry', venueEnquirySchema);
