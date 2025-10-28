// middleware/shopAccess.js
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');

exports.shopAccess = asyncHandler(async (req, res, next) => {
  // For owners/admins, no restrictions
  if (req.user.role === 'owner' || req.user.role === 'admin') {
    req.user.accessibleShopIds = null; // null means all shops accessible
    return next();
  }

  // For users with shop assignments
  if (req.user.assignedShops && req.user.assignedShops.length > 0) {
    req.user.accessibleShopIds = req.user.assignedShops.map(s => s.shopId);
    
    // Set current shop if only one assignment
    if (req.user.assignedShops.length === 1) {
      req.user.currentShopId = req.user.assignedShops[0].shopId;
    }
    
    return next();
  }

  // Users without shop assignments get no access
  req.user.accessibleShopIds = [];
  next();
});

// Middleware to validate if user can access specific shop
exports.canAccessShop = (shopIdParam = 'shopId') => {
  return asyncHandler(async (req, res, next) => {
    const shopId = req.params[shopIdParam] || req.body.shopId;
    
    if (!shopId) {
      return next(new ErrorResponse('Shop ID is required', 400));
    }

    // Owners/admins can access any shop
    if (req.user.role === 'owner' || req.user.role === 'admin') {
      return next();
    }

    // Check if user has access to this shop
    const hasAccess = req.user.assignedShops?.some(
      shop => shop.shopId.toString() === shopId.toString()
    );

    if (!hasAccess) {
      return next(new ErrorResponse('Not authorized to access this shop', 403));
    }

    next();
  });
};