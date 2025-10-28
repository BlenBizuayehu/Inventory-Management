const express = require('express');
const router = express.Router();
const salesController = require('../controllers/SalesController');


// Settings routes
router.get('/', salesController.createSale);
router.put('/', salesController.getSales);

module.exports = router;