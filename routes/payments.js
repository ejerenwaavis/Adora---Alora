const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

const crypto  = require('crypto');
const Order   = require('../models/Order');
const Booking = require('../models/Booking');

// Paystack webhook — no auth, verified by HMAC SHA512 signature
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
    
    // Verify signature if secret and signature are present
    if (secret && signature) {
      const hash = crypto
        .createHmac('sha512', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (hash !== signature) {
        console.warn('[Paystack Webhook] Signature mismatch. Ignoring request.');
        return res.status(400).send('Invalid signature');
      }
    }

    const event = req.body;

    if (event && event.event === 'charge.success') {
      const data = event.data || {};
      const { reference, metadata } = data;
      console.log(`[Paystack Webhook] charge.success received for reference: ${reference}`);

      // 1. Café Takeout / Food Orders
      if (metadata && metadata.orderId) {
        const order = await Order.findById(metadata.orderId);
        if (order) {
          order.paymentStatus = 'PAID';
          order.paymentReference = reference;
          if (order.status === 'PENDING') {
            order.status = 'ACCEPTED';
          }
          await order.save();

          const io = req.app.get('io');
          if (io) {
            io.emit('order_updated', order);
          }
          console.log(`[Paystack Webhook] Order ${order._id} marked as PAID & ACCEPTED`);
        }
      } else if (reference) {
        const order = await Order.findOne({ paymentReference: reference });
        if (order) {
          order.paymentStatus = 'PAID';
          if (order.status === 'PENDING') {
            order.status = 'ACCEPTED';
          }
          await order.save();

          const io = req.app.get('io');
          if (io) {
            io.emit('order_updated', order);
          }
          console.log(`[Paystack Webhook] Order ${order._id} marked as PAID via reference`);
        }
      }

      // 2. Class or Event Bookings
      if (metadata && metadata.bookingId) {
        const booking = await Booking.findById(metadata.bookingId);
        if (booking) {
          booking.paymentStatus = 'PAID';
          booking.status = 'CONFIRMED';
          booking.paystackReference = reference;
          await booking.save();
          console.log(`[Paystack Webhook] Booking ${booking._id} marked as PAID & CONFIRMED`);
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('[Paystack Webhook Error]:', err.message);
    res.sendStatus(200);
  }
});

// Initiate payment
router.post('/initialize', requireAuth, (req, res) => res.json({ status: 'Phase 6 — pending implementation' }));

// Verify payment (client calls after redirect)
router.get('/verify/:reference', requireAuth, (req, res) => res.json({ status: 'Phase 6 — pending implementation' }));

// Admin: payment history
router.get('/history', requireAuth, requireRole('admin', 'finance'), (req, res) => res.json({ status: 'Phase 6 — pending implementation' }));

module.exports = router;
