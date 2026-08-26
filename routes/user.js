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

// ── POST /api/user/waiver ────────────────────────────────────────────────────
router.post('/waiver', async (req, res) => {
  try {
    const {
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      medicalNotes,
      signatureName,
      agreedToTerms
    } = req.body;

    if (!agreedToTerms) {
      return res.status(400).json({ error: 'You must agree to the liability waiver terms and conditions.' });
    }

    if (!signatureName || !signatureName.trim()) {
      return res.status(400).json({ error: 'Digital signature name is required.' });
    }

    const now = new Date();
    const updates = {
      waiverSigned: true,
      waiverDate: now,
      waiverSignedAt: now,
      waiverSignature: signatureName.trim(),
      waiverVersion: 'v1.0'
    };

    if (emergencyContactName) updates.emergencyContactName = emergencyContactName.trim();
    if (emergencyContactPhone) updates.emergencyContactPhone = emergencyContactPhone.trim();
    if (emergencyContactRelation) updates.emergencyContactRelation = emergencyContactRelation.trim();
    if (medicalNotes !== undefined) updates.medicalNotes = medicalNotes.trim();

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ message: 'Liability & health waiver signed successfully.', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
