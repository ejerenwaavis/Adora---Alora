const mongoose = require('mongoose');

const venueSpaceSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  slug:             { type: String, required: true, unique: true, lowercase: true },
  description:      { type: String },
  shortDescription: { type: String },
  capacity:         { type: Number },
  seatingOptions:   [{ type: String }],  // "Theatre", "Boardroom", "Banquet", "Cocktail"
  amenities:        [{ type: String }],  // "AV Equipment", "Catering", "WiFi", "Projector"
  images:           [{ type: String }],
  floorPlanImage:   { type: String },
  // Display string only — venue hire is enquiry-led, no exact price at this stage
  priceDisplay:     { type: String },    // e.g. "From ₦150,000"
  isAvailable:      { type: Boolean, default: true },
  // The Loft has its own directly linkable sub-page (/venue-hire/the-loft)
  directlyLinkable: { type: Boolean, default: false },
  sortOrder:        { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('VenueSpace', venueSpaceSchema);
