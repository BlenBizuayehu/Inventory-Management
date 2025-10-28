import { useEffect, useState } from 'react';
import { FaBarcode, FaHistory, FaInfoCircle, FaSave, FaSearch, FaShoppingCart, FaSpinner, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../../../api';
import './SalesRegister.css';

const SalesRegister = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [packs, setPacks] = useState(0);
  const [pieces, setPieces] = useState(1);
  const [saleItems, setSaleItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState(''); // New state for customer contact
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Default to 'Cash'
  const [paymentDetails, setPaymentDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchTracking, setBatchTracking] = useState(false);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [packSize, setPackSize] = useState(1);
  const [todaysSales, setTodaysSales] = useState([]);
  const [dailyTotals, setDailyTotals] = useState({ subtotal: 0, tax: 0, total: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [shopId, setShopId] = useState(null);
  const [shops, setShops] = useState([]);
  const [systemSettings, setSystemSettings] = useState({ vatRate: 0, currency: '' });

  // --- USE EFFECT HOOKS (No changes needed here) ---
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await api.get('/shops');
        setShops(res.data);
        if (res.data.length === 1) {
          setShopId(res.data[0]._id);
        }
      } catch (err) {
        setError('Failed to fetch shops');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchShops();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get(`/products?keyword=${searchTerm}&limit=10`);
        setProducts(res.data.data);
      } catch (err) {
        setError('Failed to fetch products');
      }
    };
    if (searchTerm.length > 2) fetchProducts();
    else setProducts([]);
  }, [searchTerm]);

  useEffect(() => {
    const fetchTodaysSales = async () => {
      if (!shopId) return;
      try {
        setInitialLoading(true);
        const res = await api.get('/sales/today', { params: { shop: shopId } });
        const responseData = res.data?.data || {};
        setTodaysSales(responseData.sales || []);
        setDailyTotals(responseData.dailyTotals || { subtotal: 0, tax: 0, total: 0 });
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load today\'s sales.');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchTodaysSales();
  }, [shopId, success]);

   useEffect(() => {
    const fetchSettingsData = async () => {
      try {
        const [ settingsRes] = await Promise.all([
          api.get('/settings')
        ]);

        // Set settings
        if(settingsRes.data?.success) {
            setSystemSettings(settingsRes.data.data);
        }

      } catch (err) {
        setError('Failed to fetch initial page data. Please check your connection and refresh.');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchSettingsData();
  }, []);


  useEffect(() => {
    if (selectedProduct) {
      setPackSize(selectedProduct.piecesPerPack || 1);
      if (batchTracking && shopId) {
        const fetchBatches = async () => {
          try {
            const res = await api.get(`/sales/batches/${selectedProduct._id}?shop=${shopId}`);
            setAvailableBatches(res.data.data);
          } catch (err) {
            setError('Failed to fetch batches');
          }
        };
        fetchBatches();
      }
    }
  }, [selectedProduct, batchTracking, shopId]);


  // --- CORE FUNCTIONS ---

  const addItemToSale = () => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }
    const numPacks = Number(packs) || 0;
    const numPieces = Number(pieces) || 0;
    const totalPieces = (numPacks * packSize) + numPieces;
    if (totalPieces <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    // This is now the price BEFORE VAT.
    const unitPriceBeforeVAT = batchTracking ? selectedBatch.currentPrice : selectedProduct.currentSellPrice;
    
    const newItem = {
      product: selectedProduct._id,
      productName: selectedProduct.name,
      productSku: selectedProduct.sku,
      packs: numPacks,
      pieces: numPieces,
      packSize,
      unitPrice: unitPriceBeforeVAT, // Storing the pre-VAT price
      // Frontend calculation for display purposes only
      totalPrice: unitPriceBeforeVAT  * totalPieces,
      batchNumber: batchTracking ? selectedBatch.batchNumber : null,
      batchId: batchTracking ? selectedBatch.batchId : null
    };

    setSaleItems([...saleItems, newItem]);
    // Reset inputs
    setSelectedProduct(null);
    setSearchTerm('');
    setPacks(0);
    setPieces(1);
    setSelectedBatch(null);
    setError(null);
  };

  const removeItem = (index) => {
    const updatedItems = [...saleItems];
    updatedItems.splice(index, 1);
    setSaleItems(updatedItems);
  };

   const calculateTotals = () => {
    const vatRate = systemSettings.vatRate || 0; // Use fetched rate, default to 0

    const subtotal = saleItems.reduce((sum, item) => {
      const totalPieces = (item.packs * item.packSize) + item.pieces;
      return sum + (item.unitPrice * totalPieces);
    }, 0);

    const totalVAT = subtotal * vatRate;
    const total = subtotal + totalVAT - discount;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(totalVAT.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (saleItems.length === 0) {
      setError('Please add at least one item to the sale');
      setIsLoading(false);
      return;
    }

    if (paymentMethod === 'Credit' && !customerName.trim()) {
        setError('Customer name is required for credit sales.');
        setIsLoading(false);
        return;
    }

    try {
      // The payload sent to the backend. It does NOT include calculated totals.
      const saleData = {
        shop: shopId,
        paymentMethod,
        discount: Number(discount) || 0,
        notes: notes.trim(),
        paymentDetails: paymentDetails.trim(),
        batchTrackingEnabled: batchTracking,
        // Customer info, crucial for credit sales
        customerName: customerName.trim(),
        customerContact: customerContact.trim(),
        // Map items to the structure the backend expects
        items: saleItems.map(item => ({
          product: item.product,
          packs: item.packs,
          pieces: item.pieces,
          unitPrice: item.unitPrice, // The pre-VAT price
          ...(batchTracking && {
            batchId: item.batchId,
            batchNumber: item.batchNumber
          })
        })),
      };

      await api.post('/sales', saleData);
      setSuccess('Sale registered successfully!');
      
      // Reset form fully
      setSaleItems([]);
      setCustomerName('');
      setCustomerContact('');
      setDiscount(0);
      setPaymentDetails('');
      setNotes('');
      setPaymentMethod('Cash');

    } catch (err) {
      console.error('Sale creation error:', err);
      setError(err.response?.data?.error || 'Failed to register sale. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const { subtotal, tax, total } = calculateTotals();

  if (initialLoading) {
    return <div className="loading">Loading shop data...</div>;
  }

  if (shops.length === 0) {
    return <div className="alert alert-error">No shops available. Please create a shop first.</div>;
  }

  if (!shopId && shops.length > 1) {

    return (
      <div className="shop-selection">
        <h2>Select Shop</h2>
        <select
          value={shopId || ''}
          onChange={(e) => setShopId(e.target.value)}
          className="shop-select"
        >
          <option value="">Select a shop</option>
          {shops.map(shop => (
            <option key={shop._id} value={shop._id}>
              {shop.name} ({shop.location})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="sales-register-container">
      <h2 className="sales-register-title">
        <FaShoppingCart /> Register Sale
      </h2>

      <Link to="/owner/dashboard/sales/all" className="view-all-sales-btn">
                View All Sales
            </Link>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="batch-tracking-toggle">
        <label>
          <input
            type="checkbox"
            checked={batchTracking}
            onChange={() => setBatchTracking(!batchTracking)}
          />
          Enable Batch Tracking
        </label>
        {batchTracking && (
          <span className="batch-tracking-info">
            <FaInfoCircle /> When enabled, you must specify batch numbers for each item
          </span>
        )}
      </div>

      <div className="sales-register-form">
        <div className="product-selection">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {searchTerm && products.length > 0 && (
            <div className="product-search-results">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="product-result-item"
                  onClick={() => {
                    setSelectedProduct(product);
                    setSearchTerm(product.name);
                  }}
                >
                  <div className="product-name">{product.name}</div>
                  <div className="product-sku">{product.sku}</div>
                  <div className="product-price">
                    {systemSettings.currency} {product.currentSellPrice?.toFixed(2) || '0.00'}
                  </div>
                  {product.piecesPerPack > 1 && (
                    <div className="product-pack-size">
                      {product.piecesPerPack} pieces per pack
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedProduct && batchTracking && (
            <div className="batch-selection">
              <h4>Select Batch:</h4>
              {availableBatches.length > 0 ? (
                <select
                  value={selectedBatch?.batchId || ''}
                  onChange={(e) => {
                    const batch = availableBatches.find(b => b.batchId === e.target.value);
                    setSelectedBatch(batch);
                  }}
                >
                  <option value="">Select a batch</option>
                  {availableBatches.map((batch) => (
                    <option key={batch.batchId} value={batch.batchId}>
                      {batch.batchNumber} (Available: {batch.availableQuantity}) - $
                      {batch.currentPrice.toFixed(2)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="no-batches">No available batches for this product</div>
              )}
            </div>
          )}

          <div className="quantity-inputs">
            {packSize > 1 && (
              <div className="quantity-input">
                <label>Packs:</label>
                <input
                  type="number"
                  min="0"
                  value={packs}
                  onChange={(e) => setPacks(Number(e.target.value) || 0)}
                />
              </div>
            )}
            <div className="quantity-input">
              <label>{packSize > 1 ? 'Pieces:' : 'Quantity:'}</label>
              <input
                type="number"
                min={packSize > 1 ? '1' : '0'}
                value={pieces}
                onChange={(e) => setPieces(Number(e.target.value) || 0)}
              />
            </div>
            <div className="quantity-summary">
              Total: {(packs * packSize) + pieces} pieces
            </div>
          </div>

          <button
            className="add-item-btn"
            onClick={addItemToSale}
            disabled={!selectedProduct || (batchTracking && !selectedBatch)}
          >
            <FaShoppingCart /> Add Item
          </button>
        </div>

        <div className="sale-items-list">
          <h3>Current Sale Items</h3>
          {saleItems.length === 0 ? (
            <div className="no-items">No items added yet</div>
          ) : (
            <table className="sale-items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  {batchTracking && <th>Batch</th>}
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {saleItems.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div className="product-name">{item.productName}</div>
                      <div className="product-sku">{item.productSku}</div>
                    </td>
                    {batchTracking && (
                      <td className="batch-number">
                        <FaBarcode /> {item.batchNumber}
                      </td>
                    )}
                    <td>
                      {item.packSize > 1 && item.packs > 0 && (
                        <>{item.packs} pack{item.packs !== 1 ? 's' : ''}{item.pieces > 0 && ' + '}</>
                      )}
                      {item.pieces > 0 && (
                        <>{item.pieces} piece{item.pieces !== 1 ? 's' : ''}</>
                      )}
                    </td>
                    <td>{systemSettings.currency} {item.unitPrice.toFixed(2)}</td>
                    <td>{systemSettings.currency} {item.totalPrice.toFixed(2)}</td>
                    <td>
                      <button
                        className="remove-item-btn"
                        onClick={() => removeItem(index)}
                      >
                        <FaTimes />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="sale-totals">
            <div className="total-row">
              <span>Subtotal (before VAT):</span>
              <span>{systemSettings.currency} {subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>VAT ({(systemSettings.vatRate * 100).toFixed(0)}%):</span>
              <span>{systemSettings.currency} {tax.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <label>Discount:</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="discount-input"
              />
            </div>
            <div className="total-row grand-total">
              <span>Total:</span>
              <span>{systemSettings.currency} {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="sale-details">
          {/* --- MODIFIED PAYMENT SECTION --- */}
          <div className="form-group">
            <label>Payment Method:</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Check">Check</option>
              <option value="Credit">Credit</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Conditional rendering for credit sales */}
          {paymentMethod === 'Credit' && (
            <>
              <div className="form-group">
                <label>Customer Name*:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Required for credit"
                  required
                />
              </div>
              <div className="form-group">
                <label>Customer Contact:</label>
                <input
                  type="text"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="Phone or Email"
                />
              </div>
            </>
          )}

          {/* Conditional rendering for other payment details */}
          {['Bank Transfer', 'Check', 'Other'].includes(paymentMethod) && (
             <div className="form-group">
                <label>Payment Details:</label>
                <input
                  type="text"
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder="Transaction ID, Check #, etc."
                />
            </div>
          )}
          
          <div className="form-group">
            <label>Notes:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>

          <button
            className="submit-sale-btn"
            onClick={handleSubmit}
            disabled={saleItems.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="spin" /> Processing...
              </>
            ) : (
              <>
                <FaSave /> Complete Sale
              </>
            )}
          </button>
        </div>
      </div>

      {/* Today's Sales Summary Section */}
      <div className="todays-sales-summary">
            <h3><FaHistory /> Today's Sales</h3>
            {todaysSales.length === 0 ? (
                <div className="no-sales">No sales recorded today yet</div>
            ) : (
                <div className="sales-list">
                  {todaysSales.map((sale, index) => (
                    <div key={sale._id} className="sale-card">
                      <div className="sale-header">
                        <span className="sale-number">Sale #{sale.saleNumber}</span> {/* Use actual saleNumber */}
                        <span className="sale-time">{new Date(sale.createdAt).toLocaleTimeString()}</span>
                        <span className="sale-total">{sale.currency || systemSettings.currency} {sale.total.toFixed(2)}</span>
                      </div>
                      <div className="sale-items">
                        {sale.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="sale-item">
                            <span className="item-name">{item.product?.name || item.productName || 'Unknown'}</span>
                            {/* --- NEW: Display for Packs and Pieces --- */}
                            <span className="item-quantity">
                              {item.packSize > 1 && item.packs > 0 && (
                                <>{item.packs} pack{item.packs !== 1 ? 's' : ''}{item.pieces > 0 && ' + '}</>
                              )}
                              {item.pieces > 0 && (
                                <>{item.pieces} piece{item.pieces !== 1 ? 's' : ''}</>
                              )}
                              {/* Fallback for older sales without packs/pieces */}
                              {(!item.packs && !item.pieces) && `${item.quantity} total`}
                            </span>
                            <span className="item-price">{sale.currency || systemSettings.currency} {item.unitPrice.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                // ... daily totals section
            )}
        </div>
    </div>
);
}

export default SalesRegister;