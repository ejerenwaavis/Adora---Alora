const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { formLimiter } = require('../middleware/rateLimiter');
const { antiBotShield } = require('../middleware/antiBot');
const { sendCafeOrderReceipt, sendCafeOrderReady } = require('../services/mailer');

// Create a new order (Checkout)
router.post('/', formLimiter, antiBotShield(), async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, items, totalAmountKobo, user: bodyUser, userId } = req.body;
    
    let associatedUser = bodyUser || userId || null;
    if (!associatedUser && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.slice(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && (decoded.sub || decoded.id || decoded._id)) {
          associatedUser = decoded.sub || decoded.id || decoded._id;
        }
      } catch (e) {}
    }

    // Create the Order document in PENDING state
    const newOrder = new Order({
      customerName,
      customerPhone,
      customerEmail: (customerEmail && customerEmail.trim()) || 'guest@aorahouse.com',
      user: associatedUser || undefined,
      items,
      totalAmountKobo,
      status: 'PENDING'
    });

    await newOrder.save();

    let authorizationUrl = '';
    let paystackRef = '';

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;

    if (paystackKey && !paystackKey.includes('replace') && paystackKey.length > 20) {
      try {
        const callbackUrl = `${req.protocol}://${req.get('host')}/payment/verify`;
        const reference = `aora_order_${newOrder._id}_${Date.now()}`;

        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: newOrder.customerEmail,
            amount: totalAmountKobo,
            reference,
            callback_url: callbackUrl,
            metadata: {
              paymentType: 'cafe_order',
              orderId: newOrder._id.toString(),
              orderNumber: newOrder.orderNumber
            }
          })
        });
        
        const pData = await paystackRes.json();
        if (pData.status && pData.data) {
          authorizationUrl = pData.data.authorization_url;
          paystackRef = pData.data.reference;
        } else {
          console.error('Paystack initialization failed:', pData.message);
          return res.status(400).json({ 
            success: false, 
            error: pData.message || 'Payment initialization failed with Paystack.' 
          });
        }
      } catch (err) {
        console.error('Paystack fetch error:', err.message);
        return res.status(500).json({ 
          success: false, 
          error: `Payment service communication error: ${err.message}` 
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        error: 'Paystack is not configured. Please check server environment keys.'
      });
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

// Get single order details (For confirmation & receipt view)
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
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
