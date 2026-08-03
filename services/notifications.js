const mailer = require('./mailer');

// ── Unified notification dispatcher ───────────────────────────────────────────
// All transactional notifications go through here.
// This makes Phase 11 (adding SMS/WhatsApp) a single-file change.

const EVENTS = {
  BOOKING_CONFIRMED:    'booking.confirmed',
  BOOKING_REMINDER:     'booking.reminder',
  BOOKING_CANCELLED:    'booking.cancelled',
  BOOKING_NO_SHOW:      'booking.no_show',
  WAITLIST_JOINED:      'waitlist.joined',
  WAITLIST_PROMOTED:    'waitlist.promoted',
  WAITLIST_EXPIRED:     'waitlist.expired',
  EVENT_CONFIRMED:      'event.confirmed',
  VENUE_ENQUIRY_ACK:    'venue.enquiry_ack',
  VENUE_ENQUIRY_ADMIN:  'venue.enquiry_admin',
  NEWSLETTER_OPTIN:     'newsletter.optin',
  EMAIL_VERIFY:         'account.verify_email',
  PASSWORD_RESET:       'account.password_reset',
};

async function dispatch(event, payload) {
  switch (event) {
    case EVENTS.BOOKING_CONFIRMED:
      return mailer.sendBookingConfirmation(payload);

    case EVENTS.BOOKING_REMINDER:
      return mailer.sendBookingReminder(payload);

    case EVENTS.WAITLIST_PROMOTED:
      return mailer.sendWaitlistPromotion(payload);

    case EVENTS.VENUE_ENQUIRY_ACK:
      return mailer.sendVenueEnquiryAck(payload);

    case EVENTS.EMAIL_VERIFY:
      return mailer.sendEmailVerification(payload);

    case EVENTS.PASSWORD_RESET:
      return mailer.sendPasswordReset(payload);

    // Phase 11: add SMS/WhatsApp channels here without touching callers
    default:
      console.warn(`[notifications] Unhandled event: ${event}`);
  }
}

module.exports = { dispatch, EVENTS };
