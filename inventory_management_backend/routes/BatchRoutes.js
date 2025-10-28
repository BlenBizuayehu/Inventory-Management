const express = require('express');
const router = express.Router();
const batchController = require('../controllers/BatchController');
const { protect, authorize } = require('../middleware/auth');

// Batch retrieval routes
router.get('/', batchController.getBatches);
router.get('/:batchId/locations', batchController.getBatchLocations);

// Batch placement routes
router.post('/placements',  protect, batchController.createBatchPlacements);
// In your routes file (e.g., batchesRoutes.js)
router.get('/placements',  protect, batchController.getPlacementsByInvoice);
// Inventory transfer routes

module.exports = router;