const mongoose = require('mongoose');

// ──────────────────────────────────────────────────────────────────────────────
// Membership tiers: Gold | Platinum | Diamond
//
// IMPORTANT: isActive and isPublic are FALSE on ALL plans at creation.
// Membership purchase UI does NOT ship at launch.
// These models exist now so Phase 16 (post-launch) requires ZERO schema migration.
// ──────────────────────────────────────────────────────────────────────────────
const membershipPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Gold', 'Platinum', 'Diamond'],
    trim: true,
  },
  slug:      { type: String, required: true, unique: true, lowercase: true },
  tagline:   { type: String },
  description:{ type: String },

  // ── Pricing (kobo) ──
  monthlyPriceKobo: { type: Number, required: true },
  annualPriceKobo:  { type: Number },

  // ── Perks ──
  classCreditsPerMonth: { type: Number },  // null = unlimited
  guestPassesPerMonth:  { type: Number, default: 0 },
  venueHireDiscount:    { type: Number, default: 0 },  // percentage
  cafeDiscount:         { type: Number, default: 0 },  // percentage
  priorityBooking:      { type: Boolean, default: false },
  inclusions:           [{ type: String }],  // human-readable perk list

  // ── Visibility — stays false until post-launch greenlight ──
  isActive:  { type: Boolean, default: false },
  isPublic:  { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
