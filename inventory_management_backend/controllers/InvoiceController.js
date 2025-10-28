

// controllers/invoiceController.js
const Invoice = require('../models/Invoice');
const InvoiceItem = require('../models/InvoiceItem');
const Supplier=require("../models/Supplier");
const Batch=require("../models/Batch");
const SystemSettings=require("../models/SystemSettings");
const { isValidObjectId } = require('mongoose');
const mongoose= require('mongoose');
const { Types: { ObjectId } } = mongoose;

exports.createInvoice = async (req, res) => {
  try {
    // Enhanced validation
    const requiredFields = ['supplier', 'invoiceNumber', 'items'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`,
        success: false
      });
    }

    // Validate items array
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({
        message: 'At least one invoice item is required',
        success: false
      });
    }

    // Check if supplier exists
    const supplier = await Supplier.findById(req.body.supplier);
    if (!supplier) {
      return res.status(400).json({
        message: 'Supplier not found',
        success: false
      });
    }

    // Check for duplicate invoice number
    const existingInvoice = await Invoice.findOne({ 
      invoiceNumber: req.body.invoiceNumber 
    });
    
    if (existingInvoice) {
      return res.status(400).json({
        message: 'Invoice number already exists',
        success: false
      });
    }

    // Get system settings (VAT rate)
    const settings = await SystemSettings.findOne();
    const vatRate = settings?.vatRate || 0.15;

    // Create the invoice
    const invoice = new Invoice({
      supplier: req.body.supplier,
      supplierName: supplier.name,
      invoiceNumber: req.body.invoiceNumber,
      invoiceDate: new Date(req.body.invoiceDate)
    });

    const savedInvoice = await invoice.save();

    // Create invoice items with enhanced validation
    const invoiceItems = await Promise.all(
      req.body.items.map(async (item) => {
        if (!item.product || !item.buyPrice || !item.quantityBought) {
          throw new Error('Invalid item data');
        }
        
        const invoiceItem = new InvoiceItem({
           invoice: savedInvoice._id,
          product: item.product,
          buyPrice: parseFloat(item.buyPrice),
          quantityBought: parseInt(item.quantityBought), // Store as entered
          unitMode: item.unitMode || 'piece',
          piecesPerPack: item.piecesPerPack || 1,
          quantityRemaining: parseInt(item.quantityBought) ,
          batchNumber: savedInvoice.invoiceNumber,
          unitMode: item.unitMode || 'piece',
          piecesPerPack: item.piecesPerPack || 1
        });
        
const savedItem = await invoiceItem.save();
         await Batch.create({
          invoiceItem: savedItem._id,
          batchNumber: savedItem.batchNumber,
          location: req.body.location || 'main-store',
          originalQuantity: item.quantityBought,
          availablePacks: Math.floor(item.quantityBought / (item.piecesPerPack || 1)),
          availablePieces: item.quantityBought % (item.piecesPerPack || 1),
          packSize: item.piecesPerPack || 1,
          purchasePrice: item.buyPrice,
          currentPrice: item.buyPrice * 1.2 // Example markup
        });     
        
         return savedItem;
})
    );

    

    // Calculate totals
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.buyPrice * item.quantityBought), 0);
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;

    // Update invoice with totals
    savedInvoice.subtotal = subtotal;
    savedInvoice.vatAmount = vatAmount;
    savedInvoice.total = total;
    await savedInvoice.save();

    res.status(201).json({
      message: 'Invoice created successfully',
      success: true,
      data: {
        invoice: savedInvoice,
        items: invoiceItems,
         nextStep: `/batch-placement/${savedInvoice._id}`
      }
    });
  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({
      message: error.message || 'Server error',
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .sort({ invoiceDate: -1 })
      .lean();
    
    const invoicesWithItems = await Promise.all(
      invoices.map(async (invoice) => {
        const items = await InvoiceItem.find({ invoice: invoice._id })
          .populate('product', 'name')
          .lean();
        return { 
          ...invoice, 
          items,
          supplierName: invoice.supplierName // Make sure this field is included
        };
      })
    );

    res.status(200).json({
      success: true,
      data: invoicesWithItems
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices'
    });
  }
};


// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const deleted = await Invoice.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Invoice not found' });
    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update invoice
// In your Node.js controller

exports.updateInvoice = async (req, res) => {
  try {
    const { supplier, invoiceNumber, invoiceDate, items } = req.body;

    // Validate required fields
    if (!supplier || !invoiceNumber || !invoiceDate || !items || !Array.isArray(items)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.product || item.buyPrice === undefined || !item.quantityBought) {
        return res.status(400).json({
          success: false,
          message: 'All items must have product, buyPrice, and quantityBought'
        });
      }
    }

    // Get supplier details
    const supplierDoc = await Supplier.findById(supplier);
    if (!supplierDoc) {
      return res.status(400).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // First update the invoice document
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        supplier: supplier,
        supplierName: supplierDoc.name,
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
      },
      { 
        new: true,
        runValidators: true 
      }
    );

    if (!updatedInvoice) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invoice not found' 
      });
    }

    // Then update the invoice items
    await Promise.all(items.map(async (item) => {
      await InvoiceItem.findOneAndUpdate(
        { 
          invoice: updatedInvoice._id,
          product: item.product 
        },
        {
          buyPrice: item.buyPrice,
          quantityBought: item.quantityBought,
          quantityRemaining: item.quantityBought // Reset remaining quantity
        },
        { upsert: true, new: true }
      );
    }));

    // Remove any items not in the updated list
    await InvoiceItem.deleteMany({
      invoice: updatedInvoice._id,
      product: { $nin: items.map(i => i.product) }
    });

    // Recalculate totals
    const invoiceItems = await InvoiceItem.find({ invoice: updatedInvoice._id });
    const subtotal = invoiceItems.reduce(
      (sum, item) => sum + (item.buyPrice * item.quantityBought),
      0
    );
    const vatAmount = subtotal * 0.15; // Assuming 15% VAT
    const total = subtotal + vatAmount;

    // Update totals
    updatedInvoice.subtotal = subtotal;
    updatedInvoice.vatAmount = vatAmount;
    updatedInvoice.total = total;
    await updatedInvoice.save();

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice
    });

  } catch (error) {
    console.error('Update error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


/// Add this to your invoiceController.js
exports.getInvoice = async (req, res) => {
  try {
    // Step 1: Fetch the invoice document by ID
    const invoice = await Invoice.findById(req.params.id)
      .populate('supplierName', 'name')
      .lean(); // use lean to get plain JS object

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Step 2: Fetch the associated invoice items separately
    const items = await InvoiceItem.find({ invoice: invoice._id })
      .populate('product', 'name')
      .lean();

    // Step 3: Merge and return
    res.status(200).json({
      success: true,
      data: {
        ...invoice,
        items
      }
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice'
    });
  }
};



exports.getInvoiceItemsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const invoiceItems = await InvoiceItem.find({ product: productId })
      .select('batchNumber buyPrice quantityBought quantityRemaining')
      .sort({ createdAt: -1 });

    if (!invoiceItems || invoiceItems.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No invoice items found for this product' 
      });
    }

    res.status(200).json({
      success: true,
      data: invoiceItems
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// in controllers/invoiceController.js

/**
 * Get invoices with unpriced items (items without corresponding ProductPrice entries)
 */
// Get invoices with unpriced items
/**
 * Get invoices with unpriced items
 */
// In your invoiceController.js
exports.getInvoicesWithUnpricedItems = async (req, res) => {
  try {
    const invoices = await Invoice.aggregate([
      {
        $lookup: {
          from: "invoiceitems",
          localField: "_id",
          foreignField: "invoice",
          as: "items"
        }
      },
      {
        $lookup: {
          from: "productprices",
          localField: "items._id",
          foreignField: "batch",
          as: "prices"
        }
      },
      {
        $addFields: {
          unpricedItems: {
            $filter: {
              input: "$items",
              as: "item",
              cond: {
                $not: {
                  $in: ["$$item._id", "$prices.batch"]
                }
              }
            }
          }
        }
      },
      {
        $match: {
          "unpricedItems.0": { $exists: true } // Has at least one unpriced item
        }
      }
    ]);

    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
/**
 * Get unpriced items for a specific invoice
 */
/**
 * Get unpriced items for a specific invoice
 */
exports.getUnpricedItemsForInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Modern way to create ObjectId
    const { Types: { ObjectId } } = mongoose;
    
    // Find items that don't have corresponding product prices
    const items = await InvoiceItem.aggregate([
      {
        $match: { 
          invoice: new ObjectId(invoiceId) // Use new keyword here
        }
      },
      {
        $lookup: {
          from: 'productprices',
          localField: '_id',
          foreignField: 'batch',
          as: 'price'
        }
      },
      {
        $match: {
          price: { $size: 0 } // Items with no price records
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    const invoice = await Invoice.findById(invoiceId)
      .select('invoiceNumber supplierName invoiceDate');
    
    res.json({
      success: true,
      data: {
        invoice,
        unpricedItems: items
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Add this to your existing controller
exports.distributeToStores = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { distributions } = req.body;

    // Validate input
    if (!distributions || !Array.isArray(distributions)) {
      return res.status(400).json({ message: 'Invalid distribution data' });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Update each item with store distributions
    await Promise.all(distributions.map(async (distribution) => {
      const { itemId, storeDistributions } = distribution;
      
      await InvoiceItem.findByIdAndUpdate(itemId, {
        $set: { storeDistributions }
      });
    }));

    res.status(200).json({
      success: true,
      message: 'Items distributed to stores successfully'
    });
  } catch (error) {
    console.error('Distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to distribute items'
    });
  }
};