const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

// CMS routes — content_editor or admin
router.use(requireAuth);
router.use(requireRole('admin', 'content_editor'));

// Menu
router.get('/menu',             (req, res) => res.json({ status: 'Phase 3' }));
router.post('/menu/categories', (req, res) => res.json({ status: 'Phase 3' }));
router.post('/menu/items',      (req, res) => res.json({ status: 'Phase 3' }));
router.patch('/menu/items/:id', (req, res) => res.json({ status: 'Phase 3' }));
router.delete('/menu/items/:id',(req, res) => res.json({ status: 'Phase 3' }));

// Announcement Bar
router.get('/announcements',    (req, res) => res.json({ status: 'Phase 3' }));
router.post('/announcements',   (req, res) => res.json({ status: 'Phase 3' }));
router.patch('/announcements/:id',(req, res) => res.json({ status: 'Phase 3' }));
router.delete('/announcements/:id',(req, res) => res.json({ status: 'Phase 3' }));

// FAQs
router.get('/faqs',    (req, res) => res.json({ status: 'Phase 3' }));
router.post('/faqs',   (req, res) => res.json({ status: 'Phase 3' }));
router.patch('/faqs/:id', (req, res) => res.json({ status: 'Phase 3' }));
router.delete('/faqs/:id',(req, res) => res.json({ status: 'Phase 3' }));

// Fashion
router.get('/fashion',        (req, res) => res.json({ status: 'Phase 3' }));
router.post('/fashion/layers',(req, res) => res.json({ status: 'Phase 3' }));
router.post('/fashion/items', (req, res) => res.json({ status: 'Phase 3' }));
router.patch('/fashion/items/:id', (req, res) => res.json({ status: 'Phase 3' }));

module.exports = router;
