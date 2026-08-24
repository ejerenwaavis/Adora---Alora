const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const VenueSpace = require('../models/VenueSpace');
const VenueEnquiry = require('../models/VenueEnquiry');
const { sendVenueEnquiryAck } = require('../services/mailer');
const { formLimiter } = require('../middleware/rateLimiter');
const { antiBotShield } = require('../middleware/antiBot');

// Public: Get all active spaces
router.get('/spaces', async (req, res) => {
  try {
    const spaces = await VenueSpace.find({
      isActive: true,
      $or: [
        { isHireableVenue: true },
        { spaceType: 'venue_hire' },
        { spaceType: { $exists: false } }
      ]
    }).sort('sortOrder');
    res.json(spaces);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch venue spaces' });
  }
});

router.get('/spaces/:slug', async (req, res) => {
  try {
    const space = await VenueSpace.findOne({ slug: req.params.slug });
    if (!space) return res.status(404).json({ error: 'Venue not found' });
    res.json(space);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// Enquiry form (public submission)
router.post('/enquire', formLimiter, antiBotShield(), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      organisation,
      eventType,
      preferredDate,
      alternativeDate,
      preferredStartTime,
      preferredEndTime,
      guestCount,
      spacePreference,
      seatingStyle,
      cateringRequired,
      avRequired,
      description
    } = req.body;

    if (!firstName || !lastName || !email || !eventType || !preferredDate || !guestCount) {
      return res.status(400).json({ error: 'Missing required enquiry fields.' });
    }

    // Map space preference safely
    let mappedSpace = 'not_sure';
    if (spacePreference === 'the-loft' || spacePreference === 'loft') mappedSpace = 'loft';
    else if (spacePreference === 'the-cafe' || spacePreference === 'cafe') mappedSpace = 'cafe';

    const enquiry = new VenueEnquiry({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      organisation: organisation ? organisation.trim() : '',
      eventType: eventType.trim(),
      preferredDate: new Date(preferredDate),
      alternativeDate: alternativeDate ? new Date(alternativeDate) : undefined,
      preferredStartTime,
      preferredEndTime,
      guestCount: parseInt(guestCount, 10) || 1,
      spacePreference: mappedSpace,
      seatingStyle,
      cateringRequired: Boolean(cateringRequired),
      avRequired: Boolean(avRequired),
      description: description ? description.trim() : '',
      status: 'new'
    });

    await enquiry.save();

    // Broadcast via WebSockets if io is available
    const io = req.app.get('io');
    if (io) {
      io.emit('new_venue_enquiry', enquiry);
    }

    // Send email acknowledgement in background
    try {
      await sendVenueEnquiryAck({ enquiry });
    } catch (mailErr) {
      console.warn('Venue enquiry email ack error:', mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Your venue hire enquiry has been received. Our concierge team will be in touch shortly.',
      enquiry
    });
  } catch (err) {
    console.error('Error saving venue enquiry:', err);
    res.status(500).json({ error: 'Failed to submit enquiry. Please try again.' });
  }
});

// Admin / Clerk enquiry inbox
router.get('/enquiries', requireAuth, requireRole('super_admin', 'admin', 'clerk', 'content_editor'), async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const total = await VenueEnquiry.countDocuments(filter);
    const enquiries = await VenueEnquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10))
      .populate('assignedTo', 'firstName lastName email');

    res.json({ success: true, total, enquiries });
  } catch (err) {
    console.error('Error fetching venue enquiries:', err);
    res.status(500).json({ error: 'Failed to fetch venue enquiries' });
  }
});

// Admin update enquiry status & notes
router.patch('/enquiries/:id', requireAuth, requireRole('super_admin', 'admin', 'clerk'), async (req, res) => {
  try {
    const { status, adminNotes, assignedTo } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    if (status === 'quoted') updateData.quotedAt = new Date();
    if (status === 'confirmed') updateData.confirmedAt = new Date();

    const enquiry = await VenueEnquiry.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ success: true, enquiry });
  } catch (err) {
    console.error('Error updating venue enquiry:', err);
    res.status(500).json({ error: 'Failed to update venue enquiry' });
  }
});

module.exports = router;
