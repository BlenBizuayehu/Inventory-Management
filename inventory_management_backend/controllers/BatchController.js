const Batch = require('../models/Batch');
const InvoiceItem = require('../models/InvoiceItem');
const InventoryAllocation = require('../models/InventoryAllocation');
const InventoryStore = require('../models/InventoryStore');
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');

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

// Create batch placements from invoice
exports.createBatchPlacements = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { invoiceId, placements } = req.body;

    // Validate request
    if (!invoiceId) throw new Error('Missing invoiceId');
    if (!placements?.length) throw new Error('Placements array required');

    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    const results = await Promise.all(
      placements.map(async (placement) => {
        // Validate placement
        if (!placement.invoiceItem || !placement.store || !placement.batchNumber) {
          throw new Error('Missing required fields in placement');
        }
        
        const totalPieces = (placement.packs * placement.packSize) + placement.pieces;
        if (totalPieces <= 0) throw new Error('Total quantity must be positive');

        const invoiceItem = await InvoiceItem.findOne({
          _id: placement.invoiceItem,
          invoice: invoiceId
        }).session(session);
        
        if (!invoiceItem) throw new Error(`Invoice item ${placement.invoiceItem} not found`);

        // 1. Find or create batch
        let batch = await Batch.findOne({
          batchNumber: placement.batchNumber
        }).session(session);

        if (!batch) {
          batch = new Batch({
            invoiceItem: placement.invoiceItem,
            product: placement.product,
            batchNumber: placement.batchNumber,
            packSize: placement.packSize,
            originalQuantity: totalPieces,
            remainingQuantity: totalPieces,
            purchasePrice: invoiceItem.buyPrice
          });
          await batch.save({ session });
        }

        // 2. Check existing allocation
        let allocation = await InventoryAllocation.findOne({
          batch: batch._id,
          store: placement.store
        }).session(session);

        if (allocation) {
          // Update existing allocation
          allocation.quantity += totalPieces;
          allocation.packs += placement.packs;
          allocation.pieces += placement.pieces;
          await allocation.save({ session });
        } else {
          // Create new allocation
          allocation = await InventoryAllocation.create([{
            batch: batch._id,
            store: placement.store,
            quantity: totalPieces,
            packs: placement.packs,
            pieces: placement.pieces,
            status: 'placed',
            reference: invoiceId
          }], { session });
        }

        // 3. Update store inventory
        await InventoryStore.findOneAndUpdate(
          { product: placement.product, store: placement.store },
          {
            $inc: { totalQuantity: totalPieces },
            $push: { 
              batchBreakdown: {
                batch: batch._id,
                quantity: totalPieces,
                packs: placement.packs,
                pieces: placement.pieces
              }
            }
          },
          { upsert: true, session }
        );

        return {
          batch: batch.batchNumber,
          product: placement.product,
          store: placement.store,
          quantity: totalPieces,
          packs: placement.packs,
          pieces: placement.pieces
        };
      })
    );

    await session.commitTransaction();
    res.status(201).json({ 
      success: true,
      data: results
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Batch placement error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Transfer inventory between locations
exports.transferInventory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { fromStore, toStore, transfers } = req.body;

    if (!fromStore || !toStore || !transfers?.length) {
      throw new Error('Missing required fields');
    }

    const transferResults = await Promise.all(
      transfers.map(async (transfer) => {
        // 1. Verify source allocation
        const sourceAllocation = await InventoryAllocation.findOne({
          batch: transfer.batchId,
          store: fromStore,
          quantity: { $gte: transfer.quantity }
        }).session(session);

        if (!sourceAllocation) {
          throw new Error(`Insufficient quantity in batch ${transfer.batchId} at store ${fromStore}`);
        }

        // 2. Update source allocation
        await InventoryAllocation.findByIdAndUpdate(
          sourceAllocation._id,
          { $inc: { quantity: -transfer.quantity } },
          { session }
        );

        // 3. Create destination allocation
        await InventoryAllocation.create([{
          batch: transfer.batchId,
          store: toStore,
          quantity: transfer.quantity,
          status: 'transferred',
          reference: transfer.referenceId || 'manual-transfer'
        }], { session });

        // 4. Update store inventories
        await Promise.all([
          // Reduce source
          InventoryStore.findOneAndUpdate(
            { product: transfer.productId, store: fromStore },
            {
              $inc: { totalQuantity: -transfer.quantity },
              $pull: { batchBreakdown: { batch: transfer.batchId } }
            },
            { session }
          ),
          // Increase destination
          InventoryStore.findOneAndUpdate(
            { product: transfer.productId, store: toStore },
            {
              $inc: { totalQuantity: transfer.quantity },
              $push: { 
                batchBreakdown: {
                  batch: transfer.batchId,
                  quantity: transfer.quantity
                }
              }
            },
            { upsert: true, session }
          )
        ]);

        return {
          batch: transfer.batchId,
          fromStore,
          toStore,
          quantity: transfer.quantity,
          status: 'completed'
        };
      })
    );

    await session.commitTransaction();
    res.status(200).json({ 
      success: true,
      data: transferResults 
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};