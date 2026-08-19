const mongoose = require('mongoose');

const cafeReservationSchema = new mongoose.Schema({
  customerName:  { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  customerPhone: { type: String },
  
  date:      { type: Date, required: true },
  time:      { type: String, required: true },
  partySize: { type: Number, required: true },
  
  status: {
    type: String,
    enum: ['confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
    default: 'confirmed',
  },
  
  specialRequests: { type: String },
  clerkNotes:      { type: String },
}, { timestamps: true });

cafeReservationSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('CafeReservation', cafeReservationSchema);
