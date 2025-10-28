const mongoose = require('mongoose');
const Transfer = require('../models/Transfer');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Store = require('../models/Store');
const InventoryStore = require('../models/InventoryStore');
const InventoryShop = require('../models/InventoryShop');
const InventoryActivity = require('../models/InventoryActivity');
const Batch = require('../models/Batch'); // Ensure this model exists

// @desc    Create new transfer
// @route   POST /api/transfers
// @access  Private

const performStockDeduction = (batchBreakdown, totalPiecesToDeduct) => {
    let newBatchBreakdown = JSON.parse(JSON.stringify(batchBreakdown));
    let piecesLeftToDeduct = totalPiecesToDeduct;
    const deductedBatches = [];

    for (const batch of newBatchBreakdown) {
        if (piecesLeftToDeduct <= 0) break;

        const totalPiecesInBatch = (batch.packs * batch.packSize) + batch.pieces;
        const piecesToDeductFromThisBatch = Math.min(piecesLeftToDeduct, totalPiecesInBatch);

        if (piecesToDeductFromThisBatch > 0) {
            deductedBatches.push({
                packSize: batch.packSize,
                packs: Math.floor(piecesToDeductFromThisBatch / batch.packSize),
                pieces: piecesToDeductFromThisBatch % batch.packSize,
            });

            const remainingPiecesInBatch = totalPiecesInBatch - piecesToDeductFromThisBatch;
            batch.packs = Math.floor(remainingPiecesInBatch / batch.packSize);
            batch.pieces = remainingPiecesInBatch % batch.packSize;
            
            piecesLeftToDeduct -= piecesToDeductFromThisBatch;
        }
    }

    if (piecesLeftToDeduct > 0) {
        throw new Error('Deduction logic failed to find enough pieces, despite initial validation.');
    }

    newBatchBreakdown = newBatchBreakdown.filter(b => b.packs > 0 || b.pieces > 0);
    
    return { updatedBatchBreakdown: newBatchBreakdown, deductedBatches };
};

exports.createTransfer = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { products, fromLocation, toLocation, transferDate, notes } = req.body;
        if (!products?.length) throw new Error('Products array is required.');
        
        const fromStore = await Store.findById(fromLocation).select('name').lean();
        const toShop = await Shop.findById(toLocation).select('name').lean();
        if (!fromStore || !toShop) throw new Error('Invalid source or destination location.');

        const transferNote = notes || `Transfer from ${fromStore.name} to ${toShop.name}`;
        const createdTransfer = new Transfer({ 
            ...req.body, 
            transferredBy: req.user.id, 
            status: 'completed', 
            notes: transferNote
        });

        for (const item of products) {
            const product = await Product.findById(item.product).select('name piecesPerPack').session(session);
            if (!product) throw new Error(`Product with ID ${item.product} not found.`);
            
            const packSize = product.piecesPerPack || 1;
            const totalPiecesToTransfer = (item.packs || 0) * packSize + (item.pieces || 0);
            if (totalPiecesToTransfer <= 0) continue;

            const storeInventory = await InventoryStore.findOne({ product: item.product, store: fromLocation }).session(session);
            if (!storeInventory || storeInventory.totalQuantity < totalPiecesToTransfer) {
                throw new Error(`Insufficient stock for ${product.name}.`);
            }

            const { updatedBatchBreakdown, deductedBatches } = performStockDeduction(
                storeInventory.batchBreakdown, 
                totalPiecesToTransfer
            );

            await InventoryStore.updateOne(
                { _id: storeInventory._id }, 
                { 
                    $inc: { totalQuantity: -totalPiecesToTransfer }, 
                    $set: { batchBreakdown: updatedBatchBreakdown } 
                }, 
                { session }
            );

            await InventoryShop.updateOne(
                { product: item.product, shop: toLocation }, 
                { 
                    $inc: { totalQuantity: totalPiecesToTransfer }, 
                    $push: { batchBreakdown: { $each: deductedBatches } } 
                }, 
                { upsert: true, session }
            );

            // Activity logs - CORRECTED to match your schema
            const activityDate = transferDate || new Date();

            // Outbound transfer activity (from store)
            await InventoryActivity.create([{
                type: 'transfer',
                store: fromLocation, // Required for 'transfer' type
                product: item.product,
                packs: item.packs || 0, 
                pieces: item.pieces || 0, 
                packSize: packSize, // Added packSize
                quantity: totalPiecesToTransfer, // Positive quantity
                user: req.user.id,
                direction: 'out', // Indicates stock going out
                description: `Transferred ${totalPiecesToTransfer} pieces to ${toShop.name}`,
                date: activityDate,
                destination: toLocation,
                destinationModel: 'Shop'
            }], { session });

            // Inbound receipt activity (to shop)
            await InventoryActivity.create([{
                type: 'receipt',
                shop: toLocation, // Required for 'receipt' type
                product: item.product,
                packs: item.packs || 0, 
                pieces: item.pieces || 0, 
                packSize: packSize, // Added packSize
                quantity: totalPiecesToTransfer, // Positive quantity
                user: req.user.id,
                direction: 'in', // Indicates stock coming in
                description: `Received ${totalPiecesToTransfer} pieces from ${fromStore.name}`,
                date: activityDate,
                source: fromLocation,
                sourceModel: 'Store'
            }], { session });
        }
        
        await createdTransfer.save({ session });
        await session.commitTransaction();
        res.status(201).json({ success: true, data: createdTransfer });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ success: false, error: 'Transfer failed', message: err.message });
    } finally {
        session.endSession();
    }
};


// @desc    Update transfer
// @route   PUT /api/transfers/:id
// @access  Private/Admin
exports.updateTransfer = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const transferId = req.params.id;
        const { products: newProducts, fromLocation, toLocation, transferDate, notes } = req.body;

        const oldTransfer = await Transfer.findById(transferId).populate('products.product', 'name sku packSize').session(session);
        if (!oldTransfer) throw new Error('Original transfer not found');
        
        const previousState = oldTransfer.toObject();

        // 1. Revert the old transfer completely
        for (const item of oldTransfer.products) {
            const packSize = item.product.packSize || 1;
            const totalPieces = (item.packs * packSize) + (item.pieces || 0);
            
            const batchToRestore = { batchNumber: item.batchNumber || `REVERTED-${oldTransfer._id.toString().slice(-4)}`, packs: item.packs, pieces: item.pieces, packSize: packSize };
            
            await InventoryShop.updateOne({ shop: oldTransfer.toLocation, product: item.product._id }, { $inc: { totalQuantity: -totalPieces }, $pull: { batchBreakdown: { sourceTransfer: oldTransfer._id } } }, { session });
            await InventoryStore.updateOne({ store: oldTransfer.fromLocation, product: item.product._id }, { $inc: { totalQuantity: totalPieces }, $push: { batchBreakdown: batchToRestore } }, { session });
        }

        // 2. Apply the new transfer as if it were a new one from the now-restored inventory
        for (const item of newProducts) {
            const product = await Product.findById(item.product).select('name piecesPerPack').session(session);
            const packSize = product.piecesPerPack || 1;
            const totalPiecesToTransfer = (item.packs || 0) * packSize + (item.pieces || 0);
            if (totalPiecesToTransfer <= 0) continue;

            const storeInventory = await InventoryStore.findOne({ product: item.product, store: fromLocation }).session(session);
            if (!storeInventory || storeInventory.totalQuantity < totalPiecesToTransfer) throw new Error(`Insufficient stock for ${product.name} after edit.`);

            const { updatedBatchBreakdown, deductedBatches } = performStockDeduction(storeInventory.batchBreakdown, totalPiecesToTransfer);
            const shopBatchUpdates = deductedBatches.map(b => ({ ...b, sourceTransfer: oldTransfer._id }));

            await InventoryStore.updateOne({ _id: storeInventory._id }, { $inc: { totalQuantity: -totalPiecesToTransfer }, $set: { batchBreakdown: updatedBatchBreakdown, lastUpdated: new Date() } }, { session });
            await InventoryShop.updateOne({ product: item.product, shop: toLocation }, { $inc: { totalQuantity: totalPiecesToTransfer }, $set: { lastUpdated: new Date() }, $push: { batchBreakdown: { $each: shopBatchUpdates } }, $setOnInsert: { product: item.product, shop: toLocation } }, { upsert: true, session });
        }
        
        // 3. Update the transfer document itself
        await InventoryActivity.deleteMany({ transfer: oldTransfer._id }, { session }); // Clean up old activities
        
        const transferToUpdate = await Transfer.findById(transferId).session(session);
        transferToUpdate.products = newProducts;
        transferToUpdate.fromLocation = fromLocation;
        transferToUpdate.toLocation = toLocation;
        transferToUpdate.transferDate = transferDate;
        transferToUpdate.notes = notes; 
        transferToUpdate.status = 'completed-edited';
        transferToUpdate.editHistory.push({ editedBy: req.user.id, editedAt: new Date(), previousState });
        
        const updatedTransfer = await transferToUpdate.save({ session });
        
        await session.commitTransaction();
        res.status(200).json({ success: true, data: updatedTransfer });
    } catch (err) {
        await session.abortTransaction();
        console.error("Update Transfer failed:", err);
        res.status(500).json({ success: false, error: 'Update failed', message: err.message });
    } finally {
        session.endSession();
    }
};



