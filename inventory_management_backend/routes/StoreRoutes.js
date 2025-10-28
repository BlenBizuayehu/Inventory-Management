const express = require('express');
const router = express.Router();
const storeController = require('../controllers/StoreController');

router.post('/', storeController.createStore);
router.get('/', storeController.getAllStores);
router.get('/:id', storeController.getStore);
router.put('/:id', storeController.updateStore);
router.delete('/:id', storeController.deleteStore);

module.exports = router;