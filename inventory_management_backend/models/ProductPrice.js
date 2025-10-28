const mongoose = require('mongoose');

const ProductPriceSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  batch: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'InvoiceItem', 
    required: true 
  },
  sellPrice: { 
    type: Number, 
    required: true 
  },
  effectiveDate: { 
    type: Date, 
    default: Date.now 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true,
  // Ensure unique combination of product and batch
  index: { product: 1, batch: 1, unique: true }
});

module.exports = mongoose.model('ProductPrice', ProductPriceSchema);