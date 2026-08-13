require('dotenv').config();
const mongoose = require('mongoose');

const EventRecord = require('./models/EventRecord');
const FAQ = require('./models/FAQ');
const AnnouncementBar = require('./models/AnnouncementBar');
const VenueSpace = require('./models/VenueSpace');

async function seedData() {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('<password>')) {
    console.error('❌ Missing or invalid MONGO_URI');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Seed Events
    await EventRecord.deleteMany({});
    await EventRecord.insertMany([
      {
        title: "Styling Conversation: The Archive",
        slug: "styling-conversation-archive",
        organiser: "Adora & Alora",
        bookingDestination: "internal",
        startDate: new Date(Date.now() + 86400000 * 5), // +5 days
        endDate: new Date(Date.now() + 86400000 * 5 + 3600000 * 2), // +2 hours
        status: "published",
        isFeatured: true,
        coverImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800"
      },
      {
        title: "Becoming: Leadership Circle",
        slug: "becoming-leadership-circle",
        organiser: "The Becoming Network",
        bookingDestination: "external_url",
        externalUrl: "https://thebecomingnetwork.com",
        externalOrganizerCta: "Register with Partner",
        startDate: new Date(Date.now() + 86400000 * 20), // +20 days
        endDate: new Date(Date.now() + 86400000 * 20 + 3600000 * 3), 
        status: "published",
        coverImage: "https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&q=80&w=800"
      },
      {
        title: "Introspective Journaling Night",
        slug: "introspective-journaling-night",
        organiser: "Adora & Alora",
        bookingDestination: "internal",
        startDate: new Date(Date.now() + 86400000 * 12), // +12 days
        endDate: new Date(Date.now() + 86400000 * 12 + 3600000 * 1.5), 
        status: "published",
        coverImage: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=800"
      }
    ]);
    console.log('✅ Seeded Events');

    // Seed FAQs
    await FAQ.deleteMany({});
    await FAQ.insertMany([
      {
        question: "Do I need a membership to visit Adora & Alora?",
        answer: "No, the house is open to everyone! All our rituals — Café dining, Reformer classes, Fashion pop-ups, and cultural events — are open for non-members.",
        category: "General",
        isActive: true,
        sortOrder: 1
      },
      {
        question: "How early should I arrive for a class or reservation?",
        answer: "We recommend arriving 15 minutes prior to studio movement sessions to change comfortably. Café tables are held for 15 minutes past reservation times.",
        category: "Classes",
        isActive: true,
        sortOrder: 2
      },
      {
        question: "What is the dress code inside the house?",
        answer: "We embrace elevated, effortless everyday style. Grip socks are required in the Reformer Pilates studio (available for purchase at reception).",
        category: "General",
        isActive: true,
        sortOrder: 3
      },
      {
        question: "Can I host a private event or photoshoot?",
        answer: "Yes, our courtyard, loft, and private dining rooms are available for private venue hire. Submit an enquiry via our Venue Hire page.",
        category: "Venue Hire",
        isActive: true,
        sortOrder: 4
      }
    ]);
    console.log('✅ Seeded FAQs');

    // Seed Announcements
    await AnnouncementBar.deleteMany({});
    await AnnouncementBar.create({
      message: "New wellness collection drops this Friday. Early access available now.",
      linkText: "Shop the Collection",
      linkUrl: "/fashion",
      isActive: true,
      backgroundColor: "var(--rust, #A4451F)",
      textColor: "var(--white, #F7EFE1)"
    });
    console.log('✅ Seeded Announcements');

    // Seed VenueSpaces
    await VenueSpace.deleteMany({});
    await VenueSpace.insertMany([
      {
        name: "The Coastal Courtyard",
        slug: "coastal-courtyard",
        description: "An open-air sanctuary wrapped in lush Mediterranean flora and natural limestone.",
        capacityText: "Up to 50 guests standing, 30 seated",
        features: ["Outdoor Space", "Natural Light", "Cafe Access"],
        isActive: true,
        sortOrder: 1,
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=2000"]
      },
      {
        name: "The Movement Loft",
        slug: "movement-loft",
        description: "A bright, airy studio with sprung floors and premium Pilates reformer equipment.",
        capacityText: "12 Reformer beds, up to 20 for mat work",
        features: ["Mirrors", "Sonos Sound System", "Private Lockers"],
        isActive: true,
        sortOrder: 2,
        images: ["https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=2000"]
      }
    ]);
    console.log('✅ Seeded VenueSpaces');

    console.log('🎉 DB Seeding Complete!');
  } catch (err) {
    console.error('❌ Error seeding DB:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedData();
