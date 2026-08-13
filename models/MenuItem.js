const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, lowercase: true, trim: true },
  description: { type: String },
  priceKobo:   { type: Number },
  dietaryTags: [{
    type: String,
    enum: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free', 'sugar-free'],
  }],
  allergens:   [{ type: String }],
  image:       { type: String },
  isAvailable: { type: Boolean, default: true },
  isSignature: { type: Boolean, default: false }, // highlighted as a signature item
  sortOrder:   { type: Number, default: 0 },
  badge:       { type: String },   // "New", "Popular", "Seasonal"
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
