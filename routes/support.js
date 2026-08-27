const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const VenueEnquiry = require('../models/VenueEnquiry');
const { requireAuth, requireRole } = require('../middleware/auth');

// Get user's support tickets and venue enquiries
router.get('/my-tickets', requireAuth, async (req, res) => {
  try {
    const venues = await VenueEnquiry.find({ email: req.user.email }).sort({ updatedAt: -1 }).lean();
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ updatedAt: -1 }).lean();

    const merged = [
      ...venues.map(v => ({
        _id: v._id,
        isVenue: true,
        type: 'Venue Enquiry',
        subject: `Venue: ${v.space || 'General'} (${v.eventType || 'Event'})`,
        status: v.status,
        updatedAt: v.updatedAt,
        createdAt: v.createdAt,
        messages: v.messages
      })),
      ...tickets.map(t => ({
        _id: t._id,
        isVenue: false,
        type: t.type,
        subject: t.subject,
        status: t.status,
        updatedAt: t.updatedAt,
        createdAt: t.createdAt,
        messages: t.messages
      }))
    ];

    merged.sort((a, b) => b.updatedAt - a.updatedAt);
    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get ALL tickets and enquiries
router.get('/admin', requireAuth, requireRole(['admin', 'clerk']), async (req, res) => {
  try {
    const venues = await VenueEnquiry.find().sort({ updatedAt: -1 }).lean();
    const tickets = await SupportTicket.find().populate('user', 'firstName lastName email').sort({ updatedAt: -1 }).lean();

    const merged = [
      ...venues.map(v => ({
        _id: v._id,
        isVenue: true,
        type: 'Venue Enquiry',
        subject: `Venue: ${v.space || 'General'} (${v.eventType || 'Event'})`,
        user: { firstName: v.firstName, lastName: v.lastName, email: v.email },
        status: v.status,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
      ...tickets.map(t => ({
        _id: t._id,
        isVenue: false,
        type: t.type,
        subject: t.subject,
        user: t.user,
        status: t.status,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }))
    ];

    merged.sort((a, b) => b.updatedAt - a.updatedAt);
    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new Support Ticket
router.post('/', requireAuth, async (req, res) => {
  try {
    const { subject, type, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });

    const ticket = new SupportTicket({
      user: req.user._id,
      subject,
      type: type || 'General Message',
      status: 'open',
      messages: [{
        sender: 'user',
        senderName: `${req.user.firstName} ${req.user.lastName}`,
        message
      }]
    });
    
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reply to Ticket (User or Admin)
router.post('/:id/message', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message cannot be empty' });

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const isAdmin = ['admin', 'clerk'].includes(req.user.role);
    
    // Auth check
    if (!isAdmin && ticket.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    ticket.messages.push({
      sender: isAdmin ? 'admin' : 'user',
      senderName: isAdmin ? `Aora House (${req.user.firstName})` : `${req.user.firstName} ${req.user.lastName}`,
      message
    });

    if (isAdmin && ticket.status === 'open') {
      ticket.status = 'in-progress';
    } else if (!isAdmin && ticket.status === 'closed') {
      ticket.status = 'open'; // Reopen on user reply
    }

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Change ticket status
router.patch('/:id/status', requireAuth, requireRole(['admin', 'clerk']), async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
