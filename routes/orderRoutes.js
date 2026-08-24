const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { formLimiter } = require('../middleware/rateLimiter');
const { antiBotShield } = require('../middleware/antiBot');
const { sendCafeOrderReceipt, sendCafeOrderReady } = require('../services/mailer');

// Create a new order (Checkout)
router.post('/', formLimiter, antiBotShield(), async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, items, totalAmountKobo } = req.body;
    
    // Create the Order document in PENDING state
    const newOrder = new Order({
      customerName,
      customerPhone,
      customerEmail: (customerEmail && customerEmail.trim()) || 'guest@aorahouse.com',
      items,
      totalAmountKobo,
      status: 'PENDING'
    });

    await newOrder.save();

    let authorizationUrl = '';
    let paystackRef = '';

    // If Paystack is configured, initialize a real transaction
    if (process.env.PAYSTACK_SECRET_KEY) {
      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newOrder.customerEmail,
          amount: totalAmountKobo,
          reference: `aora_order_${newOrder._id}_${Date.now()}`,
          callback_url: `${req.protocol}://${req.get('host')}/cafe/verify`,
          metadata: { orderId: newOrder._id }
        })
      });
      
      const pData = await paystackRes.json();
      if (pData.status) {
        authorizationUrl = pData.data.authorization_url;
        paystackRef = pData.data.reference;
      } else {
        throw new Error('Paystack initialization failed: ' + pData.message);
      }
    } else {
      // Fallback for local development without keys
      paystackRef = `mock_ref_${Date.now()}`;
      authorizationUrl = `https://mock-paystack.com/checkout/${paystackRef}`;
    }

    newOrder.paymentReference = paystackRef;
    await newOrder.save();
    
    // Broadcast via WebSockets to the KDS
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', newOrder);
    }

    // Trigger instant email receipt to customer (and staging override)
    if (newOrder.customerEmail && newOrder.customerEmail !== 'guest@aorahouse.com') {
      sendCafeOrderReceipt({ order: newOrder }).catch(e => console.warn('Cafe order email receipt error:', e.message));
    }
    
    res.status(201).json({ 
      success: true, 
      order: newOrder,
      message: 'Order placed successfully. Redirect to payment.',
      authorizationUrl
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// Get all active orders (For the KDS and Admin)
router.get('/active', async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: { $in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] } 
    }).sort({ createdAt: 1 });
    
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// Update order status (KDS Action)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    // Broadcast via WebSockets to the KDS
    const io = req.app.get('io');
    if (io) {
      io.emit('order_updated', order);
    }
    
    // Trigger ready email notification when kitchen marks order READY
    if (status === 'READY' && order.customerEmail && order.customerEmail !== 'guest@aorahouse.com') {
      sendCafeOrderReady({ order }).catch(e => console.warn('Cafe order ready email error:', e.message));
    }
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

module.exports = router;
