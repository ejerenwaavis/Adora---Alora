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
        subject: `Venue: ${v.spacePreference || 'General'} (${v.eventType || 'Event'})`,
        status: v.status,
        updatedAt: v.updatedAt,
        createdAt: v.createdAt,
        messages: v.messages || []
      })),
      ...tickets.map(t => ({
        _id: t._id,
        isVenue: false,
        type: t.type,
        subject: t.subject,
        status: t.status,
        updatedAt: t.updatedAt,
        createdAt: t.createdAt,
        messages: t.messages || []
      }))
    ];

    merged.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Concierge CMS: Get ALL tickets and enquiries with optional status filter
router.get('/concierge-requests', requireAuth, requireRole('admin', 'concierge', 'clerk'), async (req, res) => {
  try {
    const { status } = req.query;
    let venueFilter = {};
    let ticketFilter = {};

    if (status && status !== 'all') {
      if (status === 'new') {
        venueFilter.status = 'new';
        ticketFilter.status = '__none__';
      } else if (status === 'open') {
        ticketFilter.status = 'open';
        venueFilter.status = '__none__';
      } else if (status === 'in_progress') {
        venueFilter.status = { $in: ['awaiting_reply', 'quoted'] };
        ticketFilter.status = 'in_progress';
      } else if (status === 'resolved') {
        venueFilter.status = { $in: ['resolved', 'confirmed'] };
        ticketFilter.status = 'resolved';
      } else if (status === 'closed') {
        venueFilter.status = { $in: ['closed', 'declined'] };
        ticketFilter.status = 'closed';
      } else {
        venueFilter.status = status;
        ticketFilter.status = status;
      }
    }

    const venues = venueFilter.status === '__none__' 
      ? [] 
      : await VenueEnquiry.find(venueFilter).sort({ updatedAt: -1 }).lean();

    const tickets = ticketFilter.status === '__none__'
      ? []
      : await SupportTicket.find(ticketFilter).populate('user', 'firstName lastName email').sort({ updatedAt: -1 }).lean();

    const merged = [
      ...venues.map(v => ({
        _id: v._id,
        isVenue: true,
        type: 'Venue Enquiry',
        subject: `Venue: ${v.spacePreference || 'General'} (${v.eventType || 'Event'})`,
        user: { firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone },
        status: v.status,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        messages: v.messages || [],
        originalData: v
      })),
      ...tickets.map(t => ({
        _id: t._id,
        isVenue: false,
        type: t.type || 'Support Ticket',
        subject: t.subject,
        user: t.user ? { firstName: t.user.firstName, lastName: t.user.lastName, email: t.user.email } : { firstName: 'Guest', lastName: '', email: '' },
        status: t.status,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        messages: t.messages || [],
        originalData: t
      }))
    ];

    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Legacy merged endpoint
router.get('/admin', requireAuth, requireRole('admin', 'concierge', 'clerk'), async (req, res) => {
  try {
    const venues = await VenueEnquiry.find().sort({ updatedAt: -1 }).lean();
    const tickets = await SupportTicket.find().populate('user', 'firstName lastName email').sort({ updatedAt: -1 }).lean();

    const merged = [
      ...venues.map(v => ({
        _id: v._id,
        isVenue: true,
        type: 'Venue Enquiry',
        subject: `Venue: ${v.spacePreference || 'General'} (${v.eventType || 'Event'})`,
        user: { firstName: v.firstName, lastName: v.lastName, email: v.email },
        status: v.status,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        messages: v.messages || [],
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
        messages: t.messages || [],
        originalData: t
      }))
    ];

    merged.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new Support Ticket
router.post('/', requireAuth, async (req, res) => {
  try {
    const { subject, type, message, text } = req.body;
    const messageText = (message || text || '').trim();
    if (!subject || !messageText) return res.status(400).json({ error: 'Subject and message are required' });

    const ticket = new SupportTicket({
      user: req.user._id,
      subject,
      type: type || 'General Message',
      status: 'open',
      messages: [{
        senderId: req.user._id,
        senderName: `${req.user.firstName} ${req.user.lastName}`.trim(),
        senderRole: 'user',
        text: messageText,
        createdAt: new Date(),
        isRead: false
      }]
    });
    
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reply to Ticket (User or Admin/Concierge)
router.post('/:id/message', requireAuth, async (req, res) => {
  try {
    const text = (req.body.text || req.body.message || '').trim();
    if (!text) return res.status(400).json({ error: 'Message cannot be empty' });

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const isStaff = ['admin', 'clerk', 'concierge'].includes(req.user.role);
    
    // Auth check
    if (!isStaff && ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    ticket.messages.push({
      senderId: req.user._id,
      senderName: isStaff ? `Aora House (${req.user.firstName})` : `${req.user.firstName} ${req.user.lastName}`.trim(),
      senderRole: isStaff ? (req.user.role === 'admin' ? 'admin' : 'concierge') : 'user',
      text,
      createdAt: new Date(),
      isRead: false
    });

    if (isStaff && ticket.status === 'open') {
      ticket.status = 'in_progress';
    } else if (!isStaff && ticket.status === 'closed') {
      ticket.status = 'open'; // Reopen on user reply
    }

    await ticket.save();
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin / Concierge: Change ticket status (supports both PATCH and PUT)
const updateStatusHandler = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.route('/:id/status')
  .patch(requireAuth, requireRole('admin', 'clerk', 'concierge'), updateStatusHandler)
  .put(requireAuth, requireRole('admin', 'clerk', 'concierge'), updateStatusHandler);

module.exports = router;
