const mongoose = require('mongoose');

const creditPackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  credits: { type: Number, required: true },
  priceKobo: { type: Number, required: true }, // price in kobo (100 kobo = 1 Naira)
  expiresInDays: { type: Number, required: true, default: 30 }, // e.g. 14, 30, 60, 90
  isActive: { type: Boolean, default: true },
  badge: { type: String, default: '' }, // e.g. 'Most Popular', 'Best Value'
  description: { type: String, default: '' },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('CreditPack', creditPackSchema);
