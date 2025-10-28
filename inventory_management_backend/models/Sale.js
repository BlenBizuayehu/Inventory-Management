const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// NEW: Import the mongoose-sequence package. This will handle our saleNumber generation.
const AutoIncrement = require('mongoose-sequence')(mongoose);

// --- SaleItemSchema (The sub-document for each item in a sale) ---
const SaleItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // NEW: A field to explicitly store the price before tax for accurate records.
  unitPriceBeforeVAT: {
    type: Number,
    required: true,
  },
  // NEW: Store the calculated VAT amount for a single item.
  unitVAT: {
      type: Number,
      required: true,
  },
  // MODIFIED: Your existing 'unitPrice' field will now store the final price PER UNIT (including VAT).
  // This ensures no existing data is broken. Your controller will calculate this.
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  // --- No changes to these existing fields ---
  batch: { type: Schema.Types.ObjectId, ref: 'Batch', required: false },
  batchNumber: { type: String, required: false },
  costPrice: { type: Number, required: false }
});


// --- SaleSchema (The main document for the entire sale) ---
const SaleSchema = new Schema({
  // MODIFIED: The saleNumber is now a simple Number. The plugin below will handle
  // generating a unique, sequential number automatically, solving the validation error.
  saleNumber: {
    type: Number,
    unique: true,
  },
  // NEW: A field to store the total VAT for the entire sale. This is better for reporting.
  totalVAT: {
    type: Number,
    required: true,
    default: 0
  },
   currency: {
        type: String,
        required: true,
        default: 'ETB' // Your system's default
    },
  // Your existing 'tax' field is kept for backward compatibility. Your controller
  // should populate both 'tax' and 'totalVAT' with the same value.
  tax: {
    type: Number,
    default: 0
  },
  // MODIFIED: This enum was already correct from your last version. Confirming it here.
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Check', 'Credit', 'Other'],
    required: true
  },
  // This 'credit' field was already correct from your last version. Confirming it here.
  credit: {
    type: Schema.Types.ObjectId,
    ref: 'Credit',
    required: false
  },
  // --- No changes to these existing fields ---
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: false },
  customerName: { type: String, required: false },
  items: [SaleItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentDetails: { type: String, required: false },
  notes: { type: String, required: false },
  batchTrackingEnabled: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true }
}, { timestamps: true });


// REMOVED: Your old, manual pre-save hook is deleted. It was the source of the error.
// SaleSchema.pre('save', async function(next) { ... });


// NEW: Apply the auto-increment plugin. This is the definitive fix for the saleNumber error.
// It will automatically create a unique, sequential number for `saleNumber` before any sale is saved.
SaleSchema.plugin(AutoIncrement, { inc_field: 'saleNumber', id: 'sale_counter', start_seq: 1001 });

module.exports = mongoose.model('Sale', SaleSchema);