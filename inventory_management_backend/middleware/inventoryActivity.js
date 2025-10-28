const InventoryActivity = require('../models/InventoryActivity');

const recordInventoryActivity = async (req, res, next) => {
  // Skip if not an inventory-related route
  if (!req.originalUrl.includes('/inventory/') && 
      !req.originalUrl.includes('/transfers') && 
      !req.originalUrl.includes('/placements')) {
    return next();
  }

  try {
    // Skip if already handled in controller
    if (req.method === 'POST' && 
        (req.originalUrl.includes('/transfers') || 
         req.originalUrl.includes('/placements'))) {
      return next();
    }

    // Handle direct inventory adjustments
    if (req.method === 'PUT' || req.method === 'POST') {
      const activity = new InventoryActivity({
        store: req.body.storeId,
        type: 'adjustment',
        quantity: Math.abs(req.body.quantity),
        product: req.body.productId,
        user: req.user.id,
        description: req.body.reason || 'Inventory adjustment'
      });
      await activity.save();
    }

    next();
  } catch (err) {
    console.error('Failed to record activity:', err);
    next();
  }
};

module.exports = recordInventoryActivity;