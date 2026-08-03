const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

// Clerk routes — clerk or admin
router.use(requireAuth);
router.use(requireRole('admin', 'clerk'));

router.get('/dashboard',      (req, res) => res.json({ status: 'Phase 7 — pending implementation' }));
router.get('/today',          (req, res) => res.json({ status: 'Phase 7 — pending implementation' }));   // today's sessions
router.post('/walkin',        (req, res) => res.json({ status: 'Phase 7 — pending implementation' }));   // walk-in booking
router.post('/checkin/:bookingId', (req, res) => res.json({ status: 'Phase 7 — pending implementation' }));
router.post('/enquiry',       (req, res) => res.json({ status: 'Phase 7 — pending implementation' }));   // walk-in enquiry

module.exports = router;
