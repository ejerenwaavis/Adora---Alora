const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MenuItem',
    required: true 
  },
  name: { type: String, required: true }, // snapshot of the name
  quantity: { type: Number, required: true, min: 1 },
  priceKobo: { type: Number, required: true }, // snapshot of the price at order time
  notes: { type: String, trim: true } // e.g., "No onions"
});

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  customerEmail: { type: String, trim: true },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, // Optional: if the user was logged in
  
  items: [orderItemSchema],
  totalAmountKobo: { type: Number, required: true },
  
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED'],
    default: 'PENDING'
  },
  paymentReference: { type: String }, // From Paystack
  
  orderType: {
    type: String,
    enum: ['TAKEOUT', 'GLOVO'],
    default: 'TAKEOUT'
  },
  
  // For Phase 3: Glovo Integration
  glovoOrderId: { type: String, unique: true, sparse: true }
}, { timestamps: true });

// Index for efficient KDS polling and sorting
orderSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('Order', orderSchema);
