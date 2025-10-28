// models/Credit.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: { type: String, required: true },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: String,
});

const CreditSchema = new Schema({
    sale: {
        type: Schema.Types.ObjectId,
        ref: 'Sale',
        required: true,
        unique: true
    },
    shop: {
        type: Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerContact: {
        type: String
    },
    totalAmount: { // The initial amount of the debt
        type: Number,
        required: true
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    outstandingBalance: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Outstanding', 'Paid'],
        default: 'Outstanding'
    },
    payments: [PaymentSchema], // A history of all payments made
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Credit', CreditSchema);