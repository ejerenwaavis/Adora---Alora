const mongoose = require('mongoose');

// A specific scheduled instance of a ClassType
const classSessionSchema = new mongoose.Schema({
  classType:   { type: mongoose.Schema.Types.ObjectId, ref: 'ClassType',  required: true },
  instructor:  { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor', required: true },
  startTime:   { type: Date, required: true },
  endTime:     { type: Date, required: true },
  location:    { type: String, default: 'The Studio' },
  maxCapacity: { type: Number, required: true },
  bookedCount: { type: Number, default: 0 },
  waitlistCount:{ type: Number, default: 0 },
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed', 'full'],
    default: 'scheduled',
  },
  isCancelled:        { type: Boolean, default: false },
  cancelledAt:        { type: Date },
  cancellationReason: { type: String },
  // Admin overrides
  overridePriceKobo: { type: Number },   // overrides ClassType.singleClassPriceKobo if set
  notes:             { type: String },   // internal admin notes only
  isPublic:          { type: Boolean, default: true },
}, { timestamps: true });

// Compound index for timetable queries
classSessionSchema.index({ startTime: 1, status: 1 });
classSessionSchema.index({ instructor: 1, startTime: 1 });

module.exports = mongoose.model('ClassSession', classSessionSchema);
