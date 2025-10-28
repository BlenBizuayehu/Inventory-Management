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

  const generateBatchNumber = (invoiceId, productId) => {
    return `${invoiceId}-${productId || 'item'}-${Date.now().toString(36).slice(-4)}`.toUpperCase();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [storesRes, invoiceRes] = await Promise.all([
          api.get('/stores'),
          api.get(`/invoices/${invoiceId}`)
        ]);

        setStores(storesRes.data);
        const invoiceItems = invoiceRes.data.data.items || [];
        
        const initialPlacements = invoiceItems.map(item => {
          const product = item.product || {};
          const packSize = Number(item.piecesPerPack) || Number(product.packSize) || 1;
          const quantityBought = Number(item.quantityBought) || 0;
          const totalPieces = quantityBought * packSize;
          
          return {
            itemId: item._id,
            productId: product._id || 'unknown',
            productName: product.name || 'Unknown Product',
            packSize,
            totalPieces,
            remainingPieces: totalPieces,
            storeId: storesRes.data.length === 1 ? storesRes.data[0]._id : '',
            batchNumber: item.batchNumber || generateBatchNumber(invoiceId, product._id),
            packsToPlace: 0,
            piecesToPlace: 0
          };
        });
        
        setPlacements(initialPlacements);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [invoiceId]);

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

      // Validate
      const errors = [];
      placements.forEach(p => {
        const totalPlaced = (p.packsToPlace * p.packSize) + p.piecesToPlace;
        
        if (totalPlaced <= 0) {
          errors.push(`Please enter quantity for ${p.productName}`);
        }
        if (totalPlaced > p.remainingPieces) {
          errors.push(`Not enough quantity available for ${p.productName}`);
        }
      });
      
      if (errors.length) throw new Error(errors.join('\n'));

      const payload = {
        invoiceId,
        placements: placements.map(p => ({
          invoiceItem: p.itemId,
          store: p.storeId,
          batchNumber: p.batchNumber,
          packs: p.packsToPlace,
          pieces: p.piecesToPlace,
          packSize: p.packSize,
          product: p.productId
        }))
      };

      const response = await api.post('/batches/placements', payload);
      
      // Update UI state
      setPlacements(prev => prev.map(p => {
        const totalPlaced = (p.packsToPlace * p.packSize) + p.piecesToPlace;
        return {
          ...p,
          remainingPieces: p.remainingPieces - totalPlaced,
          packsToPlace: 0,
          piecesToPlace: 0
        };
      }));

      setSuccess('Placements created successfully!');
    } catch (err) {
      console.error('Submission error:', {
        message: err.message,
        response: err.response?.data,
        config: err.config
      });
      setError(err.response?.data?.message || err.message || 'Submission failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="loading">Loading batch placement data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!placements.length) return <div className="empty">No items available for placement</div>;

  return (
    <div className="batch-placement">
      <h2>Batch Placement for Invoice #{invoiceId}</h2>
      {success && <div className="success">{success}</div>}
      
      <div className="placement-items">
        {placements.map((item, index) => {
          const totalDisplay = calculateDisplayQuantities(item.totalPieces, item.packSize);
          const remainingDisplay = calculateDisplayQuantities(item.remainingPieces, item.packSize);
          
          return (
            <div key={index} className="placement-item">
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
                  <span className={item.remainingPieces <= 0 ? 'completed' : ''}>
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
                  disabled={item.remainingPieces <= 0}
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
                  disabled={item.remainingPieces <= 0}
                />
                
                <div className="quantity-controls">
                  <div className="pack-control">
                    <label>Packs</label>
                    <input
                      type="number"
                      min="0"
                      max={Math.floor(item.remainingPieces / item.packSize)}
                      value={item.packsToPlace}
                      onChange={(e) => {
                        const packs = Math.max(0, parseInt(e.target.value) || 0);
                        const newPlacements = [...placements];
                        newPlacements[index].packsToPlace = Math.min(
                          packs, 
                          Math.floor(item.remainingPieces / item.packSize)
                        );
                        setPlacements(newPlacements);
                      }}
                      disabled={item.remainingPieces <= 0}
                    />
                    <span>Max: {Math.floor(item.remainingPieces / item.packSize)}</span>
                  </div>
                  
                  <div className="pieces-control">
                    <label>Pieces</label>
                    <input
                      type="number"
                      min="0"
                      max={item.packSize - 1}
                      value={item.piecesToPlace}
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
                      disabled={item.remainingPieces <= 0 || item.packSize <= 1}
                    />
                    <span>Max: {Math.min(
                      item.packSize - 1,
                      item.remainingPieces - (item.packsToPlace * item.packSize)
                    )}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="placement-actions">
        <button 
          onClick={handleSubmit}
          disabled={isLoading || placements.every(p => 
            p.packsToPlace === 0 && p.piecesToPlace === 0
          )}
        >
          {isLoading ? 'Processing...' : 'Confirm Placements'}
        </button>
      </div>
    </div>
  );
};

export default BatchPlacement;