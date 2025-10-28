import { useEffect, useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

const DistributionModal = ({ 
  items, 
  stores, 
  onSave, 
  onClose,
  defaultStore 
}) => {
  const [distributions, setDistributions] = useState({});

  useEffect(() => {
    // Initialize distributions
    const initialDistributions = {};
    items.forEach(item => {
      initialDistributions[item._id] = stores.map(store => ({
        store: store._id,
        quantity: store._id === defaultStore?._id ? item.quantityBought : 0,
        unitMode: item.unitMode
      }));
    });
    setDistributions(initialDistributions);
  }, [items, stores, defaultStore]);

  const handleQuantityChange = (itemId, storeId, value) => {
    setDistributions(prev => ({
      ...prev,
      [itemId]: prev[itemId].map(dist => 
        dist.store === storeId ? { ...dist, quantity: parseInt(value) || 0 } : dist
      )
    }));
  };

  const handleSubmit = () => {
    const formattedDistributions = Object.entries(distributions).map(
      ([itemId, storeDists]) => ({
        itemId,
        storeDistributions: storeDists.filter(d => d.quantity > 0)
      })
    );
    onSave(formattedDistributions);
  };

  return (
    <div className="distribution-modal">
      <div className="modal-content">
        <h3>Distribute Items to Stores</h3>
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="distribution-grid">
          <div className="header-row">
            <div className="header-cell">Product</div>
            {stores.map(store => (
              <div key={store._id} className="header-cell">{store.name}</div>
            ))}
          </div>
          
          {items.map(item => (
            <div key={item._id} className="distribution-row">
              <div className="product-cell">
                {item.product?.name || 'Unknown Product'}
                <small>({item.quantityBought} {item.unitMode})</small>
              </div>
              
              {stores.map(store => (
                <div key={store._id} className="quantity-cell">
                  <input
                    type="number"
                    min="0"
                    max={item.quantityBought}
                    value={distributions[item._id]?.find(d => d.store === store._id)?.quantity || 0}
                    onChange={(e) => handleQuantityChange(item._id, store._id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        
        <button className="save-btn" onClick={handleSubmit}>
          <FaCheck /> Confirm Distribution
        </button>
      </div>
    </div>
  );
};

export default DistributionModal;