const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const paystack = require('../services/paystack');

const Order        = require('../models/Order');
const Booking      = require('../models/Booking');
const CreditPack   = require('../models/CreditPack');
const CreditGrant  = require('../models/CreditGrant');
const User         = require('../models/User');
const VenueEnquiry = require('../models/VenueEnquiry');
const EventBooking = require('../models/EventBooking');
const EventRecord  = require('../models/EventRecord');
const ClassSession = require('../models/ClassSession');

const {
  sendBookingConfirmation,
  sendCafeOrderReceipt,
  sendEventTicketConfirmation
} = require('../services/mailer');

/**
 * Universal fulfillment logic executed on either Paystack Redirect Verification or Webhook confirmation.
 * Guaranteed idempotent: duplicate calls will not double-grant credits or double-confirm orders.
 */
async function fulfillPayment(data, app) {
  const reference = data.reference;
  const metadata = data.metadata || {};
  const paymentType = metadata.paymentType || metadata.type || '';
  const amountKobo = data.amount || 0;
  const io = app ? app.get('io') : null;

  console.log(`[Paystack Fulfillment] Processing ref: ${reference}, type: ${paymentType}`);

  // ── 1. CAFÉ TAKEOUT ORDER ──────────────────────────────────────────────────
  if (paymentType === 'cafe_order' || metadata.orderId || reference.startsWith('aora_order_') || reference.startsWith('AH-CAFE-')) {
    const orderId = metadata.orderId;
    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ paymentReference: reference });
    }

    if (order) {
      const wasAlreadyPaid = order.paymentStatus === 'PAID';
      order.paymentStatus = 'PAID';
      order.paymentReference = reference;
      if (order.status === 'PENDING') {
        order.status = 'ACCEPTED';
      }
      await order.save();

      if (io) {
        io.emit('order_updated', order);
        if (!wasAlreadyPaid) {
          io.emit('new_order', order);
        }
      }

      if (!wasAlreadyPaid && order.customerEmail && order.customerEmail !== 'guest@aorahouse.com') {
        sendCafeOrderReceipt({ order }).catch(e => console.warn('[Cafe Receipt Mailer]:', e.message));
      }

      return {
        paymentType: 'cafe_order',
        title: 'Café Order Confirmed',
        message: 'Your payment was confirmed. The kitchen has received your order.',
        reference,
        amountNaira: order.totalAmountKobo / 100,
        customerName: order.customerName,
        orderId: order._id,
        order,
        orderNumber: order.orderNumber || order._id.toString().slice(-6).toUpperCase(),
        redirectUrl: `/cafe?orderSuccess=true&orderId=${order._id}`
      };
    }
  }

  // ── 2. CREDIT PACK / PERKS ────────────────────────────────────────────────
  if (paymentType === 'credit_pack' || metadata.packId || reference.startsWith('AH-PACK-')) {
    const packId = metadata.packId;
    const userId = metadata.userId;

    // Check if grant already created for this reference
    let existingGrant = await CreditGrant.findOne({ paymentReference: reference });
    if (existingGrant) {
      const user = await User.findById(existingGrant.user);
      return {
        paymentType: 'credit_pack',
        title: 'Class Credits Added',
        message: `Your account has been credited with ${existingGrant.creditsGranted} credits.`,
        reference,
        amountNaira: (existingGrant.pricePaidKobo || amountKobo) / 100,
        packName: existingGrant.packName,
        creditsGranted: existingGrant.creditsGranted,
        newBalance: user ? user.classCredits : 0,
        redirectUrl: '/movement?packPurchased=true'
      };
    }

    const pack = await CreditPack.findById(packId);
    const user = await User.findById(userId);

    if (pack && user) {
      const expiresInDays = pack.expiresInDays || 60;
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

      const grant = new CreditGrant({
        user: user._id,
        creditPack: pack._id,
        packName: pack.name,
        creditsGranted: pack.credits,
        creditsRemaining: pack.credits,
        pricePaidKobo: amountKobo || pack.priceKobo,
        paymentReference: reference,
        expiresAt,
        status: 'active'
      });
      await grant.save();

      user.classCredits = (user.classCredits || 0) + pack.credits;
      await user.save();

      console.log(`[Paystack Fulfillment] Credited ${pack.credits} to user ${user.email}. New total: ${user.classCredits}`);

      return {
        paymentType: 'credit_pack',
        title: 'Class Credits Added',
        message: `${pack.credits} class credits have been added to your Aora House profile.`,
        reference,
        amountNaira: (amountKobo || pack.priceKobo) / 100,
        packName: pack.name,
        creditsGranted: pack.credits,
        newBalance: user.classCredits,
        redirectUrl: '/movement?packPurchased=true'
      };
    }
  }

  // ── 3. SINGLE CLASS BOOKING (DROP-IN) ───────────────────────────────────────
  if (paymentType === 'class_booking' || metadata.classSessionId || reference.startsWith('AH-CLASS-')) {
    const classSessionId = metadata.classSessionId;
    const userId = metadata.userId;

    let existingBooking = await Booking.findOne({ paystackReference: reference });
    if (!existingBooking && metadata.bookingId) {
      existingBooking = await Booking.findById(metadata.bookingId);
    }

    if (existingBooking) {
      existingBooking.paymentStatus = 'PAID';
      existingBooking.status = 'confirmed';
      existingBooking.paystackReference = reference;
      await existingBooking.save();

      return {
        paymentType: 'class_booking',
        title: 'Class Spot Reserved',
        message: 'Your spot in class is confirmed.',
        reference,
        amountNaira: amountKobo / 100,
        redirectUrl: '/account/orders?tab=classes&booked=true'
      };
    }

    if (classSessionId && userId) {
      const classSession = await ClassSession.findById(classSessionId).populate('classType instructor');
      const user = await User.findById(userId);

      if (classSession && user) {
        const booking = new Booking({
          user: user._id,
          classSession: classSession._id,
          status: 'confirmed',
          paymentStatus: 'PAID',
          paymentMethod: 'paystack',
          paystackReference: reference,
          bookedAt: new Date()
        });
        await booking.save();

        sendBookingConfirmation({
          user,
          booking,
          classSession
        }).catch(e => console.warn('[Class Booking Mailer]:', e.message));

        return {
          paymentType: 'class_booking',
          title: 'Class Spot Reserved',
          message: `You are booked into ${classSession.classType?.name || 'Class'}.`,
          reference,
          amountNaira: amountKobo / 100,
          className: classSession.classType?.name,
          instructor: classSession.instructor ? `${classSession.instructor.firstName} ${classSession.instructor.lastName}` : '',
          startTime: classSession.startTime,
          redirectUrl: '/movement?booked=true'
        };
      }
    }
  }

  // ── 4. VENUE HIRE / QUOTE DEPOSIT ──────────────────────────────────────────
  if (paymentType === 'venue_enquiry' || metadata.enquiryId || reference.startsWith('AH-VENUE-')) {
    const enquiryId = metadata.enquiryId;
    let enquiry = null;
    if (enquiryId) {
      enquiry = await VenueEnquiry.findById(enquiryId);
    }
    if (!enquiry) {
      enquiry = await VenueEnquiry.findOne({ paymentReference: reference });
    }

    if (enquiry) {
      enquiry.depositPaid = true;
      enquiry.paymentReference = reference;
      enquiry.paidAt = new Date();
      enquiry.status = 'confirmed';
      await enquiry.save();

      if (io) {
        io.emit('venue_enquiry_updated', enquiry);
      }

      return {
        paymentType: 'venue_enquiry',
        title: 'Venue Deposit Received',
        message: 'Your venue booking deposit has been processed. Concierge is preparing your date.',
        reference,
        amountNaira: amountKobo / 100,
        enquiryId: enquiry._id,
        eventType: enquiry.eventType,
        preferredDate: enquiry.preferredDate,
        redirectUrl: '/venue-hire?paymentSuccess=true'
      };
    }
  }

  // ── 5. EVENT TICKET ────────────────────────────────────────────────────────
  if (paymentType === 'event_ticket' || metadata.eventId || reference.startsWith('AH-EVENT-')) {
    const eventId = metadata.eventId;
    let eventBooking = await EventBooking.findOne({ paymentReference: reference });

    if (!eventBooking && eventId) {
      const event = await EventRecord.findById(eventId);
      if (event) {
        const qty = parseInt(metadata.ticketQuantity || '1', 10);
        eventBooking = new EventBooking({
          event: event._id,
          user: metadata.userId || undefined,
          customerName: metadata.customerName || data.customer?.first_name || 'Guest',
          customerEmail: metadata.customerEmail || data.customer?.email || 'guest@aorahouse.com',
          customerPhone: metadata.customerPhone || data.customer?.phone || '',
          ticketQuantity: qty,
          amountPaidKobo: amountKobo,
          paymentReference: reference,
          paymentStatus: 'PAID',
          status: 'confirmed'
        });
        await eventBooking.save();

        event.ticketsSold = (event.ticketsSold || 0) + qty;
        if (event.capacity && event.ticketsSold >= event.capacity) {
          event.status = 'sold_out';
        }
        await event.save();

        sendEventTicketConfirmation({
          user: { email: eventBooking.customerEmail, firstName: eventBooking.customerName },
          event,
          booking: eventBooking
        }).catch(e => console.warn('[Event Ticket Mailer]:', e.message));
      }
    } else if (eventBooking) {
      eventBooking.paymentStatus = 'PAID';
      eventBooking.status = 'confirmed';
      await eventBooking.save();
    }

    return {
      paymentType: 'event_ticket',
      title: 'Event Tickets Confirmed',
      message: 'Your ticket has been confirmed. A calendar invite has been sent to your email.',
      reference,
      amountNaira: amountKobo / 100,
      redirectUrl: '/events?ticketSuccess=true'
    };
  }

  // Generic fallback if payment succeeded but type unrecognized
  return {
    paymentType: 'generic',
    title: 'Payment Successful',
    message: 'Your payment was received and verified.',
    reference,
    amountNaira: amountKobo / 100,
    redirectUrl: '/'
  };
}

