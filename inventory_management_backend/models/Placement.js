// placementModel.js
const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  invoiceItem: { type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceItem', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  batchNumber: { type: String, required: true },
  packs: { type: Number, default: 0 },
  pieces: { type: Number, default: 0 },
  packSize: { type: Number, required: true },
  placedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Placement', placementSchema);