const mongoose = require('mongoose');

const fashionItemSchema = new mongoose.Schema({
  layer:            { type: mongoose.Schema.Types.ObjectId, ref: 'FashionLayer', required: true },
  name:             { type: String, required: true, trim: true },
  slug:             { type: String, required: true, unique: true, trim: true },
  description:      { type: String },
  sizes:            [{ type: String }],
  colors:           [{ type: String }],
  brand:            { type: String },
  sellerName:       { type: String },       // for Raire Featured Sellers
  raireListingUrl:  { type: String },       // external Raire purchase link
  images:           [{ type: String }],
  displayPriceKobo: { type: Number },       // for display only — no cart/checkout on site
  currency:         { type: String, default: 'NGN' },
  isAvailableInStore:{ type: Boolean, default: true },
  availabilityNote: { type: String },       // "In-store only", "Limited stock"
  collection:       { type: String },
  sortOrder:        { type: Number, default: 0 },
  isFeatured:       { type: Boolean, default: false },
  isActive:         { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('FashionItem', fashionItemSchema);
