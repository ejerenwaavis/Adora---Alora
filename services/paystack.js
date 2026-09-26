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
async function initialize({ email, amountKobo, reference, metadata = {}, callbackUrl }) {
  const fallbackUrl = process.env.APP_URL 
    ? `${process.env.APP_URL}/payment/verify` 
    : 'https://stage.aorahouse.com/payment/verify';

  const { data } = await client().post('/transaction/initialize', {
    email,
    amount:       Math.round(amountKobo),
    reference,
    metadata,
    callback_url: callbackUrl || fallbackUrl,
    currency:     'NGN',
  });
  return data.data; // { authorization_url, access_code, reference }
}

// ── Verify a transaction ───────────────────────────────────────────────────────
async function verify(reference) {
  const { data } = await client().get(`/transaction/verify/${encodeURIComponent(reference)}`);
  return data.data; // { status, amount, customer, metadata, gateway_response, ... }
}

// ── Format Gateway Error Message ───────────────────────────────────────────────
function formatGatewayError(data) {
  if (!data) return 'The payment could not be processed. Please try again.';
  const resp = data.gateway_response || data.message || '';
  const lower = resp.toLowerCase();

  if (lower.includes('insufficient')) {
    return 'Transaction declined: Insufficient funds in the selected account or card.';
  }
  if (lower.includes('expired')) {
    return 'Transaction declined: The card has expired or the security session timed out.';
  }
  if (lower.includes('incorrect') || lower.includes('invalid pin') || lower.includes('wrong pin')) {
    return 'Transaction declined: Incorrect card details or PIN entered.';
  }
  if (lower.includes('declined') || lower.includes('do not honor')) {
    return 'Transaction declined by your bank or card issuer. Please contact your bank.';
  }
  if (lower.includes('cancelled') || lower.includes('canceled') || lower.includes('abandoned')) {
    return 'Transaction cancelled by customer.';
  }
  return resp || 'Transaction was not successful. Please verify your payment details and retry.';
}

// ── Generate a unique reference ────────────────────────────────────────────────
function generateReference(prefix = 'AH') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// ── Verify webhook signature ───────────────────────────────────────────────────
const crypto = require('crypto');
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;
  const hash = crypto
    .createHmac('sha512', secret)
    .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
    .digest('hex');
  return hash === signature;
}

// ── Refund a transaction ───────────────────────────────────────────────────────
async function refund({ reference, amountKobo }) {
  const { data } = await client().post('/refund', {
    transaction: reference,
    ...(amountKobo && { amount: Math.round(amountKobo) }),
  });
  return data.data;
}

module.exports = { initialize, verify, generateReference, verifyWebhookSignature, refund, formatGatewayError };
