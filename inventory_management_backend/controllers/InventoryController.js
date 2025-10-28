const InventoryStore = require('../models/InventoryStore');
const Batch = require('../models/Batch');
const ActivityLog = require('../models/ActivityLog');
const Product = require('../models/Product');
const Store = require('../models/Store');

exports.getStoreInventory = async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const inventory = await InventoryStore.find({ store: storeId })
      .populate('product', 'name sku')
      .populate({
        path: 'batchBreakdown.batch',
        select: 'batchNumber'
      });
      
    res.json({
      success: true,
      data: inventory
    });
    
  } catch (error) {
    console.error('Error fetching store inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch store inventory'
    });
  }
};

exports.getInventoryStats = async (req, res) => {
  try {
    const [totalProducts, lowStockItems, totalStores] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ quantity: { $lt: 10 } }), // Example threshold
      Store.countDocuments()
    ]);
    
    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockItems,
        totalStores
      }
    });
    
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory stats'
    });
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name')
      .populate('product', 'name');
      
    res.json({
      success: true,
      data: activities
    });
    
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activities'
    });
  }
};

// Update in inventoryController.js
exports.getStoreInventory = async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const inventory = await InventoryStore.find({ store: storeId })
      .populate('product', 'name sku')
      .populate({
        path: 'batchBreakdown.batch',
        select: 'batchNumber packSize'
      });
    
    res.json({
      success: true,
      data: inventory.map(item => ({
        ...item.toObject(),
        // Calculate total packs/pieces
        totalPacks: item.batchBreakdown.reduce((sum, b) => sum + (b.packs || 0), 0),
        totalPieces: item.batchBreakdown.reduce((sum, b) => sum + (b.pieces || 0), 0),
        // Include breakdown with pack size
        batchBreakdown: item.batchBreakdown.map(b => ({
          ...b,
          packSize: b.batch?.packSize || 1
        }))
      }))
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};