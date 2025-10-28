const express = require('express');
const router = express.Router();
const batchController = require('../controllers/BatchController');

// Batch retrieval routes
router.get('/', batchController.getBatches);
router.get('/:batchId/locations', batchController.getBatchLocations);

// Batch placement routes
router.post('/placements', batchController.createBatchPlacements);

// Inventory transfer routes
router.post('/transfers', batchController.transferInventory);

module.exports = router;