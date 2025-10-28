const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'Please select a category']
  },
  unit: {
    type: String,
    required: [true, 'Please specify a unit of measurement'],
    enum: ['piece', 'gallon', 'kg', 'liter', 'box', 'pack', 'set', 'pair', 'meter', 'gram'], // Common units
    default: 'piece'
  },
  piecesPerPack: {
    type: Number,
    min: [1, 'Pieces per pack must be at least 1'],
    default: 1
  },
    currentSellPrice: {
    type: Number,
    min: 0,
    default: 0,
  },
  imageUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add to your ProductSchema
ProductSchema.statics.updateCurrentPrices = async function(priceUpdates, session = null) {
  const ops = priceUpdates.map(({ productId, price }) => ({
    updateOne: {
      filter: { _id: productId },
      update: { $set: { currentSellPrice: price } }
    }
  }));

  const options = session ? { session } : {};
  return this.bulkWrite(ops, options);
};

ProductSchema.methods.getPriceHistory = function() {
  return mongoose.model('ProductPrice').find({ product: this._id })
    .sort({ effectiveDate: -1 })
    .populate('createdBy', 'name');
};
module.exports = mongoose.model('Product', ProductSchema);