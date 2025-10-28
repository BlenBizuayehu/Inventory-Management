import { useEffect, useState } from 'react';
import { FaFileInvoice, FaSave, FaSearch, FaSpinner } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../../api'; // Update the import path
import './ProductPrice.css';

const ProductPrice = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [unpricedItems, setUnpricedItems] = useState([]);
  const [prices, setPrices] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvoicesWithoutPrices();
  }, []);

const fetchInvoicesWithoutPrices = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    // Make sure to use the full endpoint path
    const response = await api.get('/invoices/unpriced');
    
    console.log('API Response:', response);
    
    if (!response.data) {
      throw new Error('No data received from server');
    }

    // Handle both success/error response formats
    if (response.data.success === false) {
      throw new Error(response.data.error || 'Failed to fetch invoices');
    }

    // Handle direct array responses (like in your InvoicesPage example)
    const invoiceData = Array.isArray(response.data.data) 
      ? response.data.data 
      : Array.isArray(response.data)
        ? response.data
        : [];

    setInvoices(invoiceData);
  } catch (err) {
    console.error('Fetch invoices error:', err);
    setError(err.response?.data?.error || 
            err.message || 
            'Failed to fetch invoices. Please check the console for details.');
  } finally {
    setIsLoading(false);
  }
};

  const fetchUnpricedItems = async (invoiceId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/invoices/${invoiceId}/unpriced-items`);
      
      const { invoice, unpricedItems = [] } = response.data?.data || response.data || {};
      
      setSelectedInvoice(invoice);
      setUnpricedItems(unpricedItems);
      
      // Initialize prices state
      const initialPrices = {};
      unpricedItems.forEach(item => {
        initialPrices[item._id] = {
          price: '',
          productId: item.product?._id || ''
        };
      });
      setPrices(initialPrices);
    } catch (err) {
      console.error('Fetch unpriced items error:', err);
      setError(err.response?.data?.error || 'Failed to fetch unpriced items');
      setUnpricedItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceChange = (itemId, value) => {
    setPrices(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        price: value
      }
    }));
  };

  const savePrices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare price updates with product IDs
      const priceUpdates = Object.entries(prices)
        .filter(([itemId, priceData]) => priceData.price !== '')
        .map(([itemId, priceData]) => ({
          itemId,
          productId: priceData.productId,
          sellPrice: parseFloat(priceData.price)
        }));

      if (priceUpdates.length === 0) {
        throw new Error('Please set prices for at least one item');
      }

      await api.post(`/prices/batch-create/${selectedInvoice._id}`, {
        priceUpdates
      });

      setSuccess('Prices saved successfully');
      // Refresh the data
      await fetchInvoicesWithoutPrices();
      await fetchUnpricedItems(selectedInvoice._id);
    } catch (err) {
      console.error('Save prices error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save prices');
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Safely filter invoices
  const filteredInvoices = Array.isArray(invoices) 
    ? invoices.filter(invoice => {
        const invoiceNumber = invoice.invoiceNumber?.toString().toLowerCase() || '';
        const supplierName = invoice.supplierName?.toString().toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        
        return invoiceNumber.includes(search) || supplierName.includes(search);
      })
    : [];

  return (
    <div className="dashboard-page">
      <h1 className="page-title">Set Prices for Unpriced Items</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="search-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="price-invoice-selector">
        <h2>Select Invoice with Unpriced Items</h2>
        {isLoading && invoices.length === 0 ? (
          <div className="loading">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="no-results">
            {searchTerm ? 'No matching invoices found' : 'No invoices with unpriced items'}
          </div>
        ) : (
          <div className="price-invoice-grid">
            {filteredInvoices.map(invoice => (
              <div
                key={invoice._id}
                className={`price-invoice-card ${selectedInvoice?._id === invoice._id ? 'selected' : ''}`}
                onClick={() => fetchUnpricedItems(invoice._id)}
              >
                <div className="price-invoice-header">
                  <FaFileInvoice className="invoice-icon" />
                  <h3>Invoice #{invoice.invoiceNumber}</h3>
                </div>
                <div className="price-invoice-details">
                  <p>Supplier: {invoice.supplierName || 'N/A'}</p>
                  <p>Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                  <p>Unpriced Items: {invoice.unpricedItems?.length || 0}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedInvoice && (
        <div className="batch-prices-container">
          <h2>Set Prices for Invoice #{selectedInvoice.invoiceNumber}</h2>
          <div className="batch-prices-header">
            <span>Product</span>
            <span>Batch Number</span>
            <span>Buy Price</span>
            <span>Quantity</span>
            <span>Selling Price</span>
          </div>
          
          {unpricedItems.length === 0 ? (
            <div className="no-items">
              {isLoading ? 'Loading items...' : 'All items already have prices'}
            </div>
          ) : (
            unpricedItems.map(item => (
              <div key={item._id} className="batch-price-row">
                <span>{item.product?.name || 'Unknown Product'}</span>
                <span>{item.batchNumber}</span>
                <span>${item.buyPrice?.toFixed(2) || '0.00'}</span>
                <span>{item.quantityRemaining}/{item.quantityBought}</span>
                <input
                  type="number"
                  value={prices[item._id]?.price || ''}
                  onChange={(e) => handlePriceChange(item._id, e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Set price"
                />
              </div>
            ))
          )}

          {unpricedItems.length > 0 && (
            <button
              className="save-prices-btn"
              onClick={savePrices}
              disabled={isLoading}
            >
              {isLoading ? (
                <><FaSpinner className="spin" /> Saving...</>
              ) : (
                <><FaSave /> Save Prices</>
              )}
            </button>
          )}
        </div>
      )}

      <Link to="/prices/list" className="view-all-prices-btn">
  View All Prices by Batch
</Link>
    </div>
  );
};

export default ProductPrice;