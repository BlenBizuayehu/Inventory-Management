const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductPriceSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  batch: {
    type: Schema.Types.ObjectId,
    ref: 'Batch',
    required: false // Not required for current prices
  },
  invoiceItem: {
    type: Schema.Types.ObjectId,
    ref: 'InvoiceItem',
    required: false
  },
  buyPrice: {
    type: Number,
    required: false
  },
  sellPrice: {
    type: Number,
    required: true,
    min: 0
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    required: false
  }
}, { timestamps: true });

// Indexes for faster queries
ProductPriceSchema.index({ product: 1, isCurrent: 1 });
ProductPriceSchema.index({ batch: 1 });
ProductPriceSchema.index({ invoiceItem: 1 });

// Static method to update current price
ProductPriceSchema.statics.updateCurrentPrice = async function(productId, newPrice, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Mark old current price as not current
    await this.updateMany(
      { product: productId, isCurrent: true },
      { $set: { isCurrent: false } },
      { session }
    );

    // Create new current price
    const newPriceRecord = await this.create([{
      product: productId,
      sellPrice: newPrice,
      isCurrent: true,
      createdBy: userId
    }], { session });

    await session.commitTransaction();
    return newPriceRecord[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = mongoose.model('ProductPrice', ProductPriceSchema);