const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  contactPerson: String,
  phone: String,
  email: String,
  address: String,
  vatNumber: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Supplier', SupplierSchema);