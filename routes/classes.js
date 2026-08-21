const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ClassSession = require('../models/ClassSession');
const ClassType = require('../models/ClassType');
const Instructor = require('../models/Instructor');

// PUBLIC: Get timetable for a date range
router.get('/timetable', async (req, res) => {
  try {
    const { start, end } = req.query;
    const query = { isPublic: true, isCancelled: false };
    
    query.startTime = { $gte: new Date() };
    if (start) query.startTime.$gte = new Date(start);
    if (end) query.startTime.$lte = new Date(end);
    const sessions = await ClassSession.find(query)
      .populate('classType')
      .populate('instructor')
      .sort({ startTime: 1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Get all class sessions (including cancelled/hidden)
router.get('/', requireAuth, requireRole('admin', 'content_editor', 'clerk'), async (req, res) => {
  try {
    const { start, end } = req.query;
    const query = {};
    if (start && end) {
      query.startTime = { $gte: new Date(start), $lte: new Date(end) };
    }
    const sessions = await ClassSession.find(query)
      .populate('classType')
      .populate('instructor')
      .sort({ startTime: 1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const session = await ClassSession.findById(req.params.id)
      .populate('classType')
      .populate('instructor');
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Create a new class session
router.post('/', requireAuth, requireRole('admin', 'content_editor'), async (req, res) => {
  try {
    const startTime = new Date(req.body.startTime);
    const now = new Date();
    const hoursDifference = (startTime - now) / (1000 * 60 * 60);
    
    if (hoursDifference < 6) {
      return res.status(400).json({ error: 'A class must be scheduled at least 6 hours in advance.' });
    }

    const session = new ClassSession(req.body);
    await session.save();
    res.status(201).json(await session.populate('classType instructor'));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ADMIN: Update a class session
router.patch('/:id', requireAuth, requireRole('admin', 'content_editor'), async (req, res) => {
  try {
    if (req.body.startTime) {
      const existing = await ClassSession.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Not found' });
      
      const newStart = new Date(req.body.startTime);
      const oldStart = new Date(existing.startTime);
      
      if (newStart.getTime() !== oldStart.getTime()) {
        const now = new Date();
        const hoursDifference = (newStart - now) / (1000 * 60 * 60);
        if (hoursDifference < 6) {
          return res.status(400).json({ error: 'A class must be scheduled at least 6 hours in advance.' });
        }
      }
    }

    const session = await ClassSession.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('classType instructor');
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ADMIN: Delete a class session
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const session = await ClassSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
