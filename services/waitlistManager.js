const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const ClassSession = require('../models/ClassSession');
const User = require('../models/User');
const Setting = require('../models/Setting');
const { sendWaitlistPromotion } = require('./mailer');

/**
 * Promotes the next eligible member in the waitlist queue for a class session.
 * Does NOT deduct credits until the member actively confirms.
 */
async function promoteNextWaitlisted(classSessionId) {
  try {
    const classSession = await ClassSession.findById(classSessionId)
      .populate('classType')
      .populate('instructor');

    if (!classSession || classSession.isCancelled) return null;

    // Rule: Do not cascade/promote if class starts in less than 20 minutes or has already started
    const now = new Date();
    const startTime = new Date(classSession.startTime);
    const timeUntilClassMs = startTime.getTime() - now.getTime();
    const twentyMinutesMs = 20 * 60 * 1000;

    if (timeUntilClassMs < twentyMinutesMs) {
      console.log(`[Waitlist] Class ${classSession.classType?.name} is within 20 minutes of starting. Halting cascade.`);
      return null;
    }

    // Check capacity: only promote if open spots exist
    if (classSession.bookedCount >= classSession.maxCapacity) {
      return null;
    }

    // Check if there is already an active 'promoted' booking awaiting confirmation
    const activePendingPromotion = await Booking.findOne({
      classSession: classSessionId,
      status: 'promoted',
      promotionExpiresAt: { $gt: now }
    });

    if (activePendingPromotion) {
      return null; // Already a member evaluating an open spot
    }

    // Find the next person in line
    const nextBooking = await Booking.findOne({
      classSession: classSessionId,
      status: 'waitlisted'
    }).sort({ createdAt: 1 });

    if (!nextBooking) return null;

    // Read claim window from settings (defaults to 5 minutes)
    const windowSetting = await Setting.findOne({ key: 'waitlist_claim_window_minutes' });
    const windowMinutes = windowSetting ? parseInt(windowSetting.value, 10) : 5;
    const expiresAt = new Date(now.getTime() + windowMinutes * 60 * 1000);

    nextBooking.status = 'promoted';
    nextBooking.promotedAt = now;
    nextBooking.promotionExpiresAt = expiresAt;
    await nextBooking.save();

    const user = await User.findById(nextBooking.user);
    if (user) {
      // Send high-priority claim notification email
      sendWaitlistPromotion({
        user,
        classSession,
        booking: nextBooking,
        expiresMinutes: windowMinutes
      }).catch(err => console.warn('[Waitlist Email Error]', err.message));
    }

    console.log(`[Waitlist] Promoted user ${user?.email} for ${classSession.classType?.name}. Claim deadline: ${expiresAt.toISOString()}`);
    return nextBooking;
  } catch (err) {
    console.error('[Waitlist Promotion Error]', err);
    return null;
  }
}

/**
 * Background worker: finds expired promoted bookings, marks them expired, and cascades to the next person.
 */
async function processExpiredPromotions() {
  try {
    const now = new Date();
    const expiredPromotions = await Booking.find({
      status: 'promoted',
      promotionExpiresAt: { $lt: now }
    });

    for (const booking of expiredPromotions) {
      console.log(`[Waitlist] Claim window expired for booking ${booking._id}. Cascading to next member in line.`);
      booking.status = 'cancelled';
      booking.cancelledAt = now;
      booking.cancellationReason = 'Waitlist claim window expired (5 minutes)';
      await booking.save();

      // Trigger cascade for the next person in line
      await promoteNextWaitlisted(booking.classSession);
    }
  } catch (err) {
    console.error('[Waitlist Process Expired Error]', err);
  }
}

module.exports = {
  promoteNextWaitlisted,
  processExpiredPromotions
};
