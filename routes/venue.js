const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

const VenueSpace = require('../models/VenueSpace');

// Public
router.get('/spaces', async (req, res) => {
  try {
    const spaces = await VenueSpace.find({ isActive: true }).sort('sortOrder');
    res.json(spaces);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch venue spaces' });
  }
});

router.get('/spaces/:slug', async (req, res) => {
  try {
    const space = await VenueSpace.findOne({ slug: req.params.slug, isActive: true });
    if (!space) return res.status(404).json({ error: 'Venue not found' });
    res.json(space);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// Enquiry form (public)
router.post('/enquire', (req, res) => res.json({ status: 'Phase 9 — pending implementation' }));

// Admin enquiry inbox
router.get('/enquiries',      requireAuth, requireRole('admin', 'clerk'), (req, res) => res.json({ status: 'Phase 9 — pending implementation' }));
router.patch('/enquiries/:id', requireAuth, requireRole('admin', 'clerk'), (req, res) => res.json({ status: 'Phase 9 — pending implementation' }));

module.exports = router;
