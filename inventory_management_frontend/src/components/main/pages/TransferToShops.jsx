import { useEffect, useState } from 'react';
import { FaExchangeAlt, FaHistory, FaStore } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../../api';
import './TransferToShops.css';

const TransferToShops = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  const [transferData, setTransferData] = useState({
    fromLocation: '',
    toLocation: '',
    transferDate: new Date().toISOString().split('T')[0],
    transferredBy: currentUser._id || '',
    products: []
  });

  const [currentProduct, setCurrentProduct] = useState({
    product: '',
    packs: '',
    pieces: '',
    batchNumber: ''
  });

  const [stores, setStores] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const productsRes = await api.get('/products?select=name sku packSize stockPacks stockPieces');
        setProducts(productsRes.data.data);
        
        const locationsRes = await api.get('/transfers/locations');
        setStores(locationsRes.data.data.stores);
        setShops(locationsRes.data.data.shops);
        
        if (location.state?.editData) {
          setIsEditMode(true);
          const { editData } = location.state;
          
          const formattedDate = editData.transferDate.split('T')[0];
          
          setTransferData({
            fromLocation: editData.fromLocation,
            toLocation: editData.toLocation,
            transferDate: formattedDate,
            transferredBy: editData.transferredBy || currentUser._id || '',
            products: editData.products.map(p => {
              const product = productsRes.data.data.find(prod => prod._id === p.product);
              return {
                product: p.product,
                productName: p.productName,
                packs: p.packs || 0,
                pieces: p.pieces || 0,
                batchNumber: p.batchNumber || '',
                packSize: product?.packSize || 1,
                stockPacks: product?.stockPacks || 0,
                stockPieces: product?.stockPieces || 0
              }
            })
          });
        }
      } catch (err) {
        console.error("API Error:", err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [location.state]);

  const fetchBatchesForProduct = async (productId, location) => {
  try {
    const response = await api.get(`/batches?product=${productId}&location=${location}`);
    return response.data.data;
  } catch (err) {
    console.error("Failed to fetch batches:", err);
    return [];
  }
};


// Modify your handleAddProduct function
const handleAddProduct = async () => {
  if (!currentProduct.product || (!currentProduct.packs && !currentProduct.pieces)) {
    setError('Please select a product and enter at least packs or pieces');
    return;
  }

  const selectedProduct = products.find(p => p._id === currentProduct.product);
  const packs = parseInt(currentProduct.packs) || 0;
  const pieces = parseInt(currentProduct.pieces) || 0;
  
  if (packs < 0 || pieces < 0) {
    setError('Quantities cannot be negative');
    return;
  }

  try {
    let availableBatches = [];
    if (transferData.fromLocation) {
      availableBatches = await fetchBatchesForProduct(
        currentProduct.product, 
        transferData.fromLocation
      );
    }

    setTransferData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          product: currentProduct.product,
          productName: selectedProduct.name,
          packs,
          pieces,
          batchNumber: currentProduct.batchNumber || '',
          availableBatches,
          packSize: selectedProduct.packSize,
          stockPacks: selectedProduct.stockPacks,
          stockPieces: selectedProduct.stockPieces
        }
      ]
    }));

    setCurrentProduct({
      product: '',
      packs: '',
      pieces: '',
      batchNumber: ''
    });
  } catch (err) {
    console.error("Error adding product:", err);
    setError('Failed to add product. Please try again.');
  }
};

  const handleRemoveProduct = (index) => {
    setTransferData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateProduct = (index, field, value) => {
    const numValue = parseInt(value) || 0;
    if (numValue < 0) return;

    setTransferData(prev => {
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
    setTransferData(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotalPieces = (product) => {
    return (product.packs * (product.packSize || 1)) + product.pieces;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (transferData.products.length === 0) {
      setError('Please add at least one product to transfer');
      return;
    }
    
    if (!transferData.fromLocation || !transferData.toLocation) {
      setError('Please select both source and destination locations');
      return;
    }

    for (const product of transferData.products) {
      if (product.packs <= 0 && product.pieces <= 0) {
        setError(`Product ${product.productName} must have at least packs or pieces`);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...transferData,
        products: transferData.products.map(p => ({
          product: p.product,
          productName: p.productName,
          packs: p.packs,
          pieces: p.pieces,
          batchNumber: p.batchNumber
        }))
      };

      if (isEditMode) {
        await api.put(`/transfers/${location.state.editData.id}`, {
          ...payload,
          editedBy: currentUser._id
        });
        setSuccess('Transfer updated successfully!');
        navigate('/dashboard/transfers/records');
      } else {
        await api.post('/transfers', payload);
        setSuccess('Transfer created successfully!');
        setTransferData({
          fromLocation: transferData.fromLocation,
          toLocation: transferData.toLocation,
          transferDate: new Date().toISOString().split('T')[0],
          transferredBy: transferData.transferredBy,
          products: []
        });
      }
      
      setCurrentProduct({
        product: '',
        packs: '',
        pieces: '',
        batchNumber: ''
      });
    } catch (err) {
      console.error("Transfer error:", err);
      setError(err.response?.data?.error || 
        (isEditMode ? 'Failed to update transfer' : 'Failed to create transfer'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <h1 className="page-title">
        {isEditMode ? 'Edit Transfer' : 'Transfer Inventory'}
      </h1>
      
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="transfer-form">
        <div className="product-selection-section">
          <h3>Add Products to Transfer</h3>
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
                {products?.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.name} ({product.stockPacks}p + {product.stockPieces}pc)
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

            
            <div className="form-group">

              <button 
                type="button" 
                className="add-product-button"
                onClick={handleAddProduct}
                disabled={isLoading || !currentProduct.product || (!currentProduct.packs && !currentProduct.pieces)}
              >
                Add Product
              </button>
            </div>
          </div>

          {transferData.products.length > 0 && (
            <div className="product-list">
              <h4>Products to Transfer ({transferData.products.length})</h4>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Packs</th>
                    <th>Pieces</th>
                    <th>Total</th>
                    <th>Batch</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transferData.products.map((item, index) => {
                    const packSize = item.packSize || 1;
                    const totalPieces = (item.packs * packSize) + item.pieces;
                    const stockPieces = (item.stockPacks * packSize) + item.stockPieces;
                    
                    return (
                      <tr key={index}>
                        <td>{item.productName}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={item.packs}
                            onChange={(e) => handleUpdateProduct(index, 'packs', e.target.value)}
                            className="quantity-input"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={item.pieces}
                            onChange={(e) => handleUpdateProduct(index, 'pieces', e.target.value)}
                            className="quantity-input"
                          />
                        </td>
                        <td>{totalPieces} pc</td>
                        <td>{item.batchNumber || '-'}</td>
                        <td>{item.stockPacks}p + {item.stockPieces}pc</td>
                        <td>
              {item.availableBatches?.length > 0 ? (
                <select
                  value={item.batchNumber || ''}
                  onChange={(e) => handleUpdateProduct(index, 'batchNumber', e.target.value)}
                  className="batch-select"
                >
                  <option value="">Auto-select</option>
                  {item.availableBatches.map(batch => (
                    <option key={batch._id} value={batch.batchNumber}>
                      {batch.batchNumber} ({batch.availablePacks}p + {batch.availablePieces}pc)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={item.batchNumber || ''}
                  onChange={(e) => handleUpdateProduct(index, 'batchNumber', e.target.value)}
                  placeholder="Enter batch"
                />
              )}
            </td>
                        <td>
                          <button 
                            type="button" 
                            className="remove-button"
                            onClick={() => handleRemoveProduct(index)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>From Location</label>
            <div className="location-select">
              <FaStore className="location-icon" />
              <select
                name="fromLocation"
                value={transferData.fromLocation}
                onChange={handleChange}
                required
                disabled={isLoading}
              >
                <option value="">Select Store</option>
                {stores.map(store => (
                  <option key={store.id} value={store.name}>{store.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>To Location</label>
            <div className="location-select">
              <FaStore className="location-icon" />
              <select
                name="toLocation"
                value={transferData.toLocation}
                onChange={handleChange}
                required
                disabled={isLoading}
              >
                <option value="">Select Shop</option>
                {shops.map(shop => (
                  <option key={shop.id} value={shop.name}>{shop.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Transfer Date</label>
            <input
              type="date"
              name="transferDate"
              value={transferData.transferDate}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <>
                <FaExchangeAlt /> {isEditMode ? 'Update Transfer' : 'Process Transfer'}
              </>
            )}
          </button>

          {isEditMode && (
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/dashboard/transfers/records')}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {!isEditMode && (
        <div className="transfer-actions">
          <Link to="/dashboard/transfers/records" className="view-records-button">
            <FaHistory /> View Transfer Records
          </Link>
        </div>
      )}
    </div>
  );
};

export default TransferToShops;