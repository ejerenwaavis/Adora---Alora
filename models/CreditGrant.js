const mongoose = require('mongoose');

const creditGrantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  creditPack: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditPack'
  },
  packName: {
    type: String,
    required: true
  },
  creditsGranted: {
    type: Number,
    required: true
  },
  creditsRemaining: {
    type: Number,
    required: true
  },
  pricePaidKobo: {
    type: Number,
    default: 0
  },
  paymentReference: {
    type: String,
    default: ''
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'exhausted', 'expired', 'refunded'],
    default: 'active',
    index: true
  }
}, { timestamps: true });

creditGrantSchema.index({ user: 1, status: 1, expiresAt: 1 });

module.exports = mongoose.model('CreditGrant', creditGrantSchema);
