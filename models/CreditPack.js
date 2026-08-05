const mongoose = require('mongoose');

const creditPackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  credits: { type: Number, required: true },
  priceKobo: { type: Number, required: true }, // price in kobo (100 kobo = 1 Naira)
  expiresInDays: { type: Number, required: true }, // e.g. 30, 90, 365
  isActive: { type: Boolean, default: true },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CreditPack', creditPackSchema);
