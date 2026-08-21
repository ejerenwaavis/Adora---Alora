require('dotenv').config();
const mongoose = require('mongoose');
const FashionLayer = require('./models/FashionLayer');
const FashionItem = require('./models/FashionItem');

const VENDORS = [
  { name: 'Numen', slug: 'numen', description: 'Curated earthy essentials.' },
  { name: 'Terra', slug: 'terra', description: 'Sustainable modern wear.' },
  { name: 'Aora House', slug: 'aora-house', description: 'Our signature house collection.' },
  { name: 'Raireapp', slug: 'raireapp', description: 'Featured sellers from the Raire network.' }
];

const ITEMS = [
  // Numen Items
  {
    layerSlug: 'numen',
    name: 'Ember Vest',
    slug: 'numen-ember-vest',
    description: 'The rust-ember drop. A cropped puffer vest with a heat-mapped fill, made for the in-between temperatures.\n\nConfidence, wrapped in warmth.',
    sizes: ['20', '20', '30', '40'],
    colors: ['#A4451F'], // Terracotta / Rust
    brand: 'Numen',
    images: ['/assets/fashion-1.jpg'],
    displayPriceKobo: 12900,
  },
  {
    layerSlug: 'numen',
    name: 'Glacier Parka',
    slug: 'numen-glacier-parka',
    description: 'Heavy duty warmth for extreme conditions.',
    sizes: ['S', 'M', 'L'],
    colors: ['#2B3A42'], // Dark Slate
    brand: 'Numen',
    images: ['/assets/fashion-1.jpg'],
    displayPriceKobo: 25000,
  },
  {
    layerSlug: 'numen',
    name: 'Ash Field Coat',
    slug: 'numen-ash-field-coat',
    description: 'Classic utilitarian design in washed canvas.',
    sizes: ['M', 'L', 'XL'],
    colors: ['#5E5A54'], // Ash Grey
    brand: 'Numen',
    images: ['/assets/fashion-1.jpg'],
    displayPriceKobo: 18900,
  },
  // Terra Items
  {
    layerSlug: 'terra',
    name: 'Oasis Linen Dress',
    slug: 'terra-oasis-linen-dress',
    description: 'Breathable, sustainable linen for coastal living.',
    sizes: ['S', 'M', 'L'],
    colors: ['#E3D3B8'], // Beige
    brand: 'Terra',
    images: ['/assets/fashion-1.jpg'],
    displayPriceKobo: 9500,
  },
  // Aora House Items
  {
    layerSlug: 'aora-house',
    name: 'Signature Silk Scarf',
    slug: 'aa-signature-silk-scarf',
    description: 'Hand-rolled edges with our custom house print.',
    sizes: ['OS'],
    colors: ['#414F36'], // Forest Green
    brand: 'Aora House',
    images: ['/assets/fashion-1.jpg'],
    displayPriceKobo: 4500,
  },
  // Raireapp Items
  {
    layerSlug: 'raireapp',
    name: 'Vintage Leather Tote',
    slug: 'raire-vintage-tote',
    description: 'Sourced from local artisans. Only 1 available.',
    sizes: ['OS'],
    colors: ['#6B5240'], // Cocoa
    sellerName: 'LeatherCraft NG',
    raireListingUrl: 'https://raireapp.com/listing/vintage-tote',
    images: ['/assets/fashion-1.jpg'],
    displayPriceKobo: 32000,
  },
];

async function seedFashion() {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('<password>')) {
    console.error('❌ Missing or invalid MONGO_URI in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('Clearing existing Fashion data...');
    await FashionLayer.deleteMany({});
    await FashionItem.deleteMany({});

    console.log('Seeding Fashion Layers (Vendors)...');
    const layerDocs = {};
    for (const v of VENDORS) {
      const layer = new FashionLayer(v);
      await layer.save();
      layerDocs[v.slug] = layer._id;
    }

    console.log('Seeding Fashion Items...');
    for (const itemData of ITEMS) {
      const { layerSlug, ...data } = itemData;
      data.layer = layerDocs[layerSlug];
      const item = new FashionItem(data);
      await item.save();
    }

    console.log('🎉 Fashion data seeded successfully!');

  } catch (err) {
    console.error('❌ Error seeding fashion data:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedFashion();
