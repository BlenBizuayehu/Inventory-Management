const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  supplierName: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: Date, required: true },
   currency: {
        type: String,
        required: true,
        default: 'ETB' // Set a sensible default
    },
  // New calculated fields (optional but recommended)
  subtotal: { type: Number },
  vatAmount: { type: Number },
  total: { type: Number }
}, { timestamps: true });

// Virtual for items (if you want to access items directly from invoice)
InvoiceSchema.virtual('items', {
  ref: 'InvoiceItem',
  localField: '_id',
  foreignField: 'invoice'
});

// Set toObject and toJSON options to include virtuals
InvoiceSchema.set('toObject', { virtuals: true });
InvoiceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);