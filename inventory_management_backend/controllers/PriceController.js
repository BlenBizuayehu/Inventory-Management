const ProductPrice = require('../models/ProductPrice');
const Invoice = require('../models/Invoice');
const InvoiceItem = require('../models/InvoiceItem');


// in controllers/productPriceController.js

/**
 * Batch create product prices
 */
// controllers/productPriceController.js
exports.batchCreatePrices = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { priceUpdates } = req.body;

    // Get all batches for this invoice
    const invoiceItems = await InvoiceItem.find({ invoice: invoiceId });
    const batchNumbers = invoiceItems.map(item => item.batchNumber);
    
    const batches = await Batch.find({ batchNumber: { $in: batchNumbers } });

    const pricesToCreate = batches.map(batch => ({
      product: batch.invoiceItem.product,
      batch: batch._id,
      sellPrice: batch.currentPrice,
      effectiveDate: new Date()
    }));

    const createdPrices = await ProductPrice.insertMany(pricesToCreate);

    res.status(201).json({
      success: true,
      data: createdPrices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getProductPrices = async (req, res) => {
  try {
    const { productId } = req.params;

    const prices = await ProductPrice.find({ product: productId })
      .populate('batch', 'batchNumber quantityRemaining')
      .sort({ effectiveDate: -1 });

    res.status(200).json({
      success: true,
      data: prices
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

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
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};