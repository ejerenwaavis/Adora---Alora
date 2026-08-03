const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  slug:      { type: String, required: true, unique: true, lowercase: true },
  description:{ type: String },
  icon:      { type: String },   // emoji or icon identifier
  sortOrder: { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('MenuCategory', menuCategorySchema);
