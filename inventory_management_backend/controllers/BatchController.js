const Batch = require('../models/Batch');
const invoiceItem = require('../models/InvoiceItem');
const BatchAssignment = require('../models/BatchAssignment.js');
const InventoryStore = require('../models/InventoryStore');
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Placement=require('../models/Placement.js');
const InventoryActivity=require('../models/InventoryActivity.js');
const asyncHandler = require('../middleware/async');

// Fetch batches for product (internal use)
exports.fetchBatchesForProduct = async (productId, location) => {
  try {
    const batches = await Batch.find({ 
      product: productId,
      'allocations.store': location,
      'allocations.quantity': { $gt: 0 }
    }).lean();
    return batches;
  } catch (err) {
    console.error("Failed to fetch batches:", err);
    return [];
  }
};

// Get batches with filtering
exports.getBatches = async (req, res) => {
  try {
    const { product, location } = req.query;
    
    const query = {};
    if (product) query.product = product;
    
    // If location specified, only show batches with allocations there
    if (location) {
      query['allocations.store'] = location;
      query['allocations.quantity'] = { $gt: 0 };
    }
    
    const batches = await Batch.find(query)
      .populate('product', 'name sku')
      .populate('allocations.store', 'name location')
      .populate('invoiceItem', 'invoiceNumber');
      
    res.status(200).json({
      success: true,
      data: batches
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get batch distribution across locations
exports.getBatchLocations = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId)
      .populate('product', 'name sku')
      .populate('invoiceItem', 'invoiceDate invoiceNumber')
      .populate('allocations.store', 'name location');

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }

    res.json({
      success: true,
      data: {
        batchInfo: {
          number: batch.batchNumber,
          product: batch.product,
          origin: batch.invoiceItem,
          totalRemaining: batch.remainingQuantity
        },
        allocations: batch.allocations.filter(a => a.quantity > 0)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// controllers/BatchController.js

// controllers/BatchController.js

exports.createBatchPlacements = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { invoiceId, placements } = req.body;

    // --- Robust Validation ---
    if (!invoiceId) throw new Error('Invoice ID is required.');
    if (!placements || !Array.isArray(placements)) throw new Error('Placements array is required.');

    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) throw new Error(`Invoice with ID ${invoiceId} not found.`);

    // Filter out any placements where the user did not enter a quantity
    const validPlacements = placements.filter(p => {
        const totalPieces = (p.packs || 0) * (p.packSize || 1) + (p.pieces || 0);
        return totalPieces > 0;
    });

    if (validPlacements.length === 0) {
        throw new Error('No valid quantities were submitted for placement.');
    }

    const results = [];

    // Loop through only the valid placements
    for (const placement of validPlacements) {
        const totalPieces = (placement.packs * placement.packSize) + placement.pieces;
        
        // --- THIS IS THE FIX ---
        // We construct the full object here to pass to Placement.create,
        // ensuring all required fields are present.
        const placementData = {
            invoice: invoiceId,
            invoiceItem: placement.invoiceItem,
            product: placement.product,
            store: placement.store,
            batchNumber: placement.batchNumber,
            packs: placement.packs,
            pieces: placement.pieces,
            packSize: placement.packSize,
            quantity: totalPieces
        };
        
        // 1. Create the placement record
        const [newPlacement] = await Placement.create([placementData], { session });
        results.push(newPlacement);

        // 2. Update the inventory store
        await InventoryStore.findOneAndUpdate(
          { product: placement.product, store: placement.store },
          {
            $push: {
              batchBreakdown: {
                batchNumber: placement.batchNumber,
                packs: placement.packs,
                pieces: placement.pieces,
                packSize: placement.packSize
              }
            },
            $inc: { totalQuantity: totalPieces },
            $set: { lastUpdated: new Date() }
          },
          { upsert: true, new: true, session }
        );

        // 3. Record the inventory activity
        await InventoryActivity.create([{
          store: placement.store,
          type: 'placement',
          quantity: totalPieces,
          packs: placement.packs,
          pieces: placement.pieces,
          product: placement.product,
          user: req.user._id,
          notes: `Stock placed from invoice #${invoice.invoiceNumber}`,
          batchNumber: placement.batchNumber
        }], { session });
    }

    await session.commitTransaction();
    res.status(201).json({ success: true, data: results });

  } catch (error) {
    await session.abortTransaction();
    console.error('Batch placement error:', error);
    // Send a more specific error message back to the frontend
    res.status(400).json({ 
      success: false,
      error: error.message
    });
  } finally {
    session.endSession();
  }
});
// In your backend controller (e.g., batchesController.js)
// In batchesController.js
exports.getPlacementsByInvoice = asyncHandler(async (req, res) => {
  try {
    const { invoiceId } = req.query;
    
    if (!invoiceId) {
      return res.status(400).json({ 
        success: false,
        error: 'Invoice ID is required' 
      });
    }

    const placements = await Placement.find({ invoice: invoiceId })
      .populate('store', 'name')
      .populate('product', 'name');

    res.status(200).json({
      success: true,
      data: placements
    });
  } catch (error) {
    console.error('Error fetching placements:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch placements' 
    });
  }
});







const migratePlacementsToInventory = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const placements = await Placement.find().session(session);

    for (const placement of placements) {
      await InventoryStore.findOneAndUpdate(
        { product: placement.product, store: placement.store },
        {
          $push: {
            batchBreakdown: {
              batchNumber: placement.batchNumber,
              packs: placement.packs,
              pieces: placement.pieces,
              packSize: placement.packSize
            }
          },
          $set: { lastUpdated: new Date() }
        },
        { upsert: true, session }
      );
    }

    await session.commitTransaction();
    console.log('Successfully migrated placements to inventory');
  } catch (error) {
    await session.abortTransaction();
    console.error('Migration failed:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

// Run with: 
// migratePlacementsToInventory().then(() => process.exit(0)).catch(() => process.exit(1));