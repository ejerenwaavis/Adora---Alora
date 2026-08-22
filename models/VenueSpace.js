const mongoose = require('mongoose');

const venueSpaceSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  slug:             { type: String, required: true, unique: true, lowercase: true },
  spaceType:        { 
    type: String, 
    enum: ['studio', 'venue_hire', 'cafe', 'wellness', 'multi_purpose'], 
    default: 'studio' 
  },
  // Capability flags
  isClassStudio:    { type: Boolean, default: true },  // Available for Movement/Timetable classes
  isHireableVenue:  { type: Boolean, default: false }, // Available for public venue hire & enquiries
  isCafeArea:       { type: Boolean, default: false }, // Associated with café & table seating
  defaultCapacity:  { type: Number, default: 14 },
  colorTag:         { type: String, default: '#C89B4A' },
  description:      { type: String },
  shortDescription: { type: String },
  capacity:         { type: Number },
  suitableFor:      [{ type: String }],  // e.g. "Seminars", "Workshops", "Pilates", "Yoga"
  amenities:        [{ type: String }],  // "Wall Mirrors", "Reformer Beds", "AV Equipment", "Sound System"
  images:           [{ type: String }],
  floorPlanImage:   { type: String },
  priceKobo:        { type: Number, default: 0 },
  isAvailable:      { type: Boolean, default: true },
  isActive:         { type: Boolean, default: true },
  // The Loft has its own directly linkable sub-page (/venue-hire/the-loft)
  directlyLinkable: { type: Boolean, default: false },
  sortOrder:        { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('VenueSpace', venueSpaceSchema);
