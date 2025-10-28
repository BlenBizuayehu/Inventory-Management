const express = require('express');
const router = express.Router();
const priceController = require('../controllers/PriceController');
const { protect, authorize } = require('../middleware/auth');

// Invoice-based pricing
router.post(
  '/batch-create/:invoiceId',
  protect,
  authorize('admin', 'owner'),
  priceController.batchCreatePrices
);

// Current price management
router.put(
  '/set-current/:productId',
  protect,
  authorize('admin', 'owner'),
  priceController.setCurrentProductPrice
);
router.get('/grouped-by-invoice', protect, priceController.getPricesGroupedByInvoice);


// Price queries
router.get(
  '/product/:productId',
  protect,
  priceController.getProductPrices
);
router.get(
  '/grouped-by-invoice',
  protect,
  priceController.getPricesGroupedByInvoice
);
router.post(
  '/current-prices',
  protect,
  priceController.getCurrentPrices
);

module.exports = router;