const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

// Stubs — implemented in Phase 5 (Booking Engine)

router.get('/',  requireAuth, (req, res) => res.json({ route: 'bookings', status: 'Phase 5 — pending implementation' }));
router.post('/', requireAuth, (req, res) => res.json({ route: 'bookings/create', status: 'Phase 5 — pending implementation' }));
router.get('/:id', requireAuth, (req, res) => res.json({ route: 'bookings/:id', status: 'Phase 5 — pending implementation' }));
router.patch('/:id/cancel', requireAuth, (req, res) => res.json({ route: 'bookings/:id/cancel', status: 'Phase 5 — pending implementation' }));
router.post('/:id/checkin', requireAuth, requireRole('admin', 'clerk'), (req, res) => res.json({ route: 'bookings/:id/checkin', status: 'Phase 5 — pending implementation' }));
router.get('/:id/calendar/ics',    requireAuth, (req, res) => res.json({ route: 'calendar/ics',   status: 'Phase 5 — pending implementation' }));
router.get('/:id/calendar/google', requireAuth, (req, res) => res.json({ route: 'calendar/google', status: 'Phase 5 — pending implementation' }));

module.exports = router;
