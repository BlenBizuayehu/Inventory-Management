import { useEffect, useState } from 'react';
import { FaHistory, FaSave, FaSearch, FaSpinner } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../../api';
import './ProductPrice.css';

const ProductPrice = () => {
  const [products, setProducts] = useState([]);
  const [currentPrices, setCurrentPrices] = useState({});
  const [productSearch, setProductSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState({
    products: true,
    save: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(productSearch);
    }, 500);
    return () => clearTimeout(handler);
  }, [productSearch]);

  // Fetch products
  useEffect(() => {
    fetchProducts(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch]);

  const fetchProducts = async (page = 1, keyword = '') => {
    setIsLoading(prev => ({ ...prev, products: true }));
    setError(null);
    try {
      const res = await api.get(`/products?page=${page}&limit=20&keyword=${keyword}&select=name,sku,currentSellPrice`);
      setProducts(res.data.data);
      setPagination(res.data.pagination || {});
      
      // Initialize current prices
      const initialPrices = {};
      res.data.data.forEach(product => {
        initialPrices[product._id] = product.currentSellPrice?.toFixed(2) || '';
      });
      setCurrentPrices(initialPrices);
    } catch (err) {
      setError('Failed to fetch products.');
    } finally {
      setIsLoading(prev => ({ ...prev, products: false }));
    }
  };

  const saveCurrentPrices = async () => {
    setIsLoading(prev => ({ ...prev, save: true }));
    setError(null);
    setSuccess(null);
    try {
      // Find changed prices
      const priceUpdates = Object.entries(currentPrices)
        .filter(([productId, newPrice]) => {
          const product = products.find(p => p._id === productId);
          return newPrice && parseFloat(newPrice) > 0 && 
                 parseFloat(newPrice) !== product?.currentSellPrice;
        });

      if (priceUpdates.length === 0) {
        throw new Error('No price changes detected.');
      }

      // Update each changed price
      await Promise.all(
        priceUpdates.map(([productId, newPrice]) =>
          api.put(`/prices/set-current/${productId}`, { newPrice })
        )
      );

      setSuccess(`Updated ${priceUpdates.length} product prices!`);
      fetchProducts(currentPage, debouncedSearch); // Refresh with updated prices
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update prices.');
    } finally {
      setIsLoading(prev => ({ ...prev, save: false }));
    }
  };

  const handleCurrentPriceChange = (productId, value) => {
    setCurrentPrices(prev => ({ ...prev, [productId]: value }));
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= (pagination.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="dashboard-page">
      <h1 className="page-title">Product Pricing</h1>
      
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="current-pricing-container">
        <p className="page-subtitle">
          Update the current selling price for any product. This will create a new price history record.
        </p>
        
        <div className="current-pricing-header">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => {
                setCurrentPage(1);
                setProductSearch(e.target.value);
              }}
            />
          </div>
          
          <button
            className="save-button"
            onClick={saveCurrentPrices}
            disabled={isLoading.save}
          >
            {isLoading.save ? (
              <><FaSpinner className="spin" /> Saving...</>
            ) : (
              <><FaSave /> Save All Changes</>
            )}
          </button>
        </div>
        
        {isLoading.products ? (
          <div className="loading">
            <FaSpinner className="spin" /> Loading products...
          </div>
        ) : (
          <>
            <div className="current-price-table">
              <div className="price-table-header">
                <span>Product</span>
                <span>SKU</span>
                <span>Current Price</span>
                <span>New Price</span>
              </div>
              
              {products.map(product => (
                <div key={product._id} className="price-row">
                  <div className="product-info">
                    <strong>{product.name}</strong>
                  </div>
                  <span className="sku">{product.sku || 'N/A'}</span>
                  <span className="current-price">
                    ${product.currentSellPrice?.toFixed(2) || '0.00'}
                  </span>
                  <div className="price-input">
                    <span className="currency-symbol">$</span>
                    <input
                      type="number"
                      value={currentPrices[product._id] || ''}
                      onChange={(e) => handleCurrentPriceChange(product._id, e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pagination-controls">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {pagination.totalPages || 1}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === (pagination.totalPages || 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <Link to="/owner/dashboard/prices/history" className="view-history-link">
        <FaHistory /> View Price History
      </Link>
    </div>
  );
};

export default ProductPrice;