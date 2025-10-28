const mongoose = require('mongoose');

// Tracks batch quantities at specific locations
const batchAssignmentSchema = new mongoose.Schema({
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  quantity: Number,
  packs: Number,
  pieces: Number,
  status: { type: String, enum: ['placed', 'transferred', 'sold'] }
});

module.exports = mongoose.model('BatchAssignment', batchAssignmentSchema);

