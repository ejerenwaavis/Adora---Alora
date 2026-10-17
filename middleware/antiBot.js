const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'aora_house_bot_secret_key_2026';

/**
 * Generates a signed cryptographic token containing the issuance timestamp.
 */
function generateFormToken() {
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac('sha256', SECRET).update(timestamp).digest('hex');
  return Buffer.from(`${timestamp}:${signature}`).toString('base64');
}

/**
 * Validates the form token and enforces the time-trap (minimum 1.5 seconds, max 2 hours).
 */
function validateFormToken(token) {
  if (!token) return { valid: false, reason: 'Missing anti-bot security token.' };

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [timestampStr, signature] = decoded.split(':');
    if (!timestampStr || !signature) {
      return { valid: false, reason: 'Malformed security token.' };
    }

    // Verify HMAC signature
    const expectedSignature = crypto.createHmac('sha256', SECRET).update(timestampStr).digest('hex');
    if (signature !== expectedSignature) {
      return { valid: false, reason: 'Invalid or forged security token.' };
    }

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const elapsedMs = now - timestamp;


    // Time-trap 2: Token expired (> 2 hours)
    if (elapsedMs > 2 * 60 * 60 * 1000) {
      return { valid: false, reason: 'Security session expired. Please refresh the page and try again.' };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, reason: 'Security token validation failed.' };
  }
}

/**
 * Express middleware for public forms: checks honeypots and form token.
 */
function antiBotShield(options = {}) {
  const { requireToken = false } = options;

  return (req, res, next) => {
    // 1. Honeypot check: common crawler decoy fields
    const honeypotFields = ['_aora_uid', '_aora_session', '_hp_website', '_hp_company', '_hp_fax', 'bot_trap_field'];
    for (const field of honeypotFields) {
      if (req.body && req.body[field]) {
        console.warn(`[Anti-Bot] Honeypot triggered on field "${field}" from IP: ${req.ip}`);
        // Return 200 OK or 400 Bad Request to confuse crawler
        return res.status(400).json({ error: 'Automated submission rejected.' });
      }
    }

    // 2. Form token check
    if (requireToken) {
      const token = req.body?._form_token || req.headers['x-form-token'];
      const result = validateFormToken(token);
      if (!result.valid) {
        console.warn(`[Anti-Bot] Token validation failed: ${result.reason} (IP: ${req.ip})`);
        return res.status(400).json({ error: result.reason });
      }
    }

    next();
  };
}

module.exports = {
  generateFormToken,
  validateFormToken,
  antiBotShield
};
