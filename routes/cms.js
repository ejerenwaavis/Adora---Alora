const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Models
const AnnouncementBar = require('../models/AnnouncementBar');
const FAQ             = require('../models/FAQ');
const MenuCategory    = require('../models/MenuCategory');
const MenuItem        = require('../models/MenuItem');
const FashionLayer    = require('../models/FashionLayer');
const FashionItem     = require('../models/FashionItem');
const VenueSpace      = require('../models/VenueSpace');
const EventRecord     = require('../models/EventRecord');
const ClassType       = require('../models/ClassType');
const Instructor      = require('../models/Instructor');
const Setting         = require('../models/Setting');
const CreditPack      = require('../models/CreditPack');

// CMS routes — content_editor or admin
router.use(requireAuth);
router.use(requireRole('admin', 'content_editor'));

/* ==========================================================================
   ANNOUNCEMENT BAR
   ========================================================================== */
router.get('/announcements', async (req, res) => {
  try {
    const items = await AnnouncementBar.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/announcements', async (req, res) => {
  try {
    const item = new AnnouncementBar(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/announcements/:id', async (req, res) => {
  try {
    const item = await AnnouncementBar.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    const item = await AnnouncementBar.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ==========================================================================
   SETTINGS
   ========================================================================== */
router.get('/settings', async (req, res) => {
  try {
    const items = await Setting.find().sort({ key: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/settings', async (req, res) => {
  try {
    const item = new Setting(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/settings/:id', async (req, res) => {
  try {
    const item = await Setting.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/settings/:id', async (req, res) => {
  try {
    const item = await Setting.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ==========================================================================
   CREDIT PACKS
   ========================================================================== */
router.get('/credit-packs', async (req, res) => {
  try {
    const items = await CreditPack.find().sort({ priceKobo: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/credit-packs', async (req, res) => {
  try {
    const item = new CreditPack(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/credit-packs/:id', async (req, res) => {
  try {
    const item = await CreditPack.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/credit-packs/:id', async (req, res) => {
  try {
    const item = await CreditPack.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ==========================================================================
   FAQs
   ========================================================================== */
router.get('/faqs', async (req, res) => {
  try {
    const items = await FAQ.find().sort({ sortOrder: 1, category: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/faqs', async (req, res) => {
  try {
    const item = new FAQ(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/faqs/:id', async (req, res) => {
  try {
    const item = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/faqs/:id', async (req, res) => {
  try {
    const item = await FAQ.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ==========================================================================
   CAFE MENU
   ========================================================================== */
router.get('/menu-categories', async (req, res) => {
  try {
    res.json(await MenuCategory.find().sort({ sortOrder: 1 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/menu-categories', async (req, res) => {
  try {
    const item = new MenuCategory(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.patch('/menu-categories/:id', async (req, res) => {
  try {
    const item = await MenuCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/menu-categories/:id', async (req, res) => {
  try {
    await MenuCategory.findByIdAndDelete(req.params.id);
    await MenuItem.deleteMany({ category: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/menu-items', async (req, res) => {
  try {
    res.json(await MenuItem.find().populate('category').sort({ sortOrder: 1 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/menu-items', upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;
    
    // Parse dietaryTags from comma-separated string to array
    if (typeof data.dietaryTags === 'string') {
      data.dietaryTags = data.dietaryTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    }

    const item = new MenuItem(data);
    await item.save();
    res.status(201).json(await item.populate('category'));
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.patch('/menu-items/:id', upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;
    
    // Parse dietaryTags from comma-separated string to array
    if (typeof data.dietaryTags === 'string') {
      data.dietaryTags = data.dietaryTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    }

    const item = await MenuItem.findByIdAndUpdate(req.params.id, data, { new: true }).populate('category');
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/menu-items/:id', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ==========================================================================
   FASHION
   ========================================================================== */
router.get('/fashion-layers', async (req, res) => {
  try { res.json(await FashionLayer.find().sort({ sortOrder: 1 })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/fashion-layers', async (req, res) => {
  try { res.status(201).json(await new FashionLayer(req.body).save()); } 
  catch (err) { res.status(400).json({ error: err.message }); }
});
router.patch('/fashion-layers/:id', async (req, res) => {
  try { res.json(await FashionLayer.findByIdAndUpdate(req.params.id, req.body, { new: true })); } 
  catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/fashion-layers/:id', async (req, res) => {
  try {
    await FashionLayer.findByIdAndDelete(req.params.id);
    await FashionItem.deleteMany({ layer: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/fashion-items', async (req, res) => {
  try { res.json(await FashionItem.find().populate('layer').sort({ sortOrder: 1 })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/fashion-items', upload.array('images', 10), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files && req.files.length > 0) {
      data.images = req.files.map(f => f.path);
    }
    if (data.sizes && typeof data.sizes === 'string') data.sizes = data.sizes.split(',').map(s => s.trim());
    if (data.colors && typeof data.colors === 'string') data.colors = data.colors.split(',').map(c => c.trim());
    if (data.existingImages) {
      const existing = Array.isArray(data.existingImages) ? data.existingImages : [data.existingImages];
      data.images = [...(data.images || []), ...existing];
    }
    const existingItem = await FashionItem.findOne({ slug: data.slug });
    if (existingItem) {
      return res.status(400).json({ error: 'A fashion item with this slug already exists.' });
    }

    const item = new FashionItem(data);
    await item.save();
    res.status(201).json(await item.populate('layer'));
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.patch('/fashion-items/:id', upload.array('images', 10), async (req, res) => {
  try {
    const data = { ...req.body };
    
    // Combine existing images (URLs) + newly uploaded images (files)
    let finalImages = [];
    if (data.existingImages) {
      finalImages = Array.isArray(data.existingImages) ? data.existingImages : [data.existingImages];
    }
    if (req.files && req.files.length > 0) {
      finalImages = finalImages.concat(req.files.map(f => f.path));
    }
    data.images = finalImages;

    if (data.sizes && typeof data.sizes === 'string') data.sizes = data.sizes.split(',').map(s => s.trim());
    if (data.colors && typeof data.colors === 'string') data.colors = data.colors.split(',').map(c => c.trim());
    
    if (data.slug) {
      const existingItem = await FashionItem.findOne({ slug: data.slug, _id: { $ne: req.params.id } });
      if (existingItem) {
        return res.status(400).json({ error: 'A fashion item with this slug already exists.' });
      }
    }

    const item = await FashionItem.findByIdAndUpdate(req.params.id, data, { new: true }).populate('layer');
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/fashion-items/:id', async (req, res) => {
  try { await FashionItem.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

/* ==========================================================================
   MOVEMENT (CLASSES & INSTRUCTORS)
   ========================================================================== */
router.get('/instructors', async (req, res) => {
  try { res.json(await Instructor.find().sort({ name: 1 })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/instructors', upload.single('photo'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.photo = req.file.path;
    res.status(201).json(await new Instructor(data).save());
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.patch('/instructors/:id', upload.single('photo'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.photo = req.file.path;
    res.json(await Instructor.findByIdAndUpdate(req.params.id, data, { new: true }));
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/instructors/:id', async (req, res) => {
  try { await Instructor.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/class-types', async (req, res) => {
  try { res.json(await ClassType.find().sort({ name: 1 })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/class-types', upload.single('coverImage'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.coverImage = req.file.path;
    res.status(201).json(await new ClassType(data).save());
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.patch('/class-types/:id', upload.single('coverImage'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.coverImage = req.file.path;
    res.json(await ClassType.findByIdAndUpdate(req.params.id, data, { new: true }));
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/class-types/:id', async (req, res) => {
  try { await ClassType.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

/* ==========================================================================
   VENUES & EVENTS
   ========================================================================== */
router.get('/venue-spaces', async (req, res) => {
  try { res.json(await VenueSpace.find().sort({ sortOrder: 1 })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/venue-spaces', upload.array('gallery', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files) data.gallery = req.files.map(f => f.path);
    if (data.features) data.features = data.features.split(',').map(f => f.trim());
    res.status(201).json(await new VenueSpace(data).save());
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.patch('/venue-spaces/:id', upload.array('gallery', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files && req.files.length > 0) data.gallery = req.files.map(f => f.path);
    if (data.features && typeof data.features === 'string') data.features = data.features.split(',').map(f => f.trim());
    res.json(await VenueSpace.findByIdAndUpdate(req.params.id, data, { new: true }));
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/venue-spaces/:id', async (req, res) => {
  try { await VenueSpace.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/events', async (req, res) => {
  try { res.json(await EventRecord.find().populate('venueSpace').sort({ startDate: -1 })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/events', upload.single('coverImage'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.coverImage = req.file.path;
    const evt = new EventRecord(data);
    await evt.save();
    res.status(201).json(await evt.populate('venueSpace'));
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.patch('/events/:id', upload.single('coverImage'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.coverImage = req.file.path;
    res.json(await EventRecord.findByIdAndUpdate(req.params.id, data, { new: true }).populate('venueSpace'));
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/events/:id', async (req, res) => {
  try { await EventRecord.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
