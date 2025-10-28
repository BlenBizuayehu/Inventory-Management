const mongoose = require('mongoose');
const InventoryStore = require('../models/InventoryStore');
const InventoryShop = require('../models/InventoryShop');
const Batch = require('../models/Batch');
const InventoryActivity = require('../models/InventoryActivity');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Shop = require('../models/Shop');
const asyncHandler = require('../middleware/async');

// Helper function to check if user has full access (owner/admin)
const hasFullAccess = (user) => {
  return user.role === 'owner' || user.role === 'admin';
};

// Helper function to get shop filter based on user role
const getShopFilter = (user) => {
  if (hasFullAccess(user)) {
    return {}; // No filter for owners/admins
  }
  
  if (user.accessibleShopIds && user.accessibleShopIds.length > 0) {
    return { shop: { $in: user.accessibleShopIds } };
  }
  
  return { shop: { $in: [] } }; // No access for users without shop assignments
};

// @desc    Get inventory stats with proper role-based filtering
// @route   GET /api/inventory/stats
// @access  Private
exports.getInventoryStats = asyncHandler(async (req, res) => {
  const shopFilter = getShopFilter(req.user);
  
  const [totalProducts, lowStockItems, totalStores, totalShops] = await Promise.all([
    Product.countDocuments(),
    InventoryStore.countDocuments({ totalQuantity: { $lt: 10 } }),
    Store.countDocuments(),
    // Shop count based on user access
    hasFullAccess(req.user) 
      ? Shop.countDocuments()
      : Shop.countDocuments({ _id: { $in: req.user.accessibleShopIds || [] } })
  ]);
  
  res.status(200).json({
    success: true,
    data: { 
      totalProducts, 
      lowStockItems, 
      totalStores, 
      totalShops,
      userRole: req.user.role,
      accessibleShops: req.user.accessibleShopIds ? req.user.accessibleShopIds.length : 'all'
    }
  });
});

// ...


// @desc    Get recent activities with proper role-based filtering
// @route   GET /api/inventory/activities
// @access  Private
exports.getRecentActivities = asyncHandler(async (req, res) => {
  const { limit = 10, shopIds } = req.query;
  
  let activityFilter = {};
  
  // Apply shop filter for non-admin users
  if (!hasFullAccess(req.user) && req.user.accessibleShopIds && req.user.accessibleShopIds.length > 0) {
    activityFilter = { 
      $or: [
        { shop: { $in: req.user.accessibleShopIds } },
        { store: { $exists: true } } // Include store activities too
      ]
    };
  }
  
  // If specific shop IDs are requested, filter by them
  if (shopIds) {
    const shopIdArray = shopIds.split(',').map(id => id.trim());
    activityFilter.shop = { $in: shopIdArray };
  }

  const activities = await InventoryActivity.find(activityFilter)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('user', 'name')
    .populate('product', 'name sku')
    .populate('store', 'name')
    .populate('shop', 'name');
    
  res.status(200).json({ 
    success: true, 
    data: activities,
    userRole: req.user.role,
    filterApplied: !hasFullAccess(req.user)
  });
});

// @desc    Get inventory history for a specific store
// @route   GET /api/inventory/store-history/:storeId
// @access  Private
exports.getStoreHistory = asyncHandler(async (req, res, next) => {
  const { storeId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(storeId)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid store ID' 
    });
  }

  // Store access logic (if you need to restrict store access in the future)
  // For now, owners/admins can access all stores, regular users might need store assignments

  const activities = await InventoryActivity.find({ store: storeId })
    .sort({ date: -1, createdAt: -1 })
    .populate({
      path: 'product',
      select: 'name sku piecesPerPack'
    })
    .populate({
      path: 'user',
      select: 'name'
    })
    .populate({
      path: 'destination',
      select: 'name'
    })
    .lean();

  const processedActivities = activities.map(activity => {
    const packSize = activity.product?.piecesPerPack || 1;
    let packs = activity.packs || 0;
    let pieces = activity.pieces || 0;
    
    if (activity.quantity && !activity.packs && !activity.pieces) {
      packs = Math.floor(activity.quantity / packSize);
      pieces = activity.quantity % packSize;
    }

    const totalPieces = (packs * packSize) + pieces;

    let displayQuantity;
    if (packSize > 1) {
      displayQuantity = `${packs} pack${packs !== 1 ? 's' : ''} (${packs * packSize} pieces)`;
      if (pieces > 0) {
        displayQuantity += ` + ${pieces} piece${pieces !== 1 ? 's' : ''}`;
      }
    } else {
      displayQuantity = `${totalPieces} piece${totalPieces !== 1 ? 's' : ''}`;
    }

    const destination = activity.destination || 
                      (activity.toLocation ? { name: 'Unknown Location' } : null);

    return {
      ...activity,
      packs,
      pieces,
      packSize,
      totalPieces,
      displayQuantity,
      batchNumber: activity.batch || activity.batchNumber || 'N/A',
      destination,
      product: activity.product || { name: 'Unknown Product', sku: 'N/A' }
    };
  });

  res.status(200).json({
    success: true,
    count: processedActivities.length,
    data: processedActivities,
    userRole: req.user.role
  });
});

