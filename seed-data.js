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
        organiser: "Aora House",
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
        organiser: "Aora House",
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
        question: "Do I need a membership to visit Aora House?",
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
        name: "The Loft",
        slug: "the-loft",
        shortDescription: "A flexible venue created for meaningful learning, conversation and connection.",
        description: "Positioned as a learning and events venue rather than a leadership lounge — “The Loft” is more distinctive and commercially flexible.",
        capacity: 60,
        seatingOptions: [
          "Seminars and workshops",
          "Masterclasses and mastermind programmes",
          "Training sessions and leadership events",
          "Panel discussions and networking events",
          "Book launches and community gatherings",
          "Webinars, recordings and hybrid programmes",
          "Small conferences"
        ],
        amenities: ["Flexible seating formats", "AV Equipment", "Theatre & Classroom Layouts", "WiFi"],
        isAvailable: true,
        sortOrder: 1,
        images: [
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000",
          "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=2000",
          "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=2000"
        ]
      },
      {
        name: "The Café",
        slug: "the-cafe",
        shortDescription: "A warm and stylish setting for smaller gatherings and celebrations.",
        description: "An inviting and intimately designed setting tailored for personal connections and vibrant social events.",
        capacity: 40,
        seatingOptions: [
          "Private breakfasts, brunches and dinners",
          "Birthday celebrations",
          "Bridal and baby showers",
          "Book clubs and intimate conversations",
          "Brand activations and pop-up events",
          "Networking gatherings and small parties"
        ],
        amenities: ["Exclusive full café hire", "Private seating area", "Food & beverage packages", "Optional event styling"],
        isAvailable: true,
        sortOrder: 2,
        images: [
          "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=2000",
          "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&q=80&w=2000",
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2000"
        ]
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
