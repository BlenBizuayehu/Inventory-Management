const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/SupplierController');

// Suppliers routes
router.post('/', supplierController.createSupplier);
router.get('/', supplierController.getAllSuppliers);
// UPDATE
router.put('/:id', supplierController.updateSupplier);

// DELETE
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;