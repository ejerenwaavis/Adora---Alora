const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode  = require('qrcode');
const crypto  = require('crypto');
const User    = require('../models/User');
const Session = require('../models/Session');
const { requireAuth } = require('../middleware/auth');
const { sendTwoFactorCode, sendPasswordReset } = require('../services/mailer');
const { authLimiter, twoFactorLimiter } = require('../middleware/rateLimiter');

// ── Helpers ──────────────────────────────────────────────────────────────────
function issueTokens(userId) {
  const accessToken = jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET || 'aora_jwt_secret_key_2026',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_SECRET || 'aora_jwt_secret_key_2026',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d' }
  );
  return { accessToken, refreshToken };
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', authLimiter, [
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { firstName, lastName, email, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ firstName, lastName, email, passwordHash });
    res.status(201).json({ message: 'Account created', userId: user._id });
  } catch (err) { next(err); }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 1. Check Brute-Force Lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMins = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({ 
        error: `Account temporarily locked due to excessive failed attempts. Please try again in ${waitMins} minute(s).` 
      });
    }

    // 2. Validate Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
      }
      await user.save();
      return res.status(401).json({ 
        error: user.failedLoginAttempts >= 5 
          ? 'Too many failed login attempts. Account locked for 15 minutes.' 
          : 'Invalid email or password' 
      });
    }

    // 3. Two-Factor Authentication Check (Enabled for admins/clerks or opt-in users)
    const isStaff = ['admin', 'clerk', 'content_editor', 'finance'].includes(user.role);
    if (user.twoFactorEnabled || isStaff) {
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const tempToken = crypto.randomBytes(24).toString('hex');
      
      user.twoFactorCode = await bcrypt.hash(otpCode, 8);
      user.twoFactorExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      user.tempAuthToken = tempToken;
      await user.save();

      // Dispatch 2FA verification email (automatically BCCs aceddivisionllc@gmail.com)
      console.log(`[2FA OTP GENERATED] Email: ${user.email} | Code: ${otpCode}`);
      sendTwoFactorCode({ user, code: otpCode, expiresMinutes: 10 })
        .catch(err => console.warn('[2FA Email Error]', err.message));

      const parts = user.email.split('@');
      const maskedEmail = `${parts[0].slice(0, 2)}***@${parts[1]}`;

      return res.status(200).json({
        requires2FA: true,
        tempToken,
        maskedEmail,
        message: `A 6-digit verification code has been sent to ${maskedEmail}.`
      });
    }

    // 4. Successful Direct Login
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = issueTokens(user._id);
    await Session.create({
      userId:      user._id,
      refreshToken,
      userAgent:   req.headers['user-agent'],
      ipAddress:   req.ip,
      expiresAt:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.json({ accessToken, refreshToken, user });
  } catch (err) { next(err); }
});

// ── POST /api/auth/verify-2fa ─────────────────────────────────────────────────
router.post('/verify-2fa', twoFactorLimiter, [
  body('tempToken').notEmpty().withMessage('Security session token required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('6-digit code required'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { tempToken, code } = req.body;
    const user = await User.findOne({
      tempAuthToken: tempToken,
      twoFactorExpiresAt: { $gt: new Date() }
    });

    if (!user || !user.twoFactorCode) {
      return res.status(400).json({ error: 'Security code expired or session invalid. Please log in again.' });
    }

    const isValid = await bcrypt.compare(code.trim(), user.twoFactorCode);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }

    // Clear 2FA temporary security state
    user.twoFactorCode = undefined;
    user.twoFactorExpiresAt = undefined;
    user.tempAuthToken = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = issueTokens(user._id);
    await Session.create({
      userId:      user._id,
      refreshToken,
      userAgent:   req.headers['user-agent'],
      ipAddress:   req.ip,
      expiresAt:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.json({ accessToken, refreshToken, user, message: 'Authentication successful.' });
  } catch (err) { next(err); }
});

// ── POST /api/auth/resend-2fa ─────────────────────────────────────────────────
router.post('/resend-2fa', twoFactorLimiter, async (req, res, next) => {
  try {
    const { tempToken } = req.body;
    if (!tempToken) return res.status(400).json({ error: 'Security session token required' });

    const user = await User.findOne({ tempAuthToken: tempToken });
    if (!user) return res.status(400).json({ error: 'Session expired. Please log in again.' });

    const otpCode = crypto.randomInt(100000, 999999).toString();
    user.twoFactorCode = await bcrypt.hash(otpCode, 8);
    user.twoFactorExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`[2FA OTP RESENT] Email: ${user.email} | Code: ${otpCode}`);
    sendTwoFactorCode({ user, code: otpCode, expiresMinutes: 10 })
      .catch(err => console.warn('[2FA Resend Email Error]', err.message));

    res.json({ message: 'A new 6-digit security code has been sent to your email.' });
  } catch (err) { next(err); }
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET || 'aora_jwt_secret_key_2026');
    const session = await Session.findOne({ refreshToken, isRevoked: false });
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired or revoked' });
    }
    const tokens = issueTokens(payload.sub);
    // Rotate refresh token
    session.refreshToken = tokens.refreshToken;
    session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await session.save();
    res.json(tokens);
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    next(err);
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await Session.findOneAndUpdate({ refreshToken }, { isRevoked: true });
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// ── POST /api/auth/toggle-2fa ─────────────────────────────────────────────────
router.post('/toggle-2fa', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();

    res.json({ 
      twoFactorEnabled: user.twoFactorEnabled, 
      message: `Two-factor authentication ${user.twoFactorEnabled ? 'enabled' : 'disabled'}.` 
    });
  } catch (err) { next(err); }
});

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
router.post('/forgot-password', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(200).json({ message: 'If that email is registered, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    sendPasswordReset({ user, token: resetToken })
      .catch(err => console.warn('[Password Reset Email Error]', err.message));

    res.status(200).json({ message: 'If that email is registered, a password reset link has been sent.' });
  } catch (err) { next(err); }
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post('/reset-password', authLimiter, [
  body('token').notEmpty().withMessage('Token required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const hashedToken = crypto.createHash('sha256').update(req.body.token).digest('hex');
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Reset token is invalid or has expired.' });
    }

    user.passwordHash = await bcrypt.hash(req.body.password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully. You may now log in.' });
  } catch (err) { next(err); }
});

const upload = require('../middleware/upload');

// ── PUT /api/auth/me (Update Profile) ─────────────────────────────────────────
router.put('/me', requireAuth, upload.single('avatar'), async (req, res, next) => {
  try {
    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 
      'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation', 
      'medicalNotes',
      'emailMarketing', 'emailTransactional', 'smsReminders',
      'waiverVersion'
    ];

    const user = await User.findById(req.user._id);
    
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        user[key] = req.body[key];
        if (key === 'waiverVersion' && req.body.waiverVersion && !user.waiverSignedAt) {
          user.waiverSignedAt = new Date();
        }
      }
    }

    if (req.file) {
      user.avatar = req.file.path;
      if (user.role === 'instructor') {
        const Instructor = require('../models/Instructor');
        await Instructor.findOneAndUpdate({ userId: user._id }, { photo: user.avatar });
      }
    }

    await user.save();
    res.json({ user });
  } catch (err) { next(err); }
});

module.exports = router;
