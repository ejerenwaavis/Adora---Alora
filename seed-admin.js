const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seedAdmin() {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('<password>')) {
    console.error('❌ Missing or invalid MONGO_URI environment variable');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'hello@adora-alora.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:', adminEmail);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('AdoraAlora2026!', salt);

    const adminUser = new User({
      email: adminEmail,
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isEmailVerified: true
    });

    await adminUser.save();
    console.log('🎉 Initial admin user created successfully!');
    console.log(`Email: ${adminEmail}`);
    console.log('Password: AdoraAlora2026!');

  } catch (err) {
    console.error('❌ Error seeding admin user:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdmin();
