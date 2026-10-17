require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Instructor = require('../models/Instructor');
const ClassType = require('../models/ClassType');
const ClassSession = require('../models/ClassSession');
const Booking = require('../models/Booking');
const CafeReservation = require('../models/CafeReservation');
const EventRecord = require('../models/EventRecord');
const EventBooking = require('../models/EventBooking');

async function seedClerkData() {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('<password>')) {
    console.error('❌ Missing or invalid MONGO_URI');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clean up relevant collections first
    await Booking.deleteMany({});
    await ClassSession.deleteMany({});
    await ClassType.deleteMany({});
    await Instructor.deleteMany({});
    await CafeReservation.deleteMany({});
    await EventBooking.deleteMany({});
    await EventRecord.deleteMany({});
    
    // Do not delete all Users to save admin/clerk accounts, just remove the specific test guests
    const guestEmails = [
      'amara@example.com', 'chisom@example.com', 'lola@example.com', 'fola@example.com',
      'adaeze@example.com', 'bisi@example.com', 'chiamaka@example.com', 'yemi@example.com', 'temi@example.com'
    ];
    await User.deleteMany({ email: { $in: guestEmails } });

    // 1. Create Instructor
    const instructor = await Instructor.create({
      firstName: 'Jane',
      lastName: 'Doe',
      bio: 'Expert Pilates Instructor',
      isActive: true
    });

    // 2. Create Users
    const users = await User.insertMany([
      { firstName: 'Amara', lastName: 'Osei', email: 'amara@example.com', passwordHash: 'noop' },
      { firstName: 'Chisom', lastName: 'Eze', email: 'chisom@example.com', passwordHash: 'noop' },
      { firstName: 'Lola', lastName: 'Adeyemi', email: 'lola@example.com', passwordHash: 'noop' },
      { firstName: 'Fola', lastName: 'Nwosu', email: 'fola@example.com', passwordHash: 'noop' },
      { firstName: 'Adaeze', lastName: 'Obi', email: 'adaeze@example.com', passwordHash: 'noop' },
      { firstName: 'Bisi', lastName: 'Nwachukwu', email: 'bisi@example.com', passwordHash: 'noop' },
      { firstName: 'Chiamaka', lastName: 'Eze', email: 'chiamaka@example.com', passwordHash: 'noop' },
      { firstName: 'Yemi', lastName: 'Adesanya', email: 'yemi@example.com', passwordHash: 'noop' },
      { firstName: 'Temi', lastName: 'Ogundimu', email: 'temi@example.com', passwordHash: 'noop' }
    ]);

    // 3. Create Class Types
    const reCenterType = await ClassType.create({
      name: 'Re-Center',
      slug: 're-center',
      durationMinutes: 60,
      maxCapacity: 14,
      isActive: true
    });

    const flowType = await ClassType.create({
      name: 'Flow & Lengthen',
      slug: 'flow-lengthen',
      durationMinutes: 45,
      maxCapacity: 14,
      isActive: true
    });

    // 4. Create Class Sessions (Today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const session8am = new Date(today);
    session8am.setHours(8, 0, 0, 0);

    const session9am = new Date(today);
    session9am.setHours(9, 0, 0, 0);

    const session10am = new Date(today);
    session10am.setHours(10, 0, 0, 0);

    const session8 = await ClassSession.create({
      classType: reCenterType._id,
      instructor: instructor._id,
      startTime: session8am,
      endTime: session9am,
      maxCapacity: 14,
      bookedCount: 4,
      status: 'scheduled'
    });

    await ClassSession.create({
      classType: flowType._id,
      instructor: instructor._id,
      startTime: session10am,
      endTime: new Date(today.getTime() + 10 * 3600000 + 45 * 60000),
      maxCapacity: 14,
      bookedCount: 0,
      status: 'scheduled'
    });

    // 5. Create Bookings
    await Booking.insertMany([
      { user: users[0]._id, classSession: session8._id, status: 'confirmed', paymentStatus: 'paid', checkedInAt: new Date(), createdAt: new Date(today.getTime() + 7 * 3600000 + 14 * 60000) },
      { user: users[1]._id, classSession: session8._id, status: 'confirmed', paymentStatus: 'paid', createdAt: new Date(today.getTime() + 6 * 3600000 + 52 * 60000) },
      { user: users[2]._id, classSession: session8._id, status: 'confirmed', paymentStatus: 'paid', createdAt: new Date(today.getTime() - 24 * 3600000) },
      { user: users[3]._id, classSession: session8._id, status: 'confirmed', paymentStatus: 'paid', createdAt: new Date(today.getTime() + 6 * 3600000 + 30 * 60000) }
    ]);

    // 6. Create Cafe Reservations (Today)
    const cafe1 = new Date(today); cafe1.setHours(12, 30);
    const cafe2 = new Date(today); cafe2.setHours(13, 0);
    await CafeReservation.insertMany([
      { customerName: 'Zara Okonkwo', customerEmail: 'zara@example.com', date: today, time: '12:30', partySize: 2, status: 'confirmed' },
      { customerName: 'Adeola Makinde', customerEmail: 'adeola@example.com', date: today, time: '13:00', partySize: 4, status: 'confirmed' },
      { customerName: 'Kemi Balogun', customerEmail: 'kemi@example.com', date: today, time: '14:00', partySize: 1, status: 'confirmed' },
      { customerName: 'Funmi Olatunji', customerEmail: 'funmi@example.com', date: today, time: '18:00', partySize: 2, status: 'confirmed' },
      { customerName: 'Sade Adu', customerEmail: 'sade@example.com', date: today, time: '19:30', partySize: 6, status: 'confirmed' },
      { customerName: 'Toluwani', customerEmail: 'tolu@example.com', date: today, time: '09:00', partySize: 2, status: 'completed' },
      { customerName: 'Ngozi', customerEmail: 'ngozi@example.com', date: today, time: '10:00', partySize: 3, status: 'completed' },
      { customerName: 'Chika', customerEmail: 'chika@example.com', date: today, time: '11:00', partySize: 2, status: 'completed' },
    ]);

    // 7. Create EventRecord for today
    const eventTime = new Date(today);
    eventTime.setHours(19, 0, 0, 0);
    const eventEnd = new Date(today);
    eventEnd.setHours(21, 0, 0, 0);

    const event = await EventRecord.create({
      title: 'Leadership Circle',
      slug: 'leadership-circle',
      organiser: 'The Becoming Network',
      bookingDestination: 'external_url',
      externalUrl: 'https://thebecomingnetwork.com',
      externalOrganizerCta: 'Register with Partner',
      startDate: eventTime,
      endDate: eventEnd,
      status: 'published'
    });

    // 8. Create EventBookings
    await EventBooking.insertMany([
      { event: event._id, user: users[4]._id, customerName: 'Adaeze Obi', customerEmail: 'adaeze@example.com', status: 'confirmed', checkedInAt: new Date() },
      { event: event._id, user: users[5]._id, customerName: 'Bisi Nwachukwu', customerEmail: 'bisi@example.com', status: 'confirmed', checkedInAt: new Date() },
      { event: event._id, user: users[6]._id, customerName: 'Chiamaka Eze', customerEmail: 'chiamaka@example.com', status: 'confirmed', checkedInAt: new Date() },
      { event: event._id, user: users[7]._id, customerName: 'Yemi Adesanya', customerEmail: 'yemi@example.com', status: 'confirmed' },
      { event: event._id, user: users[8]._id, customerName: 'Temi Ogundimu', customerEmail: 'temi@example.com', status: 'confirmed' }
    ]);

    console.log('✅ Clerk Dashboard Seed Data Inserted!');

  } catch (err) {
    console.error('❌ Error seeding DB:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedClerkData();
