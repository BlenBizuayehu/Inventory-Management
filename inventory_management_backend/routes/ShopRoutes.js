const express = require('express');
const router = express.Router();
const shopController = require('../controllers/ShopController');

router.post('/', shopController.createShop);
router.get('/', shopController.getAllShops);
router.get('/:id', shopController.getShop);
router.put('/:id', shopController.updateShop);
router.delete('/:id', shopController.deleteShop);

module.exports = router;