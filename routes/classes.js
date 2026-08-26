const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ClassSession = require('../models/ClassSession');
const ClassType = require('../models/ClassType');
const Instructor = require('../models/Instructor');
const CreditPack = require('../models/CreditPack');

// PUBLIC: Get active credit packs
router.get('/credit-packs', async (req, res) => {
  try {
    const packs = await CreditPack.find({ isActive: true }).sort({ sortOrder: 1, priceKobo: 1 });
    res.json(packs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

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

// Helper: Generate occurrence timestamps for recurring schedules
function generateOccurrences({ baseStart, baseEnd, frequency, daysOfWeek = [], repeatCount = 4, repeatUntil = null }) {
  const occurrences = [];
  const durationMs = baseEnd.getTime() - baseStart.getTime();
  const maxSafetyLimit = 52;
  const targetCount = repeatUntil ? maxSafetyLimit : Math.min(Math.max(parseInt(repeatCount) || 1, 1), maxSafetyLimit);
  const untilDate = repeatUntil ? new Date(repeatUntil) : null;

  if (frequency === 'daily') {
    let currStart = new Date(baseStart);
    while (occurrences.length < targetCount) {
      if (untilDate && currStart > untilDate) break;
      const currEnd = new Date(currStart.getTime() + durationMs);
      occurrences.push({ startTime: new Date(currStart), endTime: currEnd });
      currStart.setDate(currStart.getDate() + 1);
    }
  } else if (frequency === 'weekly' || frequency === 'biweekly') {
    const stepWeeks = frequency === 'biweekly' ? 2 : 1;
    const activeDays = Array.isArray(daysOfWeek) && daysOfWeek.length > 0 ? daysOfWeek.map(Number) : [baseStart.getDay()];
    
    let weekStart = new Date(baseStart);
    const dayOffset = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - dayOffset);

    let weekCounter = 0;
    while (occurrences.length < targetCount && weekCounter < 52) {
      for (const day of [0, 1, 2, 3, 4, 5, 6]) {
        if (activeDays.includes(day)) {
          const occStart = new Date(weekStart);
          occStart.setDate(occStart.getDate() + day);
          occStart.setHours(baseStart.getHours(), baseStart.getMinutes(), 0, 0);

          if (occStart >= baseStart) {
            if (untilDate && occStart > untilDate) break;
            const occEnd = new Date(occStart.getTime() + durationMs);
            occurrences.push({ startTime: occStart, endTime: occEnd });
            if (occurrences.length >= targetCount) break;
          }
        }
      }
      weekStart.setDate(weekStart.getDate() + (7 * stepWeeks));
      weekCounter += stepWeeks;
    }
  } else if (frequency === 'monthly') {
    let currStart = new Date(baseStart);
    while (occurrences.length < targetCount) {
      if (untilDate && currStart > untilDate) break;
      const currEnd = new Date(currStart.getTime() + durationMs);
      occurrences.push({ startTime: new Date(currStart), endTime: currEnd });
      currStart.setMonth(currStart.getMonth() + 1);
    }
  } else {
    occurrences.push({ startTime: new Date(baseStart), endTime: new Date(baseEnd) });
  }

  return occurrences;
}

// ADMIN: Create new class session (single or recurring)
router.post('/', requireAuth, requireRole('admin', 'content_editor'), async (req, res) => {
  try {
    const baseStart = new Date(req.body.startTime);
    const baseEnd = new Date(req.body.endTime || req.body.startTime);
    const now = new Date();
    const hoursDifference = (baseStart - now) / (1000 * 60 * 60);
    
    if (hoursDifference < 6) {
      return res.status(400).json({ error: 'A class must be scheduled at least 6 hours in advance.' });
    }

    // Check if recurring creation was requested
    if (req.body.isRecurring) {
      const recurrence = req.body.recurrence || {};
      const occurrences = generateOccurrences({
        baseStart,
        baseEnd,
        frequency: recurrence.frequency || 'weekly',
        daysOfWeek: recurrence.daysOfWeek || [],
        repeatCount: recurrence.repeatCount || 4,
        repeatUntil: recurrence.repeatUntil || null
      });

      if (occurrences.length === 0) {
        return res.status(400).json({ error: 'No recurring sessions could be generated with the given parameters.' });
      }

      const seriesId = 'series_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const docsToInsert = occurrences.map(occ => ({
        ...req.body,
        startTime: occ.startTime,
        endTime: occ.endTime,
        isRecurring: true,
        seriesId,
        recurrence: {
          frequency: recurrence.frequency || 'weekly',
          daysOfWeek: recurrence.daysOfWeek || [baseStart.getDay()],
          repeatCount: occurrences.length,
          repeatUntil: recurrence.repeatUntil || null
        }
      }));

      const createdSessions = await ClassSession.insertMany(docsToInsert);
      return res.status(201).json({
        message: `Successfully created ${createdSessions.length} recurring class sessions.`,
        count: createdSessions.length,
        seriesId,
        sessions: createdSessions
      });
    }

    const session = new ClassSession(req.body);
    await session.save();
    res.status(201).json(await session.populate('classType instructor'));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ADMIN: Update a class session (or convert to recurring / update series)
router.patch('/:id', requireAuth, requireRole('admin', 'content_editor'), async (req, res) => {
  try {
    const existing = await ClassSession.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const newStart = req.body.startTime ? new Date(req.body.startTime) : new Date(existing.startTime);
    const newEnd = req.body.endTime ? new Date(req.body.endTime) : new Date(existing.endTime);
    const oldStart = new Date(existing.startTime);
    
    if (newStart.getTime() !== oldStart.getTime()) {
      const now = new Date();
      const hoursDifference = (newStart - now) / (1000 * 60 * 60);
      if (hoursDifference < 6) {
        return res.status(400).json({ error: 'A class must be scheduled at least 6 hours in advance.' });
      }
    }

    // CASE 1: Converting a single session into a new recurring series
    if (req.body.isRecurring && (!existing.isRecurring || !existing.seriesId)) {
      const recurrence = req.body.recurrence || {};
      const occurrences = generateOccurrences({
        baseStart: newStart,
        baseEnd: newEnd,
        frequency: recurrence.frequency || 'weekly',
        daysOfWeek: recurrence.daysOfWeek || [newStart.getDay()],
        repeatCount: recurrence.repeatCount || 4,
        repeatUntil: recurrence.repeatUntil || null
      });

      const seriesId = 'series_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

      // 1. Update the existing session as occurrence #1
      const updatedFirstSession = await ClassSession.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          startTime: newStart,
          endTime: newEnd,
          isRecurring: true,
          seriesId,
          recurrence: {
            frequency: recurrence.frequency || 'weekly',
            daysOfWeek: recurrence.daysOfWeek || [newStart.getDay()],
            repeatCount: occurrences.length,
            repeatUntil: recurrence.repeatUntil || null
          }
        },
        { new: true, runValidators: true }
      ).populate('classType instructor');

      // 2. Generate and insert the remaining occurrences (from index 1 onwards)
      if (occurrences.length > 1) {
        const remainingDocs = occurrences.slice(1).map(occ => ({
          ...req.body,
          startTime: occ.startTime,
          endTime: occ.endTime,
          isRecurring: true,
          seriesId,
          recurrence: {
            frequency: recurrence.frequency || 'weekly',
            daysOfWeek: recurrence.daysOfWeek || [newStart.getDay()],
            repeatCount: occurrences.length,
            repeatUntil: recurrence.repeatUntil || null
          }
        }));
        await ClassSession.insertMany(remainingDocs);
      }

      return res.json({
        message: `Successfully converted session to a recurring series with ${occurrences.length} total sessions.`,
        session: updatedFirstSession,
        count: occurrences.length,
        seriesId
      });
    }

    // CASE 2: Already recurring session — check if user requested to propagate updates to all future sessions in series
    if (existing.isRecurring && existing.seriesId && req.body.updateSeries) {
      await ClassSession.updateMany(
        { seriesId: existing.seriesId, startTime: { $gte: existing.startTime } },
        {
          classType: req.body.classType || existing.classType,
          instructor: req.body.instructor || existing.instructor,
          maxCapacity: req.body.maxCapacity !== undefined ? req.body.maxCapacity : existing.maxCapacity,
          isPublic: req.body.isPublic !== undefined ? req.body.isPublic : existing.isPublic
        }
      );
    }

    // Normal update for this single session
    const session = await ClassSession.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('classType instructor');
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ADMIN: Delete a single class session
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const session = await ClassSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Delete all sessions in a recurring series
router.delete('/series/:seriesId', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await ClassSession.deleteMany({ seriesId: req.params.seriesId });
    res.json({ message: `Successfully deleted ${result.deletedCount} sessions in this recurring series.`, count: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
