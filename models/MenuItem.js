const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, lowercase: true, trim: true },
  description: { type: String },
  priceKobo:   { type: Number },
  dietaryTags: [{
    type: String,
    trim: true
  }],
  allergens:   [{ type: String }],
  image:       { type: String },
  isAvailable: { type: Boolean, default: true },
  isSignature: { type: Boolean, default: false }, // highlighted as a signature item
  sortOrder:   { type: Number, default: 0 },
  badge:       { type: String },   // "New", "Popular", "Seasonal"
}, { timestamps: true });

menuItemSchema.post('save', async function(doc) {
  try {
    const priceWithMarkup = Math.round((doc.priceKobo || 0) * 1.15); // 15% Glovo markup
    console.log(`[GLOVO SYNC] Mocking bulk update for ${doc.name} to Glovo with marked-up price ₦${priceWithMarkup/100}`);
    
    // In production, this would make an outbound fetch to Glovo's Bulk API:
    /*
    await fetch('https://api.glovoapp.com/webhook/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GLOVO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        products: [{
          id: doc._id.toString(),
          name: doc.name,
          price: priceWithMarkup / 100,
          description: doc.description || '',
          available: doc.isAvailable
        }]
      })
    });
    */
  } catch (error) {
    console.error('[GLOVO SYNC ERROR]', error);
  }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