// ── CLIENT-FACING PAYMENT VERIFICATION (Called by /payment/verify) ───────────
router.get('/verify/:reference', async (req, res) => {
  const { reference } = req.params;
  if (!reference) {
    return res.status(400).json({ success: false, message: 'Payment reference is required.' });
  }

  try {
    const data = await paystack.verify(reference);

    if (data && data.status === 'success') {
      const fulfillment = await fulfillPayment(data, req.app);
      return res.json({
        success: true,
        status: 'success',
        ...fulfillment
      });
    }

    // If status is not success (abandoned, failed, etc.)
    const errorMessage = paystack.formatGatewayError(data);
    return res.status(200).json({
      success: false,
      status: data?.status || 'failed',
      gateway_response: data?.gateway_response || 'Declined',
      message: errorMessage,
      reference
    });
  } catch (err) {
    console.error(`[Paystack Verification Error for ${reference}]:`, err.response?.data || err.message);
    const apiError = err.response?.data?.message || err.message;
    return res.status(200).json({
      success: false,
      status: 'error',
      gateway_response: apiError,
      message: `Unable to verify payment with Paystack: ${apiError}`,
      reference
    });
  }
});

// ── PAYSTACK WEBHOOK (Server-to-Server HMAC Verified) ─────────────────────────
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const rawBody = req.body;

    const isValid = paystack.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('[Paystack Webhook] Signature mismatch or unverified webhook. Header:', signature);
      if (process.env.PAYSTACK_WEBHOOK_SECRET) {
        return res.status(400).send('Invalid signature');
      }
    }

    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;

    if (event && event.event === 'charge.success') {
      const data = event.data || {};
      console.log(`[Paystack Webhook] Verified charge.success for ref: ${data.reference}`);
      await fulfillPayment(data, req.app);
    } else {
      console.log(`[Paystack Webhook] Ignored non-charge event: ${event?.event}`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('[Paystack Webhook Error]:', err.message);
    res.sendStatus(200); // Always respond 200 so Paystack stops retrying
  }
});

// ── TRANSACTION INITIALIZATION ENDPOINT (Generic) ───────────────────────────
router.post('/initialize', requireAuth, async (req, res) => {
  try {
    const { amountKobo, paymentType, metadata = {}, callbackUrl } = req.body;
    if (!amountKobo || amountKobo <= 0) {
      return res.status(400).json({ error: 'Valid amount in kobo is required' });
    }

    const reference = paystack.generateReference(paymentType ? `AH-${paymentType.slice(0, 4).toUpperCase()}` : 'AH');
    const user = req.user;

    const data = await paystack.initialize({
      email: user.email,
      amountKobo,
      reference,
      callbackUrl,
      metadata: {
        ...metadata,
        paymentType,
        userId: user.id || user._id
      }
    });

    res.json({
      success: true,
      authorizationUrl: data.authorization_url,
      reference: data.reference,
      accessCode: data.access_code
    });
  } catch (err) {
    console.error('[Paystack Init Error]:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Failed to initialize payment transaction.' });
  }
});

module.exports = router;
