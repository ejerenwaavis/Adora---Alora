const mongoose = require('mongoose');

const eventBookingSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'EventRecord', required: true },
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional if guest checkout is allowed

  customerName:  { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  customerPhone: { type: String, trim: true },
  
  ticketQuantity: { type: Number, required: true, default: 1 },
  amountPaidKobo: { type: Number, default: 0 },
  
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'refunded'],
    default: 'confirmed',
  },
  
  checkedInAt: { type: Date },
}, { timestamps: true });

eventBookingSchema.index({ event: 1, status: 1 });

module.exports = mongoose.model('EventBooking', eventBookingSchema);
