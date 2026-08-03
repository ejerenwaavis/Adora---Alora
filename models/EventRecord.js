const mongoose = require('mongoose');

// ──────────────────────────────────────────────────────────────────────────────
// CRITICAL RULE (non-negotiable, enforced at schema level):
//
//   Every event record MUST have:
//     - organiser:           who is running the event (e.g. "Adora & Alora",
//                            "The Becoming Network", or any partner name)
//     - bookingDestination:  'internal'     → Adora & Alora handles checkout
//                            'external_url' → user is sent to partner's own site
//
//   TBN events MUST use external_url. They never touch Adora & Alora checkout
//   or branding. This is enforced in the pre-save hook below.
// ──────────────────────────────────────────────────────────────────────────────
const eventRecordSchema = new mongoose.Schema({
  title:            { type: String, required: true, trim: true },
  slug:             { type: String, required: true, unique: true, lowercase: true },
  description:      { type: String },
  shortDescription: { type: String },
  coverImage:       { type: String },

  // ── Organiser / booking split ──
  organiser:           { type: String, required: true },
  bookingDestination:  { type: String, enum: ['internal', 'external_url'], required: true },
  externalUrl:         { type: String },  // required when bookingDestination = 'external_url'
  externalOrganizerCta:{ type: String },  // CTA label, e.g. "Register with The Becoming Network"

  // ── Schedule ──
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  location:    { type: String },
  venueSpace:  { type: mongoose.Schema.Types.ObjectId, ref: 'VenueSpace' },

  // ── Ticketing (internal events only) ──
  capacity:      { type: Number },
  ticketsSold:   { type: Number, default: 0 },
  priceKobo:     { type: Number, default: 0 },
  isFree:        { type: Boolean, default: false },

  // ── Status ──
  status: {
    type: String,
    enum: ['draft', 'published', 'sold_out', 'postponed', 'cancelled', 'completed'],
    default: 'draft',
  },
  isFeatured:  { type: Boolean, default: false },
  tags:        [{ type: String }],
  publishedAt: { type: Date },
}, { timestamps: true });

// Enforce: externalUrl required when bookingDestination = 'external_url'
eventRecordSchema.pre('save', function (next) {
  if (this.bookingDestination === 'external_url' && !this.externalUrl) {
    return next(new Error(
      'EventRecord: externalUrl is required when bookingDestination is external_url. ' +
      'TBN and partner events must route to their own registration — never to A&A checkout.'
    ));
  }
  next();
});

eventRecordSchema.index({ startDate: 1, status: 1 });
eventRecordSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('EventRecord', eventRecordSchema);
