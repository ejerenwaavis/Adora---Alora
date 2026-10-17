const express = require('express');
const router = express.Router();
// const twilio = require('twilio');
// const Message = require('../models/Message');

router.use(express.urlencoded({ extended: true }));

// Mock route for testing the webhook visually until Twilio is connected
router.post('/webhook', async (req, res) => {
  try {
    const { From, Body, ProfileName } = req.body;
    
    const customerPhone = From ? From.replace('whatsapp:', '') : 'Unknown';

    const newMessage = {
      id: Date.now().toString(),
      customerName: ProfileName || 'WhatsApp Guest',
      phoneNumber: customerPhone,
      text: Body || 'Mock incoming message',
      direction: 'inbound',
      status: 'delivered',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Push the message live to the Concierge CMS via WebSockets
    if (req.io) {
      req.io.emit('new_whatsapp_message', newMessage);
    }

    // Acknowledge receipt
    res.status(200).send('<Response></Response>');

  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    res.status(500).send('Error processing message');
  }
});

router.post('/reply', async (req, res) => {
  const { phoneNumber, text } = req.body;

  try {
    // In the future: const message = await client.messages.create({ ... })
    console.log(`[MOCK TWILIO] Sending to ${phoneNumber}: ${text}`);

    const savedMessage = {
      id: Date.now().toString(),
      phoneNumber,
      text,
      direction: 'outbound',
      status: 'sent',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    res.status(200).json(savedMessage);
  } catch (error) {
    console.error('Twilio Send Error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

module.exports = router;
