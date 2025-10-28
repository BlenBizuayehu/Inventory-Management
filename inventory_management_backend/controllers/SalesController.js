const Sale = require('../models/Sale');
const Product = require('../models/Product');
const InventoryShop = require('../models/InventoryShop');
const Batch = require('../models/Batch');
const mongoose = require('mongoose');
const Credit=require('../models/Credit');
const InventoryActivity = require('../models/InventoryActivity');
const SystemSettings = require('../models/SystemSettings');

/**
 * @desc    Create a new sale
 * @route   POST /api/sales
 * @access  Private
 */


// --- HELPER FUNCTION (From your example) ---
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
                batchNumber: batch.batchNumber,
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



exports.createSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items = [], paymentMethod, shop, discount = 0, customerName = '', customerContact = '', paymentDetails = '', notes = '', batchTrackingEnabled = false } = req.body;
    const userId = req.user._id; // Get user ID from protect middleware

    if (items.length === 0) throw new Error('At least one sale item is required.');
    if (paymentMethod === 'Credit' && !customerName) throw new Error('Customer name is required for credit sales.');
    
    // ... (your VAT and currency logic)
    const VAT_RATE = 0.10; // Placeholder
    const CURRENCY = 'USD'; // Placeholder

    const processedItems = [];
    let subtotal = 0;
    let totalVAT = 0;

    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) throw new Error(`Product not found.`);
      
      const packSize = product.piecesPerPack || 1;
      const quantity = (Number(item.packs || 0) * packSize) + Number(item.pieces || 0);
      if (quantity <= 0) throw new Error(`Quantity must be > 0.`);
      
      const unitPriceBeforeVAT = item.unitPrice;
      const unitVAT = parseFloat((unitPriceBeforeVAT * VAT_RATE).toFixed(2));
      const unitPriceWithVAT = unitPriceBeforeVAT + unitVAT;
      const lineTotal = parseFloat((unitPriceWithVAT * quantity).toFixed(2));
      
      subtotal += (unitPriceBeforeVAT * quantity);
      totalVAT += (unitVAT * quantity);
      
      processedItems.push({
          product: product._id, productName: product.name, productSku: product.sku, quantity, unitPriceBeforeVAT, unitVAT, unitPrice: unitPriceWithVAT, totalPrice: lineTotal, packs: item.packs, pieces: item.pieces, packSize,
      });
    }

    // Inventory Deduction and Activity Logging
    for (const item of processedItems) {
        const shopInventory = await InventoryShop.findOne({ product: item.product, shop: shop }).session(session);
        if (!shopInventory || shopInventory.totalQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${item.productName}.`);
        }
        const { updatedBatchBreakdown } = performStockDeduction(shopInventory.batchBreakdown, item.quantity);
        await InventoryShop.updateOne({ _id: shopInventory._id }, { $inc: { totalQuantity: -item.quantity }, $set: { batchBreakdown: updatedBatchBreakdown } }, { session });

        // --- THIS IS THE FIX ---
        // Ensure all required fields are present, especially `user`.
        await InventoryActivity.create([{
            type: 'sale',
            shop: shop,
            product: item.product,
            quantity: item.quantity,
            packs: item.packs,
            pieces: item.pieces,
            user: userId, // <-- CRITICAL: Add the user ID here
            notes: `Sale to ${customerName || 'customer'}.`
        }], { session });
    }

    const finalTotal = parseFloat(((subtotal + totalVAT) - discount).toFixed(2));

    const sale = new Sale({
        shop, customerName, items: processedItems, subtotal, totalVAT, tax: totalVAT, discount, total: finalTotal, paymentMethod, paymentDetails, notes, batchTrackingEnabled, createdBy: userId, currency: CURRENCY,
    });
    const savedSale = await sale.save({ session });

    if (savedSale.paymentMethod === 'Credit') {
        const creditRecord = new Credit({
            sale: savedSale._id, shop: savedSale.shop, customerName: savedSale.customerName, customerContact, totalAmount: savedSale.total, outstandingBalance: savedSale.total, createdBy: userId,
        });
        await creditRecord.save({ session });
        savedSale.credit = creditRecord._id;
        await savedSale.save({ session });
    }
    
    await session.commitTransaction();
    res.status(201).json({ success: true, data: savedSale });

  } catch (error) {
    await session.abortTransaction();
    console.error('Sale creation error:', error);
    res.status(400).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
};
/**
 * @desc    Get sales with optional filters
 * @route   GET /api/sales
 * @access  Private
 */
// controllers/SalesController.js

exports.getSales = async (req, res) => {
  try {
    const { startDate, endDate, shop, batchTracking } = req.query;
    
    const filter = {};
    
    if (startDate && endDate) {
      // Add validation for dates if necessary
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (shop) {
      filter.shop = shop;
    }
    
    if (batchTracking) {
      filter.batchTrackingEnabled = batchTracking === 'true';
    }
    
    // --- THIS IS THE CORRECTED PART ---
    const sales = await Sale.find(filter)
      // Populate the full documents. This is safer. If a referenced document (e.g., a deleted user)
      // is not found, the populated field will be `null` instead of crashing the query.
      .populate('customer') // Populates the entire customer document
      .populate('items.product') // Populates the product within each item
      .populate('createdBy') // Populates the entire user document
      .populate('shop') // Also populate the shop for display
      .sort({ createdAt: -1 });
    // --- END OF CORRECTION ---
    
    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    // --- ADDED BETTER ERROR LOGGING ---
    // This will print the detailed error to your backend console, helping you debug.
    console.error('CRITICAL ERROR in getSales controller:', error);
    
    // Send a generic, user-friendly error message to the frontend.
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred while fetching sales data.'
    });
  }
};

/**
 * @desc    Get sale by ID
 * @route   GET /api/sales/:id
 * @access  Private
 */
exports.getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('items.product', 'name sku currentSellPrice')
      .populate('items.batch', 'batchNumber buyPrice')
      .populate('createdBy', 'name')
      .populate('shop', 'name location');
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Sale not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get batches for a product
 * @route   GET /api/sales/batches/:productId
 * @access  Private
 */
exports.getProductBatches = async (req, res) => {
  try {
    const { productId } = req.params;
    const { shop } = req.query;
    
    if (!shop) {
      throw new Error('Shop ID is required');
    }
    
    // Find inventory with batches for this product in the specified shop
    const inventory = await Inventory.findOne({
      product: productId,
      shop
    }).populate('batchBreakdown.batch', 'batchNumber currentPrice buyPrice');
    
    if (!inventory) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Filter batches with available quantity
    const availableBatches = inventory.batchBreakdown
      .filter(b => b.pieces > 0)
      .map(b => ({
        batchId: b.batch._id,
        batchNumber: b.batch.batchNumber,
        currentPrice: b.batch.currentPrice,
        buyPrice: b.batch.buyPrice,
        availableQuantity: b.pieces
      }));
    
    res.status(200).json({
      success: true,
      data: availableBatches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add this new endpoint to get today's sales
exports.getTodaysSales = async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ 
        success: false, 
        error: 'Shop ID is required' 
      });
    }

    // Validate shop ID format
    if (!mongoose.Types.ObjectId.isValid(shop)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid shop ID format' 
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await Sale.find({
      shop,
      createdAt: { $gte: today, $lt: tomorrow }
    })
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });

    // Calculate daily totals
    const dailyTotals = sales.reduce((acc, sale) => {
      acc.subtotal += sale.subtotal || 0;
      acc.tax += sale.tax || 0;
      acc.total += sale.total || 0;
      return acc;
    }, { subtotal: 0, tax: 0, total: 0 });

    res.status(200).json({
      success: true,
      data: {
        sales,
        dailyTotals
      }
    });
  } catch (error) {
    console.error('Error fetching today\'s sales:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today\'s sales'
    });
  }
};