const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

// Public
router.get('/spaces',     (req, res) => res.json({ status: 'Phase 9 — pending implementation' }));
router.get('/spaces/:slug',(req, res) => res.json({ status: 'Phase 9 — pending implementation' }));

// Enquiry form (public)
router.post('/enquire', (req, res) => res.json({ status: 'Phase 9 — pending implementation' }));

// Admin enquiry inbox
router.get('/enquiries',      requireAuth, requireRole('admin', 'clerk'), (req, res) => res.json({ status: 'Phase 9 — pending implementation' }));
router.patch('/enquiries/:id', requireAuth, requireRole('admin', 'clerk'), (req, res) => res.json({ status: 'Phase 9 — pending implementation' }));

module.exports = router;
