const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

// All admin routes require admin role
router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/dashboard',  (req, res) => res.json({ status: 'Phase 3 — pending implementation' }));
router.get('/users',      (req, res) => res.json({ status: 'Phase 3 — pending implementation' }));
router.get('/analytics',  (req, res) => res.json({ status: 'Phase 13 — pending implementation' }));
router.get('/staff',      (req, res) => res.json({ status: 'Phase 3 — pending implementation' }));
router.post('/staff',     (req, res) => res.json({ status: 'Phase 3 — pending implementation' }));
router.patch('/staff/:id',(req, res) => res.json({ status: 'Phase 3 — pending implementation' }));

module.exports = router;
