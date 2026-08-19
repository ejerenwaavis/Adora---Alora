const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const { requireAuth, requireRole } = require('../middleware/auth');

const Booking = require('../models/Booking');
const ClassSession = require('../models/ClassSession');
const User = require('../models/User');
const CreditPack = require('../models/CreditPack');
const Setting = require('../models/Setting');

// STUB: Purchase a credit pack (Phase 5 - simulates payment)
router.post('/purchase-pack', requireAuth, async (req, res) => {
  try {
    const { packId } = req.body;
    const pack = await CreditPack.findById(packId);
    if (!pack) return res.status(404).json({ error: 'Pack not found' });
    if (!pack.isActive) return res.status(400).json({ error: 'Pack is no longer available' });

    // In Phase 6, we will initialize Paystack here and wait for webhook.
    // For now, we simulate success and give credits immediately.
    const user = await User.findById(req.user.id);
    user.classCredits += pack.credits;
    await user.save();

    res.json({ message: 'Pack purchased successfully', newCredits: user.classCredits });
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
router.post('/', requireAuth, async (req, res) => {
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

    // 3. Deduct credit
    const user = await User.findById(req.user.id).session(session);
    if (user.classCredits < 1) throw new Error('Insufficient credits');
    user.classCredits -= 1;
    await user.save({ session });

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
      
      // Waitlist Promotion Logic
      if (classSession.waitlistCount > 0) {
        // Find next person
        const nextInLine = await Booking.findOne({ 
          classSession: classSession._id, 
          status: 'waitlisted' 
        }).sort({ createdAt: 1 }).session(session);

        if (nextInLine) {
          // Get expiration setting
          let expSetting = await Setting.findOne({ key: 'waitlist_expiration_hours' }).session(session);
          const expHours = expSetting ? Number(expSetting.value) : 2;
          
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + expHours);

          nextInLine.status = 'promoted';
          nextInLine.promotedAt = new Date();
          nextInLine.promotionExpiresAt = expiresAt;
          await nextInLine.save({ session });

          // Decrease waitlist count, but wait, do we increment bookedCount yet?
          // No, 'promoted' means they have to confirm, OR we can just auto-confirm them.
          // In standard boutique fitness, they are auto-confirmed if they have a credit (which we already deducted).
          // Let's auto-confirm since we already took their credit!
          nextInLine.status = 'confirmed';
          classSession.bookedCount += 1;
          classSession.waitlistCount -= 1;
          await nextInLine.save({ session });
          // In reality we'd send an email here.
        }
      }
    }

    await classSession.save({ session });

    booking.status = 'cancelled';
    booking.cancelledAt = now;
    booking.cancellationReason = isLateCancel ? 'Late cancellation (no refund)' : 'Cancelled by user';
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();
    res.json(booking);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: err.message });
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

    booking.checkedInAt = new Date();
    // We do not set checkedInBy since it's self-service kiosk
    await booking.save();

    res.json({ message: 'Checked in successfully', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
