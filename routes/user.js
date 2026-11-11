const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');

const User = require('../models/User');
const Booking = require('../models/Booking');
const EventBooking = require('../models/EventBooking');
const Order = require('../models/Order');
const FashionOrder = require('../models/FashionOrder');
const CreditGrant = require('../models/CreditGrant');
const logActivity = require('../utils/activityLogger');

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
    const { validatePhone } = require('../utils/validation');
    if (req.body.phone && String(req.body.phone).trim() !== '') {
      const phoneCheck = validatePhone(req.body.phone);
      if (!phoneCheck.valid) return res.status(400).json({ error: phoneCheck.error });
      req.body.phone = phoneCheck.normalized;
    }
    if (req.body.emergencyContactPhone && String(req.body.emergencyContactPhone).trim() !== '') {
      const emergencyCheck = validatePhone(req.body.emergencyContactPhone);
      if (!emergencyCheck.valid) return res.status(400).json({ error: `Emergency contact: ${emergencyCheck.error}` });
      req.body.emergencyContactPhone = emergencyCheck.normalized;
    }

    const allowed = [
      'firstName', 'lastName', 'phone', 'avatar', 'dateOfBirth',
      'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation', 'medicalNotes'
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (req.body.profilePicture === null || req.body.profilePicture === '' || req.body.avatar === null || req.body.avatar === '') {
      updates.avatar = '';
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    await logActivity({
      req,
      action: 'guest_profile_updated',
      category: 'USERS',
      itemAffected: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      entityModel: 'User',
      entityId: user._id,
      details: `Updated member profile fields: ${Object.keys(updates).join(', ') || 'none'}`
    });
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
    const hasSigned = Boolean(
      (user.waiver?.signed && (user.waiver?.version === currentVersion || !user.waiver?.version)) ||
      (user.waiverSigned && (user.waiverVersion === currentVersion || !user.waiverVersion))
    );
    const hasEmergencyContact = Boolean(
      user.emergencyContactName &&
      String(user.emergencyContactName).trim().length >= 2 &&
      user.emergencyContactPhone &&
      String(user.emergencyContactPhone).trim().length >= 8 &&
      user.emergencyContactRelation &&
      String(user.emergencyContactRelation).trim().length >= 2
    );

    res.json({
      success: true,
      activeWaiver,
      isRequired,
      currentVersion,
      hasSigned,
      hasEmergencyContact,
      safetyGateComplete: hasSigned && hasEmergencyContact,
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

    const { validateName, validatePhone } = require('../utils/validation');
    const emNameCheck = validateName(emergencyContactName, 'Emergency contact name');
    if (!emNameCheck.valid) {
      return res.status(400).json({ success: false, error: emNameCheck.error });
    }
    const emPhoneCheck = validatePhone(emergencyContactPhone);
    if (!emPhoneCheck.valid) {
      return res.status(400).json({ success: false, error: `Emergency contact phone: ${emPhoneCheck.error}` });
    }
    const emRelCheck = validateName(emergencyContactRelation, 'Emergency contact relationship');
    if (!emRelCheck.valid) {
      return res.status(400).json({ success: false, error: emRelCheck.error });
    }

    // Get active waiver (always record the authoritative active version)
    let waiver = await WaiverVersion.findOne({ isActive: true });
    if (!waiver && requestedVersion) {
      waiver = await WaiverVersion.findOne({ version: requestedVersion });
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
      emergencyContactName: emNameCheck.normalized,
      emergencyContactPhone: emPhoneCheck.normalized,
      emergencyContactRelation: emRelCheck.normalized,
    };

    if (medicalNotes !== undefined) updates.medicalNotes = String(medicalNotes).trim();

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
    const userEmail = (req.user.email || '').trim();
    const emailRegex = new RegExp(`^${userEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');

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
        paymentStatus: 'PAID',
        status: { $ne: 'cancelled' },
        $or: [{ user: req.user._id }, { customerEmail: emailRegex }]
      })
        .populate('event')
        .sort({ createdAt: -1 }),

      Order.find({
        paymentStatus: 'PAID',
        status: { $ne: 'CANCELLED' },
        $or: [
          { user: req.user._id },
          { customerEmail: emailRegex }
        ]
      }).sort({ createdAt: -1 }),

      FashionOrder.find({
        customerEmail: emailRegex,
        status: { $ne: 'CANCELLED' }
      }).populate('fashionItem').sort({ createdAt: -1 })
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

// ── GET /api/user/orders ─────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const userEmail = (req.user.email || '').trim();
    const emailRegex = new RegExp(`^${userEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');

    const [cafeOrders, fashionOrders] = await Promise.all([
      Order.find({
        paymentStatus: 'PAID',
        status: { $ne: 'CANCELLED' },
        $or: [
          { user: req.user._id },
          { customerEmail: emailRegex }
        ]
      }).sort({ createdAt: -1 }),

      FashionOrder.find({
        customerEmail: emailRegex,
        status: { $ne: 'CANCELLED' }
      }).populate('fashionItem').sort({ createdAt: -1 })
    ]);

    const pendingCafeOrders = cafeOrders.filter(o => ['ACCEPTED', 'PREPARING', 'READY'].includes(o.status));
    const pastCafeOrders = cafeOrders.filter(o => !['ACCEPTED', 'PREPARING', 'READY'].includes(o.status));

    const pendingFashionOrders = fashionOrders.filter(o => ['PENDING', 'CONFIRMED'].includes(o.status));
    const pastFashionOrders = fashionOrders.filter(o => !['PENDING', 'CONFIRMED'].includes(o.status));

    res.json({
      success: true,
      cafeOrders,
      fashionOrders,
      pendingCafeOrders,
      pastCafeOrders,
      pendingFashionOrders,
      pastFashionOrders,
      totalOrdersCount: cafeOrders.length + fashionOrders.length,
      pendingCount: pendingCafeOrders.length + pendingFashionOrders.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/user/credits ────────────────────────────────────────────────────
router.get('/credits', (req, res) => {
  res.json({
    credits: req.user.classCredits || 0,
    waiverSigned: Boolean(req.user.waiverSigned || req.user.waiverSignedAt)
  });
});

// ── GET /api/user/billing ────────────────────────────────────────────────────
router.get('/billing', async (req, res) => {
  try {
    const escapedEmail = (req.user.email || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const emailRegex = escapedEmail ? new RegExp(`^${escapedEmail}$`, 'i') : null;

    const orderOwnerFilter = emailRegex
      ? { $or: [{ user: req.user._id }, { customerEmail: emailRegex }] }
      : { user: req.user._id };

    const [grants, paidOrders, paidEventBookings, paidClassDropIns] = await Promise.all([
      CreditGrant.find({ user: req.user._id, status: { $ne: 'refunded' } })
        .sort({ createdAt: -1 })
        .lean(),
      Order.find({
        ...orderOwnerFilter,
        paymentStatus: 'PAID',
        status: { $ne: 'CANCELLED' }
      }).sort({ createdAt: -1 }).lean(),
      EventBooking.find({
        ...orderOwnerFilter,
        paymentStatus: 'PAID',
        status: { $ne: 'cancelled' }
      }).populate('event', 'title slug startDate venue').sort({ createdAt: -1 }).lean(),
      Booking.find({
        user: req.user._id,
        paymentMethod: 'paystack',
        paymentStatus: 'paid',
        status: { $ne: 'cancelled' }
      }).populate({
        path: 'classSession',
        populate: { path: 'classType', select: 'name' }
      }).sort({ createdAt: -1 }).lean()
    ]);

    const now = new Date();
    const activeGrants = grants.filter(
      (g) => g.status === 'active' && g.creditsRemaining > 0 && (!g.expiresAt || new Date(g.expiresAt) > now)
    );

    const transactions = [
      ...grants
        .filter((g) => (g.pricePaidKobo && g.pricePaidKobo > 0) || Boolean(g.paymentReference))
        .map((g) => ({
          _id: `grant_${g._id}`,
          sourceId: g._id,
          type: 'CLASS_PACK',
          typeLabel: 'Class Pack',
          date: g.createdAt,
          description: `${g.packName || 'Studio Class Pack'} (${g.creditsGranted} ${g.creditsGranted === 1 ? 'Credit' : 'Credits'})`,
          amountKobo: g.pricePaidKobo || 0,
          status: 'Paid',
          reference: g.paymentReference || String(g._id).slice(-8).toUpperCase(),
          expiresAt: g.expiresAt || null,
          items: [
            {
              name: g.packName || 'Studio Class Pack',
              quantity: g.creditsGranted,
              unitLabel: 'credits',
              priceKobo: g.pricePaidKobo || 0
            }
          ],
          meta: {
            creditsGranted: g.creditsGranted,
            creditsRemaining: g.creditsRemaining,
            expiresAt: g.expiresAt || null
          }
        })),
      ...paidOrders.map((o) => {
        const itemSummary = Array.isArray(o.items) && o.items.length > 0
          ? o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')
          : 'Café Takeout Order';
        return {
          _id: `order_${o._id}`,
          sourceId: o._id,
          type: 'CAFE_ORDER',
          typeLabel: 'Café Order',
          date: o.createdAt,
          description: `Café Order — ${itemSummary}`,
          amountKobo: o.totalAmountKobo || 0,
          status: 'Paid',
          reference: o.paymentReference || String(o._id).slice(-8).toUpperCase(),
          items: (o.items || []).map((i) => ({
            name: i.name,
            quantity: i.quantity,
            priceKobo: (i.priceKobo || 0) * (i.quantity || 1)
          })),
          meta: {
            orderStatus: o.status,
            orderType: o.orderType || 'TAKEOUT'
          }
        };
      }),
      ...paidEventBookings.map((eb) => ({
        _id: `event_${eb._id}`,
        sourceId: eb._id,
        type: 'EVENT_TICKET',
        typeLabel: 'Event Ticket',
        date: eb.createdAt,
        description: `Event Ticket — ${eb.event?.title || 'Aora House Event'} (${eb.ticketQuantity || 1}×)`,
        amountKobo: eb.amountPaidKobo || 0,
        status: 'Paid',
        reference: eb.paymentReference || String(eb._id).slice(-8).toUpperCase(),
        items: [
          {
            name: eb.event?.title || 'Aora House Event Pass',
            quantity: eb.ticketQuantity || 1,
            priceKobo: eb.amountPaidKobo || 0
          }
        ],
        meta: {
          eventDate: eb.event?.startDate || null,
          venue: eb.event?.venue || null
        }
      })),
      ...paidClassDropIns.map((b) => {
        const className = b.classSession?.classType?.name || 'Movement Studio Class';
        return {
          _id: `booking_${b._id}`,
          sourceId: b._id,
          type: 'STUDIO_DROPIN',
          typeLabel: 'Studio Class',
          date: b.createdAt,
          description: `Studio Drop-In — ${className}`,
          amountKobo: b.amountPaidKobo || 0,
          status: 'Paid',
          reference: b.paystackReference || String(b._id).slice(-8).toUpperCase(),
          items: [
            {
              name: className,
              quantity: 1,
              priceKobo: b.amountPaidKobo || 0
            }
          ],
          meta: {
            sessionDate: b.classSession?.startTime || null
          }
        };
      })
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      classCredits: req.user.classCredits || 0,
      activeGrants,
      transactions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
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
