const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

// Paystack webhook — no auth, verified by signature
router.post('/webhook', (req, res) => {
  // TODO Phase 6: verify Paystack-Signature header and process events
  res.sendStatus(200);
});

// Initiate payment
router.post('/initialize', requireAuth, (req, res) => res.json({ status: 'Phase 6 — pending implementation' }));

// Verify payment (client calls after redirect)
router.get('/verify/:reference', requireAuth, (req, res) => res.json({ status: 'Phase 6 — pending implementation' }));

// Admin: payment history
router.get('/history', requireAuth, requireRole('admin', 'finance'), (req, res) => res.json({ status: 'Phase 6 — pending implementation' }));

module.exports = router;
