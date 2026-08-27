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
        subject: \Venue: \ (\)\,
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
    merged.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new support ticket
router.post('/', requireAuth, async (req, res) => {
  try {
    const { subject, type, message, priority } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });

    const newTicket = new SupportTicket({
      user: req.user._id,
      subject,
      type: type || 'General Message',
      priority: priority || 'medium',
      messages: [{
        senderId: req.user._id,
        senderName: \\ \\,
        senderRole: 'user',
        text: message
      }]
    });
    
    await newTicket.save();
    res.status(201).json({ message: 'Ticket created', ticket: newTicket });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Add message to ticket (User or Admin/Concierge)
router.post('/:id/message', requireAuth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    const isOwner = ticket.user.toString() === req.user._id.toString();
    const isStaff = ['admin', 'super_admin', 'concierge'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ error: 'Unauthorized' });

    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Message text required' });

    ticket.messages.push({
      senderId: req.user._id,
      senderName: \\ \\,
      senderRole: isStaff ? 'concierge' : 'user',
      text
    });

    if (isStaff && ticket.status === 'open') ticket.status = 'in_progress';
    await ticket.save();
    res.json({ message: 'Message sent', ticket });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update ticket status (Admin/Concierge)
router.put('/:id/status', requireAuth, requireRole(['admin', 'super_admin', 'concierge']), async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ ticket });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all requests for concierge
router.get('/concierge-requests', requireAuth, requireRole(['admin', 'super_admin', 'concierge']), async (req, res) => {
  try {
    const { status } = req.query;
    let vqQuery = {};
    let stQuery = {};
    if (status && status !== 'all') {
      vqQuery.status = status;
      stQuery.status = status;
    }

    const venues = await VenueEnquiry.find(vqQuery).sort({ updatedAt: -1 }).lean();
    const tickets = await SupportTicket.find(stQuery).populate('user', 'firstName lastName email').sort({ updatedAt: -1 }).lean();

    const merged = [
      ...venues.map(v => ({
        _id: v._id,
        isVenue: true,
        type: 'Venue Enquiry',
        subject: \Venue: \ (\)\,
        user: { firstName: v.firstName, lastName: v.lastName, email: v.email },
        status: v.status,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        messages: v.messages,
        originalData: v
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
        messages: t.messages,
        originalData: t
      }))
    ];

    merged.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(merged);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

module.exports = router;
