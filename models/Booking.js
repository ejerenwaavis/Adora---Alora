const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: true },
  classSession: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', required: true },

  status: {
    type: String,
    enum: ['confirmed', 'waitlisted', 'cancelled', 'no_show', 'attended', 'promoted'],
    default: 'confirmed',
  },

  // ── Payment ──
  paymentMethod: { type: String, enum: ['paystack', 'credit', 'cash', 'complimentary'] },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed', 'refunded'],
    default: 'pending',
  },
  paystackReference: { type: String, index: true },
  amountPaidKobo:    { type: Number },
  creditsUsed:       { type: Number, default: 0 },

  // ── Waitlist ──
  waitlistPosition:   { type: Number },       // set when status = 'waitlisted'
  promotedAt:         { type: Date },         // when promoted from waitlist → confirmed
  promotionExpiresAt: { type: Date },         // deadline to confirm after promotion

  // ── Cancellation ──
  cancelledAt:        { type: Date },
  cancellationReason: { type: String },
  cancelledByAdmin:   { type: Boolean, default: false },

  // ── Calendar ──
  calendarAddedGoogle: { type: Boolean, default: false },
  calendarAddedIcal:   { type: Boolean, default: false },

  // ── Check-in (clerk) ──
  checkedInAt: { type: Date },
  checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // clerk user
}, { timestamps: true });

bookingSchema.index({ user: 1, classSession: 1 }, { unique: true });
bookingSchema.index({ classSession: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
