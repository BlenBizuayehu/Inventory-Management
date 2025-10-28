const express = require('express');
const router = express.Router();
const {
  getStoreHistory, // Use this one
  getShopHistory,  // And this one
  getStoreInventory,
  getShopInventory,
  getMyShopsInventory,
  getInventoryStats,
  getRecentActivities,
  getAccessibleShops
  // ... any other functions you export and use
} = require('../controllers/InventoryController');
const { protect } = require('../middleware/auth');
const { shopAccess, canAccessShop } = require('../middleware/shopAccess');

router.use(protect);
router.use(shopAccess);
router.get('/accessible-shops', getAccessibleShops);

// Make sure your routes point to the new functions
router.route('/store-history/:storeId').get(protect, getStoreHistory);
router.route('/shop-history/:shopId').get(protect, getShopHistory);

router.route('/store/:storeId').get(protect, getStoreInventory);
router.get('/shop/:shopId', canAccessShop(), getShopInventory);

router.route('/stats').get(protect, getInventoryStats);
router.route('/activities').get(protect, getRecentActivities);
//Get all accessible shops for current user
router.get('/my-shops', getMyShopsInventory);

module.exports = router;