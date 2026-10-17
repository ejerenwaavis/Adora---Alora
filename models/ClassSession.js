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
  isRecurring:       { type: Boolean, default: false },
  seriesId:          { type: String }, // Grouping ID for all occurrences in a series
  recurrence: {
    frequency:       { type: String, enum: ['daily', 'weekly', 'biweekly', 'monthly'] },
    daysOfWeek:      [{ type: Number }], // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    repeatCount:     { type: Number },
    repeatUntil:     { type: Date }
  }
}, { timestamps: true });

// Compound index for timetable queries
classSessionSchema.index({ startTime: 1, status: 1 });
classSessionSchema.index({ instructor: 1, startTime: 1 });
classSessionSchema.index({ seriesId: 1 });

module.exports = mongoose.model('ClassSession', classSessionSchema);
