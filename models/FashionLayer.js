const mongoose = require('mongoose');

// Three fashion layers: Adora Archive | Brand Partners | Raire Featured Sellers
const fashionLayerSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  description: { type: String },
  coverImage:  { type: String },
  sortOrder:   { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('FashionLayer', fashionLayerSchema);
