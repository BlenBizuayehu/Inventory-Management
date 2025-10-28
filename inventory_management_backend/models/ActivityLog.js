const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['stock_added', 'stock_removed', 'transfer', 'low_stock', 'inventory_check']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  quantity: {
    type: Number
  },
  details: {
    type: String
  },
  referenceId: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);