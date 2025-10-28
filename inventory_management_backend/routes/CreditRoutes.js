// routes/creditRoutes.js
const express = require('express');
const { getCredits, addPayment } = require('../controllers/CreditController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes here are protected
router.use(protect);

router.route('/')
    .get(authorize('admin', 'owner'), getCredits);

router.route('/:id/pay')
    .post(authorize('admin', 'owner'), addPayment);

module.exports = router;