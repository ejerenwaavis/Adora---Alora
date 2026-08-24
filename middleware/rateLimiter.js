const rateLimit = require('express-rate-limit');

// 1. General API Limiter (300 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this network. Please slow down.' }
});

// 2. Authentication Limiter (15 login/register/forgot requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please wait 15 minutes before trying again.' }
});

// 3. 2FA Verification Limiter (5 attempts per 10 minutes)
const twoFactorLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many invalid verification attempts. Security lock activated.' }
});

// 4. Public Form Submissions (Venue enquiry, Cafe Order, Event RSVP: 10 per 10 minutes)
const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Submission limit reached. Please wait a few minutes before submitting another form.' }
});

module.exports = {
  apiLimiter,
  authLimiter,
  twoFactorLimiter,
  formLimiter
};
