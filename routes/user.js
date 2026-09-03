const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');

const User = require('../models/User');
const Booking = require('../models/Booking');
const EventBooking = require('../models/EventBooking');
const Order = require('../models/Order');
const FashionOrder = require('../models/FashionOrder');

// All user routes require authentication
router.use(requireAuth);

// ── GET /api/user/profile ───────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/user/profile ──────────────────────────────────────────────────
router.patch('/profile', async (req, res) => {
  try {
    const allowed = [
      'firstName', 'lastName', 'phone', 'avatar', 'dateOfBirth',
      'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation', 'medicalNotes'
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/user/preferences ──────────────────────────────────────────────
router.patch('/preferences', async (req, res) => {
  try {
    const { emailMarketing, emailTransactional, smsReminders } = req.body;
    const updates = {};
    if (emailMarketing !== undefined) updates.emailMarketing = Boolean(emailMarketing);
    if (emailTransactional !== undefined) updates.emailTransactional = Boolean(emailTransactional);
    if (smsReminders !== undefined) updates.smsReminders = Boolean(smsReminders);

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ message: 'Preferences updated successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const WaiverVersion = require('../models/WaiverVersion');
const WaiverRecord  = require('../models/WaiverRecord');
const Setting       = require('../models/Setting');
const logActivity   = require('../utils/activityLogger');

// ── GET /api/user/waiver/active ─────────────────────────────────────────────
router.get('/waiver/active', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const [activeWaiver, waiverRequiredSetting] = await Promise.all([
      WaiverVersion.findOne({ isActive: true }),
      Setting.findOne({ key: 'waiver_required' }),
    ]);

    const isRequired = waiverRequiredSetting ? (waiverRequiredSetting.value !== false && waiverRequiredSetting.value !== 'false') : true;
    const currentVersion = activeWaiver ? activeWaiver.version : '2026-09';
    const hasSigned = (user.waiver?.signed && user.waiver?.version === currentVersion) ||
                      (user.waiverSigned && user.waiverVersion === currentVersion);

    res.json({
      success: true,
      activeWaiver,
      isRequired,
      currentVersion,
      hasSigned,
      userWaiver: user.waiver || {
        signed: Boolean(user.waiverSigned || user.waiverSignedAt),
        signedAt: user.waiverSignedAt || user.waiverDate,
        version: user.waiverVersion || '2026-09',
        method: 'electronic'
      },
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        emergencyContactName: user.emergencyContactName,
        emergencyContactPhone: user.emergencyContactPhone,
        emergencyContactRelation: user.emergencyContactRelation,
        medicalNotes: user.medicalNotes,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/user/waiver/sign (and /api/user/waiver) ────────────────────────
const handleWaiverSign = async (req, res) => {
  try {
    const {
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      medicalNotes,
      signatureName,
      agreedToTerms,
      confirmed,
      waiverVersion: requestedVersion
    } = req.body;

    const isConfirmed = Boolean(confirmed === true || confirmed === 'true' || agreedToTerms);
    if (!isConfirmed) {
      return res.status(400).json({
        success: false,
        error: 'You must check the confirmation box to agree to the liability waiver terms.'
      });
    }

    const sig = (signatureName || `${req.user.firstName} ${req.user.lastName}`).trim();
    if (!sig) {
      return res.status(400).json({
        success: false,
        error: 'Digital signature name is required.'
      });
    }

    // Get active waiver (or requested version)
    let waiver = null;
    if (requestedVersion) {
      waiver = await WaiverVersion.findOne({ version: requestedVersion });
    }
    if (!waiver) {
      waiver = await WaiverVersion.findOne({ isActive: true });
    }

    const versionId = waiver ? waiver.version : (requestedVersion || '2026-09');
    const waiverText = waiver ? waiver.content : 'Aora House Movement Studio Client Liability Waiver (Lagos, Nigeria)';

    const forwarded = req.headers['x-forwarded-for'];
    const ip = (forwarded ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || req.ip || 'unknown'));
    const userAgent = req.headers['user-agent'] || 'unknown';
    const now = new Date();

    const updates = {
      waiver: {
        signed: true,
        signedAt: now,
        version: versionId,
        ipAddress: ip,
        userAgent: userAgent,
        method: 'electronic',
      },
      waiverSigned: true,
      waiverDate: now,
      waiverSignedAt: now,
      waiverSignature: sig,
      waiverVersion: versionId,
    };

    if (emergencyContactName) updates.emergencyContactName = emergencyContactName.trim();
    if (emergencyContactPhone) updates.emergencyContactPhone = emergencyContactPhone.trim();
    if (emergencyContactRelation) updates.emergencyContactRelation = emergencyContactRelation.trim();
    if (medicalNotes !== undefined) updates.medicalNotes = medicalNotes.trim();

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });

    // Store permanent audit record in WaiverRecord
    await WaiverRecord.create({
      userId: req.user._id,
      waiverVersion: versionId,
      waiverText: waiverText,
      signedAt: now,
      ipAddress: ip,
      userAgent: userAgent,
      method: 'electronic',
      memberName: `${user.firstName} ${user.lastName}`,
      memberEmail: user.email,
    });

    await logActivity(req.user._id, 'SIGN', 'WAIVER', `Liability Waiver ${versionId} signed by ${user.firstName} ${user.lastName}`);

    res.json({
      success: true,
      message: 'Liability & health waiver signed successfully.',
      user
    });
  } catch (err) {
    console.error('[Waiver Sign Error]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

router.post('/waiver/sign', handleWaiverSign);
router.post('/waiver', handleWaiverSign);

// ── GET /api/user/bookings ───────────────────────────────────────────────────
router.get('/bookings', async (req, res) => {
  try {
    const now = new Date();

    const [classBookings, eventBookings, cafeOrders, fashionOrders] = await Promise.all([
      Booking.find({ user: req.user._id })
        .populate({
          path: 'classSession',
          populate: [
            { path: 'classType', select: 'name slug durationMinutes intensity room' },
            { path: 'instructor', select: 'firstName lastName fullName bio photo specialty' }
          ]
        })
        .sort({ createdAt: -1 }),

      EventBooking.find({
        $or: [{ user: req.user._id }, { customerEmail: req.user.email.toLowerCase() }]
      })
        .populate('event')
        .sort({ createdAt: -1 }),

      Order.find({ customerEmail: req.user.email.toLowerCase() }).sort({ createdAt: -1 }).limit(15),
      FashionOrder.find({ customerEmail: req.user.email.toLowerCase() }).populate('fashionItem').sort({ createdAt: -1 }).limit(15)
    ]);

    // Partition classes
    const upcomingClasses = classBookings.filter(b => {
      const startTime = b.classSession?.startTime ? new Date(b.classSession.startTime) : null;
      return startTime && startTime >= now && b.status !== 'cancelled';
    }).sort((a, b) => new Date(a.classSession.startTime) - new Date(b.classSession.startTime));

    const pastClasses = classBookings.filter(b => {
      const startTime = b.classSession?.startTime ? new Date(b.classSession.startTime) : null;
      return !startTime || startTime < now || b.status === 'cancelled';
    }).sort((a, b) => {
      const aTime = a.classSession?.startTime ? new Date(a.classSession.startTime).getTime() : 0;
      const bTime = b.classSession?.startTime ? new Date(b.classSession.startTime).getTime() : 0;
      return bTime - aTime;
    });

    // Partition events
    const upcomingEvents = eventBookings.filter(e => {
      const startDate = e.event?.startDate ? new Date(e.event.startDate) : null;
      return startDate && startDate >= now && e.status !== 'cancelled';
    }).sort((a, b) => new Date(a.event.startDate) - new Date(b.event.startDate));

    const pastEvents = eventBookings.filter(e => {
      const startDate = e.event?.startDate ? new Date(e.event.startDate) : null;
      return !startDate || startDate < now || e.status === 'cancelled';
    }).sort((a, b) => {
      const aTime = a.event?.startDate ? new Date(a.event.startDate).getTime() : 0;
      const bTime = b.event?.startDate ? new Date(b.event.startDate).getTime() : 0;
      return bTime - aTime;
    });

    res.json({
      classCredits: req.user.classCredits || 0,
      waiverSigned: Boolean(req.user.waiverSigned || req.user.waiverSignedAt),
      waiverDate: req.user.waiverDate || req.user.waiverSignedAt,
      upcomingClasses,
      pastClasses,
      upcomingEvents,
      pastEvents,
      cafeOrders,
      fashionOrders,
      totalBookingsCount: classBookings.length + eventBookings.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/user/credits ────────────────────────────────────────────────────
router.get('/credits', (req, res) => {
  res.json({
    credits: req.user.classCredits || 0,
    waiverSigned: Boolean(req.user.waiverSigned || req.user.waiverSignedAt)
  });
});

// ── GET /api/user/membership ─────────────────────────────────────────────────
router.get('/membership', (req, res) => {
  res.json({
    status: req.user.membershipStatus || 'none',
    planId: req.user.membershipPlanId,
    startDate: req.user.membershipStartDate,
    endDate: req.user.membershipEndDate
  });
});

module.exports = router;
