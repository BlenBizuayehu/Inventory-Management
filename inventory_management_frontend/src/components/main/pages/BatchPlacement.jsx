import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api';
import './BatchPlacement.css';

const BatchPlacement = () => {
const { invoiceId } = useParams();
const navigate = useNavigate();

const [stores, setStores] = useState([]);
const [placements, setPlacements] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);
const [success, setSuccess] = useState(null);
const [refreshTrigger, setRefreshTrigger] = useState(0);


const generateBatchNumber = (invoiceId, productId) => {
return `${invoiceId}-${productId || 'item'}-${Date.now().toString(36).slice(-4)}`.toUpperCase();
};

useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all required data in parallel
      const [storesRes, invoiceRes, placementsRes] = await Promise.all([
        api.get('/stores'),
        api.get(`/invoices/${invoiceId}`),
        api.get('/batches/placements', { params: { invoiceId } })
          .catch(() => ({ data: { data: [] } })) // Fallback if endpoint fails
      ]);

      const stores = storesRes.data;
      const invoiceItems = invoiceRes.data.data.items || [];
      const existingPlacements = placementsRes.data.data || [];

       console.log('Existing placements data:', existingPlacements);
      console.log('Stores data:', stores);
      
      // Create store map for quick lookup
      const storeMap = stores.reduce((map, store) => {
        map[store._id] = store.name;
        return map;
      }, {});

      // Initialize placements with calculated quantities
      const updatedPlacements = invoiceItems.map(item => {
        const product = item.product || {};
        const packSize = Math.max(1, 
          Number(item.piecesPerPack) || 
          Math.max(1, Number(product.packSize) || 1)
        );
        const quantityBought = Number(item.quantityBought) || 0;
        const totalPieces = quantityBought * packSize;

        console.log('Placement store IDs:', existingPlacements.map(p => p.store));
console.log('Available store IDs:', stores.map(s => s._id));

        // Filter placements for this specific item
       const itemPlacements = existingPlacements
  .filter(p => p.invoiceItem === item._id)
  .map(p => {
    // Handle both string and object store IDs
    const storeId = p.store?._id || p.store;
    const matchedStore = stores.find(store => store._id === storeId || store._id === storeId?._id);
    
    return {
      storeId: storeId,
      storeName: matchedStore?.name || 'Unknown Store',
      quantity: (p.packs * p.packSize) + p.pieces,
      packs: p.packs,
      pieces: p.pieces,
      batchNumber: p.batchNumber,
      placementDate: p.createdAt || new Date().toISOString()
    };
  });

        const totalPlaced = itemPlacements.reduce((sum, p) => sum + p.quantity, 0);

        return {
          itemId: item._id,
          productId: product._id || 'unknown',
          productName: product.name || 'Unknown Product',
          packSize,
          totalPieces,
          remainingPieces: Math.max(0, totalPieces - totalPlaced),
          storeId: stores.length === 1 ? stores[0]._id : '',
          batchNumber: item.batchNumber || generateBatchNumber(invoiceId, product._id),
          packsToPlace: 0,
          piecesToPlace: 0,
          alreadyPlaced: totalPlaced,
          placementDetails: itemPlacements
        };
      });

      setStores(stores);
      setPlacements(updatedPlacements);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, [invoiceId, success, refreshTrigger]);

const calculateDisplayQuantities = (pieces, packSize) => {
const packs = Math.floor(pieces / packSize);
const remainingPieces = pieces % packSize;
return { packs, pieces: remainingPieces };
};


