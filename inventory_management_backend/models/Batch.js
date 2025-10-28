const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchNumber: { 
    type: String, 
    required: true,
    index: true,
    unique: true
  },
  invoiceItem: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'InvoiceItem',
    required: true 
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  packSize: {
    type: Number,
    required: true,
    min: 1
  },
  originalQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  remainingQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

batchSchema.virtual('allocations', {
  ref: 'InventoryAllocation',
  localField: '_id',
  foreignField: 'batch'
});

module.exports = mongoose.model('Batch', batchSchema);