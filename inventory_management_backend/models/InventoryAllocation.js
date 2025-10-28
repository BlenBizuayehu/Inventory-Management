const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  batch: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Batch',
    required: true 
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  packs: Number,
  pieces: Number,
  status: {
    type: String,
    enum: ['placed', 'transferred', 'sold'],
    default: 'placed'
  },
  reference: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Ensure no duplicate batch-store allocations
allocationSchema.index({ batch: 1, store: 1 }, { unique: true });

module.exports = mongoose.model('InventoryAllocation', allocationSchema);

