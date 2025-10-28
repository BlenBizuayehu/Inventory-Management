const mongoose = require('mongoose');

const storeDistributionSchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitMode: { type: String, enum: ['pack', 'piece'], required: true }
});

const InvoiceItemSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  buyPrice: { type: Number, required: true },
  quantityBought: { type: Number, required: true },
  quantityRemaining: { type: Number, required: true },
  batchNumber: { type: String, required: true },
  expiryDate: { type: Date },
  
  // New fields for pack/piece support
  unitMode: {
    type: String,
    enum: ['pack', 'piece'],
    default: 'pack',
    required: true
  },
  piecesPerPack: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },

  storeDistributions: [storeDistributionSchema],
  
  // Calculated fields
  totalPieces: {
    type: Number,
    required: false
  },
  totalPrice: {
    type: Number,
    required: false
  }
}, { timestamps: true });

// Pre-save hook to calculate derived fields
InvoiceItemSchema.pre('save', function(next) {
  this.totalPieces = this.unitMode === 'pack' 
    ? this.quantityBought * this.piecesPerPack
    : this.quantityBought;
    
  this.totalPrice = this.buyPrice * this.totalPieces;
  
  // For backward compatibility, set quantityRemaining if not provided
  if (this.isNew && typeof this.quantityRemaining === 'undefined') {
    this.quantityRemaining = this.totalPieces;
  }
  
  next();
});

module.exports = mongoose.model('InvoiceItem', InvoiceItemSchema);
