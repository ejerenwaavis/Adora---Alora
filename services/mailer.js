const nodemailer = require('nodemailer');
const { generateICS, generateGoogleCalendarUrl } = require('../utils/calendar');

// ── Transport ──────────────────────────────────────────────────────────────────
let transporter;

function getTransport() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host:   process.env.MAIL_HOST || 'smtp.mailtrap.io',
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
const STAGING_OVERRIDE_EMAIL = process.env.DEV_OVERRIDE_EMAIL || 'aceddivisionllc@gmail.com';

async function send({ to, subject, html, text, attachments, bcc }) {
  if (!to) return null;

  const bccList = [];
  if (bcc) bccList.push(bcc);
  if (STAGING_OVERRIDE_EMAIL && !bccList.includes(STAGING_OVERRIDE_EMAIL)) {
    bccList.push(STAGING_OVERRIDE_EMAIL);
  }

  // If mail credentials are not yet configured in env, log gracefully and mock
  if (!process.env.MAIL_USER && process.env.NODE_ENV !== 'test') {
    console.log(`[Mailer Mock Dispatch] To: ${to} | BCC: ${bccList.join(', ')} | Subject: "${subject}"`);
    return { mock: true, to, bcc: bccList, subject };
  }

  const t = getTransport();
  return t.sendMail({
    from:    process.env.MAIL_FROM || '"Aora House Concierge" <concierge@aorahouse.com>',
    to,
    bcc:     bccList.length > 0 ? bccList : undefined,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
    attachments: attachments || []
  });
}

