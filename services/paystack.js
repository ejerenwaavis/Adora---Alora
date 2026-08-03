const axios = require('axios');

const BASE_URL = 'https://api.paystack.co';

// ── Axios instance with Paystack auth ─────────────────────────────────────────
function client() {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
}

// ── Initialize a transaction ───────────────────────────────────────────────────
// amount: in KOBO (₦100 = 10000 kobo)
// metadata: { bookingId, userId, type: 'class' | 'event' | 'pack' }
async function initialize({ email, amountKobo, reference, metadata = {}, callbackUrl }) {
  const { data } = await client().post('/transaction/initialize', {
    email,
    amount:       amountKobo,
    reference,
    metadata,
    callback_url: callbackUrl || `${process.env.APP_URL}/payment/verify`,
    currency:     'NGN',
  });
  return data.data; // { authorization_url, access_code, reference }
}

// ── Verify a transaction ───────────────────────────────────────────────────────
async function verify(reference) {
  const { data } = await client().get(`/transaction/verify/${reference}`);
  return data.data; // { status, amount, customer, metadata, ... }
}

// ── Generate a unique reference ────────────────────────────────────────────────
function generateReference(prefix = 'AA') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// ── Verify webhook signature ───────────────────────────────────────────────────
const crypto = require('crypto');
function verifyWebhookSignature(rawBody, signature) {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

// ── Refund a transaction ───────────────────────────────────────────────────────
async function refund({ reference, amountKobo }) {
  const { data } = await client().post('/refund', {
    transaction: reference,
    ...(amountKobo && { amount: amountKobo }),
  });
  return data.data;
}

module.exports = { initialize, verify, generateReference, verifyWebhookSignature, refund };
