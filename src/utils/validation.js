/**
 * Strict shared validation helpers for frontend forms.
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

export function validateName(raw, label = 'Full name') {
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

export function validateEmail(raw) {
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

  if (!EMAIL_REGEX.test(value) || !/\.[a-zA-Z]{2,}$/.test(parts[1])) {
    return {
      valid: false,
      normalized: value,
      error: 'Please enter a complete email address with a valid domain (e.g. name@gmail.com).',
    };
  }

  return { valid: true, normalized: value };
}

export function validatePhone(raw) {
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

  if (!/^\+?[\d\s\-().]+$/.test(value)) {
    return {
      valid: false,
      normalized: value,
      error: 'Enter a valid phone number using digits only (e.g. +234 803 123 4567).',
    };
  }

  const cleaned = value.replace(/[\s\-().]/g, '');
  const digitsOnly = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;

  if (/(\d)\1{6,}/.test(digitsOnly) || SEQUENTIAL_PATTERNS.some((seq) => digitsOnly.includes(seq))) {
    return {
      valid: false,
      normalized: cleaned,
      error: 'Please enter a real, reachable phone number.',
    };
  }

  if (/^\+?2340\d+/.test(cleaned)) {
    return {
      valid: false,
      normalized: cleaned,
      error: 'Remove the leading "0" after +234 (e.g. +234 803 123 4567).',
    };
  }

  if (/^0(?:70|71|80|81|90|91)\d{8}$/.test(cleaned)) {
    return { valid: true, normalized: `+234${cleaned.slice(1)}` };
  }

  if (/^0(?:1|9)\d{7,8}$/.test(cleaned)) {
    return { valid: true, normalized: `+234${cleaned.slice(1)}` };
  }

  if (/^\+?234(?:(?:70|71|80|81|90|91)\d{8}|(?:1|9)\d{7,8})$/.test(cleaned)) {
    return {
      valid: true,
      normalized: cleaned.startsWith('+') ? cleaned : `+${cleaned}`,
    };
  }

  if (cleaned.startsWith('+234') || cleaned.startsWith('234') || cleaned.startsWith('0')) {
    return {
      valid: false,
      normalized: cleaned,
      error: 'Enter a valid Nigerian phone number (e.g. 0803 123 4567 or +234 803 123 4567).',
    };
  }

  if (/^\+[1-9]\d{9,14}$/.test(cleaned)) {
    return { valid: true, normalized: cleaned };
  }

  return {
    valid: false,
    normalized: cleaned,
    error: 'Enter a valid phone number (e.g. 0803 123 4567 or +234 803 123 4567).',
  };
}

export function hasSignedWaiver(user) {
  if (!user) return false;
  return Boolean(
    user.waiver?.signed ||
    user.waiverSigned ||
    user.waiverSignedAt ||
    user.waiverDate
  );
}

export function hasValidEmergencyContact(user) {
  if (!user) return false;
  return Boolean(
    user.emergencyContactName &&
    String(user.emergencyContactName).trim().length >= 2 &&
    user.emergencyContactPhone &&
    String(user.emergencyContactPhone).trim().length >= 8 &&
    user.emergencyContactRelation &&
    String(user.emergencyContactRelation).trim().length >= 2
  );
}

export function isSafetyGateComplete(user) {
  return hasSignedWaiver(user) && hasValidEmergencyContact(user);
}
