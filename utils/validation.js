/**
 * Strict shared validation helpers for backend API routes.
 */

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const SEQUENTIAL_PATTERNS = [
  '01234567',
  '12345678',
  '23456789',
  '98765432',
  '87654321',
  '76543210',
];

function validateName(raw, label = 'Full name') {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) {
    return { valid: false, normalized: '', error: `${label} is required.` };
  }
  if (value.length < 2) {
    return { valid: false, normalized: value, error: `${label} must be at least 2 characters.` };
  }
  if (!/[a-zA-Z\u00C0-\u024F]{2,}/.test(value)) {
    return { valid: false, normalized: value, error: `Please enter a valid ${label.toLowerCase()}.` };
  }
  return { valid: true, normalized: value };
}

function validateEmail(raw) {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!value) {
    return { valid: false, normalized: '', error: 'Email address is required.' };
  }
  if (value.length > 254 || /\s/.test(value) || value.includes('..')) {
    return {
      valid: false,
      normalized: value,
      error: 'Please enter a valid email address (e.g. name@example.com).',
    };
  }

  const parts = value.split('@');
  if (parts.length !== 2 || parts[0].length === 0 || parts[0].length > 64) {
    return {
      valid: false,
      normalized: value,
      error: 'Please enter a valid email address (e.g. name@example.com).',
    };
  }

  if (parts[0].startsWith('.') || parts[0].endsWith('.')) {
    return {
      valid: false,
      normalized: value,
      error: 'Please enter a valid email address (e.g. name@example.com).',
    };
  }

  // Require valid domain and alphabetic TLD of at least 2 chars (.com, .ng, .co.uk, etc.)
  if (!EMAIL_REGEX.test(value) || !/\.[a-zA-Z]{2,}$/.test(parts[1])) {
    return {
      valid: false,
      normalized: value,
      error: 'Please enter a complete email address with a valid domain (e.g. name@gmail.com).',
    };
  }

  return { valid: true, normalized: value };
}

function validatePhone(raw) {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) {
    return { valid: false, normalized: '', error: 'Phone number is required.' };
  }

  if (/[a-zA-Z]/.test(value)) {
    return {
      valid: false,
      normalized: value,
      error: 'Phone number cannot contain letters.',
    };
  }

  // Only allow digits, spaces, hyphens, parentheses, dots, and optional leading +
  if (!/^\+?[\d\s\-().]+$/.test(value)) {
    return {
      valid: false,
      normalized: value,
      error: 'Enter a valid phone number using digits only (e.g. +234 803 123 4567).',
    };
  }

  const cleaned = value.replace(/[\s\-().]/g, '');
  const digitsOnly = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;

  // Reject all-repeated (7+ identical consecutive digits) or obvious sequential fake numbers
  if (/(\d)\1{6,}/.test(digitsOnly) || SEQUENTIAL_PATTERNS.some((seq) => digitsOnly.includes(seq))) {
    return {
      valid: false,
      normalized: cleaned,
      error: 'Please enter a real, reachable phone number.',
    };
  }

  // Catch common Nigerian mistake: +234 followed by 0 (e.g. +2340803...)
  if (/^\+?2340\d+/.test(cleaned)) {
    return {
      valid: false,
      normalized: cleaned,
      error: 'Remove the leading "0" after +234 (e.g. +234 803 123 4567).',
    };
  }

  // Nigerian mobile local: 070/071/080/081/090/091 + 8 digits = 11 digits
  if (/^0(?:70|71|80|81|90|91)\d{8}$/.test(cleaned)) {
    return { valid: true, normalized: `+234${cleaned.slice(1)}` };
  }

  // Nigerian Lagos/Abuja landline local: 01 or 09 + 7-8 digits
  if (/^0(?:1|9)\d{7,8}$/.test(cleaned)) {
    return { valid: true, normalized: `+234${cleaned.slice(1)}` };
  }

  // Nigerian international: +234 or 234 followed by mobile (10 digits) or landline (8-9 digits)
  if (/^\+?234(?:(?:70|71|80|81|90|91)\d{8}|(?:1|9)\d{7,8})$/.test(cleaned)) {
    return {
      valid: true,
      normalized: cleaned.startsWith('+') ? cleaned : `+${cleaned}`,
    };
  }

  // If it starts with +234 / 234 or 0 but didn't match valid Nigerian structure above
  if (cleaned.startsWith('+234') || cleaned.startsWith('234') || cleaned.startsWith('0')) {
    return {
      valid: false,
      normalized: cleaned,
      error: 'Enter a valid Nigerian phone number (e.g. 0803 123 4567 or +234 803 123 4567).',
    };
  }

  // International E.164 format (+ followed by non-zero country code and 10 to 15 digits total)
  if (/^\+[1-9]\d{9,14}$/.test(cleaned)) {
    return { valid: true, normalized: cleaned };
  }

  return {
    valid: false,
    normalized: cleaned,
    error: 'Enter a valid phone number (e.g. 0803 123 4567 or +234 803 123 4567).',
  };
}

module.exports = {
  validateName,
  validateEmail,
  validatePhone,
};
