const mongoose = require('mongoose');
require('dotenv').config();

async function seedSpaces() {
  await mongoose.connect(process.env.MONGO_URI);
  const VenueSpace = require('../models/VenueSpace');

  const spacesData = [
    {
      name: 'Studio A',
      slug: 'studio-a',
      spaceType: 'studio',
      isClassStudio: true,
      isHireableVenue: false,
      isCafeArea: false,
      defaultCapacity: 14,
      capacity: 14,
      colorTag: '#C89B4A',
      shortDescription: 'Primary studio dedicated to mindful movement, breathwork and yoga.',
      description: 'An expansive and serene sanctuary featuring warm oak flooring, natural ambient lighting, full-length mirrors, and complete yoga props for mindful movement.',
      amenities: ['Wall Mirrors', 'Yoga Mats & Blocks', 'Sound System', 'Air Conditioning'],
      suitableFor: ['Re-Center', 'Mindful Yoga', 'Breathwork', 'Sound Meditation'],
      images: ['https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=1200'],
      sortOrder: 1,
      isActive: true,
      isAvailable: true
    },
    {
      name: 'Studio B',
      slug: 'studio-b',
      spaceType: 'studio',
      isClassStudio: true,
      isHireableVenue: false,
      isCafeArea: false,
      defaultCapacity: 16,
      capacity: 16,
      colorTag: '#A4451F',
      shortDescription: 'Specialized reformer studio for high-precision pilates and conditioning.',
      description: 'Custom-designed pilates studio equipped with state-of-the-art reformer machines, precision resistance springs, and integrated audio.',
      amenities: ['Reformer Pilates Beds', 'Sound System', 'Full-Length Mirrors'],
      suitableFor: ['Reformer Pilates', 'Mat Pilates', 'Core Strength', 'Barre'],
      images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=1200'],
      sortOrder: 2,
      isActive: true,
      isAvailable: true
    },
    {
      name: 'The Studio',
      slug: 'the-studio',
      spaceType: 'studio',
      isClassStudio: true,
      isHireableVenue: false,
      isCafeArea: false,
      defaultCapacity: 20,
      capacity: 20,
      colorTag: '#414F36',
      shortDescription: 'Spacious multi-disciplinary studio for flow, dynamic movement, and sound baths.',
      description: 'Our largest movement space, designed for fluid transitions, sound baths, group masterclasses, and community wellness practices.',
      amenities: ['Movement Mats', 'Ballet Barres', 'Ambient Lighting', 'Sound System'],
      suitableFor: ['The Daily Movement', 'Aora Flow', 'Masterclasses', 'Community Gatherings'],
      images: ['https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200'],
      sortOrder: 3,
      isActive: true,
      isAvailable: true
    },
    {
      name: 'The Loft',
      slug: 'the-loft',
      spaceType: 'venue_hire',
      isClassStudio: false,
      isHireableVenue: true,
      isCafeArea: false,
      defaultCapacity: 60,
      capacity: 60,
      colorTag: '#633806',
      priceKobo: 4500000,
      shortDescription: 'A flexible venue created for meaningful learning, conversation and connection.',
      description: 'Positioned as a learning and events venue rather than a leadership lounge — The Loft is more distinctive and commercially flexible.',
      amenities: ['Flexible seating formats', 'AV Equipment', 'Theatre & Classroom Layouts', 'WiFi'],
      suitableFor: ['Private Events', 'Gatherings', 'Photoshoots', 'Seminars'],
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000',
        'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=2000'
      ],
      sortOrder: 4,
      isActive: true,
      isAvailable: true
    },
    {
      name: 'The Café',
      slug: 'the-cafe',
      spaceType: 'cafe',
      isClassStudio: false,
      isHireableVenue: true,
      isCafeArea: true,
      defaultCapacity: 40,
      capacity: 40,
      colorTag: '#8C5815',
      priceKobo: 2500000,
      shortDescription: 'A warm and stylish setting for smaller gatherings and celebrations.',
      description: 'An inviting and intimately designed setting tailored for personal connections, curated café dining, and private social events.',
      amenities: ['Exclusive full café hire', 'Private seating area', 'Food & beverage packages', 'Optional event styling'],
      suitableFor: ['Private Dinners', 'Brand Activations', 'Social Mixers', 'Pop-Up Events'],
      images: [
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=2000',
        'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&q=80&w=2000'
      ],
      sortOrder: 5,
      isActive: true,
      isAvailable: true
    }
  ];

  for (const s of spacesData) {
    await VenueSpace.findOneAndUpdate(
      { slug: s.slug },
      { $set: s },
      { upsert: true, new: true }
    );
  }

  const allSpaces = await VenueSpace.find().sort('sortOrder');
  console.log('All spaces in database count:', allSpaces.length);
  allSpaces.forEach(s => console.log(`- ${s.name} (${s.spaceType}) | isClassStudio: ${s.isClassStudio} | isHireableVenue: ${s.isHireableVenue} | colorTag: ${s.colorTag}`));
  await mongoose.disconnect();
}
seedSpaces();
