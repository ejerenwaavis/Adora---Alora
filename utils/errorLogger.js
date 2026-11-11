const mongoose = require('mongoose');
const ErrorLog = require('../models/ErrorLog');

const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'newpassword',
  'currentpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'authorization',
  'cookie',
  'dev_logs_password'
];

function sanitizeValue(obj, depth = 0) {
  if (obj === null || obj === undefined || depth > 4) return obj;
  if (typeof obj !== 'object') {
    if (typeof obj === 'string' && obj.length > 1000) {
      return `${obj.slice(0, 1000)}…[truncated]`;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.slice(0, 25).map(item => sanitizeValue(item, depth + 1));
  }
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      cleaned[key] = '[REDACTED]';
    } else {
      cleaned[key] = sanitizeValue(val, depth + 1);
    }
  }
  return cleaned;
}

let isWritingError = false;

/**
 * Non-blocking developer error logger. Never throws.
 */
async function logError({
  level = 'error',
  source = 'server',
  message,
  error = null,
  req = null,
  statusCode = 500,
  context = null
} = {}) {
  if (isWritingError) return;
  try {
    isWritingError = true;

    // Skip DB write if mongoose isn't connected yet
    if (mongoose.connection.readyState !== 1) return;

    const finalMessage =
      message ||
      (error && (error.message || String(error))) ||
      'Unknown server error';

    const stack = error && error.stack ? String(error.stack).slice(0, 8000) : '';

    const requestContext = req
      ? {
          query: req.query && Object.keys(req.query).length ? sanitizeValue(req.query) : undefined,
          body: req.body && Object.keys(req.body).length ? sanitizeValue(req.body) : undefined,
          ip: req.ip,
          userAgent: req.headers ? req.headers['user-agent'] : undefined
        }
      : undefined;

    const mergedContext =
      context || requestContext
        ? {
            ...(requestContext || {}),
            ...(context ? { extra: sanitizeValue(context) } : {})
          }
        : null;

    await ErrorLog.create({
      level: ['error', 'warn', 'fatal'].includes(level) ? level : 'error',
      source: String(source || 'server'),
      message: String(finalMessage).slice(0, 2000),
      stack,
      method: req?.method || '',
      path: req?.originalUrl || req?.url || '',
      statusCode: Number(statusCode) || 500,
      userEmail: req?.user?.email || '',
      userRole: req?.user?.role || '',
      context: mergedContext
    });
  } catch (internalErr) {
    // Fallback strictly to process.stderr to guarantee zero recursion
    process.stderr.write(`[ErrorLogger Fallback] ${internalErr.message}\n`);
  } finally {
    isWritingError = false;
  }
}

module.exports = { logError, sanitizeValue };
