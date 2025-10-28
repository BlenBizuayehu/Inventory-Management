const mongoose = require('mongoose');
// models/Transfer.js
const transferSchema = new mongoose.Schema({
  fromLocation: { type: String, required: true },
  toLocation: { type: String, required: true },
  transferDate: { type: Date, default: Date.now },
  transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    packs: { type: Number, default: 0 },
    pieces: { type: Number, default: 0 },
    batchNumber: String,
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }, // Reference to Batch document
    sku: String
  }],
  editHistory: [{
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    editedAt: { type: Date, default: Date.now },
    previousState: {
      fromLocation: String,
      toLocation: String,
      transferDate: Date,
      transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: String,
        packs: Number,
        pieces: Number,
        batchNumber: String,
        batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
        sku: String
      }]
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Transfer', transferSchema);