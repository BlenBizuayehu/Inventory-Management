import { useEffect, useState } from 'react';
import { FaBoxOpen, FaExchangeAlt, FaHistory, FaUser, FaWarehouse } from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import api from '../../../api';
import './StoreHistory.css';

const StoreHistory = () => {
  const { id: storeId } = useParams();
  const [history, setHistory] = useState([]);
  const [store, setStore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch store details and history in parallel
        const [storeResponse, historyResponse] = await Promise.all([
          api.get(`/stores/${storeId}`),
          api.get(`/inventory/store-history/${storeId}`)
        ]);

        // Set store details
        setStore(storeResponse.data.data || storeResponse.data);

        // Process history data
        const historyData = historyResponse.data.data || historyResponse.data || [];
        
        const processedHistory = await Promise.all(historyData.map(async (activity) => {
          // Calculate total pieces properly
          const packSize = activity.packSize || 1;
          const packs = activity.packs || 0;
          const pieces = activity.pieces || 0;
          const totalPieces = (packs * packSize) + pieces;

          // Format quantity display
          let displayQuantity = '';
          if (packSize > 1) {
            displayQuantity = `${packs} pack${packs !== 1 ? 's' : ''} × ${packSize} + ${pieces} piece${pieces !== 1 ? 's' : ''} = ${totalPieces} pieces`;
          } else {
            displayQuantity = `${totalPieces} piece${totalPieces !== 1 ? 's' : ''}`;
          }

          // Get proper location names - FIXED
          let locationName = 'Unknown Location';
          let locationId = null;

          if (activity.type === 'transfer') {
            // Handle different ways destination might be stored
            if (activity.destination && activity.destination.name) {
              locationName = activity.destination.name;
              locationId = activity.destination._id;
            } else if (activity.toLocation && activity.toLocation.name) {
              locationName = activity.toLocation.name;
              locationId = activity.toLocation._id;
            } else if (activity.destination) {
              // If we only have an ID, try to fetch the shop name
              try {
                const shopResponse = await api.get(`/shops/${activity.destination}`);
                locationName = shopResponse.data.data?.name || shopResponse.data?.name || `Shop ${activity.destination.slice(-6)}`;
                locationId = activity.destination;
              } catch (err) {
                locationName = `Shop ${activity.destination.slice(-6)}`;
                locationId = activity.destination;
              }
            } else if (activity.toLocation) {
              locationName = `Shop ${activity.toLocation.slice(-6)}`;
              locationId = activity.toLocation;
            }
          } else if (activity.type === 'receipt') {
            if (activity.source && activity.source.name) {
              locationName = activity.source.name;
            } else if (activity.source) {
              locationName = `Source ${activity.source.slice(-6)}`;
            }
          }

          return {
            ...activity,
            packs,
            pieces,
            packSize,
            totalPieces,
            displayQuantity,
            locationName,
            locationId,
            product: activity.product || { name: 'Unknown Product', sku: 'N/A' },
            batchNumber: activity.batchNumber || activity.batch || 'N/A',
            user: activity.user || { name: 'System' }
          };
        }));

        setHistory(processedHistory);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load history');
      } finally {
        setIsLoading(false);
      }
    };

    if (storeId) fetchData();
  }, [storeId]);

  const filteredHistory = history.filter(activity => {
    switch (filter) {
      case 'transfers': return activity.type === 'transfer';
      case 'receipts': return activity.type === 'receipt';
      case 'adjustments': return activity.type === 'adjustment';
      default: return true;
    }
  });

  const getActivityTitle = (activity) => {
    switch (activity.type) {
      case 'transfer': return 'Transfer to Shop';
      case 'receipt': return 'Stock Receipt';
      case 'adjustment': return 'Stock Adjustment';
      default: return 'Inventory Activity';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'transfer': return <FaExchangeAlt className="transfer-icon" />;
      case 'receipt': return <FaBoxOpen className="receipt-icon" />;
      default: return <FaHistory className="default-icon" />;
    }
  };

  // Format the location display properly
  const formatLocationDisplay = (activity) => {
    if (activity.type === 'transfer') {
      if (activity.locationName && activity.locationName !== 'Unknown Location') {
        return activity.locationName;
      } else if (activity.locationId) {
        return `Shop ${activity.locationId.slice(-6)}`;
      } else if (activity.destination) {
        return `Shop ${activity.destination.slice(-6)}`;
      } else if (activity.toLocation) {
        return `Shop ${activity.toLocation.slice(-6)}`;
      }
      return 'Unknown Shop';
    } else {
      return activity.locationName || 'Unknown Source';
    }
  };

  if (isLoading) return <div className="loading">Loading history...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="store-history-container">
      <div className="history-header">
        <div className="header-top">
          <Link to="/owner/dashboard/overview" className="back-button">
            ← Back to Inventory
          </Link>
          <h1>
            <FaWarehouse className="header-icon" />
            {store?.name || 'Store'} Inventory History
          </h1>
        </div>
        
        {store && (
          <div className="store-info">
            <span className="store-name">{store.name}</span>
            {store.location && <span className="store-location">{store.location}</span>}
          </div>
        )}
        
        <div className="filter-controls">
          <button className={`filter-button ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All Activities ({history.length})
          </button>
          <button className={`filter-button ${filter === 'transfers' ? 'active' : ''}`} onClick={() => setFilter('transfers')}>
            <FaExchangeAlt /> Transfers ({history.filter(a => a.type === 'transfer').length})
          </button>
          <button className={`filter-button ${filter === 'receipts' ? 'active' : ''}`} onClick={() => setFilter('receipts')}>
            <FaBoxOpen /> Receipts ({history.filter(a => a.type === 'receipt').length})
          </button>
        </div>
      </div>

      <div className="activity-list">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((activity) => (
            <div key={activity._id} className={`activity-item ${activity.type}`}>
              <div className="activity-icon">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="activity-content">
                <div className="activity-header">
                  <div className="activity-title">
                    <h3>{getActivityTitle(activity)}</h3>
                    {activity.batchNumber !== 'N/A' && (
                      <span className="batch-tag">Batch: {activity.batchNumber}</span>
                    )}
                  </div>
                  <span className="activity-date">
                    {new Date(activity.date || activity.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className="activity-details">
                  <div className="detail-row">
                    <span className="detail-label">Product:</span>
                    <span className="detail-value">
                      <strong>{activity.product.name}</strong>
                      {activity.product.sku && activity.product.sku !== 'N/A' && ` (SKU: ${activity.product.sku})`}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Quantity:</span>
                    <span className="detail-value quantity-value">{activity.displayQuantity}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">
                      {activity.type === 'transfer' ? 'To:' : 'From:'}
                    </span>
                    <span className="detail-value">{formatLocationDisplay(activity)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">User:</span>
                    <span className="detail-value">
                      <FaUser className="user-icon" />
                      {activity.user.name}
                    </span>
                  </div>

                  {activity.description && (
                    <div className="detail-row">
                      <span className="detail-label">Notes:</span>
                      <span className="detail-value notes-text">{activity.description}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <FaHistory className="empty-icon" />
            <h3>No activities found</h3>
            <p>
              {filter === 'all' 
                ? 'This store has no recorded inventory activities yet.'
                : `No ${filter} activities found for this store.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreHistory;