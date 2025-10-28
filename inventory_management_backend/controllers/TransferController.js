const Transfer = require('../models/Transfer');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Store = require('../models/Store');

// @desc    Create new transfer
// @route   POST /api/transfers
// @access  Private
// controllers/transferController.js

// @desc    Create new transfer
// controllers/transferController.js
const Batch = require('../models/Batch');

exports.createTransfer = async (req, res, next) => {
  try {
    const { products, fromLocation, toLocation } = req.body;

    // Validate all products first
    for (const item of products) {
      const productDoc = await Product.findById(item.product);
      if (!productDoc) {
        return res.status(404).json({ 
          success: false, 
          error: `Product ${item.product} not found` 
        });
      }

      // If batchNumber is provided, validate it
      if (item.batchNumber) {
        const batch = await Batch.findOne({ 
          batchNumber: item.batchNumber,
          location: fromLocation
        });
        if (!batch) {
          return res.status(404).json({
            success: false,
            error: `Batch ${item.batchNumber} not found in ${fromLocation}`
          });
        }
      }
      
      // Calculate total pieces being transferred
      const totalPieces = (item.packs * productDoc.packSize) + item.pieces;
      
      // Calculate available pieces in inventory
      const availablePieces = (productDoc.stockPacks * productDoc.packSize) + productDoc.stockPieces;
      
      if (totalPieces > availablePieces) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient stock for ${productDoc.name}. Available: ${availablePieces} pieces` 
        });
      }
    }

    // Create transfer with all products
    const transfer = await Transfer.create({
      ...req.body,
      transferredBy: req.user.id
    });

    // Update stock for each product and handle batches
    for (const item of products) {
      const productDoc = await Product.findById(item.product);
      const totalPieces = (item.packs * productDoc.packSize) + item.pieces;
      
      // Convert pieces back to optimal pack/piece combination
      const newTotalPieces = (productDoc.stockPacks * productDoc.packSize) + productDoc.stockPieces - totalPieces;
      const newPacks = Math.floor(newTotalPieces / productDoc.packSize);
      const newPieces = newTotalPieces % productDoc.packSize;
      
      // Update product stock
      await Product.findByIdAndUpdate(item.product, {
        stockPacks: newPacks,
        stockPieces: newPieces
      });

      // If batchNumber was provided, update batch location
      if (item.batchNumber) {
        await Batch.findOneAndUpdate(
          { 
            batchNumber: item.batchNumber,
            location: fromLocation
          },
          {
            $inc: {
              availablePacks: -item.packs,
              availablePieces: -item.pieces
            }
          }
        );

        // Create/update batch at destination
        await Batch.findOneAndUpdate(
          { 
            batchNumber: item.batchNumber,
            location: toLocation
          },
          {
            $setOnInsert: {
              product: item.product,
              purchasePrice: productDoc.costPrice,
              currentPrice: productDoc.sellPrice
            },
            $inc: {
              availablePacks: item.packs,
              availablePieces: item.pieces
            }
          },
          { upsert: true }
        );
      }
    }

    res.status(201).json({
      success: true,
      data: transfer
    });
  } catch (err) {
    next(err);
  }
};
exports.getTransfers = async (req, res, next) => {
  try {
    const transfers = await Transfer.find()
      .populate({
        path: 'products.product',
        select: 'name sku packSize'
      })
      .populate({
        path: 'transferredBy',
        select: 'name email'
      })
      .populate({
        path: 'editHistory.editedBy',
        select: 'name email'
      })
      .sort({ transferDate: -1 });

    res.status(200).json({
      success: true,
      data: transfers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all transfers
// @route   GET /api/transfers
// @access  Private
// In your transfer controller
// In your transfer controller (TransferController.js)
exports.getTransfers = async (req, res, next) => {
  try {
    const transfers = await Transfer.find()
      .populate({
        path: 'products.product',
        select: 'name sku stock'
      })
      .populate({
        path: 'transferredBy',
        select: 'name email'
      })
      .populate({
        path: 'editHistory.editedBy',
        select: 'name email'
      })
      .sort({ transferDate: -1 });

    res.status(200).json({
      success: true,
      data: transfers
    });
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
        shops: shops.map(s => ({ type: 'shop', id: s._id, name: `${s.name} (${s.location})` })),
        stores: stores.map(s => ({ type: 'store', id: s._id, name: `${s.name} (${s.address})` }))
      }
    });
  } catch (err) {
    next(err);
  }
};

// Add these methods to your existing controller

// @desc    Get single transfer
// @route   GET /api/transfers/:id
// @access  Private
exports.getTransfer = async (req, res, next) => {
  try {
    

    const transfer = await Transfer.findById(req.params.id)
      .populate({
        path: 'products.product',
        select: 'name sku stock'
      })
      .populate('transferredBy', 'name email')
      .populate('editHistory.editedBy', 'name email')
      .populate('editHistory.previousState.transferredBy', 'name email')
      .populate({
        path: 'editHistory.previousState.products.product',
        select: 'name sku'
      });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transfer
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update transfer
// @route   PUT /api/transfers/:id
// @access  Private/Admin
// @desc    Update transfer
// @route   PUT /api/transfers/:id
// @access  Private/Admin
// controllers/transferController.js
// controllers/transferController.js
// @desc    Update transfer
// @route   PUT /api/transfers/:id
// @access  Private/Admin
exports.updateTransfer = async (req, res, next) => {
  try {
    const currentTransfer = await Transfer.findById(req.params.id)
      .populate({
        path: 'products.product',
        select: 'name sku packSize stockPacks stockPieces'
      })
      .populate('transferredBy', 'name email')
      .lean();

    if (!currentTransfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    // Create a clean copy of the current transfer for history
    const previousState = {
      fromLocation: currentTransfer.fromLocation,
      toLocation: currentTransfer.toLocation,
      transferDate: currentTransfer.transferDate,
      transferredBy: currentTransfer.transferredBy,
      products: currentTransfer.products.map(p => ({
        product: p.product?._id || p.product,
        productName: p.productName || p.product?.name,
        packs: p.packs,
        pieces: p.pieces,
        batchNumber: p.batchNumber,
        sku: p.product?.sku
      }))
    };

    // First, revert the old stock values
    for (const item of currentTransfer.products) {
      const productDoc = await Product.findById(item.product);
      const totalPieces = (item.packs * productDoc.packSize) + item.pieces;
      
      const newTotalPieces = (productDoc.stockPacks * productDoc.packSize) + productDoc.stockPieces + totalPieces;
      const newPacks = Math.floor(newTotalPieces / productDoc.packSize);
      const newPieces = newTotalPieces % productDoc.packSize;
      
      await Product.findByIdAndUpdate(item.product, {
        stockPacks: newPacks,
        stockPieces: newPieces
      });
    }

    // Then apply the new transfer values
    for (const item of req.body.products) {
      const productDoc = await Product.findById(item.product);
      const totalPieces = (item.packs * productDoc.packSize) + item.pieces;
      
      const newTotalPieces = (productDoc.stockPacks * productDoc.packSize) + productDoc.stockPieces - totalPieces;
      const newPacks = Math.floor(newTotalPieces / productDoc.packSize);
      const newPieces = newTotalPieces % productDoc.packSize;
      
      await Product.findByIdAndUpdate(item.product, {
        stockPacks: newPacks,
        stockPieces: newPieces
      });
    }

    // Update the transfer with new data
    const updatedTransfer = await Transfer.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        $push: {
          editHistory: {
            editedBy: req.user.id,
            previousState: previousState
          }
        }
      },
      { 
        new: true,
        runValidators: true,
        populate: [
          { path: 'products.product', select: 'name sku packSize' },
          { path: 'transferredBy', select: 'name email' },
          { path: 'editHistory.editedBy', select: 'name email' }
        ]
      }
    );

    res.status(200).json({
      success: true,
      data: updatedTransfer
    });
  } catch (err) {
    next(err);
  }
};


// @desc    Delete transfer
// @route   DELETE /api/transfers/:id
// @access  Private/Admin
exports.deleteTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }

    // Restore product stock
    await Promise.all(transfer.products.map(async (item) => {
      const productDoc = await Product.findById(item.product);
      if (!productDoc) return;

      const totalPieces = (item.packs * productDoc.packSize) + item.pieces;
      const newTotalPieces = (productDoc.stockPacks * productDoc.packSize) + productDoc.stockPieces + totalPieces;
      const newPacks = Math.floor(newTotalPieces / productDoc.packSize);
      const newPieces = newTotalPieces % productDoc.packSize;
      
      await Product.findByIdAndUpdate(item.product, {
        stockPacks: newPacks,
        stockPieces: newPieces
      });
    }));

    await transfer.remove();

    res.status(200).json({
      success: true,
      data: { id: req.params.id }
    });
  } catch (err) {
    next(err);
  }
};
exports.getTransferHistory = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate({
        path: 'products.product',
        select: 'name sku packSize'
      })
      .populate('transferredBy', 'name email')
      .populate('editHistory.editedBy', 'name email')
      .populate({
        path: 'editHistory.previousState.products.product',
        select: 'name sku packSize'
      });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transfer
    });
  } catch (err) {
    next(err);
  }
};

// In your transferController.js
exports.deleteTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findByIdAndDelete(req.params.id);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }

    // Optional: Restore product stock if needed
    if (req.query.restoreStock === 'true') {
      await Promise.all(transfer.products.map(async (item) => {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }));
    }

    res.status(200).json({
      success: true,
      data: { id: req.params.id }
    });
  } catch (err) {
    next(err);
  }
};

exports.getTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate({
        path: 'products.product',
        select: 'name sku packSize'
      })
      .populate('transferredBy', 'name email')
      .populate('editHistory.editedBy', 'name email')
      .populate('editHistory.previousState.transferredBy', 'name email')
      .populate({
        path: 'editHistory.previousState.products.product',
        select: 'name sku packSize'
      });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transfer
    });
  } catch (err) {
    next(err);
  }
};

