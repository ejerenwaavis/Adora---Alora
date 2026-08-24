const express = require('express');
const router  = express.Router();

const MenuCategory = require('../models/MenuCategory');
const MenuItem     = require('../models/MenuItem');

const INITIAL_MENU = [
  {
    category: { name: 'Coffee', slug: 'coffee', icon: '☕' },
    items: [
      { name: 'Espresso Classic', description: 'Double shot of single-origin roasted beans.', price: '₦3,500', dietaryTags: [], badge: 'House Blend', isAvailable: true },
      { name: 'Spanish Latte', description: 'Espresso with textured milk and sweetened condensed milk.', price: '₦4,800', dietaryTags: [], badge: 'Popular', isAvailable: true },
      { name: 'White Chocolate Mocha', description: 'Rich espresso, velvety white chocolate, and steamed milk.', price: '₦5,200', dietaryTags: [], isAvailable: true },
      { name: 'Cold Brew Signature', description: '24-hour slow-steeped artisan cold brew served over ice.', price: '₦4,500', dietaryTags: ['vegan'], isAvailable: true },
    ]
  },
  {
    category: { name: 'Matcha', slug: 'matcha', icon: '🍵' },
    items: [
      { name: 'Classic Iced Matcha', description: 'Ceremonial grade Uji matcha whisked over fresh milk.', price: '₦5,500', dietaryTags: ['vegetarian'], badge: 'Signature', isAvailable: true },
      { name: 'Strawberry Cloud Matcha', description: 'Ceremonial matcha with house-made fresh strawberry puree layer.', price: '₦6,200', dietaryTags: ['vegetarian'], badge: 'Popular', isAvailable: true },
      { name: 'White Chocolate Matcha', description: 'Ceremonial matcha folded with silky white chocolate.', price: '₦6,000', dietaryTags: [], isAvailable: true },
      { name: 'Vanilla Bean Matcha', description: 'Madagascar vanilla bean syrup with ceremonial whisked matcha.', price: '₦5,800', dietaryTags: [], isAvailable: true },
    ]
  },
  {
    category: { name: 'Food', slug: 'food', icon: '🥪' },
    items: [
      { name: 'Pesto Chicken Focaccia', description: 'Herbed grilled chicken, house pesto, mozzarella, and sun-dried tomatoes.', price: '₦8,500', dietaryTags: [], badge: 'Bestseller', isAvailable: true },
      { name: 'Coastal Grain Bowl', description: 'Quinoa, roasted sweet potato, avocado, wild greens, and tahini drizzle.', price: '₦7,800', dietaryTags: ['vegan', 'gluten-free'], badge: 'Healthy', isAvailable: true },
      { name: 'Artisanal Breakfast Plate', description: 'Poached eggs, smoked turkey sausage, sourdough, avocado, and grilled vine tomatoes.', price: '₦9,200', dietaryTags: [], isAvailable: true },
      { name: 'House Wing Trio', description: 'Crispy glazed wings served in suya spiced, honey garlic, and habanero glaze.', price: '₦8,200', dietaryTags: [], isAvailable: true },
      { name: 'Savory Waffle & Chicken', description: 'Golden buttermilk waffle topped with crispy chicken tenders and hot honey syrup.', price: '₦8,800', dietaryTags: [], isAvailable: true },
    ]
  },
  {
    category: { name: 'Dessert', slug: 'dessert', icon: '🍰' },
    items: [
      { name: 'Chin-Chin Blueberry Cheesecake', description: 'Creamy New York cheesecake with an artisanal chin-chin crust and blueberry reduction.', price: '₦6,500', dietaryTags: ['vegetarian'], badge: 'House Special', isAvailable: true },
      { name: 'Classic Tiramisu', description: 'Espresso-soaked ladyfingers layered with whipped mascarpone cocoa cream.', price: '₦6,000', dietaryTags: ['vegetarian'], isAvailable: true },
      { name: 'Warm Skillet Cookie', description: 'Freshly baked chocolate chip skillet cookie with vanilla bean gelato.', price: '₦5,800', dietaryTags: ['vegetarian'], isAvailable: true },
    ]
  },
  {
    category: { name: 'Pastry', slug: 'pastry', icon: '🥐' },
    items: [
      { name: 'Butter Croissant', description: 'Flaky 81-layer French butter croissant.', price: '₦3,200', dietaryTags: ['vegetarian'], isAvailable: true },
      { name: 'Chocolate Croissant (Pain au Chocolat)', description: 'Classic croissant filled with Valrhona dark chocolate bars.', price: '₦3,800', dietaryTags: ['vegetarian'], badge: 'Popular', isAvailable: true },
      { name: 'Almond Croissant', description: 'Double-baked croissant filled with almond frangipane cream.', price: '₦4,200', dietaryTags: ['vegetarian'], isAvailable: true },
      { name: 'Cardamom & Cinnamon Knot', description: 'Warm Scandinavian cardamom spice knot.', price: '₦3,600', dietaryTags: ['vegetarian'], isAvailable: true },
      { name: 'Pistachio Pinwheel', description: 'Artisanal pastry spiral filled with roasted pistachio cream.', price: '₦4,500', dietaryTags: ['vegetarian'], isAvailable: true },
    ]
  },
  {
    category: { name: 'Wellness Drinks', slug: 'wellness', icon: '🥤' },
    items: [
      { name: 'Green Glow Cold-Pressed Juice', description: 'Kale, green apple, cucumber, celery, ginger, and lemon.', price: '₦5,000', dietaryTags: ['vegan', 'gluten-free'], badge: 'Detox', isAvailable: true },
      { name: 'Sunshine Citrus Smoothie', description: 'Mango, passionfruit, pineapple, coconut water, and chia seeds.', price: '₦5,200', dietaryTags: ['vegan', 'gluten-free'], isAvailable: true },
    ]
  }
];

