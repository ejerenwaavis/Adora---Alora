const nodemailer = require('nodemailer');

// ── Transport ──────────────────────────────────────────────────────────────────
let transporter;

function getTransport() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host:   process.env.MAIL_HOST,
    port:   parseInt(process.env.MAIL_PORT, 10) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  return transporter;
}

// ── Core send helper ───────────────────────────────────────────────────────────
async function send({ to, subject, html, text }) {
  const t = getTransport();
  return t.sendMail({
    from:    process.env.MAIL_FROM || '"Adora & Alora" <noreply@adoraandalora.com>',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  });
}

// ── Email templates ────────────────────────────────────────────────────────────
// Wrap any body HTML in the brand shell
function shell(content) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { margin:0; background:#F7EFE1; font-family:'Jost',Arial,sans-serif; font-weight:300; color:#2B2015; }
  .wrap { max-width:600px; margin:0 auto; background:#FCF8F0; }
  .header { background:#2A1D14; padding:32px; text-align:center; }
  .header h1 { color:#F7EFE1; font-size:24px; font-weight:500; margin:0; letter-spacing:0.1em; }
  .body { padding:40px 32px; }
  .footer { background:#2A1D14; padding:24px 32px; text-align:center; color:#9C8770; font-size:13px; }
  .btn { display:inline-block; padding:14px 28px; background:#A4451F; color:#F7EFE1; text-decoration:none; border-radius:999px; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; margin-top:24px; }
  p { line-height:1.7; margin:0 0 16px; }
  .divider { height:1px; background:#E3D3B8; margin:24px 0; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><h1>ADORA &amp; ALORA</h1></div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>Adora &amp; Alora &bull; Lagos, Nigeria</p>
    <p style="margin:4px 0 0;">You are receiving this because you have an account with us.</p>
  </div>
</div>
</body>
</html>`;
}

// ── Specific email senders ─────────────────────────────────────────────────────

// Phase 6: booking confirmation
async function sendBookingConfirmation({ user, classSession, booking, calendarLinks }) {
  // TODO Phase 6: implement with full class details + calendar buttons
  return send({
    to:      user.email,
    subject: 'Your Pilates class is confirmed — Adora & Alora',
    html:    shell(`
      <p>Hi ${user.firstName},</p>
      <p>Your booking is confirmed.</p>
      ${calendarLinks ? `<p>Add to your calendar: <a href="${calendarLinks.google}">Google Calendar</a> | <a href="${calendarLinks.ics}">iCal</a></p>` : ''}
    `),
  });
}

// Phase 11: booking reminder
async function sendBookingReminder({ user, classSession }) {
  // TODO Phase 11
}

// Phase 11: waitlist promotion
async function sendWaitlistPromotion({ user, classSession, expiresAt }) {
  // TODO Phase 11
}

// Phase 9: venue enquiry acknowledgement
async function sendVenueEnquiryAck({ enquiry }) {
  return send({
    to:      enquiry.email,
    subject: 'We received your venue enquiry — Adora & Alora',
    html:    shell(`
      <p>Hi ${enquiry.firstName},</p>
      <p>Thank you for your enquiry about hiring our venue. We'll be in touch within 2 business days.</p>
    `),
  });
}

// Phase 4: email verification
async function sendEmailVerification({ user, token }) {
  const url = `${process.env.APP_URL}/verify-email?token=${token}`;
  return send({
    to:      user.email,
    subject: 'Verify your email — Adora & Alora',
    html:    shell(`
      <p>Hi ${user.firstName},</p>
      <p>Please verify your email address to complete your account setup.</p>
      <a href="${url}" class="btn">Verify Email</a>
    `),
  });
}

// Password reset
async function sendPasswordReset({ user, token }) {
  const url = `${process.env.APP_URL}/reset-password?token=${token}`;
  return send({
    to:      user.email,
    subject: 'Reset your password — Adora & Alora',
    html:    shell(`
      <p>Hi ${user.firstName},</p>
      <p>We received a request to reset your password. This link expires in 1 hour.</p>
      <a href="${url}" class="btn">Reset Password</a>
      <div class="divider"></div>
      <p style="font-size:13px;color:#9C8770;">If you didn't request this, you can safely ignore this email.</p>
    `),
  });
}

module.exports = {
  send,
  sendBookingConfirmation,
  sendBookingReminder,
  sendWaitlistPromotion,
  sendVenueEnquiryAck,
  sendEmailVerification,
  sendPasswordReset,
};
