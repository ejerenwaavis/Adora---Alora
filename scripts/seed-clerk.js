require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adora-alora';

async function seedClerk() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'clerk@adoraalora.com';
    const password = 'password123';

    // Check if clerk exists
    let clerk = await User.findOne({ email });
    if (clerk) {
      console.log(`Clerk user already exists with email ${email}`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    clerk = await User.create({
      firstName: 'Front',
      lastName: 'Desk',
      email: email,
      passwordHash: passwordHash,
      role: 'clerk',
      isActive: true,
      isEmailVerified: true
    });

    console.log(`Successfully created clerk user:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding clerk:', err);
    process.exit(1);
  }
}

seedClerk();
