// models/InventoryActivity.js
const mongoose = require('mongoose');

// Check if model already exists before defining it
if (mongoose.models.InventoryActivity) {
  module.exports = mongoose.model('InventoryActivity');
} else {
  const InventoryActivitySchema = new mongoose.Schema({
    store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: function() {
      return !this.shop && this.type !== 'receipt';
    }
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: function() {
      return !this.store && this.type === 'receipt';
    }
  },
    type: {
      type: String,
      enum: ['transfer', 'receipt', 'placement', 'sale'],
      required: true
    },
    quantity: {
      type: Number,
      required: false,
      min: 0
    },
    packs: {
      type: Number,
      default: 0,
      min: 0
    },
    pieces: {
      type: Number,
      default: 0,
      min: 0
    },
    packSize: {
      type: Number,
      default: 1,
      min: 1
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    source: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'sourceModel'
    },
    sourceModel: {
      type: String,
      enum: ['Store', 'Shop']
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'destinationModel'
    },
    destinationModel: {
      type: String,
      enum: ['Store', 'Shop']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    batch: {
      type: mongoose.Schema.Types.Mixed
    },
    direction: {
      type: String,
      enum: ['in', 'out']
    },
    description: String
  }, {
    timestamps: true,
    toJSON: { virtuals: true }
  });

  InventoryActivitySchema.pre('save', function(next) {
    // A receipt happens at a SHOP (receiving from a store)
    if (this.type === 'receipt' && !this.shop) {
        this.invalidate('shop', 'Receipts must be associated with a shop.');
    }
    // A transfer originates from a STORE
    if (this.type === 'transfer' && !this.store) {
        this.invalidate('store', 'Transfers must be associated with a store.');
    }
    // A sale happens at a SHOP
    if (this.type === 'sale' && !this.shop) {
        this.invalidate('shop', 'Sales must be associated with a shop.');
    }
    // NEW: A placement happens at a STORE (receiving from a supplier/invoice)
    if (this.type === 'placement' && !this.store) {
        this.invalidate('store', 'Placements must be associated with a store.');
    }
    
    // Ensure that an activity isn't linked to both a shop and a store
    if (this.shop && this.store) {
        this.invalidate('shop', 'Activity cannot be associated with both a shop and a store.');
    }
    
    next();
});

  module.exports = mongoose.model('InventoryActivity', InventoryActivitySchema);
}