const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName:  { type: String, required: true, trim: true },
  lastName:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  phone:      { type: String, trim: true },

  // ── Roles ──
  // admin         : full access to everything
  // clerk         : front-desk (check-ins, walk-in bookings, enquiries)
  // content_editor: CMS-only (menu, classes, events, FAQs, announcements)
  // instructor    : read-only attendance/class view
  // finance       : read-only payments & reports
  // concierge     : guest communications & whatsapp live chat
  // member        : standard customer account
  role: {
    type: String,
    enum: ['admin', 'clerk', 'content_editor', 'instructor', 'finance', 'concierge', 'member'],
    default: 'member',
  },

  // ── Two-Factor Auth (Email OTP / TOTP) ──
  twoFactorSecret:    { type: String },
  twoFactorEnabled:   { type: Boolean, default: false },
  twoFactorCode:      { type: String },
  twoFactorExpiresAt: { type: Date },
  tempAuthToken:      { type: String },

  // ── Security & Brute-force Lockout ──
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil:           { type: Date },

  // ── Profile ──
  avatar:      { type: String },
  dateOfBirth: { type: Date },

  // ── Waiver & Emergency Contact — required for movement bookings ──
  waiver: {
    signed:      { type: Boolean, default: false },
    signedAt:    { type: Date },
    version:     { type: String },        // e.g. "2026-09" — matches current waiver version
    ipAddress:   { type: String },
    userAgent:   { type: String },
    method:      { type: String, default: 'electronic' },
  },
  waiverSigned:             { type: Boolean, default: false },
  waiverDate:               { type: Date },
  waiverSignedAt:           { type: Date },
  waiverSignature:          { type: String },
  waiverVersion:            { type: String, default: '2026-09' },
  emergencyContactName:     { type: String },
  emergencyContactPhone:    { type: String },
  emergencyContactRelation: { type: String },
  medicalNotes:             { type: String },

  // ── Membership — modeled now, UI activated post-launch ──
  membershipStatus: {
    type: String,
    enum: ['none', 'active', 'expiring', 'expired', 'paused', 'payment_failed'],
    default: 'none',
  },
  membershipPlanId:    { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan' },
  membershipStartDate: { type: Date },
  membershipEndDate:   { type: Date },

  // ── Class Credits ──
  classCredits: { type: Number, default: 0 },

  // ── Communication Preferences ──
  emailMarketing:    { type: Boolean, default: true },
  emailTransactional:{ type: Boolean, default: true },
  smsReminders:      { type: Boolean, default: false },

  // ── Account State ──
  isActive:            { type: Boolean, default: true },
  isEmailVerified:     { type: Boolean, default: false },
  emailVerifyToken:    { type: String },
  emailVerifyExpires:  { type: Date },
  passwordResetToken:  { type: String },
  passwordResetExpires:{ type: Date },
  lastLogin:           { type: Date },
}, { timestamps: true });

// Full name virtual
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Never return sensitive fields in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.passwordHash;
  delete obj.twoFactorSecret;
  delete obj.twoFactorCode;
  delete obj.tempAuthToken;
  delete obj.emailVerifyToken;
  delete obj.passwordResetToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
