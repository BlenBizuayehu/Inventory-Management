import { useEffect, useState } from 'react';
import { FaExchangeAlt, FaHistory, FaTrash } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../api';
import './TransferToShops.css';

const TransferToShops = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  
  const editData = location.state?.editData;
  const [isEditMode] = useState(!!editData);
  const [transferId] = useState(editData?.id || null);
  
  const [formData, setFormData] = useState({
    fromLocation: editData?.fromLocation || '',
    toLocation: editData?.toLocation || '',
    transferDate: editData?.transferDate ? new Date(editData.transferDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    transferredBy: editData?.transferredBy || currentUser._id || '',
    products: editData?.products || [],
    notes: editData?.notes || ''
  });

  const [currentProduct, setCurrentProduct] = useState({
    product: '',
    packs: '',
    pieces: ''
  });

  const [stores, setStores] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [productsRes, locationsRes] = await Promise.all([
        api.get('/products?select=name sku piecesPerPack'),
        api.get('/transfers/locations'),
        // In your API calls, make sure to populate the locations:
        api.get('/transfers?populate=fromLocation,toLocation,transferredBy,products.product')
      ]);
      
      setProducts(productsRes.data.data);
      setStores(locationsRes.data.data.stores);
      setShops(locationsRes.data.data.shops);
      
      if (isEditMode) {
        // Ensure we have the full transfer data if coming from history
        let fullTransfer = editData;
        if (editData.id && !editData.fromLocation?.name) {
          const res = await api.get(`/transfers/${editData.id}`);
          fullTransfer = res.data.data;
        }

        setFormData(prev => ({
          ...prev,
          fromLocation: fullTransfer.fromLocation?._id || fullTransfer.fromLocation,
          toLocation: fullTransfer.toLocation?._id || fullTransfer.toLocation,
          transferDate: fullTransfer.transferDate ? new Date(fullTransfer.transferDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          transferredBy: fullTransfer.transferredBy?._id || fullTransfer.transferredBy,
          notes: fullTransfer.notes || '',
          products: fullTransfer.products.map(p => ({
            ...p,
            product: p.product?._id || p.product,
            productName: p.productName || productsRes.data.data.find(prod => prod._id === (p.product?._id || p.product))?.name || 'Unknown Product',
            piecesPerPack: p.product?.packSize || p.piecesPerPack || 1
          }))
        }));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, [isEditMode]);

  const handleAddProduct = () => {
    if (!currentProduct.product || (!currentProduct.packs && !currentProduct.pieces)) {
      setError('Please select a product and enter quantity');
      return;
    }

    const selectedProduct = products.find(p => p._id === currentProduct.product);
    const packs = parseInt(currentProduct.packs) || 0;
    const pieces = parseInt(currentProduct.pieces) || 0;
    
    if (packs < 0 || pieces < 0) {
      setError('Quantities cannot be negative');
      return;
    }

    setFormData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          product: currentProduct.product,
          productName: selectedProduct.name,
          packs,
          pieces,
          piecesPerPack: selectedProduct.piecesPerPack
        }
      ]
    }));

    setCurrentProduct({
      product: '',
      packs: '',
      pieces: ''
    });
  };

  const handleRemoveProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateProduct = (index, field, value) => {
    const numValue = parseInt(value) || 0;
    if (numValue < 0) return;

    setFormData(prev => {
      const updatedProducts = [...prev.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        [field]: numValue
      };
      return {
        ...prev,
        products: updatedProducts
      };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const calculateTotalPieces = (product) => {
    const packSize = product.piecesPerPack || 1;
    const packs = product.packs || 0;
    const pieces = product.pieces || 0;
    return (packs * packSize) + pieces;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (formData.products.length === 0) {
    setError('Please add at least one product to transfer');
    return;
  }
  
  if (!formData.fromLocation || !formData.toLocation) {
    setError('Please select both source and destination locations');
    return;
  }

  if (formData.fromLocation === formData.toLocation) {
    setError('Source and destination locations cannot be the same');
    return;
  }

  // Validate products before sending
  const validatedProducts = formData.products.map(product => {
    const packs = Math.max(0, parseInt(product.packs, 10)) || 0;
    const pieces = Math.max(0, parseInt(product.pieces, 10)) || 0;
    const piecesPerPack = product.piecesPerPack || 1;

    if ((packs === 0 && pieces === 0) || isNaN(packs) || isNaN(pieces)) {
      throw new Error(`Invalid quantities for ${product.productName}`);
    }

    if (pieces >= piecesPerPack) {
      throw new Error(`Pieces (${pieces}) cannot be ≥ pack size (${piecesPerPack}) for ${product.productName}`);
    }

    return {
      product: product.product,
      packs,
      pieces
    };
  });

  setIsLoading(true);
  setError(null);
  setSuccess(null);

  try {
    const payload = {
      fromLocation: formData.fromLocation,
      toLocation: formData.toLocation,
      transferDate: formData.transferDate,
      transferredBy: formData.transferredBy,
      products: validatedProducts,
      notes: formData.notes
    };

    let response;
    if (isEditMode && transferId) {
      response = await api.put(`/transfers/${transferId}`, payload);
      setSuccess('Transfer updated successfully!');
    } else {
      response = await api.post('/transfers', payload);
      setSuccess('Transfer created successfully!');
    }
    
    if (!isEditMode) {
      setFormData(prev => ({
        ...prev,
        products: [],
        transferDate: new Date().toISOString().split('T')[0],
        notes: ''
      }));
    }
    
    setTimeout(() => navigate('/owner/dashboard/transfers/records'), 2000);
  } catch (err) {
    // Enhanced error handling to show backend messages properly
    let errorMessage = 'Failed to process transfer. Please try again.';
    
    if (err.response?.data) {
      const errorData = err.response.data;
      
      // Handle different backend response formats
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
      
      // Handle unavailable products with specific messages
      if (errorData.unavailableProducts && Array.isArray(errorData.unavailableProducts)) {
        const unavailableList = errorData.unavailableProducts.map(up => 
          `${up.product}: ${up.reason}`
        ).join(', ');
        errorMessage = `${errorMessage}. ${unavailableList}`;
      }
      
      // Handle warnings (partial success)
      if (errorData.warnings && errorData.warnings.unavailableProducts) {
        const warningList = errorData.warnings.unavailableProducts.map(up => 
          `${up.product}: ${up.reason}`
        ).join(', ');
        errorMessage = `Transfer partially completed. Some products could not be transferred: ${warningList}`;
        setSuccess('Transfer completed with warnings. Check the details below.');
      }
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    setError(errorMessage);
    
    // If it's a validation error, show more details
    if (err.response?.status === 400 || err.response?.status === 422) {
      console.error('Validation error details:', err.response.data);
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="dashboard-page">
      <h1 className="page-title">
        {isEditMode ? 'Edit Transfer' : 'Transfer Inventory'}
      </h1>
      
{error && (
  <div className={`alert ${error.includes('partially completed') ? 'alert-warning' : 'alert-error'}`}>
    {error}
  </div>
)}
{success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit} className="transfer-form">
        <div className="form-row">
          <div className="form-group">
            <label>From Location</label>
            <select
              name="fromLocation"
              value={formData.fromLocation}
              onChange={handleChange}
              required
              disabled={isLoading}
            >
              <option value="">Select Store</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>To Location</label>
            <select
              name="toLocation"
              value={formData.toLocation}
              onChange={handleChange}
              required
              disabled={isLoading}
            >
              <option value="">Select Shop</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Transfer Date</label>
            <input
              type="date"
              name="transferDate"
              value={formData.transferDate}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            disabled={isLoading}
            placeholder="Optional notes about this transfer"
          />
        </div>

        <div className="product-selection">
          <h3>{isEditMode ? 'Edit Products' : 'Add Products'}</h3>
          {!isEditMode && (
            <div className="form-row">
              <div className="form-group">
                <label>Product</label>
                <select
                  name="product"
                  value={currentProduct.product}
                  onChange={(e) => setCurrentProduct({...currentProduct, product: e.target.value})}
                  disabled={isLoading}
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Packs</label>
                <input
                  type="number"
                  name="packs"
                  value={currentProduct.packs}
                  onChange={(e) => setCurrentProduct({...currentProduct, packs: e.target.value})}
                  min="0"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label>Pieces</label>
                <input
                  type="number"
                  name="pieces"
                  value={currentProduct.pieces}
                  onChange={(e) => setCurrentProduct({...currentProduct, pieces: e.target.value})}
                  min="0"
                  disabled={isLoading}
                />
              </div>

              <button 
                type="button" 
                className="add-product-btn"
                onClick={handleAddProduct}
                disabled={isLoading || !currentProduct.product || (!currentProduct.packs && !currentProduct.pieces)}
              >
                Add Product
              </button>
            </div>
          )}
        </div>

        {formData.products.length > 0 && (
          <div className="product-list">
            <h4>Products to Transfer</h4>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Packs</th>
                  <th>Pieces</th>
                  <th>Total Pieces</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.products.map((item, index) => {
                  const totalPieces = calculateTotalPieces(item);
                  return (
                    <tr key={index}>
                      <td>{item.productName}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.packs}
                          onChange={(e) => handleUpdateProduct(index, 'packs', e.target.value)}
                          disabled={isLoading}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.pieces}
                          onChange={(e) => handleUpdateProduct(index, 'pieces', e.target.value)}
                          disabled={isLoading}
                        />
                      </td>
                      <td>{totalPieces}</td>
                      <td>
                        {!isEditMode && (
                          <button 
                            type="button" 
                            className="remove-btn"
                            onClick={() => handleRemoveProduct(index)}
                            disabled={isLoading}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading || formData.products.length === 0}
          >
            {isLoading ? (
              <span>Processing Transfer...</span>
            ) : (
              <>
                <FaExchangeAlt /> {isEditMode ? 'Update Transfer' : 'Process Transfer'}
              </>
            )}
          </button>
        </div>
      </form>

      <div className="transfer-actions">
        <button
          type="button"
          className="view-transfers-btn"
          onClick={() => navigate('/owner/dashboard/transfers/records')}
        >
          <FaHistory /> View Transfer History
        </button>
      </div>
    </div>
  );
};

export default TransferToShops;