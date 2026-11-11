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
const ClassSession    = require('../models/ClassSession');
const Setting         = require('../models/Setting');
const CreditPack      = require('../models/CreditPack');
const WaiverVersion   = require('../models/WaiverVersion');
const WaiverRecord    = require('../models/WaiverRecord');
const logActivity     = require('../utils/activityLogger');

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
    await logActivity({
      req,
      action: 'announcement_created',
      category: 'CMS',
      itemAffected: item.message,
      entityModel: 'AnnouncementBar',
      entityId: item._id,
      details: `Created announcement: "${item.message}"`
    });
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/announcements/:id', async (req, res) => {
  try {
    const item = await AnnouncementBar.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    await logActivity({
      req,
      action: 'announcement_updated',
      category: 'CMS',
      itemAffected: item.message,
      entityModel: 'AnnouncementBar',
      entityId: item._id,
      details: `Updated announcement: "${item.message}"`
    });
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    const item = await AnnouncementBar.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await logActivity({
      req,
      action: 'announcement_deleted',
      category: 'CMS',
      itemAffected: item.message,
      entityModel: 'AnnouncementBar',
      entityId: item._id,
      details: `Deleted announcement: "${item.message}"`
    });
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
    await logActivity({
      req,
      action: 'setting_created',
      category: 'SETTINGS',
      itemAffected: `Global Setting: ${item.key}`,
      entityModel: 'Setting',
      entityId: item._id,
      details: { value: item.value }
    });
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/settings/:id', async (req, res) => {
  try {
    const item = await Setting.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    await logActivity({
      req,
      action: 'setting_updated',
      category: 'SETTINGS',
      itemAffected: `Global Setting: ${item.key}`,
      entityModel: 'Setting',
      entityId: item._id,
      details: { value: item.value }
    });
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/settings/:id', async (req, res) => {
  try {
    const item = await Setting.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await logActivity({
      req,
      action: 'setting_deleted',
      category: 'SETTINGS',
      itemAffected: `Global Setting: ${item.key}`,
      entityModel: 'Setting',
      entityId: item._id
    });
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
    await logActivity({
      req,
      action: 'credit_pack_created',
      category: 'CLASSES',
      itemAffected: `${item.name} (${item.credits} credits)`,
      entityModel: 'CreditPack',
      entityId: item._id
    });
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/credit-packs/:id', async (req, res) => {
  try {
    const item = await CreditPack.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    await logActivity({
      req,
      action: 'credit_pack_updated',
      category: 'CLASSES',
      itemAffected: `${item.name} (${item.credits} credits)`,
      entityModel: 'CreditPack',
      entityId: item._id
    });
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/credit-packs/:id', async (req, res) => {
  try {
    const item = await CreditPack.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await logActivity({
      req,
      action: 'credit_pack_deleted',
      category: 'CLASSES',
      itemAffected: `${item.name} (${item.credits} credits)`,
      entityModel: 'CreditPack',
      entityId: item._id
    });
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
    await logActivity({
      req,
      action: 'faq_created',
      category: 'CMS',
      itemAffected: item.question,
      entityModel: 'FAQ',
      entityId: item._id,
      details: `Created FAQ: "${item.question}"`
    });
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/faqs/:id', async (req, res) => {
  try {
    const item = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    await logActivity({
      req,
      action: 'faq_updated',
      category: 'CMS',
      itemAffected: item.question,
      entityModel: 'FAQ',
      entityId: item._id,
      details: `Updated FAQ: "${item.question}"`
    });
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/faqs/:id', async (req, res) => {
  try {
    const item = await FAQ.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await logActivity({
      req,
      action: 'faq_deleted',
      category: 'CMS',
      itemAffected: item.question,
      entityModel: 'FAQ',
      entityId: item._id,
      details: `Deleted FAQ: "${item.question}"`
    });
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
    await logActivity({
      req,
      action: 'menu_category_created',
      category: 'MENU',
      itemAffected: item.name,
      entityModel: 'MenuCategory',
      entityId: item._id
    });
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.patch('/menu-categories/:id', async (req, res) => {
  try {
    const item = await MenuCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (item) {
      await logActivity({
        req,
        action: 'menu_category_updated',
        category: 'MENU',
        itemAffected: item.name,
        entityModel: 'MenuCategory',
        entityId: item._id
      });
    }
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/menu-categories/:id', async (req, res) => {
  try {
    const cat = await MenuCategory.findByIdAndDelete(req.params.id);
    await MenuItem.deleteMany({ category: req.params.id });
    await logActivity({
      req,
      action: 'menu_category_deleted',
      category: 'MENU',
      itemAffected: cat?.name || `Category #${req.params.id}`,
      entityModel: 'MenuCategory',
      entityId: req.params.id
    });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/menu-items', async (req, res) => {
  try {
    res.json(await MenuItem.find().populate('category').sort({ sortOrder: 1 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function normalizeDietaryTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(t => String(t).trim()).filter(Boolean);
  if (typeof raw === 'string') {
    return raw.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
}

router.post('/menu-items', upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;
    
    if (!data.name || !data.name.trim()) {
      return res.status(400).json({ error: 'Item name is required.' });
    }
    if (!data.category) {
      return res.status(400).json({ error: 'Please select a menu category.' });
    }

    if (!data.slug || !data.slug.trim()) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    data.dietaryTags = normalizeDietaryTags(data.dietaryTags);

    const item = new MenuItem(data);
    await item.save();
    await logActivity({
      req,
      action: 'menu_item_created',
      category: 'MENU',
      itemAffected: item.name,
      entityModel: 'MenuItem',
      entityId: item._id,
      details: `Added menu item: ${item.name}`
    });
    res.status(201).json(await item.populate('category'));
  } catch (err) { 
    console.error('Menu Item Create Error:', err);
    res.status(400).json({ error: err.message || 'Failed to create menu item.' }); 
  }
});

router.patch('/menu-items/:id', upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;
    
    if (data.dietaryTags !== undefined) {
      data.dietaryTags = normalizeDietaryTags(data.dietaryTags);
    }

    const item = await MenuItem.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).populate('category');
    if (!item) return res.status(404).json({ error: 'Menu item not found.' });
    await logActivity({
      req,
      action: 'menu_item_updated',
      category: 'MENU',
      itemAffected: item.name,
      entityModel: 'MenuItem',
      entityId: item._id,
      details: `Updated menu item: ${item.name}`
    });
    res.json(item);
  } catch (err) { 
    console.error('Menu Item Update Error:', err);
    res.status(400).json({ error: err.message || 'Failed to update menu item.' }); 
  }
});

router.delete('/menu-items/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Menu item not found.' });
    await logActivity({
      req,
      action: 'menu_item_deleted',
      category: 'MENU',
      itemAffected: item.name,
      entityModel: 'MenuItem',
      entityId: item._id,
      details: `Removed menu item: ${item.name}`
    });
    res.json({ message: 'Deleted successfully' });
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
  try {
    const layer = await new FashionLayer(req.body).save();
    await logActivity({
      req,
      action: 'fashion_layer_created',
      category: 'FASHION',
      itemAffected: layer.name,
      entityModel: 'FashionLayer',
      entityId: layer._id
    });
    res.status(201).json(layer);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.patch('/fashion-layers/:id', async (req, res) => {
  try {
    const layer = await FashionLayer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (layer) {
      await logActivity({
        req,
        action: 'fashion_layer_updated',
        category: 'FASHION',
        itemAffected: layer.name,
        entityModel: 'FashionLayer',
        entityId: layer._id
      });
    }
    res.json(layer);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/fashion-layers/:id', async (req, res) => {
  try {
    const layer = await FashionLayer.findByIdAndDelete(req.params.id);
    await FashionItem.deleteMany({ layer: req.params.id });
    await logActivity({
      req,
      action: 'fashion_layer_deleted',
      category: 'FASHION',
      itemAffected: layer?.name || `Layer #${req.params.id}`,
      entityModel: 'FashionLayer',
      entityId: req.params.id
    });
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
    const finalImages = [];
    let existingArray = data.existingImages ? (Array.isArray(data.existingImages) ? data.existingImages : [data.existingImages]) : [];
    let existingIdx = 0, newIdx = 0;
    
    if (data.mediaOrder) {
      const order = JSON.parse(data.mediaOrder);
      order.forEach(type => {
        if (type === 'existing' && existingIdx < existingArray.length) finalImages.push(existingArray[existingIdx++]);
        else if (type === 'new' && req.files && newIdx < req.files.length) finalImages.push(req.files[newIdx++].path);
      });
      data.images = finalImages;
    } else {
      if (req.files && req.files.length > 0) {
        data.images = req.files.map(f => f.path);
      }
      if (data.existingImages) {
        data.images = [...(data.images || []), ...existingArray];
      }
    }
    const existingItem = await FashionItem.findOne({ slug: data.slug });
    if (existingItem) {
      return res.status(400).json({ error: 'A fashion item with this slug already exists.' });
    }

    const item = new FashionItem(data);
    await item.save();
    await logActivity({
      req,
      action: 'fashion_item_created',
      category: 'FASHION',
      itemAffected: item.name,
      entityModel: 'FashionItem',
      entityId: item._id
    });
    res.status(201).json(await item.populate('layer'));
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.patch('/fashion-items/:id', upload.array('images', 10), async (req, res) => {
  try {
    const data = { ...req.body };
    
    // Combine existing images (URLs) + newly uploaded images (files)
    let finalImages = [];
    let existingArray = data.existingImages ? (Array.isArray(data.existingImages) ? data.existingImages : [data.existingImages]) : [];
    let existingIdx = 0, newIdx = 0;

    if (data.mediaOrder) {
      const order = JSON.parse(data.mediaOrder);
      order.forEach(type => {
        if (type === 'existing' && existingIdx < existingArray.length) finalImages.push(existingArray[existingIdx++]);
        else if (type === 'new' && req.files && newIdx < req.files.length) finalImages.push(req.files[newIdx++].path);
      });
      data.images = finalImages;
    } else {
      if (req.files && req.files.length > 0) {
        finalImages = finalImages.concat(req.files.map(f => f.path));
      }
      data.images = existingArray.concat(finalImages);
    }

    if (data.sizes && typeof data.sizes === 'string') data.sizes = data.sizes.split(',').map(s => s.trim());
    if (data.colors && typeof data.colors === 'string') data.colors = data.colors.split(',').map(c => c.trim());
    
    if (data.slug) {
      const existingItem = await FashionItem.findOne({ slug: data.slug, _id: { $ne: req.params.id } });
      if (existingItem) {
        return res.status(400).json({ error: 'A fashion item with this slug already exists.' });
      }
    }

    const item = await FashionItem.findByIdAndUpdate(req.params.id, data, { new: true }).populate('layer');
    if (item) {
      await logActivity({
        req,
        action: 'fashion_item_updated',
        category: 'FASHION',
        itemAffected: item.name,
        entityModel: 'FashionItem',
        entityId: item._id
      });
    }
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/fashion-items/:id', async (req, res) => {
  try {
    const item = await FashionItem.findByIdAndDelete(req.params.id);
    await logActivity({
      req,
      action: 'fashion_item_deleted',
      category: 'FASHION',
      itemAffected: item?.name || `Item #${req.params.id}`,
      entityModel: 'FashionItem',
      entityId: req.params.id
    });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ==========================================================================
   MOVEMENT (CLASSES & INSTRUCTORS)
   ========================================================================== */
router.get('/instructors', async (req, res) => {
  try {
    const instructors = await Instructor.find().sort({ sortOrder: 1, firstName: 1 }).lean();
    const counts = await ClassSession.aggregate([
      { $group: { _id: '$instructor', totalClasses: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { if (c._id) countMap[c._id.toString()] = c.totalClasses; });

    const enriched = instructors.map(inst => ({
      ...inst,
      classesCount: (countMap[inst._id.toString()] || 0) + (inst.classesCount || 0)
    }));

    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/instructors', upload.single('photo'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.photo = req.file.path;
    if (typeof data.specialities === 'string') {
      data.specialities = data.specialities.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (typeof data.certifications === 'string') {
      data.certifications = data.certifications.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (data.isActive !== undefined) {
      data.isActive = data.isActive === true || data.isActive === 'true';
    }
    const inst = await new Instructor(data).save();
    await logActivity({
      req,
      action: 'instructor_created',
      category: 'CLASSES',
      itemAffected: `${inst.firstName} ${inst.lastName}`,
      entityModel: 'Instructor',
      entityId: inst._id
    });
    res.status(201).json(inst);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.patch('/instructors/:id', upload.single('photo'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.photo = req.file.path;
    if (typeof data.specialities === 'string') {
      data.specialities = data.specialities.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (typeof data.certifications === 'string') {
      data.certifications = data.certifications.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (data.isActive !== undefined) {
      data.isActive = data.isActive === true || data.isActive === 'true';
    }
    const inst = await Instructor.findByIdAndUpdate(req.params.id, data, { new: true });
    if (inst) {
      await logActivity({
        req,
        action: 'instructor_updated',
        category: 'CLASSES',
        itemAffected: `${inst.firstName} ${inst.lastName}`,
        entityModel: 'Instructor',
        entityId: inst._id
      });
    }
    res.json(inst);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/instructors/:id', async (req, res) => {
  try {
    const inst = await Instructor.findByIdAndDelete(req.params.id);
    await logActivity({
      req,
      action: 'instructor_deleted',
      category: 'CLASSES',
      itemAffected: inst ? `${inst.firstName} ${inst.lastName}` : `Instructor #${req.params.id}`,
      entityModel: 'Instructor',
      entityId: req.params.id
    });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/class-types', async (req, res) => {
  try { res.json(await ClassType.find().sort({ name: 1 })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/class-types', upload.single('coverImage'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.coverImage = req.file.path;
    const ct = await new ClassType(data).save();
    await logActivity({
      req,
      action: 'class_type_created',
      category: 'CLASSES',
      itemAffected: ct.name,
      entityModel: 'ClassType',
      entityId: ct._id
    });
    res.status(201).json(ct);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.patch('/class-types/:id', upload.single('coverImage'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.coverImage = req.file.path;
    const ct = await ClassType.findByIdAndUpdate(req.params.id, data, { new: true });
    if (ct) {
      await logActivity({
        req,
        action: 'class_type_updated',
        category: 'CLASSES',
        itemAffected: ct.name,
        entityModel: 'ClassType',
        entityId: ct._id
      });
    }
    res.json(ct);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/class-types/:id', async (req, res) => {
  try {
    const ct = await ClassType.findByIdAndDelete(req.params.id);
    await logActivity({
      req,
      action: 'class_type_deleted',
      category: 'CLASSES',
      itemAffected: ct?.name || `ClassType #${req.params.id}`,
      entityModel: 'ClassType',
      entityId: req.params.id
    });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ==========================================================================
   VENUES & EVENTS
   ========================================================================== */
router.get('/venue-spaces', async (req, res) => {
  try { 
    const query = {};
    if (req.query.type) query.spaceType = req.query.type;
    if (req.query.classStudio === 'true') query.isClassStudio = true;
    if (req.query.hireable === 'true') query.isHireableVenue = true;
    res.json(await VenueSpace.find(query).sort({ sortOrder: 1, name: 1 })); 
  } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/venue-spaces', upload.array('gallery', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    const finalImages = [];
    let existingArray = data.existingGallery ? (Array.isArray(data.existingGallery) ? data.existingGallery : [data.existingGallery]) : [];
    let existingIdx = 0, newIdx = 0;
    
    if (data.mediaOrder) {
      const order = JSON.parse(data.mediaOrder);
      order.forEach(type => {
        if (type === 'existing' && existingIdx < existingArray.length) finalImages.push(existingArray[existingIdx++]);
        else if (type === 'new' && req.files && newIdx < req.files.length) finalImages.push(req.files[newIdx++].path);
      });
      data.images = finalImages;
    } else {
      if (req.files && req.files.length > 0) data.images = req.files.map(f => f.path);
    }

    if (data.features) data.amenities = data.features.split(',').map(f => f.trim()).filter(Boolean);
    if (data.seatingArrangements) data.seatingArrangements = data.seatingArrangements.split(',').map(s => s.trim()).filter(Boolean);
    if (data.suitableFor) data.suitableFor = data.suitableFor.split(',').map(s => s.trim()).filter(Boolean);
    if (data.isActive !== undefined) data.isActive = data.isActive === true || data.isActive === 'true';
    if (data.isClassStudio !== undefined) data.isClassStudio = data.isClassStudio === true || data.isClassStudio === 'true';
    if (data.isHireableVenue !== undefined) data.isHireableVenue = data.isHireableVenue === true || data.isHireableVenue === 'true';
    if (data.isCafeArea !== undefined) data.isCafeArea = data.isCafeArea === true || data.isCafeArea === 'true';
    if (data.defaultCapacity) data.defaultCapacity = Number(data.defaultCapacity);
    if (data.capacity) data.capacity = Number(data.capacity);
    if (data.price) data.priceKobo = Math.round(Number(data.price) * 100);
    if (data.sortOrder) data.sortOrder = Number(data.sortOrder);
    
    const space = await new VenueSpace(data).save();
    await logActivity({
      req,
      action: 'venue_space_created',
      category: 'VENUE',
      itemAffected: space.name,
      entityModel: 'VenueSpace',
      entityId: space._id
    });
    res.status(201).json(space);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.patch('/venue-spaces/:id', upload.array('gallery', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    const finalImages = [];
    let existingArray = data.existingGallery ? (Array.isArray(data.existingGallery) ? data.existingGallery : [data.existingGallery]) : [];
    let existingIdx = 0, newIdx = 0;
    
    if (data.mediaOrder) {
      const order = JSON.parse(data.mediaOrder);
      order.forEach(type => {
        if (type === 'existing' && existingIdx < existingArray.length) finalImages.push(existingArray[existingIdx++]);
        else if (type === 'new' && req.files && newIdx < req.files.length) finalImages.push(req.files[newIdx++].path);
      });
      data.images = finalImages;
    } else {
      if (req.files && req.files.length > 0) data.images = req.files.map(f => f.path);
    }

    if (data.features && typeof data.features === 'string') data.amenities = data.features.split(',').map(f => f.trim()).filter(Boolean);
    if (data.seatingArrangements && typeof data.seatingArrangements === 'string') data.seatingArrangements = data.seatingArrangements.split(',').map(s => s.trim()).filter(Boolean);
    if (data.suitableFor && typeof data.suitableFor === 'string') data.suitableFor = data.suitableFor.split(',').map(s => s.trim()).filter(Boolean);
    if (data.isActive !== undefined) data.isActive = data.isActive === true || data.isActive === 'true';
    if (data.isClassStudio !== undefined) data.isClassStudio = data.isClassStudio === true || data.isClassStudio === 'true';
    if (data.isHireableVenue !== undefined) data.isHireableVenue = data.isHireableVenue === true || data.isHireableVenue === 'true';
    if (data.isCafeArea !== undefined) data.isCafeArea = data.isCafeArea === true || data.isCafeArea === 'true';
    if (data.defaultCapacity) data.defaultCapacity = Number(data.defaultCapacity);
    if (data.capacity) data.capacity = Number(data.capacity);
    if (data.price !== undefined) data.priceKobo = Math.round(Number(data.price) * 100);
    if (data.sortOrder) data.sortOrder = Number(data.sortOrder);

    const space = await VenueSpace.findByIdAndUpdate(req.params.id, data, { new: true });
    if (space) {
      await logActivity({
        req,
        action: 'venue_space_updated',
        category: 'VENUE',
        itemAffected: space.name,
        entityModel: 'VenueSpace',
        entityId: space._id
      });
    }
    res.json(space);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/venue-spaces/:id', async (req, res) => {
  try {
    const space = await VenueSpace.findByIdAndDelete(req.params.id);
    await logActivity({
      req,
      action: 'venue_space_deleted',
      category: 'VENUE',
      itemAffected: space?.name || `Space #${req.params.id}`,
      entityModel: 'VenueSpace',
      entityId: req.params.id
    });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Helper for recurring event dates
function generateEventOccurrences({ baseStart, baseEnd, frequency, daysOfWeek = [], repeatCount = 4, repeatUntil = null }) {
  const occurrences = [];
  const durationMs = baseEnd.getTime() - baseStart.getTime();
  const maxSafetyLimit = 24;
  const targetCount = repeatUntil ? maxSafetyLimit : Math.min(Math.max(parseInt(repeatCount) || 1, 1), maxSafetyLimit);
  const untilDate = repeatUntil ? new Date(repeatUntil) : null;

  if (frequency === 'daily') {
    let currStart = new Date(baseStart);
    while (occurrences.length < targetCount) {
      if (untilDate && currStart > untilDate) break;
      const currEnd = new Date(currStart.getTime() + durationMs);
      occurrences.push({ startDate: new Date(currStart), endDate: currEnd });
      currStart.setDate(currStart.getDate() + 1);
    }
  } else if (frequency === 'weekly' || frequency === 'biweekly') {
    const stepWeeks = frequency === 'biweekly' ? 2 : 1;
    const activeDays = Array.isArray(daysOfWeek) && daysOfWeek.length > 0 ? daysOfWeek.map(Number) : [baseStart.getDay()];
    
    let weekStart = new Date(baseStart);
    const dayOffset = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - dayOffset);

    let weekCounter = 0;
    while (occurrences.length < targetCount && weekCounter < 52) {
      for (const day of [0, 1, 2, 3, 4, 5, 6]) {
        if (activeDays.includes(day)) {
          const occStart = new Date(weekStart);
          occStart.setDate(occStart.getDate() + day);
          occStart.setHours(baseStart.getHours(), baseStart.getMinutes(), 0, 0);

          if (occStart >= baseStart) {
            if (untilDate && occStart > untilDate) break;
            const occEnd = new Date(occStart.getTime() + durationMs);
            occurrences.push({ startDate: occStart, endDate: occEnd });
            if (occurrences.length >= targetCount) break;
          }
        }
      }
      weekStart.setDate(weekStart.getDate() + (7 * stepWeeks));
      weekCounter += stepWeeks;
    }
  } else if (frequency === 'monthly') {
    let currStart = new Date(baseStart);
    while (occurrences.length < targetCount) {
      if (untilDate && currStart > untilDate) break;
      const currEnd = new Date(currStart.getTime() + durationMs);
      occurrences.push({ startDate: new Date(currStart), endDate: currEnd });
      currStart.setMonth(currStart.getMonth() + 1);
    }
  } else {
    occurrences.push({ startDate: new Date(baseStart), endDate: new Date(baseEnd) });
  }

  return occurrences;
}

router.get('/events', async (req, res) => {
  try { res.json(await EventRecord.find().populate('venueSpace').sort({ startDate: -1 })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/events', upload.single('coverImage'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.coverImage = req.file.path;
    
    if (data.startDate) {
      const eventStart = new Date(data.startDate);
      const minStartTime = new Date(Date.now() + 6 * 60 * 60 * 1000);
      if (eventStart < minStartTime) {
        return res.status(400).json({ error: 'Events must be scheduled at least 6 hours in advance.' });
      }
    }

    if (data.startDate && data.endDate) {
      if (new Date(data.endDate) <= new Date(data.startDate)) {
        return res.status(400).json({ error: 'End date & time must be after start date & time.' });
      }
    }

    if (typeof data.customFields === 'string') {
      try { data.customFields = JSON.parse(data.customFields); } catch (e) { data.customFields = []; }
    }
    
    let recurrence = {};
    if (typeof data.recurrence === 'string') {
      try { recurrence = JSON.parse(data.recurrence); } catch (e) {}
    } else if (typeof data.recurrence === 'object') {
      recurrence = data.recurrence || {};
    }

    const isRecurring = data.isRecurring === true || data.isRecurring === 'true';

    if (isRecurring && data.startDate && data.endDate) {
      const baseStart = new Date(data.startDate);
      const baseEnd = new Date(data.endDate);
      const occurrences = generateEventOccurrences({
        baseStart,
        baseEnd,
        frequency: recurrence.frequency || 'weekly',
        daysOfWeek: recurrence.daysOfWeek || [],
        repeatCount: recurrence.repeatCount || 4,
        repeatUntil: recurrence.repeatUntil || null
      });

      if (occurrences.length === 0) {
        return res.status(400).json({ error: 'Could not generate recurring occurrences with the specified options.' });
      }

      const seriesId = 'evt_series_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const baseSlug = (data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');

      const docsToInsert = occurrences.map((occ, idx) => {
        const dateStr = occ.startDate.toISOString().split('T')[0].replace(/-/g, '');
        const slug = idx === 0 ? baseSlug : `${baseSlug}-${dateStr}`;
        return {
          ...data,
          slug,
          startDate: occ.startDate,
          endDate: occ.endDate,
          isRecurring: true,
          seriesId,
          recurrence: {
            frequency: recurrence.frequency || 'weekly',
            daysOfWeek: recurrence.daysOfWeek || [baseStart.getDay()],
            repeatCount: occurrences.length,
            repeatUntil: recurrence.repeatUntil || null
          }
        };
      });

      const createdEvents = await EventRecord.insertMany(docsToInsert);
      await logActivity({
        req,
        action: 'event_created',
        category: 'EVENTS',
        itemAffected: `${data.title || 'Recurring Event'} (${createdEvents.length} dates)`,
        entityModel: 'EventRecord',
        entityId: seriesId,
        details: `Created recurring event series (${createdEvents.length} occurrences)`
      });
      return res.status(201).json({
        message: `Created ${createdEvents.length} recurring event occurrences.`,
        count: createdEvents.length,
        seriesId,
        events: createdEvents
      });
    }

    const evt = new EventRecord(data);
    await evt.save();
    await logActivity({
      req,
      action: 'event_created',
      category: 'EVENTS',
      itemAffected: evt.title,
      entityModel: 'EventRecord',
      entityId: evt._id,
      details: `Created event: ${evt.title}`
    });
    res.status(201).json(await evt.populate('venueSpace'));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/events/:id', upload.single('coverImage'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.coverImage = req.file.path;

    const existing = await EventRecord.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Event not found' });

    if (data.startDate) {
      const eventStart = new Date(data.startDate);
      const minStartTime = new Date(Date.now() + 6 * 60 * 60 * 1000);
      const originalStart = new Date(existing.startDate);
      if (eventStart.getTime() !== originalStart.getTime() && eventStart < minStartTime) {
        return res.status(400).json({ error: 'Events must be scheduled at least 6 hours in advance.' });
      }
    }

    const effectiveStart = data.startDate ? new Date(data.startDate) : new Date(existing.startDate);
    const effectiveEnd = data.endDate ? new Date(data.endDate) : (existing.endDate ? new Date(existing.endDate) : null);
    if (effectiveEnd && effectiveEnd <= effectiveStart) {
      return res.status(400).json({ error: 'End date & time must be after start date & time.' });
    }

    if (typeof data.customFields === 'string') {
      try { data.customFields = JSON.parse(data.customFields); } catch (e) { data.customFields = []; }
    }

    let recurrence = {};
    if (typeof data.recurrence === 'string') {
      try { recurrence = JSON.parse(data.recurrence); } catch (e) {}
    } else if (typeof data.recurrence === 'object') {
      recurrence = data.recurrence || {};
    }

    const isRecurring = data.isRecurring === true || data.isRecurring === 'true';

    // Convert single event to recurring series
    if (isRecurring && (!existing.isRecurring || !existing.seriesId) && (data.startDate || existing.startDate)) {
      const baseStart = new Date(data.startDate || existing.startDate);
      const baseEnd = new Date(data.endDate || existing.endDate || baseStart);
      const occurrences = generateEventOccurrences({
        baseStart,
        baseEnd,
        frequency: recurrence.frequency || 'weekly',
        daysOfWeek: recurrence.daysOfWeek || [baseStart.getDay()],
        repeatCount: recurrence.repeatCount || 4,
        repeatUntil: recurrence.repeatUntil || null
      });

      const seriesId = 'evt_series_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const baseSlug = (data.slug || existing.slug || 'event').replace(/^-|-$/g, '');

      // 1. Update current event as #1
      const updatedFirst = await EventRecord.findByIdAndUpdate(
        req.params.id,
        {
          ...data,
          isRecurring: true,
          seriesId,
          recurrence: {
            frequency: recurrence.frequency || 'weekly',
            daysOfWeek: recurrence.daysOfWeek || [baseStart.getDay()],
            repeatCount: occurrences.length,
            repeatUntil: recurrence.repeatUntil || null
          }
        },
        { new: true }
      ).populate('venueSpace');

      // 2. Insert remaining occurrences
      if (occurrences.length > 1) {
        const remainingDocs = occurrences.slice(1).map(occ => {
          const dateStr = occ.startDate.toISOString().split('T')[0].replace(/-/g, '');
          return {
            ...existing.toObject(),
            ...data,
            _id: undefined,
            slug: `${baseSlug}-${dateStr}`,
            startDate: occ.startDate,
            endDate: occ.endDate,
            isRecurring: true,
            seriesId,
            recurrence: {
              frequency: recurrence.frequency || 'weekly',
              daysOfWeek: recurrence.daysOfWeek || [baseStart.getDay()],
              repeatCount: occurrences.length,
              repeatUntil: recurrence.repeatUntil || null
            }
          };
        });
        await EventRecord.insertMany(remainingDocs);
      }

      await logActivity({
        req,
        action: 'event_modified',
        category: 'EVENTS',
        itemAffected: `${updatedFirst?.title || existing.title} (Recurring Series · ${occurrences.length})`,
        entityModel: 'EventRecord',
        entityId: updatedFirst?._id || req.params.id
      });

      return res.json({
        message: `Converted event to recurring series with ${occurrences.length} total occurrences.`,
        event: updatedFirst,
        count: occurrences.length,
        seriesId
      });
    }

    const updated = await EventRecord.findByIdAndUpdate(req.params.id, data, { new: true }).populate('venueSpace');
    await logActivity({
      req,
      action: 'event_modified',
      category: 'EVENTS',
      itemAffected: updated?.title || existing.title,
      entityModel: 'EventRecord',
      entityId: req.params.id,
      details: `Updated event: ${updated?.title || existing.title}`
    });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/events/:id', async (req, res) => {
  try {
    const evt = await EventRecord.findByIdAndDelete(req.params.id);
    await logActivity({
      req,
      action: 'event_deleted',
      category: 'EVENTS',
      itemAffected: evt?.title || `Event #${req.params.id}`,
      entityModel: 'EventRecord',
      entityId: req.params.id
    });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/events/series/:seriesId', async (req, res) => {
  try {
    const result = await EventRecord.deleteMany({ seriesId: req.params.seriesId });
    await logActivity({
      req,
      action: 'event_series_deleted',
      category: 'EVENTS',
      itemAffected: `Series ${req.params.seriesId} (${result.deletedCount} events)`,
      entityModel: 'EventRecord',
      entityId: req.params.seriesId
    });
    res.json({ message: `Successfully deleted ${result.deletedCount} events in recurring series.`, count: result.deletedCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ==========================================================================
   WAIVERS & AUDIT RECORDS
   ========================================================================== */
router.get('/waivers', async (req, res) => {
  try {
    const waivers = await WaiverVersion.find().populate('publishedBy', 'firstName lastName email').sort({ publishedAt: -1, createdAt: -1 });
    res.json(waivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/waivers', async (req, res) => {
  try {
    const { version, title, content } = req.body;
    if (!version || !title || !content) {
      return res.status(400).json({ error: 'Version ID, title, and waiver content are all required.' });
    }

    const waiver = new WaiverVersion({
      version: version.trim(),
      title: title.trim(),
      content,
      isActive: true,
      publishedBy: req.user._id,
      publishedAt: new Date()
    });

    await waiver.save();

    // Automatically update global setting
    await Setting.findOneAndUpdate(
      { key: 'waiver_current_version' },
      { value: waiver.version, description: 'Current active waiver version ID' },
      { upsert: true, new: true }
    );

    await logActivity({
      req,
      action: 'waiver_published',
      category: 'WAIVER',
      itemAffected: `Liability Waiver ${waiver.version}`,
      entityModel: 'WaiverVersion',
      entityId: waiver._id,
      details: `Published waiver "${waiver.title}" (v${waiver.version})`
    });
    res.status(201).json(waiver);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/waivers/:id/activate', async (req, res) => {
  try {
    const waiver = await WaiverVersion.findById(req.params.id);
    if (!waiver) return res.status(404).json({ error: 'Waiver version not found' });

    waiver.isActive = true;
    await waiver.save();

    await Setting.findOneAndUpdate(
      { key: 'waiver_current_version' },
      { value: waiver.version, description: 'Current active waiver version ID' },
      { upsert: true, new: true }
    );

    await logActivity({
      req,
      action: 'waiver_activated',
      category: 'WAIVER',
      itemAffected: `Liability Waiver ${waiver.version}`,
      entityModel: 'WaiverVersion',
      entityId: waiver._id,
      details: `Activated waiver version ${waiver.version}`
    });
    res.json(waiver);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/waivers/records', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const search = req.query.search ? req.query.search.trim() : '';

    const query = search
      ? {
          $or: [
            { memberName: { $regex: search, $options: 'i' } },
            { memberEmail: { $regex: search, $options: 'i' } },
            { ipAddress: { $regex: search, $options: 'i' } },
            { waiverVersion: { $regex: search, $options: 'i' } },
          ]
        }
      : {};

    const [records, total] = await Promise.all([
      WaiverRecord.find(query)
        .sort({ signedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      WaiverRecord.countDocuments(query)
    ]);

    res.json({
      records,
      total,
      page,
      pages: Math.ceil(total / limit) || 1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/waivers/records/:id/export', async (req, res) => {
  try {
    const record = await WaiverRecord.findById(req.params.id);
    if (!record) return res.status(404).send('Record not found');

    const cleanName = (record.memberName || 'Member').replace(/[^a-zA-Z0-9_-]/g, '-');
    const filename = `waiver-${cleanName}-${record.waiverVersion || '2026-09'}.html`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Aora House — Signed Liability Waiver (${record.memberName})</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Georgia, serif;
      max-width: 820px;
      margin: 40px auto;
      padding: 24px;
      line-height: 1.7;
      color: #2B2015;
      background: #FFFFFF;
    }
    h1 { font-size: 22px; color: #1E1610; margin-bottom: 6px; }
    .header-sub { font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #9C8770; margin-bottom: 20px; font-weight: 600; }
    .meta {
      background: #FAF6EF;
      border: 1px solid #E3D3B8;
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 28px;
      font-family: monospace, sans-serif;
      font-size: 13px;
      line-height: 1.8;
    }
    .meta b { color: #1E1610; }
    .content-box {
      border: 1px solid #E8E0D2;
      border-radius: 6px;
      padding: 24px;
      background: #FFFDF9;
      margin-bottom: 24px;
      font-size: 14px;
    }
    hr { border: none; border-top: 1px solid #E3D3B8; margin: 24px 0; }
    .footer-notice {
      font-size: 12px;
      color: #6E5E4E;
      line-height: 1.6;
      border-top: 1px dashed #CCC;
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <h1>Aora House — Signed Client Liability Waiver</h1>
  <div class="header-sub">Official Electronic Forensic Audit Record · Lagos, Nigeria</div>

  <div class="meta">
    <b>Member Name:</b> ${record.memberName || 'N/A'}<br>
    <b>Member Email:</b> ${record.memberEmail || 'N/A'}<br>
    <b>Signed Date & Time:</b> ${new Date(record.signedAt).toUTCString()} (${new Date(record.signedAt).toLocaleString()})<br>
    <b>Waiver Version:</b> ${record.waiverVersion}<br>
    <b>IP Address:</b> ${record.ipAddress}<br>
    <b>Signing Method:</b> ${record.method || 'electronic'}<br>
    <b>Browser / Device Agent:</b> ${record.userAgent || 'N/A'}<br>
    <b>Record ID:</b> ${record._id}
  </div>

  <div class="content-box">
    ${record.waiverText}
  </div>

  <div class="footer-notice">
    <strong>Legal Verification:</strong> This electronic record was captured from the Aora House membership audit database. In accordance with the Arbitration and Mediation Act 2023 and the Evidence Act of the Federal Republic of Nigeria, electronic signatures and digital confirmations carry full legal evidentiary validity.
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);
  } catch (err) {
    res.status(500).send('Export failed: ' + err.message);
  }
});

module.exports = router;
