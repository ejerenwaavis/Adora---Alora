const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const ErrorLog = require('../models/ErrorLog');
const { authLimiter } = require('../middleware/rateLimiter');

const JWT_SECRET = process.env.JWT_SECRET || 'aora_jwt_secret_key_2026';

function timingSafeCompare(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a || '')).digest();
  const hashB = crypto.createHash('sha256').update(String(b || '')).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function requireDeveloperAuth(req, res, next) {
  const devHeader = req.headers['x-dev-token'];
  const authHeader = req.headers.authorization;
  const token =
    devHeader ||
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);

  if (!token) {
    return res.status(401).json({ error: 'Developer authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.scope !== 'developer_logs') {
      return res.status(403).json({ error: 'Invalid developer scope.' });
    }
    req.devUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Developer session expired or invalid.' });
  }
}

// POST /api/developer/verify
router.post('/verify', authLimiter, (req, res) => {
  const configuredPassword = process.env.DEV_LOGS_PASSWORD;
  if (!configuredPassword) {
    return res.status(503).json({
      error: 'Developer log password is not configured on the server environment.'
    });
  }

  const submitted = req.body?.password;
  if (!submitted || !timingSafeCompare(submitted, configuredPassword)) {
    return res.status(401).json({ error: 'Invalid developer password.' });
  }

  const token = jwt.sign(
    { scope: 'developer_logs', issuedAt: Date.now() },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({ success: true, token, expiresIn: '12h' });
});

// GET /api/developer/logs
router.get('/logs', requireDeveloperAuth, async (req, res) => {
  try {
    const { level = '', source = '', search = '', limit = 150, page = 1 } = req.query;
    const safeLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 150));
    const safePage = Math.max(1, parseInt(page, 10) || 1);

    const filter = {};
    if (level && ['error', 'warn', 'fatal'].includes(level)) {
      filter.level = level;
    }
    if (source && source.trim()) {
      filter.source = source.trim();
    }
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { message: regex },
        { path: regex },
        { source: regex },
        { stack: regex },
        { userEmail: regex }
      ];
    }

    const [logs, total, distinctSources] = await Promise.all([
      ErrorLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      ErrorLog.countDocuments(filter),
      ErrorLog.distinct('source')
    ]);

    res.json({
      success: true,
      logs,
      total,
      page: safePage,
      sources: distinctSources.filter(Boolean).sort(),
      serverInfo: {
        env: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        serverTime: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/developer/logs
router.delete('/logs', requireDeveloperAuth, async (req, res) => {
  try {
    const result = await ErrorLog.deleteMany({});
    res.json({ success: true, deletedCount: result.deletedCount || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
