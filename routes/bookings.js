const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const { requireAuth, requireRole } = require('../middleware/auth');
const requireWaiver = require('../middleware/requireWaiver');

const Booking = require('../models/Booking');
const ClassSession = require('../models/ClassSession');
const User = require('../models/User');
const CreditPack = require('../models/CreditPack');
const Setting = require('../models/Setting');
const CreditGrant = require('../models/CreditGrant');
const { sendBookingConfirmation, sendWaitlistPromotion } = require('../services/mailer');
const { promoteNextWaitlisted } = require('../services/waitlistManager');

// Purchase a credit pack
router.post('/purchase-pack', requireAuth, async (req, res) => {
  try {
    const { packId } = req.body;
    const pack = await CreditPack.findById(packId);
    if (!pack) return res.status(404).json({ error: 'Pack not found' });
    if (!pack.isActive) return res.status(400).json({ error: 'Pack is no longer available' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const expiresInDays = pack.expiresInDays || 30;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const grant = new CreditGrant({
      user: user._id,
      creditPack: pack._id,
      packName: pack.name,
      creditsGranted: pack.credits,
      creditsRemaining: pack.credits,
      pricePaidKobo: pack.priceKobo,
      expiresAt,
      status: 'active'
    });
    await grant.save();

    user.classCredits = (user.classCredits || 0) + pack.credits;
    await user.save();

    res.json({
      success: true,
      message: `${pack.name} purchased successfully!`,
      newCredits: user.classCredits,
      grant
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET my bookings
router.get('/me', requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate({
        path: 'classSession',
        populate: [{ path: 'classType' }, { path: 'instructor' }]
      })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a booking or join waitlist
router.post('/', requireAuth, requireWaiver, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { classSessionId } = req.body;
    
    // 1. Check class
    const classSession = await ClassSession.findById(classSessionId).session(session);
    if (!classSession) throw new Error('Class not found');
    if (classSession.isCancelled) throw new Error('Class is cancelled');
    if (new Date(classSession.startTime) < new Date()) throw new Error('Class has already started');

    // 2. Check existing booking
    const existing = await Booking.findOne({ user: req.user.id, classSession: classSessionId }).session(session);
    if (existing && existing.status !== 'cancelled') throw new Error('You are already booked or waitlisted for this class');

    // 3. Deduct credit from user
    const user = await User.findById(req.user.id).session(session);
    if ((user.classCredits || 0) < 1) throw new Error('Insufficient studio credits. Please purchase a credit pack.');
    user.classCredits -= 1;
    await user.save({ session });

    // FIFO: Deduct from earliest expiring active CreditGrant
    const activeGrant = await CreditGrant.findOne({
      user: user._id,
      status: 'active',
      creditsRemaining: { $gt: 0 },
      expiresAt: { $gte: new Date() }
    }).sort({ expiresAt: 1 }).session(session);

    if (activeGrant) {
      activeGrant.creditsRemaining -= 1;
      if (activeGrant.creditsRemaining <= 0) {
        activeGrant.status = 'exhausted';
      }
      await activeGrant.save({ session });
    }

    // 4. Booking logic
    const isWaitlist = classSession.bookedCount >= classSession.maxCapacity;
    const bookingStatus = isWaitlist ? 'waitlisted' : 'confirmed';

    if (isWaitlist) {
      classSession.waitlistCount += 1;
    } else {
      classSession.bookedCount += 1;
    }
    await classSession.save({ session });

    const booking = new Booking({
      user: user._id,
      classSession: classSessionId,
      status: bookingStatus,
      paymentMethod: 'credit',
      paymentStatus: 'paid',
      creditsUsed: 1,
      waitlistPosition: isWaitlist ? classSession.waitlistCount : undefined
    });
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Trigger confirmation email in background
    if (bookingStatus === 'confirmed') {
      ClassSession.findById(classSessionId)
        .populate('classType')
        .populate('instructor')
        .then(popSession => {
          if (popSession) {
            sendBookingConfirmation({ user, classSession: popSession, booking }).catch(e => console.warn('Booking email error:', e.message));
          }
        })
        .catch(e => console.warn('Populate session for email error:', e.message));
    }

    res.status(201).json(booking);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: err.message });
  }
});

// Cancel a booking
router.post('/:id/cancel', requireAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findById(req.params.id).populate('classSession').session(session);
    if (!booking) throw new Error('Booking not found');
    
    // Auth check: must be owner or admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'clerk') {
      throw new Error('Unauthorized');
    }
    
    if (booking.status === 'cancelled') throw new Error('Already cancelled');

    const classSession = booking.classSession;

    // Check cancellation window
    const now = new Date();
    let windowSetting = await Setting.findOne({ key: 'cancellation_window_hours' }).session(session);
    const windowHours = windowSetting ? Number(windowSetting.value) : 6;
    const cutoffTime = new Date(classSession.startTime);
    cutoffTime.setHours(cutoffTime.getHours() - windowHours);

    const isLateCancel = now > cutoffTime;

    // Refund credit if not late
    if (!isLateCancel && booking.creditsUsed > 0) {
      const user = await User.findById(booking.user).session(session);
      user.classCredits += booking.creditsUsed;
      await user.save({ session });
    }

    // Update counts
    if (booking.status === 'waitlisted') {
      classSession.waitlistCount = Math.max(0, classSession.waitlistCount - 1);
    } else if (booking.status === 'confirmed' || booking.status === 'promoted') {
      classSession.bookedCount = Math.max(0, classSession.bookedCount - 1);
    }

    await classSession.save({ session });

    booking.status = 'cancelled';
    booking.cancelledAt = now;
    booking.cancellationReason = isLateCancel ? 'Late cancellation (no refund)' : 'Cancelled by user';
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Trigger promotion cascade for the next person in line
    if (booking.status === 'cancelled' && (classSession.bookedCount < classSession.maxCapacity)) {
      promoteNextWaitlisted(classSession._id).catch(e => console.warn('Waitlist cascade error:', e.message));
    }

    res.json(booking);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: err.message });
  }
});

