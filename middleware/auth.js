const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── requireAuth ───────────────────────────────────────────────────────────────
// Verifies the JWT access token from Authorization: Bearer <token>
// Attaches the full user document to req.user
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Account not found or inactive' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ── requireRole ───────────────────────────────────────────────────────────────
// Factory — returns middleware that checks if req.user.role is in the allowed list
// Usage: requireRole('admin', 'clerk')
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error:    'Insufficient permissions',
        required: allowedRoles,
        current:  req.user.role,
      });
    }
    next();
  };
}

// ── Role reference (for documentation / frontend) ─────────────────────────────
const ROLES = {
  ADMIN:           'admin',           // full access
  CLERK:           'clerk',           // front-desk: check-ins, walk-in bookings
  CONTENT_EDITOR:  'content_editor',  // CMS: menu, classes, events, FAQs, announcements
  INSTRUCTOR:      'instructor',      // read-only: class attendance
  FINANCE:         'finance',         // read-only: payments & reports
  MEMBER:          'member',          // standard customer
};

module.exports = { requireAuth, requireRole, ROLES };
