const mongoose = require('mongoose');

const inventoryStoreSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true 
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  totalQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  batchBreakdown: [{
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch'
    },
    quantity: {
      type: Number,
      min: 0
    },
    packs: {
      type: Number,
      min: 0
    },
    pieces: {
      type: Number,
      min: 0
    }
  }],
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Compound index to ensure one inventory record per product-store combination
inventoryStoreSchema.index({ product: 1, store: 1 }, { unique: true });

module.exports = mongoose.model('InventoryStore', inventoryStoreSchema);