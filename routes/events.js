const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

const EventRecord = require('../models/EventRecord');

// Public event listing
router.get('/', async (req, res) => {
  try {
    const events = await EventRecord.find({ status: 'published', startDate: { $gte: new Date() } }).sort('startDate');
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const event = await EventRecord.findOne({ slug: req.params.slug, status: 'published' });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

// Admin event management
router.post('/',          requireAuth, requireRole('admin', 'content_editor'), (req, res) => res.json({ status: 'Phase 10 — pending implementation' }));
router.patch('/:id',      requireAuth, requireRole('admin', 'content_editor'), (req, res) => res.json({ status: 'Phase 10 — pending implementation' }));
router.patch('/:id/publish', requireAuth, requireRole('admin'), (req, res) => res.json({ status: 'Phase 10 — pending implementation' }));
router.delete('/:id',     requireAuth, requireRole('admin'), (req, res) => res.json({ status: 'Phase 10 — pending implementation' }));

const EventBooking = require('../models/EventBooking');

// Internal event ticket purchase (Phase 10)
router.post('/:id/book', async (req, res) => {
  try {
    const event = await EventRecord.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (event.bookingDestination !== 'internal') {
      return res.status(400).json({ error: 'This event must be booked through the external partner URL.' });
    }

    const { customerName, customerEmail, customerPhone, ticketQuantity } = req.body;
    if (!customerName || !customerEmail) return res.status(400).json({ error: 'Name and Email are required.' });
    
    const qty = ticketQuantity ? parseInt(ticketQuantity) : 1;
    
    if (event.capacity && (event.ticketsSold + qty > event.capacity)) {
      return res.status(400).json({ error: 'Not enough tickets available.' });
    }
    
    const booking = new EventBooking({
      event: event._id,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      ticketQuantity: qty,
      amountPaidKobo: event.priceKobo * qty,
      status: 'confirmed'
    });
    
    // Optional link to logged-in user
    if (req.user) booking.user = req.user.id;
    
    await booking.save();
    
    event.ticketsSold = (event.ticketsSold || 0) + qty;
    if (event.capacity && event.ticketsSold >= event.capacity) {
      event.status = 'sold_out';
    }
    await event.save();
    
    res.json({ message: 'Booking successful!', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