// @desc    Delete transfer
// @route   DELETE /api/transfers/:id
// @access  Private/Admin
exports.deleteTransfer = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const transfer = await Transfer.findById(req.params.id).session(session);
        if (!transfer) throw new Error('Transfer not found');

        for (const item of transfer.products) {
            const product = await Product.findById(item.product).select('piecesPerPack').session(session);
            if (!product) continue;
            const totalPieces = (item.packs * product.piecesPerPack) + (item.pieces || 0);

            await InventoryShop.updateOne({ shop: transfer.toLocation, product: item.product }, { $inc: { totalQuantity: -totalPieces }, $pull: { batchBreakdown: { sourceTransfer: transfer._id } } }, { session });
            await InventoryStore.updateOne({ store: transfer.fromLocation, product: item.product }, { $inc: { totalQuantity: totalPieces } }, { session });
        }

        await InventoryActivity.deleteMany({ transfer: transfer._id }, { session });
        await Transfer.findByIdAndDelete(req.params.id, { session });
        
        await session.commitTransaction();
        res.status(200).json({ success: true, data: { id: req.params.id } });
    } catch (err) {
        await session.abortTransaction();
        console.error("Delete Transfer failed:", err);
        res.status(500).json({ success: false, error: 'Delete failed', message: err.message });
    } finally {
        session.endSession();
    }
};


// @desc    Get all transfers
// @route   GET /api/transfers
// In controllers/transfers.js
exports.getTransfers = async (req, res, next) => {
  try {
    const transfers = await Transfer.find()
      .populate([
        { path: 'products.product', select: 'name sku packSize' },
        { path: 'transferredBy', select: 'name email' },
        { path: 'fromLocation', select: 'name' },
        { path: 'toLocation', select: 'name' }
      ])
      .sort({ transferDate: -1 })
      .lean();

    res.status(200).json({ success: true, data: transfers });
  } catch (err) {
    next(err);
  }
};

exports.getTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate([
        { path: 'products.product', select: 'name sku packSize' },
        { path: 'transferredBy', select: 'name email' },
        { path: 'editHistory.editedBy', select: 'name email' },
        { path: 'editHistory.previousState.products.product', select: 'name sku packSize' },
        { path: 'fromLocation', select: 'name' },
        { path: 'toLocation', select: 'name' }
      ]);

    if (!transfer) {
      return res.status(404).json({ success: false, error: 'Transfer not found' });
    }
    res.status(200).json({ success: true, data: transfer });
  } catch (err) {
    next(err);
  }
};

// @desc    Get locations (shops and stores)
// @route   GET /api/locations
// @access  Private
exports.getLocations = async (req, res, next) => {
    try {
        const shops = await Shop.find().select('name location');
        const stores = await Store.find().select('name address');
        res.status(200).json({
            success: true,
            data: {
                shops: shops.map(s => ({ type: 'shop', id: s._id, name: s.name, location: s.location })),
                stores: stores.map(s => ({ type: 'store', id: s._id, name: s.name, address: s.address }))
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get transfer history (this is for the history page)
// @route   GET /api/transfers/:id/history
// @access  Private
exports.getTransferHistory = async (req, res, next) => {
    try {
        const transfer = await Transfer.findById(req.params.id)
            .populate('editHistory.editedBy', 'name email')
            .populate('editHistory.previousState.products.product', 'name sku packSize');

        if (!transfer) {
            return res.status(404).json({ success: false, error: 'Transfer not found' });
        }
        res.status(200).json({ success: true, data: transfer.editHistory });
    } catch (err) {
        next(err);
    }
};