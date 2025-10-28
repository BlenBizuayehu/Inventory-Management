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

module.exports = mongoose.model('Product', ProductSchema);