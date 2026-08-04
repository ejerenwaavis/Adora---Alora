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
const sendEmail = require('../utils/sendEmail');

// ── Helpers ──────────────────────────────────────────────────────────────────
function issueTokens(userId) {
  const accessToken = jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d' }
  );
  return { accessToken, refreshToken };
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', [
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
    // TODO (Phase 11): send email verification
    res.status(201).json({ message: 'Account created', userId: user._id });
  } catch (err) { next(err); }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password, totpCode } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash +twoFactorSecret');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.twoFactorEnabled) {
      if (!totpCode) return res.status(200).json({ requires2FA: true });
      const valid = speakeasy.totp.verify({
        secret:   user.twoFactorSecret,
        encoding: 'base32',
        token:    totpCode,
        window:   1,
      });
      if (!valid) return res.status(401).json({ error: 'Invalid 2FA code' });
    }
    const { accessToken, refreshToken } = issueTokens(user._id);
    await Session.create({
      userId:      user._id,
      refreshToken,
      userAgent:   req.headers['user-agent'],
      ipAddress:   req.ip,
      expiresAt:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    user.lastLogin = new Date();
    await user.save();
    res.json({ accessToken, refreshToken, user });
  } catch (err) { next(err); }
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
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

// ── POST /api/auth/2fa/setup ──────────────────────────────────────────────────
router.post('/2fa/setup', requireAuth, async (req, res, next) => {
  try {
    const secret = speakeasy.generateSecret({ name: `Adora & Alora (${req.user.email})` });
    req.user.twoFactorSecret = secret.base32;
    await req.user.save();
    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, qrCode: qrDataUrl });
  } catch (err) { next(err); }
});

// 🌸 POST /api/auth/2fa/verify 🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸
router.post('/2fa/verify', requireAuth, async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret, encoding: 'base32', token: code, window: 1,
    });
    if (!valid) return res.status(400).json({ error: 'Invalid code' });
    user.twoFactorEnabled = true;
    await user.save();
    res.json({ message: '2FA enabled' });
  } catch (err) { next(err); }
});

// 🌸 POST /api/auth/forgot-password 🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // Return 200 to prevent email enumeration
      return res.status(200).json({ message: 'If that email is in our system, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 mins
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Adora & Alora - Password Reset',
      text: `You requested a password reset. Please go to this link to reset your password: \n\n${resetUrl}\n\nIf you didn't request this, please ignore this email.`,
      html: `<p>You requested a password reset.</p><p>Please <a href="${resetUrl}">click here</a> to reset your password.</p><p>If you didn't request this, please ignore this email.</p>`
    });

    res.status(200).json({ message: 'If that email is in our system, a reset link has been sent.' });
  } catch (err) { next(err); }
});

// 🌸 POST /api/auth/reset-password 🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸
router.post('/reset-password', [
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
      return res.status(400).json({ error: 'Token is invalid or has expired' });
    }

    user.passwordHash = await bcrypt.hash(req.body.password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully. You may now log in.' });
  } catch (err) { next(err); }
});

// 🌸 PUT /api/auth/me (Update Profile) 🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 
      'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation', 
      'medicalNotes',
      'emailMarketing', 'emailTransactional', 'smsReminders',
      'waiverVersion' // Front-end will pass this if they "sign" it
    ];

    const user = await User.findById(req.user._id);
    
    // Only update allowed fields
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        user[key] = req.body[key];
        
        // If they just signed the waiver, record the timestamp
        if (key === 'waiverVersion' && req.body.waiverVersion && !user.waiverSignedAt) {
          user.waiverSignedAt = new Date();
        }
      }
    }

    await user.save();
    res.json({ user });
  } catch (err) { next(err); }
});

module.exports = router;
