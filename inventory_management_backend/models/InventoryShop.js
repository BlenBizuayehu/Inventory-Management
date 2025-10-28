const mongoose = require('mongoose');

const InventoryShopSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  invoiceItem: { type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceItem', required: true },
  quantity: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('InventoryShop', InventoryShopSchema);