const AnnouncementBar = require('../models/AnnouncementBar');
const FAQ             = require('../models/FAQ');
const EventRecord     = require('../models/EventRecord');
const VenueSpace      = require('../models/VenueSpace');
const ClassType       = require('../models/ClassType');
const Instructor      = require('../models/Instructor');

// Public read-only data for the React frontend
router.get('/site/announcements', async (req, res) => {
  try {
    const announcements = await AnnouncementBar.find({ isActive: true }).sort('sortOrder');
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

router.get('/site/faqs', async (req, res) => {
  try {
    const faqs = await FAQ.find({ isActive: true }).sort('sortOrder');
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

const Setting = require('../models/Setting');

router.get('/site/settings/contact', async (req, res) => {
  try {
    const settings = await Setting.find({
      key: { $in: [
        'contact_email', 'contact_phone', 'location_address',
        'location_map_url', 'location_map_query', 'opening_hours_weekday',
        'opening_hours_weekend', 'open_today_text'
      ]}
    });
    
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    res.json(settingsMap);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.get('/menu', async (req, res) => {
  try {
    const categories = await MenuCategory.find({ isActive: true }).sort('sortOrder');
    if (categories && categories.length > 0) {
      const result = await Promise.all(categories.map(async cat => {
        const items = await MenuItem.find({ category: cat._id, isAvailable: true }).sort('sortOrder');
        return { category: cat, items };
      }));
      return res.json(result);
    }
  } catch (e) {
    // Fallback to initial menu structure
  }
  res.json(INITIAL_MENU);
});

const FashionLayer = require('../models/FashionLayer');
const FashionItem  = require('../models/FashionItem');
const FashionOrder = require('../models/FashionOrder');

router.get('/fashion', async (req, res) => {
  try {
    const layers = await FashionLayer.find({ isActive: true }).sort('sortOrder');
    if (layers && layers.length > 0) {
      const result = await Promise.all(layers.map(async layer => {
        const items = await FashionItem.find({ layer: layer._id, isActive: true }).sort('sortOrder');
        return { layer, items };
      }));
      return res.json(result);
    }
    res.json([]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch fashion data' });
  }
});

router.post('/fashion/order', async (req, res) => {
  try {
    const { itemId, customerName, customerEmail, customerPhone, selectedSize, orderType } = req.body;
    if (!itemId || !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({ error: 'Missing required customer or item information.' });
    }

    const item = await FashionItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Fashion item not found.' });
    }

    const order = new FashionOrder({
      fashionItem: item._id,
      itemName: item.name,
      selectedSize: selectedSize || (item.sizes && item.sizes[0]) || 'Standard',
      priceKobo: item.displayPriceKobo || 0,
      customerName,
      customerEmail,
      customerPhone,
      orderType: orderType === 'RESERVATION' ? 'RESERVATION' : 'PURCHASE',
      status: 'CONFIRMED'
    });

    await order.save();
    res.status(201).json({
      message: 'Fashion order successfully created.',
      order
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to place order.' });
  }
});

router.get('/venue/spaces', async (req, res) => {
  try {
    const spaces = await VenueSpace.find({
      isActive: true,
      $or: [
        { isHireableVenue: true },
        { spaceType: 'venue_hire' },
        { spaceType: { $exists: false } }
      ]
    }).sort('sortOrder');
    res.json(spaces);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch venue spaces' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const events = await EventRecord.find({ status: 'published' }).sort('startDate');
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/events/:slug', async (req, res) => {
  try {
    const event = await EventRecord.findOne({ slug: req.params.slug, status: 'published' });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

router.get('/classes/timetable',  (req, res) => res.json({ status: 'Phase 5 — pending implementation' }));

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q || q.length < 2) return res.json({ events: [], venues: [], classes: [], instructors: [], fashion: [] });

    const regex = new RegExp(q, 'i');

    const [events, venues, classes, instructors, fashion, cafe] = await Promise.all([
      EventRecord.find({ status: 'published', $or: [{ title: regex }, { description: regex }] }).limit(5),
      VenueSpace.find({ isActive: true, $or: [{ name: regex }, { description: regex }] }).limit(5),
      ClassType.find({ isActive: true, $or: [{ name: regex }, { description: regex }] }).limit(5),
      Instructor.find({ isActive: true, $or: [{ firstName: regex }, { lastName: regex }, { bio: regex }] }).limit(5),
      FashionItem.find({ isActive: true, $or: [{ name: regex }, { description: regex }] }).limit(5),
      MenuItem.find({ isAvailable: true, $or: [{ name: regex }, { description: regex }] }).limit(5)
    ]);

    res.json({ events, venues, classes, instructors, fashion, cafe });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
