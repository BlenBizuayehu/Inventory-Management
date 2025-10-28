// models/Report.js (if you need a report model)
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['inventory', 'sales', 'transfers', 'product-movement']
  },
  dateRange: {
    start: Date,
    end: Date
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  format: {
    type: String,
    enum: ['pdf', 'excel', 'json']
  },
  fileUrl: String,
  filters: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);