// @desc    Get inventory history for a specific shop WITH ACCESS CONTROL
// @route   GET /api/inventory/shop-history/:shopId
// @access  Private
exports.getShopHistory = asyncHandler(async (req, res, next) => {
  const { shopId } = req.params;
  const { sort = 'desc' } = req.query;

  if (!mongoose.Types.ObjectId.isValid(shopId)) {
    return res.status(400).json({ success: false, error: 'Invalid shop ID' });
  }

  // Verify access - ONLY restrict non-owner/admin users
  if (!hasFullAccess(req.user)) {
    if (!req.user.accessibleShopIds || !req.user.accessibleShopIds.some(id => id.toString() === shopId)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this shop history'
      });
    }
  }

  const sortOrder = sort === 'asc' ? 1 : -1;

  const history = await InventoryActivity.find({ shop: shopId })
    .sort({ date: sortOrder, createdAt: sortOrder })
    .populate({
      path: 'product',
      select: 'name sku piecesPerPack'
    })
    .populate({
      path: 'user',
      select: 'name'
    })
    .populate({
      path: 'source',
      select: 'name'
    });

  res.status(200).json({
    success: true,
    count: history.length,
    data: history,
    userRole: req.user.role,
    hasAccess: true
  });
});

// @desc    Get current inventory for a specific store
// @route   GET /api/inventory/store/:storeId
// @access  Private
exports.getStoreInventory = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  
  const inventory = await InventoryStore.find({ store: storeId })
    .populate({
      path: 'product',
      select: 'name sku'
    });

  const processedData = inventory.map(item => {
    const totalQuantity = item.batchBreakdown.reduce((sum, b) => {
      return sum + ((b.packs || 0) * (b.packSize || 1)) + (b.pieces || 0);
    }, 0);
    
    return {
      ...item.toObject(),
      totalQuantity
    };
  });

  res.status(200).json({ 
    success: true, 
    data: processedData,
    userRole: req.user.role
  });
});

// @desc    Get current inventory for a specific shop WITH ACCESS CONTROL
// @route   GET /api/inventory/shop/:shopId
// @access  Private
exports.getShopInventory = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  
  // Verify access - ONLY for non-owner/admin users
  if (!hasFullAccess(req.user)) {
    if (!req.user.accessibleShopIds || !req.user.accessibleShopIds.some(id => id.toString() === shopId)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this shop inventory'
      });
    }
  }

  const inventory = await InventoryShop.find({ shop: shopId })
    .populate('product', 'name sku')
    .populate('shop', 'name');

  res.status(200).json({ 
    success: true, 
    data: inventory,
    userRole: req.user.role,
    hasAccess: true
  });
});

// @desc    Get inventory for all shops accessible to the current user
// @route   GET /api/inventory/my-shops
// @access  Private
exports.getMyShopsInventory = asyncHandler(async (req, res) => {
  let shopFilter = {};
  
  // Owners/admins see all shops, regular users see only assigned shops
  if (!hasFullAccess(req.user)) {
    if (!req.user.accessibleShopIds || req.user.accessibleShopIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No shop assignments found',
        userRole: req.user.role
      });
    }
    shopFilter = { shop: { $in: req.user.accessibleShopIds } };
  }

  const inventory = await InventoryShop.find(shopFilter)
    .populate('product', 'name sku')
    .populate('shop', 'name location')
    .sort({ 'shop.name': 1 });

  // Group by shop for better frontend display
  const groupedInventory = inventory.reduce((acc, item) => {
    const shopId = item.shop._id.toString();
    if (!acc[shopId]) {
      acc[shopId] = {
        shop: item.shop,
        products: []
      };
    }
    acc[shopId].products.push(item);
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: Object.values(groupedInventory),
    userRole: req.user.role,
    showsAllShops: hasFullAccess(req.user)
  });
});

// @desc    Get all shops with basic info (for dropdowns, etc.)
// @route   GET /api/inventory/accessible-shops
// @access  Private
exports.getAccessibleShops = asyncHandler(async (req, res) => {
  let shopFilter = {};
  
  // For non-owner/admin users, filter by accessible shops
  if (!hasFullAccess(req.user)) {
    if (!req.user.accessibleShopIds || req.user.accessibleShopIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No shop assignments found'
      });
    }
    shopFilter = { _id: { $in: req.user.accessibleShopIds } };
  }

  const shops = await Shop.find(shopFilter)
    .select('name location')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: shops,
    userRole: req.user.role,
    showsAllShops: hasFullAccess(req.user),
    totalShops: shops.length
  });
});

// --- UTILITY AND OTHER FUNCTIONS ---

// Update inventory from sales
exports.updateFromSale = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { shopId, items } = req.body;
    
    // Verify shop access for non-owner/admin users
    if (!hasFullAccess(req.user)) {
      if (!req.user.accessibleShopIds || !req.user.accessibleShopIds.some(id => id.toString() === shopId)) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update inventory for this shop'
        });
      }
    }

    for (const item of items) {
      const inventory = await InventoryShop.findOne({ product: item.product, shop: shopId }).session(session);
      if (!inventory) throw new Error(`Inventory not found for product ${item.product} in shop ${shopId}`);
      
      const product = await Product.findById(item.product).select('piecesPerPack').session(session);
      const packSize = product.piecesPerPack || 1;
      const piecesToDeduct = (item.packs * packSize) + (item.pieces || 0);
      if (inventory.totalQuantity < piecesToDeduct) throw new Error(`Insufficient stock for product ${item.product}`);

      // FIFO logic here...
    }
    
    await session.commitTransaction();
    res.status(200).json({ 
      success: true, 
      message: 'Inventory updated from sale',
      userRole: req.user.role
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
});

exports.checkBatch = asyncHandler(async (req, res, next) => {
  const { product, location, batch } = req.query;
  const inventory = await InventoryStore.findOne({ product, store: location, 'batchBreakdown.batch': batch });
  res.json({ exists: !!inventory });
});
