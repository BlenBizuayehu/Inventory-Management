// routes/reports.js
const express = require('express');
const router = express.Router();
const {
  generateInventoryReport,
  generateSalesReport,
  generateTransferReport,
  generateProductMovementReport,
  getReportTypes
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');


router.use(protect);

// Report endpoints
router.get('/inventory', generateInventoryReport);
router.get('/sales', generateSalesReport);
router.get('/transfers', generateTransferReport);
router.get('/product-movement', generateProductMovementReport);
router.get('/types', getReportTypes);

module.exports = router;