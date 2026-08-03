const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');

// All user routes require authentication
router.use(requireAuth);

router.get('/profile',        (req, res) => res.json({ user: req.user }));
router.patch('/profile',      (req, res) => res.json({ status: 'Phase 4 — pending implementation' }));
router.patch('/preferences',  (req, res) => res.json({ status: 'Phase 4 — pending implementation' }));
router.post('/waiver',        (req, res) => res.json({ status: 'Phase 4 — pending implementation' }));
router.get('/bookings',       (req, res) => res.json({ status: 'Phase 4 — pending implementation' }));
router.get('/credits',        (req, res) => res.json({ credits: req.user.classCredits }));
router.get('/membership',     (req, res) => res.json({ status: req.user.membershipStatus }));

module.exports = router;
