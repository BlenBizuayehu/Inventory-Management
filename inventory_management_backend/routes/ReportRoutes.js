// routes/reports.js
const express = require('express');
const router = express.Router();
const {
  generateInventoryReport,
  generateSalesReport,
  generateTransferReport,
  generateProductMovementReport,
  getReportTypes
} = require('../controllers/ReportController');
const { protect } = require('../middleware/auth');

// Protect all report routes
router.use(protect);

// Report endpoints
router.get('/inventory', generateInventoryReport);
router.get('/sales', generateSalesReport);
router.get('/transfers', generateTransferReport);
router.get('/product-movement', generateProductMovementReport);
router.get('/types', getReportTypes);

module.exports = router;