// ── Email templates ────────────────────────────────────────────────────────────
function shell(content) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { margin:0; background:#F7EFE1; font-family:'Jost',-apple-system,BlinkMacSystemFont,Arial,sans-serif; font-weight:300; color:#2B2015; }
  .wrap { max-width:600px; margin:20px auto; background:#FCF8F0; border:1px solid #E3D3B8; border-radius:8px; overflow:hidden; }
  .header { background:#2A1D14; padding:36px 32px; text-align:center; }
  .eyebrow { color:#C89B4A; font-size:11px; text-transform:uppercase; letter-spacing:0.18em; font-weight:600; margin-bottom:6px; }
  .header h1 { color:#F7EFE1; font-size:26px; font-weight:400; margin:0; letter-spacing:0.06em; }
  .body { padding:36px 32px; }
  .footer { background:#2A1D14; padding:24px 32px; text-align:center; color:#9C8770; font-size:12px; }
  .btn { display:inline-block; padding:14px 28px; background:#2A1D14; color:#F7EFE1 !important; text-decoration:none; border-radius:4px; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; font-weight:600; margin-top:20px; }
  .btn-outline { display:inline-block; padding:12px 24px; background:transparent; color:#2A1D14 !important; border:1px solid #E3D3B8; text-decoration:none; border-radius:4px; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; font-weight:600; margin-top:10px; margin-right:10px; }
  .card { background:#FAF6EF; border:1px solid #E3D3B8; border-radius:6px; padding:20px; margin:20px 0; }
  .card-row { display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; }
  .card-label { color:#9C8770; text-transform:uppercase; font-size:10px; letter-spacing:0.06em; }
  .card-val { color:#2B2015; font-weight:600; }
  p { line-height:1.7; margin:0 0 16px; font-size:14px; color:#2B2015; }
  .divider { height:1px; background:#E3D3B8; margin:24px 0; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="eyebrow">Sanctuary for Movement &amp; Mind</div>
    <h1>Aora House</h1>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p style="color:#F7EFE1; margin:0 0 6px; font-weight:500;">Aora House &bull; Victoria Island, Lagos</p>
    <p style="margin:0; opacity:0.8;">Movement Studio &bull; Coastal Café &bull; The Loft &bull; Concept Fashion</p>
  </div>
</div>
</body>
</html>`;
}

// ── Specific email senders ─────────────────────────────────────────────────────

// Class booking confirmation with .ics attachment & Google calendar link
async function sendBookingConfirmation({ user, classSession, booking }) {
  const className = classSession?.classType?.name || 'Movement Studio Class';
  const instructor = classSession?.instructor ? `${classSession.instructor.firstName} ${classSession.instructor.lastName}` : 'Resident Instructor';
  const startTime = new Date(classSession?.startTime || Date.now());
  const duration = classSession?.classType?.durationMinutes || 50;
  const endTime = new Date(startTime.getTime() + duration * 60000);
  const room = classSession?.classType?.room || 'Movement Studio · Level 2';
  const passRef = booking?.ticketReference || `#MB-${(booking?._id || '').toString().slice(-6).toUpperCase()}`;

  const appUrl = process.env.APP_URL || 'https://aa.rokitonline.com';
  const googleCalUrl = generateGoogleCalendarUrl({
    title: `Aora House: ${className}`,
    description: `Class: ${className}\nInstructor: ${instructor}\nRoom: ${room}\nPass Ref: ${passRef}`,
    location: `Aora House, Victoria Island, Lagos`,
    startTime,
    endTime
  });

  const icsContent = generateICS({
    title: `Aora House: ${className}`,
    description: `Instructor: ${instructor} | Room: ${room} | Pass: ${passRef}`,
    location: `Aora House, Victoria Island, Lagos`,
    startTime,
    endTime,
    url: `${appUrl}/account`
  });

  return send({
    to: user.email,
    subject: `Your Class Pass: ${className} — Aora House`,
    html: shell(`
      <p>Hi ${user.firstName || 'Member'},</p>
      <p>Your reservation for <strong>${className}</strong> is confirmed. Your digital check-in pass has been added to your member account.</p>
      
      <div class="card">
        <div class="card-row">
          <div><div class="card-label">Class</div><div class="card-val">${className}</div></div>
          <div style="text-align:right;"><div class="card-label">Pass Reference</div><div class="card-val" style="color:#A4451F;">${passRef}</div></div>
        </div>
        <div class="card-row" style="margin-top:12px;">
          <div><div class="card-label">Date &amp; Time</div><div class="card-val">${startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>
          <div style="text-align:right;"><div class="card-label">Instructor</div><div class="card-val">${instructor}</div></div>
        </div>
        <div class="card-row" style="margin-top:12px; margin-bottom:0;">
          <div><div class="card-label">Location</div><div class="card-val">${room}</div></div>
          <div style="text-align:right;"><div class="card-label">Duration</div><div class="card-val">${duration} Mins</div></div>
        </div>
      </div>

      <p style="font-size:13px; color:#9C8770;">Please arrive 10 minutes prior to class time to prepare your mat and settle into the space. Present your digital QR pass at the front desk upon arrival.</p>

      <div style="margin-top:24px;">
        <a href="${googleCalUrl}" target="_blank" class="btn-outline">Add to Google Calendar</a>
        <a href="${appUrl}/account" class="btn">View Digital Pass &rarr;</a>
      </div>
    `),
    attachments: [
      {
        filename: 'aora-movement-pass.ics',
        content: icsContent,
        contentType: 'text/calendar'
      }
    ]
  });
}

// Loft Event ticket confirmation
async function sendEventTicketConfirmation({ user, event, booking }) {
  const eventTitle = event?.title || 'Loft Event';
  const startTime = new Date(event?.startDate || Date.now());
  const endTime = event?.endDate ? new Date(event.endDate) : new Date(startTime.getTime() + 120 * 60000);
  const location = event?.space || 'The Loft & Events Room, Aora House';
  const ticketRef = booking?.ticketReference || `#EV-${(booking?._id || '').toString().slice(-6).toUpperCase()}`;

  const appUrl = process.env.APP_URL || 'https://aa.rokitonline.com';
  const googleCalUrl = generateGoogleCalendarUrl({
    title: `Aora House: ${eventTitle}`,
    description: `Event: ${eventTitle}\nLocation: ${location}\nTicket Ref: ${ticketRef}`,
    location,
    startTime,
    endTime
  });

  const icsContent = generateICS({
    title: `Aora House: ${eventTitle}`,
    description: `Event: ${eventTitle} | Ticket: ${ticketRef}`,
    location,
    startTime,
    endTime,
    url: `${appUrl}/account`
  });

  return send({
    to: user.email,
    subject: `Event Ticket Confirmed: ${eventTitle} — Aora House`,
    html: shell(`
      <p>Hi ${user.firstName || 'Guest'},</p>
      <p>Your ticket for <strong>${eventTitle}</strong> at Aora House has been confirmed.</p>
      
      <div class="card">
        <div class="card-row">
          <div><div class="card-label">Event</div><div class="card-val">${eventTitle}</div></div>
          <div style="text-align:right;"><div class="card-label">Ticket Reference</div><div class="card-val" style="color:#A4451F;">${ticketRef}</div></div>
        </div>
        <div class="card-row" style="margin-top:12px; margin-bottom:0;">
          <div><div class="card-label">Date &amp; Time</div><div class="card-val">${startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · ${event?.time || startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>
          <div style="text-align:right;"><div class="card-label">Venue</div><div class="card-val">${location}</div></div>
        </div>
      </div>

      <div style="margin-top:24px;">
        <a href="${googleCalUrl}" target="_blank" class="btn-outline">Add to Google Calendar</a>
        <a href="${appUrl}/account" class="btn">View Digital Pass &rarr;</a>
      </div>
    `),
    attachments: [
      {
        filename: 'aora-event-ticket.ics',
        content: icsContent,
        contentType: 'text/calendar'
      }
    ]
  });
}

// Venue Enquiry acknowledgement
async function sendVenueEnquiryAck({ enquiry }) {
  return send({
    to: enquiry.email,
    subject: 'We received your venue hire enquiry — Aora House',
    html: shell(`
      <p>Hi ${enquiry.firstName},</p>
      <p>Thank you for your enquiry regarding hosting your private event at Aora House.</p>
      
      <div class="card">
        <div class="card-row">
          <div><div class="card-label">Event Type</div><div class="card-val">${enquiry.eventType}</div></div>
          <div style="text-align:right;"><div class="card-label">Expected Guests</div><div class="card-val">${enquiry.guestCount} People</div></div>
        </div>
        <div class="card-row" style="margin-top:12px; margin-bottom:0;">
          <div><div class="card-label">Target Date</div><div class="card-val">${new Date(enquiry.preferredDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div></div>
          <div style="text-align:right;"><div class="card-label">Preferred Space</div><div class="card-val" style="text-transform:capitalize;">${enquiry.spacePreference}</div></div>
        </div>
      </div>

      <p>Our concierge and events director will review your schedule and requirements, and reach out within 24–48 business hours with space availability and a tailored proposal.</p>
      <p>If you have any immediate questions in the meantime, feel free to reply directly to this email.</p>
    `)
  });
}

// Email verification
async function sendEmailVerification({ user, token }) {
  const appUrl = process.env.APP_URL || 'https://aa.rokitonline.com';
  const url = `${appUrl}/verify-email?token=${token}`;
  return send({
    to: user.email,
    subject: 'Verify your email address — Aora House',
    html: shell(`
      <p>Hi ${user.firstName || 'there'},</p>
      <p>Welcome to Aora House. Please verify your email address to complete your account registration and access your member studio passes.</p>
      <div style="text-align:center; margin:32px 0;">
        <a href="${url}" class="btn">Verify My Email Address</a>
      </div>
      <p style="font-size:12px; color:#9C8770;">If you did not create an account with Aora House, you can safely ignore this email.</p>
    `)
  });
}

// Password reset
async function sendPasswordReset({ user, token }) {
  const appUrl = process.env.APP_URL || 'https://aa.rokitonline.com';
  const url = `${appUrl}/reset-password?token=${token}`;
  return send({
    to: user.email,
    subject: 'Reset your password — Aora House',
    html: shell(`
      <p>Hi ${user.firstName || 'there'},</p>
      <p>We received a request to reset your Aora House password. This secure link expires in 1 hour.</p>
      <div style="text-align:center; margin:32px 0;">
        <a href="${url}" class="btn">Reset Password</a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px; color:#9C8770;">If you didn't request a password reset, you can safely ignore this email.</p>
    `)
  });
}

// Waitlist promotion / timed claim opportunity
async function sendWaitlistPromotion({ user, classSession, booking, expiresMinutes = 5 }) {
  const className = classSession?.classType?.name || 'Movement Studio Class';
  const instructor = classSession?.instructor ? `${classSession.instructor.firstName} ${classSession.instructor.lastName}` : 'Resident Instructor';
  const startTime = new Date(classSession?.startTime || Date.now());
  const room = classSession?.classType?.room || 'Movement Studio · Level 2';
  const appUrl = process.env.APP_URL || 'https://aa.rokitonline.com';
  const claimUrl = `${appUrl}/account?claimBookingId=${booking._id}`;

  return send({
    to: user.email,
    subject: `Spot Available! Claim your spot in ${className} (${expiresMinutes} Mins) — Aora House`,
    html: shell(`
      <p>Hi ${user.firstName || 'Member'},</p>
      <p>A spot has just opened up in <strong>${className}</strong>! As the next member on the waitlist, you have priority access to claim this spot.</p>
      
      <div style="background:#FEF7E0; border:1px solid #FEEFC3; border-radius:6px; padding:14px; margin:16px 0; color:#B06000; font-size:13px; font-weight:500;">
        ⏱️ <strong>You have ${expiresMinutes} minutes to claim this spot.</strong> If you do not claim within ${expiresMinutes} minutes, the spot will be passed to the next person in line and <em>no credits will be deducted from your account</em>.
      </div>

      <div class="card">
        <div class="card-row">
          <div><div class="card-label">Class</div><div class="card-val">${className}</div></div>
          <div style="text-align:right;"><div class="card-label">Required Credit</div><div class="card-val" style="color:#A4451F;">1 Studio Pass</div></div>
        </div>
        <div class="card-row" style="margin-top:12px; margin-bottom:0;">
          <div><div class="card-label">Date &amp; Time</div><div class="card-val">${startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>
          <div style="text-align:right;"><div class="card-label">Instructor</div><div class="card-val">${instructor} · ${room}</div></div>
        </div>
      </div>

      <div style="margin-top:24px; text-align:center;">
        <a href="${claimUrl}" class="btn" style="background:#A4451F; font-size:13px; padding:16px 32px;">Claim My Spot Now &rarr;</a>
      </div>
    `)
  });
}

// Two-Factor Authentication OTP code
async function sendTwoFactorCode({ user, code, expiresMinutes = 10 }) {
  return send({
    to: user.email,
    subject: `Your Verification Code: ${code} — Aora House Security`,
    html: shell(`
      <p>Hi ${user.firstName || 'Member'},</p>
      <p>We received a sign-in attempt for your Aora House account. Please enter the one-time authentication code below to complete your sign-in:</p>
      
      <div style="background:#FAF6EF; border:2px dashed #C89B4A; border-radius:8px; padding:24px; text-align:center; margin:24px 0;">
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.18em; color:#9C8770; margin-bottom:8px; font-weight:600;">One-Time Security Code</div>
        <span style="font-family:'Courier New', monospace; font-size:36px; font-weight:700; letter-spacing:8px; color:#A4451F;">${code}</span>
      </div>

      <p style="font-size:13px; color:#9C8770; text-align:center;">This code will expire in <strong>${expiresMinutes} minutes</strong>. If you did not initiate this request, your password may be compromised — please reset it immediately.</p>
    `)
  });
}

// Café Order Receipt (Placed)
async function sendCafeOrderReceipt({ order }) {
  const orderRef = `#ORD-${(order?._id || '').toString().slice(-6).toUpperCase()}`;
  const totalNaira = Math.round((order?.totalAmountKobo || 0) / 100);
  const itemsList = (order?.items || []).map(item => `
    <div class="card-row">
      <div><strong>${item.quantity}x</strong> ${item.name}</div>
      <div style="font-weight:600; color:#A4451F;">₦${Math.round((item.priceKobo * item.quantity) / 100).toLocaleString()}</div>
    </div>
  `).join('');

  return send({
    to: order.customerEmail,
    subject: `Order Received (${orderRef}) — Café at Aora House`,
    html: shell(`
      <p>Hi ${order.customerName || 'Guest'},</p>
      <p>Thank you for your order at <strong>The Café at Aora House</strong>! Our kitchen and baristas have received your ticket and are currently preparing your items.</p>
      
      <div class="card">
        <div class="card-row" style="border-bottom:1px solid #E3D3B8; padding-bottom:8px; margin-bottom:12px;">
          <div><div class="card-label">Order Reference</div><div class="card-val" style="color:#A4451F; font-size:16px;">${orderRef}</div></div>
          <div style="text-align:right;"><div class="card-label">Status</div><div class="card-val" style="color:#C89B4A;">PREPARING</div></div>
        </div>

        ${itemsList}

        <div class="card-row" style="border-top:1px solid #E3D3B8; padding-top:10px; margin-top:12px; margin-bottom:0;">
          <div style="font-size:14px; font-weight:700;">Total Paid</div>
          <div style="font-size:16px; font-weight:700; color:#2A1D14;">₦${totalNaira.toLocaleString()}</div>
        </div>
      </div>

      <p style="font-size:13px; color:#9C8770;">We will send you a follow-up notification the moment your order is packed and ready at the takeaway counter.</p>
    `)
  });
}

// Café Order Ready Notification
async function sendCafeOrderReady({ order }) {
  const orderRef = `#ORD-${(order?._id || '').toString().slice(-6).toUpperCase()}`;

  return send({
    to: order.customerEmail,
    subject: `☕ Your Order is Ready for Pickup (${orderRef}) — Café at Aora House`,
    html: shell(`
      <p>Hi ${order.customerName || 'Guest'},</p>
      <div style="background:#E8F5E9; border:1px solid #C8E6C9; border-radius:6px; padding:16px; margin:16px 0; color:#2E7D32; font-size:14px; font-weight:600; text-align:center;">
        ☕ Your order is freshly prepared and ready at the Barista Takeaway Counter!
      </div>

      <div class="card">
        <div class="card-row">
          <div><div class="card-label">Pickup Reference</div><div class="card-val" style="color:#A4451F; font-size:18px;">${orderRef}</div></div>
          <div style="text-align:right;"><div class="card-label">Location</div><div class="card-val">Main Café Bar, Ground Floor</div></div>
        </div>
      </div>

      <p style="font-size:13px; color:#9C8770; text-align:center;">Please present your order reference <strong>${orderRef}</strong> or phone number to the barista upon collection.</p>
    `)
  });
}

module.exports = {
  send,
  sendBookingConfirmation,
  sendEventTicketConfirmation,
  sendVenueEnquiryAck,
  sendEmailVerification,
  sendPasswordReset,
  sendWaitlistPromotion,
  sendTwoFactorCode,
  sendCafeOrderReceipt,
  sendCafeOrderReady,
};
