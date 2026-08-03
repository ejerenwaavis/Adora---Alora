const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

// Stubs — implemented in Phase 5 (Booking Engine)
router.get('/timetable', (req, res) => res.json({ route: 'classes/timetable', status: 'Phase 5 — pending implementation' }));
router.get('/', (req, res) => res.json({ route: 'classes', status: 'Phase 5 — pending implementation' }));
router.get('/:id', (req, res) => res.json({ route: 'classes/:id', status: 'Phase 5 — pending implementation' }));
router.post('/', requireAuth, requireRole('admin', 'content_editor'), (req, res) => res.json({ route: 'classes/create', status: 'Phase 5 — pending implementation' }));
router.patch('/:id', requireAuth, requireRole('admin', 'content_editor'), (req, res) => res.json({ route: 'classes/:id/update', status: 'Phase 5 — pending implementation' }));
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => res.json({ route: 'classes/:id/delete', status: 'Phase 5 — pending implementation' }));

module.exports = router;
