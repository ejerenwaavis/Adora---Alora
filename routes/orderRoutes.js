const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { formLimiter } = require('../middleware/rateLimiter');
const { antiBotShield } = require('../middleware/antiBot');

// Create a new order (Checkout)
router.post('/', formLimiter, antiBotShield(), async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, items, totalAmountKobo } = req.body;
    
    // Create the Order document in PENDING state
    const newOrder = new Order({
      customerName,
      customerPhone,
      customerEmail: customerEmail || 'guest@aorahouse.com',
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
    
    // Broadcast via WebSockets to the KDS (usually we might wait until payment succeeds, 
    // but for demo we broadcast it immediately, or KDS can filter for 'ACCEPTED' orders)
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', newOrder);
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
    
    // TODO: Phase 4 - if orderType === 'GLOVO', fire outbound webhook to Glovo
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

module.exports = router;
