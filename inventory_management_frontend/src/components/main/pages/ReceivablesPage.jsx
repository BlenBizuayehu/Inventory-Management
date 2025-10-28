import { useEffect, useMemo, useState } from 'react';
import api from '../../../api';
import './ReceivablesPage.css';
// Ensure the import name matches your file name
import ReceivablesExpandable from './ReceivablesExpandable';

function ReceivablesPage() {
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('summary');

    const [expandedItemId, setExpandedItemId] = useState(null);
    const [expandedCustomer, setExpandedCustomer] = useState(null);

    const fetchCredits = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/credits');
            setCredits(res.data.data);
        } catch (err) {
            setError('Failed to fetch receivables data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCredits();
    }, []);

    const handlePaymentSuccess = () => {
        setExpandedItemId(null);
        setExpandedCustomer(null);
        fetchCredits();
    };

    const customerSummaries = useMemo(() => {
        if (credits.length === 0) return [];
        const summaryMap = credits.reduce((acc, credit) => {
            if (!acc[credit.customerName]) {
                acc[credit.customerName] = { totalOutstanding: 0, creditCount: 0 };
            }
            acc[credit.customerName].totalOutstanding += credit.outstandingBalance;
            acc[credit.customerName].creditCount += 1;
            return acc;
        }, {});
        return Object.entries(summaryMap)
            .map(([name, data]) => ({ name, ...data }))
            .filter(customer => customer.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [credits, searchTerm]);

    const creditsByMonth = useMemo(() => {
        const groups = {};
        credits
            .filter(c => c.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
            .forEach(credit => {
                const date = new Date(credit.createdAt);
                const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                if (!groups[monthYear]) groups[monthYear] = [];
                groups[monthYear].push(credit);
            });
        return groups;
    }, [credits, searchTerm]);

    const toggleItemExpansion = (id) => setExpandedItemId(prevId => (prevId === id ? null : id));
    const toggleCustomerExpansion = (customerName) => setExpandedCustomer(prevName => (prevName === customerName ? null : customerName));

    const renderCustomerSummaryView = () => (
        <div className="summary-view">
            {customerSummaries.map(customer => (
                <div key={customer.name} className="customer-summary-item">
                    <div className="summary-header" onClick={() => toggleCustomerExpansion(customer.name)}>
                        <div className="customer-info">
                            <span className="customer-name">{customer.name}</span>
                            <span className="credit-count">{customer.creditCount} outstanding sale(s)</span>
                        </div>
                        <div className="customer-total">
                            <span>Total Due: Br {customer.totalOutstanding.toFixed(2)}</span>
                            <button className="details-btn">{expandedCustomer === customer.name ? 'Hide Details' : 'View Details'}</button>
                        </div>
                    </div>
                    {expandedCustomer === customer.name && (
                        <div className="customer-credit-details">
                            {credits.filter(c => c.customerName === customer.name).map(credit => (
                               <div key={credit._id} className="credit-item-nested">
                                   <div className="credit-header" onClick={() => toggleItemExpansion(credit._id)}>
                                        <span>Sale #{credit.sale?.saleNumber} - {new Date(credit.createdAt).toLocaleDateString()}</span>
                                        <span>Outstanding: Br {credit.outstandingBalance.toFixed(2)}</span>
                                   </div>
                                   {expandedItemId === credit._id && (
                                       // --- CORRECTION POINT 1 ---
                                       // We are passing the `credit` object as a prop named `credit`.
                                       <ReceivablesExpandable credit={credit} onPaymentSuccess={handlePaymentSuccess} />
                                   )}
                               </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    const renderListView = () => (
        <div className="credits-list">
            {Object.entries(creditsByMonth).map(([monthYear, creditsInMonth]) => (
                <div key={monthYear} className="month-group">
                    <h3>{monthYear}</h3>
                    <div className="month-items">
                        {creditsInMonth.map(credit => (
                            <div key={credit._id} className="credit-item-wrapper">
                                <div className="credit-item" onClick={() => toggleItemExpansion(credit._id)}>
                                    <div className="credit-info">
                                        <span className="sale-number">#{credit.sale?.saleNumber || 'N/A'}</span>
                                        <span className="customer-name">{credit.customerName}</span>
                                        <span className="credit-date">{new Date(credit.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="credit-amount">
                                        <span>Br {credit.totalAmount.toFixed(2)}</span>
                                        <button className="details-btn">{expandedItemId === credit._id ? 'Hide Details' : 'Show Details'}</button>
                                    </div>
                                </div>
                                {expandedItemId === credit._id && (
                                    // --- CORRECTION POINT 2 ---
                                    // We are passing the `credit` object as a prop named `credit`.
                                    <ReceivablesExpandable credit={credit} onPaymentSuccess={handlePaymentSuccess} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="receivables-container">
            <div className="page-header">
                <h2>Receivables</h2>
                <div className="controls-bar">
                    <div className="view-toggle">
                        <button onClick={() => setViewMode('summary')} className={viewMode === 'summary' ? 'active' : ''}>Customer Summary</button>
                        <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'active' : ''}>Chronological List</button>
                    </div>
                    <div className="search-bar">
                        <input type="text" placeholder="Search by customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </div>
            {loading && <div className="loading-indicator">Loading...</div>}
            {error && <div className="alert alert-error">{error}</div>}
            {!loading && (viewMode === 'summary' ? renderCustomerSummaryView() : renderListView())}
        </div>
    );
}

export default ReceivablesPage;