// controllers/CreditController.js
const Credit = require('../models/Credit');
const Sale = require('../models/Sale');
const mongoose = require('mongoose');

// @desc    Get all credit records (can be filtered by status)
// @route   GET /api/credits
// controllers/CreditController.js

// @desc    Get all credit records (can be filtered by status or customer name)
// @route   GET /api/credits
exports.getCredits = async (req, res) => {
    try {
        const { status, customerName } = req.query;
        const filter = {};
        
        if (status) {
            filter.status = status;
        }

        // NEW: Add search functionality by customer name
        if (customerName) {
            // Use a regular expression for a case-insensitive, partial match
            filter.customerName = { $regex: customerName, $options: 'i' };
        }

        const credits = await Credit.find(filter)
            .populate('shop', 'name')
            .populate('createdBy', 'name')
            .populate('sale', 'saleNumber') // Make sure to populate the sale number
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: credits.length, data: credits });
    } catch (error) {
        console.error('Error fetching credits:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
// @desc    Add a payment to a credit record
// @route   POST /api/credits/:id/pay
exports.addPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { amount, method, notes } = req.body;
        const creditId = req.params.id;

        if (!amount || amount <= 0) {
            throw new Error('Payment amount must be greater than zero.');
        }

        const credit = await Credit.findById(creditId).session(session);
        if (!credit) {
            throw new Error('Credit record not found.');
        }
        if (credit.status === 'Paid') {
            throw new Error('This credit has already been fully paid.');
        }

        const paymentAmount = Number(amount);
        if (paymentAmount > credit.outstandingBalance) {
            throw new Error('Payment amount cannot be greater than the outstanding balance.');
        }

        // Add the payment to the history
        credit.payments.push({
            amount: paymentAmount,
            method: method,
            notes: notes,
            receivedBy: req.user._id,
        });

        // Update the balances
        credit.amountPaid += paymentAmount;
        credit.outstandingBalance -= paymentAmount;

        // Check if the credit is now fully paid
        if (credit.outstandingBalance <= 0) {
            credit.status = 'Paid';
        }

        const updatedCredit = await credit.save({ session });
        await session.commitTransaction();

        res.status(200).json({ success: true, data: updatedCredit });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
};