// Member claims promoted waitlist spot (5-min window)
router.post('/:id/claim-waitlist', requireAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('classSession')
      .session(session);

    if (!booking) throw new Error('Booking not found');
    if (booking.user.toString() !== req.user.id) throw new Error('Unauthorized');
    if (booking.status !== 'promoted') throw new Error(`Booking cannot be claimed (current status: ${booking.status})`);

    const now = new Date();
    if (booking.promotionExpiresAt && booking.promotionExpiresAt < now) {
      throw new Error('Claim window has expired. Spot has been passed to the next member.');
    }

    const classSession = booking.classSession;
    if (classSession.bookedCount >= classSession.maxCapacity) {
      throw new Error('Class is currently full.');
    }

    // Deduct 1 credit from user
    const user = await User.findById(req.user.id).session(session);
    if ((user.classCredits || 0) < 1) {
      throw new Error('Insufficient studio credits. Please top up your credit pack to claim this spot.');
    }

    user.classCredits -= 1;
    await user.save({ session });

    // Deduct from earliest expiring CreditGrant (FIFO)
    const activeGrant = await CreditGrant.findOne({
      user: user._id,
      status: 'active',
      creditsRemaining: { $gt: 0 },
      expiresAt: { $gte: now }
    }).sort({ expiresAt: 1 }).session(session);

    if (activeGrant) {
      activeGrant.creditsRemaining -= 1;
      if (activeGrant.creditsRemaining <= 0) activeGrant.status = 'exhausted';
      await activeGrant.save({ session });
    }

    // Confirm booking
    booking.status = 'confirmed';
    booking.paymentMethod = 'credit';
    booking.paymentStatus = 'paid';
    booking.creditsUsed = 1;
    await booking.save({ session });

    classSession.bookedCount += 1;
    classSession.waitlistCount = Math.max(0, classSession.waitlistCount - 1);
    await classSession.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Trigger confirmation email with pass & calendar invite
    ClassSession.findById(classSession._id)
      .populate('classType')
      .populate('instructor')
      .then(popSession => {
        if (popSession) {
          sendBookingConfirmation({ user, classSession: popSession, booking }).catch(e => console.warn('Claim email error:', e.message));
        }
      })
      .catch(e => console.warn('Populate claim session error:', e.message));

    res.json({ success: true, message: 'Spot claimed successfully! Class is confirmed.', booking });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: err.message });
  }
});

// Member voluntarily declines / passes the waitlist spot
router.post('/:id/decline-waitlist', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.user.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = 'Declined by member (passed to next person)';
    await booking.save();

    // Trigger cascade to next member immediately
    promoteNextWaitlisted(booking.classSession).catch(e => console.warn('Cascade error on decline:', e.message));

    res.json({ success: true, message: 'Spot passed to next member in line.', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Kiosk Check-In (Public) ──

// Find today's bookings for a user by email
router.get('/today-by-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json([]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      user: user._id,
      status: 'confirmed'
    })
    .populate({
      path: 'classSession',
      match: { startTime: { $gte: startOfDay, $lte: endOfDay } },
      populate: [{ path: 'classType' }, { path: 'instructor' }]
    })
    .sort({ 'classSession.startTime': 1 });

    // Filter out bookings where the populated classSession was null (because it didn't match the time range)
    const todaysBookings = bookings.filter(b => b.classSession !== null);

    res.json(todaysBookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check-in via Kiosk
router.post('/kiosk-check-in', async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });

    const booking = await Booking.findById(bookingId).populate('classSession');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    if (booking.checkedInAt) {
      return res.status(400).json({ error: 'Already checked in' });
    }

    if (booking.classSession?.startTime) {
      const timeDiffMs = new Date(booking.classSession.startTime) - new Date();
      const minutesBefore = timeDiffMs / (1000 * 60);
      if (minutesBefore > 30) {
        return res.status(400).json({ error: 'Check-in opens 30 minutes before class.' });
      }
    }

    booking.checkedInAt = new Date();
    // We do not set checkedInBy since it's self-service kiosk
    await booking.save();

    res.json({ message: 'Checked in successfully', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
