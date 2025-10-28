const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');
const { protect, authorize } = require('../middleware/auth');

// Corrected route path
router.post('/batch-create/:invoiceId', protect, authorize('admin', 'owner'), priceController.batchCreatePrices);
router.get('/product/:productId', protect, priceController.getProductPrices);
router.get('/grouped-by-invoice', protect, priceController.getPricesGroupedByInvoice);
module.exports = router;