import { useState } from 'react';
import api from '../../../api';
import './ReceivablesExpandable.css';

// --- CORRECTION POINT 3 ---
// We destructure `{ credit }` from the props object.
// This function will now work correctly because the parent is passing a prop with this exact name.
function ReceivablesExpandable({ credit, onPaymentSuccess }) {
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleAddPayment = async (e) => {
        e.preventDefault();
        setError(null);
        const amount = Number(paymentAmount);

        if (!amount || amount <= 0 || amount > credit.outstandingBalance) {
            setError('Please enter a valid amount not exceeding the outstanding balance.');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post(`/credits/${credit._id}/pay`, { amount, method: paymentMethod });
            onPaymentSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add payment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add a check to prevent rendering if credit is somehow not passed, avoiding the crash.
     if (!credit) {
        return (
            <div className="credit-detail-expandable error-state">
                Error: Credit data could not be loaded.
            </div>
        );
    }

    return (
        <div className="credit-detail-expandable">
            <div className="detail-grid">
                <div className="credit-summary">
                    <h4>Sale Summary</h4>
                    {/* This line will now work because 'credit' is a defined object */}
                    <p><strong>Sale #:</strong> {credit.sale?.saleNumber || 'N/A'}</p>
                    <p><strong>Date:</strong> {new Date(credit.createdAt).toLocaleString()}</p>
                    <p><strong>Total Amount:</strong> Br {credit.totalAmount.toFixed(2)}</p>
                    <p><strong>Amount Paid:</strong> Br {credit.amountPaid.toFixed(2)}</p>
                    <p className="outstanding"><strong>Outstanding:</strong> Br {credit.outstandingBalance.toFixed(2)}</p>
                </div>
                <div className="payment-history">
                    <h4>Payment History</h4>
                    {credit.payments.length > 0 ? (
                        <ul>
                            {credit.payments.map((p, index) => (
                                <li key={index}>
                                    {new Date(p.date).toLocaleDateString()}: <strong>Br {p.amount.toFixed(2)}</strong> via {p.method}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No payments recorded yet.</p>
                    )}
                </div>
                {credit.status === 'Outstanding' && (
                    <div className="payment-section">
                        <h4>Record a Payment</h4>
                        <form onSubmit={handleAddPayment}>
                            {error && <div className="alert alert-error">{error}</div>}
                            <div className="form-group">
                                <label>Amount:</label>
                                <input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Payment Method:</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Check">Check</option>
                                </select>
                            </div>
                            <button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Add Payment'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReceivablesExpandable;