// routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/InvoiceController');
const { protect, authorize } = require('../middleware/auth');
const { isValidObjectId } = require('mongoose');


router.post('/', invoiceController.createInvoice);
router.get('/', invoiceController.getAllInvoices);
router.put('/:id', invoiceController.updateInvoice); 
router.delete('/:id', invoiceController.deleteInvoice);
router.get('/unpriced', protect, invoiceController.getInvoicesWithUnpricedItems);
// router.get('/:id', invoiceController.getInvoice); 
router.get('/:id', (req, res, next) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
}, invoiceController.getInvoice);
router.get('/product/:productId', invoiceController.getInvoiceItemsByProduct); 
router.get('/:invoiceId/unpriced-items', protect, invoiceController.getUnpricedItemsForInvoice);
module.exports = router;