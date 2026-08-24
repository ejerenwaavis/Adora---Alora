const mongoose = require('mongoose');

const fashionOrderSchema = new mongoose.Schema({
  fashionItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FashionItem', required: true },
  itemName: { type: String, required: true },
  selectedSize: { type: String },
  priceKobo: { type: Number, required: true },
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  orderType: { type: String, enum: ['PURCHASE', 'RESERVATION'], default: 'PURCHASE' },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'FULFILLED', 'CANCELLED'], default: 'CONFIRMED' },
  orderNumber: { type: String }
}, { timestamps: true });

fashionOrderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'AH-FSH-' + Math.floor(100000 + Math.random() * 900000);
  }
  next();
});

module.exports = mongoose.model('FashionOrder', fashionOrderSchema);
