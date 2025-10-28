const ProductPrice = require('../models/ProductPrice');
const Product = require('../models/Product');
const InvoiceItem = require('../models/InvoiceItem');
const Batch = require('../models/Batch');
const mongoose = require('mongoose');

/**
 * @desc    Batch create prices for invoice items
 * @route   POST /api/prices/batch-create/:invoiceId
 * @access  Private (Admin)
 */
exports.batchCreatePrices = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { invoiceId } = req.params;
    const { priceUpdates } = req.body;
    const userId = req.user.id;

    if (!priceUpdates || !Array.isArray(priceUpdates)) {
      throw new Error('Invalid price updates data');
    }

    // Get all invoice items being priced
    const itemIds = priceUpdates.map(update => update.itemId);
    const invoiceItems = await InvoiceItem.find({ 
      _id: { $in: itemIds },
      invoice: invoiceId
    }).session(session);

    if (invoiceItems.length !== priceUpdates.length) {
      throw new Error('Some items not found in this invoice');
    }

    // Prepare price records
    const priceRecords = [];
    const productUpdates = {};

    for (const update of priceUpdates) {
      const item = invoiceItems.find(i => i._id.equals(update.itemId));
      if (!item) continue;

      const sellPrice = parseFloat(update.sellPrice);
      if (isNaN(sellPrice) || sellPrice <= 0) {
        throw new Error(`Invalid price for item ${item._id}`);
      }

      priceRecords.push({
        product: item.product,
        batch: item.batch,
        invoiceItem: item._id,
        buyPrice: item.buyPrice,
        sellPrice: sellPrice,
        isCurrent: true, // These become the current prices
        createdBy: userId
      });

      // Track which products need their current price updated
      productUpdates[item.product.toString()] = sellPrice;
    }

    // First mark any existing current prices for these products as not current
    await ProductPrice.updateMany(
      { product: { $in: Object.keys(productUpdates) }}, 
      { $set: { isCurrent: false } },
      { session }
    );

    // Create all new price records
    const createdPrices = await ProductPrice.insertMany(priceRecords, { session });

    // Update products' currentSellPrice
    const productUpdateOps = Object.entries(productUpdates).map(([productId, price]) => ({
      updateOne: {
        filter: { _id: productId },
        update: { $set: { currentSellPrice: price } }
      }
    }));

    if (productUpdateOps.length > 0) {
      await Product.bulkWrite(productUpdateOps, { session });
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: createdPrices,
      message: `${createdPrices.length} prices created successfully`
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

/**
 * @desc    Set or update current price for a product
 * @route   PUT /api/prices/set-current/:productId
 * @access  Private (Admin)
 */
exports.setCurrentProductPrice = async (req, res) => {
  try {
    const { productId } = req.params;
    const { newPrice } = req.body;
    const userId = req.user.id;

    const sellPrice = parseFloat(newPrice);
    if (isNaN(sellPrice)) {
      throw new Error('Invalid price value');
    }

    // Update price using model method
    const priceRecord = await ProductPrice.updateCurrentPrice(
      productId, 
      sellPrice, 
      userId
    );

    // Update product's current price
    const product = await Product.findByIdAndUpdate(
      productId,
      { currentSellPrice: sellPrice },
      { new: true }
    );

    if (!product) {
      throw new Error('Product not found');
    }

    res.status(200).json({
      success: true,
      data: {
        product,
        priceRecord
      },
      message: `Price for ${product.name} updated to $${sellPrice.toFixed(2)}`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get all prices for a product
 * @route   GET /api/prices/product/:productId
 * @access  Private
 */
exports.getProductPrices = async (req, res) => {
  try {
    const { productId } = req.params;

    const prices = await ProductPrice.find({ product: productId })
      .populate('batch', 'batchNumber')
      .populate('createdBy', 'name')
      .sort({ effectiveDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: prices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * @desc    Get prices grouped by invoice with product info
 * @route   GET /api/prices/grouped-by-invoice
 * @access  Private
 */

exports.getPricesGroupedByInvoice = async (req, res) => {
  try {
    const prices = await ProductPrice.aggregate([
      {
        $lookup: {
          from: 'invoiceitems',
          localField: 'batch',
          foreignField: '_id',
          as: 'batchInfo'
        }
      },
      { $unwind: '$batchInfo' },
      {
        $lookup: {
          from: 'invoices',
          localField: 'batchInfo.invoice',
          foreignField: '_id',
          as: 'invoice'
        }
      },
      { $unwind: '$invoice' },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$invoice._id',
          items: {
            $push: {
              _id: '$_id',
              sellPrice: '$sellPrice',
              batchId: '$batchInfo._id',
              batchNumber: '$batchInfo.batchNumber',
              buyPrice: '$batchInfo.buyPrice',
              product: '$product',
              invoice: {
                _id: '$invoice._id',
                invoiceNumber: '$invoice.invoiceNumber',
                supplierName: '$invoice.supplierName',
                invoiceDate: '$invoice.invoiceDate'
              }
            }
          }
        }
      }
    ]);

    // Convert array to object with invoice IDs as keys
    const result = {};
    prices.forEach(group => {
      result[group._id] = group.items;
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {[]
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * @desc    Get current prices for multiple products
 * @route   POST /api/prices/current-prices
 * @access  Private
 */
exports.getCurrentPrices = async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!Array.isArray(productIds)) {
      throw new Error('Product IDs must be an array');
    }

    const prices = await ProductPrice.find({
      product: { $in: productIds },
      isCurrent: true
    });

    res.status(200).json({
      success: true,
      data: prices
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};