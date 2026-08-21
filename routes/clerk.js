const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const mongoose = require('mongoose');

const Booking = require('../models/Booking');
const ClassSession = require('../models/ClassSession');
const User = require('../models/User');
const CafeReservation = require('../models/CafeReservation');
const EventRecord = require('../models/EventRecord');
const EventBooking = require('../models/EventBooking');
const ActivityLog = require('../models/ActivityLog');

// Clerk routes — clerk or admin
router.use(requireAuth);
router.use(requireRole('admin', 'clerk'));

// Helper for logging
async function logActivity(userId, action, entityModel, entityId, description) {
  await ActivityLog.create({ user: userId, action, entityModel, entityId, description });
}

// ── QR Check-in ──
router.post('/qr-checkin', async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken || !qrToken.includes(':')) {
      return res.status(400).json({ error: 'Invalid QR code format' });
    }
    const [type, id] = qrToken.split(':');
    
    if (type === 'CLASS') {
      const booking = await Booking.findById(id).populate('user').populate('classSession');
      if (!booking) return res.status(404).json({ error: 'Class booking not found' });
      if (booking.checkedInAt) return res.status(400).json({ error: 'Guest already checked in' });
      
      booking.checkedInAt = new Date();
      booking.checkedInBy = req.user.id;
      await booking.save();
      
      // Update session booked/checkedIn count if not already doing so
      // In this system, bookedCount is already updated on booking.
      
      await logActivity(
        req.user.id, 
        'qr_checkin_class', 
        'Booking', 
        booking._id, 
        `QR Checked in ${booking.user.firstName} ${booking.user.lastName} for class ${booking.classSession._id}`
      );
      
      return res.json({ message: `Successfully checked in ${booking.user.firstName} ${booking.user.lastName}` });
    } else if (type === 'EVENT') {
      const booking = await EventBooking.findById(id).populate('user');
      if (!booking) return res.status(404).json({ error: 'Event booking not found' });
      if (booking.checkedInAt) return res.status(400).json({ error: 'Guest already checked in' });
      
      booking.checkedInAt = new Date();
      await booking.save();
      
      await logActivity(
        req.user.id, 
        'qr_checkin_event', 
        'EventBooking', 
        booking._id, 
        `QR Checked in ${booking.customerName} for event ${booking.event}`
      );
      
      return res.json({ message: `Successfully checked in ${booking.customerName}` });
    } else {
      return res.status(400).json({ error: 'Unknown QR token type' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Global Search ──
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q || q.length < 2) return res.json([]);

    const regex = new RegExp(q, 'i');

    const [users, cafeReservations, eventBookings] = await Promise.all([
      User.find({
        $or: [ { firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex } ]
      }).limit(5),
      CafeReservation.find({
        $or: [ { customerName: regex }, { customerEmail: regex } ]
      }).limit(5),
      EventBooking.find({
        $or: [ { customerName: regex }, { customerEmail: regex } ]
      }).populate('event').limit(5)
    ]);

    const results = [];
    users.forEach(u => results.push({ type: 'User', title: `${u.firstName} ${u.lastName}`, subtitle: u.email }));
    cafeReservations.forEach(r => results.push({ type: 'Cafe Reservation', title: r.customerName, subtitle: `${new Date(r.date).toLocaleDateString()} - ${r.time} - Status: ${r.status}` }));
    eventBookings.forEach(e => results.push({ type: 'Event Booking', title: e.customerName, subtitle: `${e.event?.title || 'Event'} - ${new Date(e.createdAt).toLocaleDateString()}` }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dashboard Overview ──
router.get('/dashboard', async (req, res) => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);

    const classCount = await ClassSession.countDocuments({ startTime: { $gte: startOfDay, $lte: endOfDay } });
    const cafeCount = await CafeReservation.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay } });
    const eventCount = await EventRecord.countDocuments({ startDate: { $gte: startOfDay, $lte: endOfDay } });

    res.json({
      classesToday: classCount,
      cafeReservationsToday: cafeCount,
      eventsToday: eventCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Classes ──
router.get('/classes/today', async (req, res) => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);

    const sessions = await ClassSession.find({ startTime: { $gte: startOfDay, $lte: endOfDay } })
      .populate('classType')
      .populate('instructor')
      .sort({ startTime: 1 });
    
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/classes/:sessionId/roster', async (req, res) => {
  try {
    const bookings = await Booking.find({ classSession: req.params.sessionId })
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/classes/checkin', async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('user').populate('classSession');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.checkedInAt) return res.status(400).json({ error: 'Already checked in' });

    booking.checkedInAt = new Date();
    booking.checkedInBy = req.user.id;
    await booking.save();

    await logActivity(
      req.user.id, 
      'class_checkin', 
      'Booking', 
      booking._id, 
      `Checked in ${booking.user.firstName} ${booking.user.lastName} for class ${booking.classSession._id}`
    );

    res.json({ message: 'Checked in successfully', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/classes/walkin', async (req, res) => {
  // Simplistic walk-in booking simulation
  try {
    const { classSessionId, email, firstName, lastName } = req.body;
    
    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        firstName, lastName, email: email.toLowerCase(), passwordHash: 'walkin-no-password'
      });
    }

    const session = await ClassSession.findById(classSessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    // Create booking
    const booking = new Booking({
      user: user._id,
      classSession: classSessionId,
      status: 'confirmed',
      paymentMethod: 'cash', // Assuming walk-in pays cash at desk
      paymentStatus: 'paid',
      checkedInAt: new Date(),
      checkedInBy: req.user.id
    });
    await booking.save();

    session.bookedCount += 1;
    await session.save();

    await logActivity(
      req.user.id, 
      'class_walkin', 
      'Booking', 
      booking._id, 
      `Walk-in booked and checked in ${user.firstName} ${user.lastName} for class ${session._id}`
    );

    res.json({ message: 'Walk-in successful', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Cafe ──
router.get('/cafe/today', async (req, res) => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);

    const reservations = await CafeReservation.find({ date: { $gte: startOfDay, $lte: endOfDay } })
      .sort({ time: 1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cafe/status', async (req, res) => {
  try {
    const { reservationId, status } = req.body;
    const reservation = await CafeReservation.findById(reservationId);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    reservation.status = status;
    await reservation.save();

    await logActivity(
      req.user.id, 
      'cafe_status_update', 
      'CafeReservation', 
      reservation._id, 
      `Updated cafe reservation for ${reservation.customerName} to ${status}`
    );

    res.json({ message: 'Status updated', reservation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cafe/walkin', async (req, res) => {
  try {
    const { name, email } = req.body;
    const reservation = new CafeReservation({
      customerName: name,
      customerEmail: email || 'walkin@example.com',
      date: new Date(),
      time: 'Walk-in',
      partySize: 1,
      status: 'seated'
    });
    await reservation.save();
    await logActivity(req.user.id, 'cafe_walkin', 'CafeReservation', reservation._id, `Seated cafe walk-in ${name}`);
    res.json({ message: 'Cafe walk-in seated', reservation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Events ──
router.get('/events/upcoming', async (req, res) => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const events = await EventRecord.find({ startDate: { $gte: startOfDay } }).sort({ startDate: 1 }).limit(10);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/events/:eventId/roster', async (req, res) => {
  try {
    const bookings = await EventBooking.find({ event: req.params.eventId }).populate('user', 'firstName lastName');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/events/checkin', async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await EventBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Event booking not found' });
    if (booking.checkedInAt) return res.status(400).json({ error: 'Already checked in' });

    booking.checkedInAt = new Date();
    await booking.save();

    await logActivity(
      req.user.id, 
      'event_checkin', 
      'EventBooking', 
      booking._id, 
      `Checked in ${booking.customerName} for event ${booking.event}`
    );

    res.json({ message: 'Event check-in successful', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/events/walkin', async (req, res) => {
  try {
    const { eventId, name, email } = req.body;
    
    let user = await User.findOne({ email: (email || 'walkin@example.com').toLowerCase() });
    if (!user) {
      const [firstName, ...lastNameArr] = name.split(' ');
      user = await User.create({
        firstName, lastName: lastNameArr.join(' ') || 'Guest', email: (email || 'walkin@example.com').toLowerCase(), passwordHash: 'walkin-no-password'
      });
    }

    const booking = new EventBooking({
      event: eventId,
      user: user._id,
      customerName: name,
      customerEmail: email || 'walkin@example.com',
      tickets: 1,
      totalAmount: 0,
      paymentStatus: 'paid',
      checkedInAt: new Date()
    });
    await booking.save();
    await logActivity(req.user.id, 'event_walkin', 'EventBooking', booking._id, `Checked in event walk-in ${name}`);
    res.json({ message: 'Event walk-in successful', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Logs ──
router.get('/logs', async (req, res) => {
  try {
    const logs = await ActivityLog.find().populate('user', 'firstName lastName email').sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
