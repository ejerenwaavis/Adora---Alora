const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');

// Middleware to verify Glovo authorization token using constant-time comparison
const verifyGlovoToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.split(' ')[1]; // "Bearer <token>"
  if (!token) {
    return res.status(401).json({ error: 'Malformed Authorization header' });
  }

  const expectedToken = process.env.GLOVO_WEBHOOK_TOKEN || 'test_glovo_token_123';
  
  if (token.length !== expectedToken.length) {
    return res.status(403).json({ error: 'Invalid token length' });
  }

  const isValid = crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
  if (!isValid) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};

// POST /api/webhooks/glovo/orders
router.post('/glovo/orders', verifyGlovoToken, async (req, res) => {
  try {
    const glovoPayload = req.body;
    
    // Example Glovo payload mapping to our native Order schema
    // Glovo sends: { order_id: "GLV-999", customer: { name: "John", phone: "123" }, products: [...] }
    
    // Convert Glovo items to our item schema
    const mappedItems = glovoPayload.products ? glovoPayload.products.map(p => ({
      menuItem: p.id, // Assuming Glovo's product_id maps perfectly to our MenuItem _id
      name: p.name,
      quantity: p.quantity,
      priceKobo: p.price * 100 // Glovo usually sends in standard currency
    })) : [];

    const newOrder = new Order({
      customerName: glovoPayload.customer?.name || 'Glovo Customer',
      customerPhone: glovoPayload.customer?.phone || '',
      items: mappedItems,
      totalAmountKobo: glovoPayload.total_amount ? glovoPayload.total_amount * 100 : 0,
      paymentReference: `GLOVO_${glovoPayload.order_id || Date.now()}`,
      status: 'PENDING'
    });

    await newOrder.save();

    // Broadcast to KDS via WebSockets
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', newOrder);
    }

    res.status(200).json({ success: true, message: 'Order received from Glovo' });
  } catch (error) {
    console.error('[Glovo Webhook Error]', error);
    res.status(500).json({ error: 'Failed to process Glovo order' });
  }
});

module.exports = router;