const handleSubmit = async () => {
  try {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validate all fields
    const validationErrors = [];
    
    placements.forEach((p) => {
      const totalPlaced = (p.packsToPlace * p.packSize) + p.piecesToPlace;
      
      if (totalPlaced <= 0) {
        validationErrors.push(`Please enter quantity for ${p.productName}`);
      }
      if (totalPlaced > p.remainingPieces) {
        validationErrors.push(`Cannot place more than remaining quantity for ${p.productName}`);
      }
      if (!p.storeId) {
        validationErrors.push(`Please select a store for ${p.productName}`);
      }
      if (!p.batchNumber?.trim()) {
        validationErrors.push(`Please enter a batch number for ${p.productName}`);
      }
    });
    
    if (validationErrors.length > 0) {
      throw validationErrors;
    }

    const payload = {
      invoiceId,
      placements: placements.map(p => ({
        invoiceItem: p.itemId,
        product: p.productId,
        store: p.storeId,
        batchNumber: String(p.batchNumber),
        packs: p.packsToPlace,
        pieces: p.piecesToPlace,
        packSize: p.packSize
      }))
    };

    // Submit to backend
    await api.post('/batches/placements', payload);
    
    // Update local state to reflect the changes
    setPlacements(prev => prev.map(p => {
      const totalPlaced = (p.packsToPlace * p.packSize) + p.piecesToPlace;
      return {
        ...p,
        remainingPieces: p.remainingPieces - totalPlaced,
        alreadyPlaced: p.alreadyPlaced + totalPlaced,
        packsToPlace: 0,
        piecesToPlace: 0
      };
    }));
    setRefreshTrigger(prev => prev + 1);
    setSuccess('Placements created successfully!');

    
  } catch (err) {
    console.error('Submission error:', err);
    if (Array.isArray(err)) {
      setError(
        <div className="error-list">
          {err.map((errorMsg, index) => (
            <div key={index} className="error-item">{errorMsg}</div>
          ))}
        </div>
      );
    } else {
      setError(err.response?.data?.message || err.message || 'Submission failed. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};
const PlacementDetails = ({ details }) => {
  if (!details || !details.length) return null;

  return (
    <div className="placement-details">
      <h4>Batch Distribution:</h4>
      <div className="placement-grid">
        {details.map((detail, idx) => (
          <div key={idx} className="placement-card">
            <div className="placement-store">{detail.storeName}</div>
            <div className="placement-batch">Batch: {detail.batchNumber}</div>
            <div className="placement-quantity">
              <span className="label">Quantity:</span>
              <span className="value">
                {detail.packs > 0 ? `${detail.packs} pack${detail.packs !== 1 ? 's' : ''}` : ''}
                {detail.packs > 0 && detail.pieces > 0 ? ' + ' : ''}
                {detail.pieces > 0 ? `${detail.pieces} piece${detail.pieces !== 1 ? 's' : ''}` : ''}
                {detail.packs === 0 && detail.pieces === 0 ? '0 pieces' : ''}
                {` (${detail.quantity} total pieces)`}
              </span>
            </div>
            <div className="placement-date">
                <span className="label">Placed:</span>
                <span className="value">
                    {detail.placementDate ? new Date(detail.placementDate).toLocaleDateString() : 'Unknown date'}
                </span>
                </div>
          </div>
        ))}
      </div>
    </div>
  );
};

if (isLoading) return <div className="loading">Loading batch placement data...</div>;
if (error) return <div className="error-container">{error}</div>;
if (!placements.length) return <div className="empty">No items available for placement</div>;

return (
<div className="batch-placement">
    <h2>Batch Placement for Invoice #{invoiceId}</h2>
    {success && (
    <div className="success">
        {success}
        <button onClick={() => navigate(-1)} className="back-button">
        Back to Invoice
        </button>
    </div>
    )}
    
    <div className="placement-items">
    {placements.map((item, index) => {
        const totalDisplay = calculateDisplayQuantities(item.totalPieces, item.packSize);
        const remainingDisplay = calculateDisplayQuantities(item.remainingPieces, item.packSize);
        const canPlaceMore = item.remainingPieces > 0;
        
        return (
        <div key={index} className={`placement-item ${!canPlaceMore ? 'completed' : ''}`}>
            <div className="product-header">
            <h3>{item.productName}</h3>
            <div className="quantity-info">
                <span>
                Total: {totalDisplay.packs > 0 ? `${totalDisplay.packs} pack${totalDisplay.packs !== 1 ? 's' : ''}` : ''}
                {totalDisplay.packs > 0 && totalDisplay.pieces > 0 ? ' + ' : ''}
                {totalDisplay.pieces > 0 ? `${totalDisplay.pieces} piece${totalDisplay.pieces !== 1 ? 's' : ''}` : ''}
                {totalDisplay.packs === 0 && totalDisplay.pieces === 0 ? '0 pieces' : ''}
                {` (${item.totalPieces} pieces)`}
                </span>
                {item.alreadyPlaced > 0 && (
                <span className="already-placed">
                    Already Placed: {calculateDisplayQuantities(item.alreadyPlaced, item.packSize).packs > 0 ? 
                    `${calculateDisplayQuantities(item.alreadyPlaced, item.packSize).packs} pack${calculateDisplayQuantities(item.alreadyPlaced, item.packSize).packs !== 1 ? 's' : ''}` : ''}
                    {calculateDisplayQuantities(item.alreadyPlaced, item.packSize).packs > 0 && calculateDisplayQuantities(item.alreadyPlaced, item.packSize).pieces > 0 ? ' + ' : ''}
                    {calculateDisplayQuantities(item.alreadyPlaced, item.packSize).pieces > 0 ? 
                    `${calculateDisplayQuantities(item.alreadyPlaced, item.packSize).pieces} piece${calculateDisplayQuantities(item.alreadyPlaced, item.packSize).pieces !== 1 ? 's' : ''}` : ''}
                    {calculateDisplayQuantities(item.alreadyPlaced, item.packSize).packs === 0 && calculateDisplayQuantities(item.alreadyPlaced, item.packSize).pieces === 0 ? '0 pieces' : ''}
                    {` (${item.alreadyPlaced} pieces)`}
                </span>
                )}
                <span className={!canPlaceMore ? 'completed' : ''}>
                Remaining: {remainingDisplay.packs > 0 ? `${remainingDisplay.packs} pack${remainingDisplay.packs !== 1 ? 's' : ''}` : ''}
                {remainingDisplay.packs > 0 && remainingDisplay.pieces > 0 ? ' + ' : ''}
                {remainingDisplay.pieces > 0 ? `${remainingDisplay.pieces} piece${remainingDisplay.pieces !== 1 ? 's' : ''}` : ''}
                {remainingDisplay.packs === 0 && remainingDisplay.pieces === 0 ? '0 pieces' : ''}
                {` (${item.remainingPieces} pieces)`}
                </span>
            </div>
            </div>
            
            <div className="placement-controls">
            <select
                value={item.storeId}
                onChange={(e) => {
                const newPlacements = [...placements];
                newPlacements[index].storeId = e.target.value;
                setPlacements(newPlacements);
                }}
                disabled={!canPlaceMore}
                className={!item.storeId ? 'required-field' : ''}
            >
                <option value="">Select Store</option>
                {stores.map(store => (
                <option key={store._id} value={store._id}>
                    {store.name}
                </option>
                ))}
                </select>
                
                <input
                type="text"
                value={item.batchNumber}
                onChange={(e) => {
                const newPlacements = [...placements];
                newPlacements[index].batchNumber = e.target.value;
                setPlacements(newPlacements);
                }}
                placeholder="Batch Number"
                disabled={!canPlaceMore}
                className={!item.batchNumber?.trim() ? 'required-field' : ''}
            />
            
            <div className="quantity-controls">
                <div className="pack-control">
                <label>Packs</label>
                <input
                    type="number"
                    min="0"
                    max={Math.floor(item.remainingPieces / item.packSize)}
                    value={item.packsToPlace || ''}
                    onChange={(e) => {
                    const packs = Math.max(0, parseInt(e.target.value) || 0);
                    const newPlacements = [...placements];
                    newPlacements[index].packsToPlace = Math.min(
                        packs, 
                        Math.floor(item.remainingPieces / item.packSize)
                    );
                    setPlacements(newPlacements);
                    }}
                    disabled={!canPlaceMore}
                />
                <span>Max: {Math.floor(item.remainingPieces / item.packSize)}</span>
                </div>
                
                {item.packSize > 1 && (
                <div className="pieces-control">
                    <label>Pieces</label>
                    <input
                    type="number"
                    min="0"
                    max={Math.min(
                        item.packSize - 1,
                        item.remainingPieces - (item.packsToPlace * item.packSize)
                    )}
                    value={item.piecesToPlace || ''}
                    onChange={(e) => {
                        const pieces = Math.max(0, parseInt(e.target.value) || 0);
                        const newPlacements = [...placements];
                        newPlacements[index].piecesToPlace = Math.min(
                        pieces, 
                        item.packSize - 1,
                        item.remainingPieces - (item.packsToPlace * item.packSize)
                        );
                        setPlacements(newPlacements);
                    }}
                    disabled={!canPlaceMore || item.packSize <= 1}
                    />
                    <span>
                    Max: {Math.min(
                        item.packSize - 1,
                        item.remainingPieces - (item.packsToPlace * item.packSize)
                    )}
                    </span>
                </div>
                )}
            </div>
            </div>
            {item.placementDetails?.length > 0 && (
    <PlacementDetails details={item.placementDetails} />
  )}
        </div>
        );
    })}
    </div>
    
    <div className="placement-actions">
    <button className='confirm-placements-button'
        onClick={handleSubmit}
        disabled={isLoading || placements.every(p => 
        (p.packsToPlace === 0 && p.piecesToPlace === 0) || p.remainingPieces <= 0
        )}
    >
        {isLoading ? 'Processing...' : 'Confirm Placements'}
    </button>
    
    </div>

    
</div>
);
};

export default BatchPlacement;