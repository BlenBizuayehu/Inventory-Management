const mongoose = require('mongoose');

// Suggested Batch Schema
const batchSchema = new mongoose.Schema({
  batchNumber: String,
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  invoiceItem: { type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceItem' },
  packSize: Number,
  totalQuantity: Number,
  assignedQuantity: Number,  // Total assigned across all locations
  unassignedQuantity: Number, // Available to assign
  assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BatchAssignment' }],
  purchasePrice: Number
});

module.exports = mongoose.model('Batch', batchSchema);