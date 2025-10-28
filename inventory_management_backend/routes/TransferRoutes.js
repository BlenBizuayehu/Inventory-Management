const express = require('express');
const {
  createTransfer,
  getTransfers,
  getLocations,
  updateTransfer,
  deleteTransfer,
  getTransfer, // Make sure this is imported
  getTransferHistory
} = require('../controllers/TransferController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
// Corrected route order
router.use(protect);

// Transfer routes
router.route('/')
  .get(getTransfers)
  .post(authorize('admin', 'owner'), createTransfer);

// Locations route - MOVED BEFORE :id ROUTE
router.get('/locations', getLocations);

// ID-based routes
router.route('/:id')
  .get(getTransfer)
  .put(authorize('admin', 'owner'), updateTransfer)
  .delete(authorize('admin', 'owner'), deleteTransfer);

// History route
router.get('/:id/history', getTransferHistory);

module.exports = router;