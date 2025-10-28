const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  fromLocation: { type: String, required: true },
  toLocation: { type: String, required: true },
  transferDate: { type: Date, default: Date.now },
  transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    packs: { type: Number, default: 0 },
    pieces: { type: Number, default: 0 },
    piecesPerPack: Number
  }],
  editHistory: [{
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    editedAt: { type: Date, default: Date.now },
    previousState: {
      fromLocation: String,
      toLocation: String,
      transferDate: Date,
      transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      notes: String,
      products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: String,
        packs: Number,
        pieces: Number,
        piecesPerPack: Number
      }]
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Transfer', transferSchema);