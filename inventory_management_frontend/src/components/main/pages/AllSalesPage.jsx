import { useEffect, useState } from 'react';
import api from '../../../api';
import './AllSalesPage.css'; // Create a corresponding CSS file for styling

import { useMemo } from 'react';
import './AllSalesPage.css';
import SaleDetailExpandable from './SaleDetailExpandable';

function AllSalesPage() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true); // Set initial loading to true
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
    });
    
    // State for dynamic settings and UI
    const [systemSettings, setSystemSettings] = useState({ currency: '', vatRate: 0 });
    const [expandedSaleId, setExpandedSaleId] = useState(null);

    // Fetch both sales and settings together
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const [salesRes, settingsRes] = await Promise.all([
                api.get('/sales', { params }),
                api.get('/settings')
            ]);
            
            setSales(salesRes.data.data);
            if (settingsRes.data?.success) {
                setSystemSettings(settingsRes.data.data);
            }

        } catch (err) {
            setError('Failed to fetch sales records.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(); // Fetch data on initial component mount
    }, []); // Only run once on mount

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchData(); // Refetch data with new filters
    };
    
    const toggleExpansion = (saleId) => {
        setExpandedSaleId(prevId => (prevId === saleId ? null : saleId));
    };

    // Group sales by month and year for the new display format
    const groupedSales = useMemo(() => {
        const groups = {};
        sales.forEach(sale => {
            const date = new Date(sale.createdAt);
            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(sale);
        });
        return groups;
    }, [sales]);

    return (
        <div className="all-sales-container">
            <h2>All Sales Records</h2>
            
            <form onSubmit={handleFilterSubmit} className="filter-form">
                <div className="form-group">
                    <label>Start Date:</label>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                </div>
                <div className="form-group">
                    <label>End Date:</label>
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                </div>
                <button type="submit" className="btn-filter" disabled={loading}>
                    {loading ? 'Filtering...' : 'Apply Filter'}
                </button>
           </form>

            {loading && <div className="loading-indicator">Loading sales records...</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="sales-list-view">
                {Object.keys(groupedSales).length === 0 && !loading && (
                    <div className="no-results">No sales records found for the selected period.</div>
                )}
                {Object.entries(groupedSales).map(([monthYear, salesInMonth]) => (
                    <div key={monthYear} className="month-group">
                        <h3>{monthYear}</h3>
                        <div className="month-items">
                            {salesInMonth.map(sale => {
                                const currency = sale.currency || systemSettings.currency;
                                return (
                                    <div key={sale._id} className="sale-item-wrapper">
                                        <div className="sale-item" onClick={() => toggleExpansion(sale._id)}>
                                            <div className="sale-info">
                                                <span className="sale-number">#{sale.saleNumber}</span>
                                                <span className="customer-name">{sale.customerName || 'Walk-in Customer'}</span>
                                                <span className="sale-date">{new Date(sale.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="sale-amount">
                                                <span>{currency} {sale.total.toFixed(2)}</span>
                                                <button className="details-btn">
                                                    {expandedSaleId === sale._id ? 'Hide Details' : 'Show Details'}
                                                </button>
                                            </div>
                                        </div>
                                        {expandedSaleId === sale._id && (
                                            <SaleDetailExpandable sale={sale} settings={systemSettings} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AllSalesPage;