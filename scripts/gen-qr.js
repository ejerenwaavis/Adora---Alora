require('dotenv').config();
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const fs = require('fs');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  require('../models/User');
  const Booking = require('../models/Booking');
  
  const booking = await Booking.findOne({ checkedInAt: { $exists: false } }).populate('user');
  
  if (booking) {
    const token = `CLASS:${booking._id}`;
    console.log(`Found booking for ${booking.user.firstName} - Token: ${token}`);
    
    const dest = 'c:/Users/ejere/.gemini/antigravity-ide/brain/06d365ca-5b52-45fd-b4bc-5786b460f98b/sample_qr.png';
    await QRCode.toFile(dest, token, { width: 300 });
    console.log(`Saved QR to ${dest}`);
  } else {
    console.log('No booking found');
  }
  
  process.exit();
}
run();
