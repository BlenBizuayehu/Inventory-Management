const express = require('express');
const router = express.Router();
const saleController = require('../controllers/SalesController');
const { protect, authorize } = require('../middleware/auth');

router.post(
  '/',
  protect,
  authorize('cashier', 'admin', 'owner'),
  saleController.createSale
);

router.get(
  '/',
  protect,
  saleController.getSales
);

//Add this new route
router.get(
  '/today',
  protect,
  saleController.getTodaysSales
);

router.get(
  '/:id',
  protect,
  saleController.getSale
);

router.get(
  '/batches/:productId',
  protect,
  saleController.getProductBatches
);

module.exports = router;