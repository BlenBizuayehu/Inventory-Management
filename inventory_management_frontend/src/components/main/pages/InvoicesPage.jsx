import { useEffect, useState } from 'react';
import { FaCalendarAlt, FaEdit, FaFileInvoice, FaSearch, FaSyncAlt, FaTrash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../api';

import './InvoicesPage.css';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [vatRate, setVatRate] = useState(0.15);
  const navigate = useNavigate();

  
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await api.get('/invoices', {
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

        setInvoices(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // Updated calculation to consider pack/piece mode
  const calculateInvoiceTotals = (items) => {
    const subtotal = items.reduce((sum, item) => {
      const quantity = item.unitMode === 'pack' 
        ? item.quantityBought * (item.piecesPerPack || 1)
        : item.quantityBought;
      return sum + (Number(item.buyPrice) * quantity);
    }, 0);
    
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;
    
    return {
      subtotal: subtotal.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const toggleInvoice = (invoiceId) => {
    setExpandedInvoice(expandedInvoice === invoiceId ? null : invoiceId);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate ? 
      new Date(invoice.invoiceDate).toISOString().split('T')[0] === filterDate : 
      true;
    return matchesSearch && matchesDate;
  });

  const groupInvoicesByMonth = () => {
    const grouped = {};
    filteredInvoices.forEach(invoice => {
      const date = new Date(invoice.invoiceDate);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(invoice);
    });
    return grouped;
  };

  const groupedInvoices = groupInvoicesByMonth();

  const handleDelete = async (invoiceId) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await api.delete(`/invoices/${invoiceId}`);
        setInvoices(prev => prev.filter(inv => inv._id !== invoiceId));
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  // Helper to format quantity display
  const formatQuantityDisplay = (item) => {
  if (item.unitMode === 'pack') {
    return `${item.quantityBought} pack(s) × ${item.piecesPerPack} = ${item.quantityBought * (item.piecesPerPack || 1)} pieces`;
  }
  return `${item.quantityBought} piece(s)`;
};

// Update calculateItemTotals to use the correct quantity
const calculateItemTotals = (item) => {
  const quantity = item.unitMode === 'pack' 
    ? item.quantityBought * (item.piecesPerPack || 1)
    : item.quantityBought;
  
  const itemTotal = Number(item.buyPrice) * quantity;
  const itemTotalWithVat = itemTotal * (1 + vatRate);
  
  return {
    quantity: item.quantityBought, // Show the original entered quantity
    totalPieces: quantity, // Show calculated total pieces
    itemTotal,
    itemTotalWithVat
  };
};

  return (
    <div className="dashboard-page invoices-page">
      <div className="page-header">
        <h1 className="page-title">
          <FaFileInvoice /> Invoices
        </h1>
        <Link to="/owner/dashboard/invoices/new" className="new-invoice-btn">
          Create New Invoice
        </Link>
      </div>

      <div className="search-filters">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by supplier or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="date-filter">
          <FaCalendarAlt className="filter-icon" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          {filterDate && (
            <button 
              className="clear-filter"
              onClick={() => setFilterDate('')}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <FaSyncAlt className="spin" /> Loading invoices...
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="no-results">
          No invoices found {searchTerm || filterDate ? 'matching your criteria' : ''}
        </div>
      ) : (
        <div className="invoice-list">
          {Object.entries(groupedInvoices).map(([monthYear, monthInvoices]) => (
            <div key={monthYear} className="invoice-month-group">
              <h2 className="month-header">{monthYear}</h2>
              
              {monthInvoices.map(invoice => {
                const { subtotal, vatAmount, total } = calculateInvoiceTotals(invoice.items);
                
                return (
                  <div key={invoice._id} className="invoice-card">
                    <div 
                      className="invoice-summary"
                      onClick={() => toggleInvoice(invoice._id)}
                    >
                      <div className="invoice-info">
                        <span className="invoice-number">
                          {invoice.invoiceNumber}
                        </span>
                        <span className="supplier-name">
                          {invoice.supplierName}
                        </span>
                      </div>
                      
                      <div className="invoice-meta">
                        <span className="invoice-date">
                          {new Date(invoice.invoiceDate).toLocaleDateString()}
                        </span>
                        <span className="invoice-total-amount">
                          Br {total}
                        </span>
                        <span className={`invoice-status ${expandedInvoice === invoice._id ? 'open' : ''}`}>
                          {expandedInvoice === invoice._id ? 'Hide Details' : 'Show Details'}
                        </span>
                      </div>
                    </div>

                    {expandedInvoice === invoice._id && (
                      <div className="invoice-details">
                        <div className="details-row">
                          <div className="detail-item">
                            <span className="detail-label">Invoice Date:</span>
                            <span className="detail-value">
                              {new Date(invoice.invoiceDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Created:</span>
                            <span className="detail-value">
                              {new Date(invoice.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="invoice-actions">
                            <Link 
                              to={`/owner/dashboard/invoices/edit/${invoice._id}`} 
                              className="edit-btn"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FaEdit/>
                            </Link>
                            <button 
                              className="delete-btn"
                              onClick={() => handleDelete(invoice._id)}
                            >
                              <FaTrash/>
                            </button>
                              <button
                                type="button"
                                className="batch-placement-btn"
                                onClick={() => navigate(`/owner/dashboard/batch-placement/${invoice._id}`, { 
                                  state: { invoice } 
                                })}
                              >
                                Batch Placement
                              </button>
                          </div>
                        </div>

                        <h3 className="items-header">Items</h3>
                        <div className="items-table">
                          <div className="table-header">
                            <div className="table-cell">Product</div>
                            <div className="table-cell">Unit</div>
                            <div className="table-cell">Unit Price</div>
                            <div className="table-cell">Quantity</div>
                            <div className="table-cell">Item Total</div>
                            <div className="table-cell">Item Total (VAT)</div>
                          </div>
                          
                          {invoice.items.map((item, index) => {
                            const { quantity, itemTotal, itemTotalWithVat } = calculateItemTotals(item);
                            
                            return (
                              <div key={index} className="table-row">
                                <div className="table-cell">
                                  {item.product?.name || 'Unknown Product'}
                                </div>
                                <div className="table-cell">
                                  {item.unitMode === 'pack' ? 'Pack' : 'Piece'}
                                </div>
                                <div className="table-cell">
                                  Br {Number(item.buyPrice).toFixed(2)}
                                </div>
                                <div className="table-cell">
                                  {formatQuantityDisplay(item)}
                                </div>
                                <div className="table-cell">
                                  Br {itemTotal.toFixed(2)}
                                </div>
                                <div className="table-cell">
                                  Br {itemTotalWithVat.toFixed(2)}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="invoice-totals">
                          <div className="total-row">
                            <span className="total-label">Subtotal:</span>
                            <span className="total-amount">Br {subtotal}</span>
                          </div>
                          <div className="total-row">
                            <span className="total-label">VAT ({vatRate * 100}%):</span>
                            <span className="total-amount">Br {vatAmount}</span>
                          </div>
                          <div className="total-row grand-total">
                            <span className="total-label">Total:</span>
                            <span className="total-amount">Br {total}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;