const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  invoiceItem: { type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceItem' },
  quantity: { type: Number, required: true },
  sellPrice: { type: mongoose.Types.Decimal128, required: true },
  saleDate: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);
