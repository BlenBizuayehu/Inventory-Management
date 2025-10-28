const mongoose = require('mongoose');

const UserShopSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  shop: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Shop', 
    required: true,
    index: true 
  },
  role: {
    type: String,
    enum: ['manager', 'staff', 'cashier'],
    default: 'staff'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  // Ensure each user can only be assigned to a shop once
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

// Compound index to prevent duplicate assignments
UserShopSchema.index({ user: 1, shop: 1 }, { unique: true });

module.exports = mongoose.model('UserShop', UserShopSchema);