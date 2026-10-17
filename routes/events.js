const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

const EventRecord = require('../models/EventRecord');
const EventBooking = require('../models/EventBooking');
const { sendEventTicketConfirmation } = require('../services/mailer');

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
    
    const qty = ticketQuantity ? parseInt(ticketQuantity, 10) : 1;
    
    if (event.capacity && (event.ticketsSold + qty > event.capacity)) {
      return res.status(400).json({ error: 'Not enough tickets available.' });
    }

    const totalKobo = (event.priceKobo || 0) * qty;

    // If paid event, initialize Paystack transaction
    if (totalKobo > 0) {
      const paystack = require('../services/paystack');
      const reference = paystack.generateReference('AH-EVENT');
      const callbackUrl = `${req.protocol}://${req.get('host')}/payment/verify`;

      const pData = await paystack.initialize({
        email: customerEmail,
        amountKobo: totalKobo,
        reference,
        callbackUrl,
        metadata: {
          paymentType: 'event_ticket',
          eventId: event._id.toString(),
          customerName,
          customerEmail,
          customerPhone: customerPhone || '',
          ticketQuantity: qty,
          userId: req.user?.id || undefined
        }
      });

      return res.json({
        success: true,
        requiresPayment: true,
        authorizationUrl: pData.authorization_url,
        reference: pData.reference
      });
    }

    // Free event: Confirm immediately
    const booking = new EventBooking({
      event: event._id,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      ticketQuantity: qty,
      amountPaidKobo: 0,
      paymentStatus: 'PAID',
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

    // Trigger ticket confirmation email with .ics attachment
    try {
      sendEventTicketConfirmation({
        user: { email: customerEmail, firstName: customerName },
        event,
        booking
      }).catch(e => console.warn('Event ticket email error:', e.message));
    } catch (mailErr) {
      console.warn('Event ticket email trigger error:', mailErr.message);
    }
    
    res.json({ message: 'Booking successful!', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
