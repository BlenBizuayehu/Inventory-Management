const mongoose = require('mongoose');

const inventoryStoreSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: [true, 'Product ID is required'],
    validate: {
      validator: mongoose.Types.ObjectId.isValid,
      message: props => `${props.value} is not a valid product ID!`
    }
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  quantity: {  // Renamed from totalPieces for consistency
    type: Number,
    default: 0,
    min: 0
  },
  batchBreakdown: [{
    batch: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Batch'
    },
    batchNumber: {  // Added this crucial field
      type: String,
      required: true
    },
    packs: {
      type: Number,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value'
      }
    },
    pieces: {
      type: Number,
      min: 0,
      default: 0,
      validate: [
        {
          validator: Number.isInteger,
          message: '{VALUE} is not an integer value'
        },
        {
          validator: function(v) {
            return v < this.packSize;
          },
          message: 'Pieces must be less than pack size'
        }
      ]
    },
    packSize: {
      type: Number,
      min: 1,
      default: 1,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value'
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  index: { product: 1, store: 1 },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-calculate quantity when saving
inventoryStoreSchema.pre('save', function(next) {
  this.quantity = this.batchBreakdown.reduce((total, batch) => {
    return total + (batch.packs * batch.packSize) + batch.pieces;
  }, 0);
  this.lastUpdated = new Date();
  next();
});

// Add virtual for total pieces by batch
inventoryStoreSchema.virtual('batchBreakdown.totalPieces').get(function() {
  return this.batchBreakdown.map(batch => ({
    ...batch.toObject(),
    totalPieces: (batch.packs * batch.packSize) + batch.pieces
  }));
});

module.exports = mongoose.model('InventoryStore', inventoryStoreSchema);