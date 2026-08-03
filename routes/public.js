const express = require('express');
const router  = express.Router();

// Public read-only data for the React frontend
// These fire during Phase 2 (static pages) and Phase 3 (CMS content)

router.get('/site/announcements', (req, res) => res.json({ status: 'Phase 3 — pending implementation' }));
router.get('/site/faqs',          (req, res) => res.json({ status: 'Phase 3 — pending implementation' }));
router.get('/menu',               (req, res) => res.json({ status: 'Phase 3 — pending implementation' }));
router.get('/fashion',            (req, res) => res.json({ status: 'Phase 3 — pending implementation' }));
router.get('/venue/spaces',       (req, res) => res.json({ status: 'Phase 9 — pending implementation' }));
router.get('/events',             (req, res) => res.json({ status: 'Phase 10 — pending implementation' }));
router.get('/events/:slug',       (req, res) => res.json({ status: 'Phase 10 — pending implementation' }));
router.get('/classes/timetable',  (req, res) => res.json({ status: 'Phase 5 — pending implementation' }));

module.exports = router;
