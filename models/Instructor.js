const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  // Optional link to a User account (if the instructor has login access)
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  firstName:     { type: String, required: true, trim: true },
  lastName:      { type: String, required: true, trim: true },
  bio:           { type: String },
  shortBio:      { type: String },
  photo:         { type: String },
  specialities:  [{ type: String }],
  certifications:[{ type: String }],
  instagram:     { type: String },
  isActive:      { type: Boolean, default: true },
  sortOrder:     { type: Number, default: 0 },
}, { timestamps: true });

instructorSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Instructor', instructorSchema);
