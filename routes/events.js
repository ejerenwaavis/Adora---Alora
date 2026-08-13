const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

const EventRecord = require('../models/EventRecord');

// Public event listing
router.get('/', async (req, res) => {
  try {
    const events = await EventRecord.find({ status: 'published' }).sort('startDate');
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
router.post('/:id/book', requireAuth, (req, res) => res.json({ status: 'Phase 10 — pending implementation' }));

module.exports = router;
