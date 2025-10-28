// models/InventoryShop.js
const mongoose = require('mongoose');

const InventoryShopSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true 
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  totalQuantity: { // Renamed from totalPieces for consistency
    type: Number,
    default: 0,
    min: 0
  },
  // --- THIS IS THE FIX: Make the structure identical to InventoryStore ---
  batchBreakdown: [{
    batchNumber: {
      type: String,
      required: true,
      trim: true
    },
    packs: {
      type: Number,
      min: 0,
      default: 0
    },
    pieces: {
      type: Number,
      min: 0,
      default: 0
    },
    packSize: {
      type: Number,
      min: 1,
      default: 1
    },
    sourceTransfer: { // Optional: useful for tracing where stock came from
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transfer'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Auto-calculate totalQuantity before saving
InventoryShopSchema.pre('save', function(next) {
  this.totalQuantity = this.batchBreakdown.reduce((total, batch) => {
    return total + ((batch.packs || 0) * (batch.packSize || 1)) + (batch.pieces || 0);
  }, 0);
  this.lastUpdated = new Date();
  next();
});

// Compound index for unique product-shop combinations
InventoryShopSchema.index({ product: 1, shop: 1 }, { unique: true });

module.exports = mongoose.model('InventoryShop', InventoryShopSchema);