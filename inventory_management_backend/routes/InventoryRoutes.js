const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

// Get store inventory
router.get('/store/:storeId', protect, inventoryController.getStoreInventory);

// Get all inventory stats (for overview)
router.get('/stats', protect, inventoryController.getInventoryStats);

// Get recent activities
router.get('/activities', protect, inventoryController.getRecentActivities);

module.exports = router;