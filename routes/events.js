const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

// Public event listing
router.get('/',      (req, res) => res.json({ route: 'events', status: 'Phase 10 — pending implementation' }));
router.get('/:slug', (req, res) => res.json({ route: 'events/:slug', status: 'Phase 10 — pending implementation' }));

// Admin event management
router.post('/',          requireAuth, requireRole('admin', 'content_editor'), (req, res) => res.json({ status: 'Phase 10 — pending implementation' }));
router.patch('/:id',      requireAuth, requireRole('admin', 'content_editor'), (req, res) => res.json({ status: 'Phase 10 — pending implementation' }));
router.patch('/:id/publish', requireAuth, requireRole('admin'), (req, res) => res.json({ status: 'Phase 10 — pending implementation' }));
router.delete('/:id',     requireAuth, requireRole('admin'), (req, res) => res.json({ status: 'Phase 10 — pending implementation' }));

// Internal event ticket purchase (Phase 10)
router.post('/:id/book', requireAuth, (req, res) => res.json({ status: 'Phase 10 — pending implementation' }));

module.exports = router;
