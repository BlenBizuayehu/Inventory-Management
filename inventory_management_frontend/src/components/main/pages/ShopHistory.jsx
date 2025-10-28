import { useEffect, useState } from 'react';
import { FaBoxOpen, FaHistory, FaShoppingCart, FaStore, FaUser } from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import api from '../../../api';
import './ShopHistory.css';

const ShopHistory = () => {
  const { id: shopId } = useParams();
  const [history, setHistory] = useState([]);
  const [shop, setShop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!shopId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch shop details and history in parallel
        const [shopResponse, historyResponse] = await Promise.all([
          api.get(`/shops/${shopId}`),
          api.get(`/inventory/shop-history/${shopId}`)
        ]);

        // Set shop details
        setShop(shopResponse.data.data || shopResponse.data);

        // Process history data
        const historyData = historyResponse.data.data || historyResponse.data || [];
        
        const processedHistory = historyData.map(activity => {
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

          // Get proper location names
          let locationName = 'Unknown Location';
          if (activity.type === 'receipt' && activity.source) {
            locationName = activity.source.name || `Store ${activity.source._id?.slice(-6)}`;
          } else if (activity.type === 'sale') {
            locationName = 'Customer Sale';
          }

          return {
            ...activity,
            packs,
            pieces,
            packSize,
            totalPieces,
            displayQuantity,
            locationName,
            product: activity.product || { name: 'Unknown Product', sku: 'N/A' },
            batchNumber: activity.batchNumber || activity.batch || 'N/A',
            user: activity.user || { name: 'System' }
          };
        });

        setHistory(processedHistory);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  const filteredHistory = history.filter(activity => {
    switch (filter) {
      case 'receipts': return activity.type === 'receipt';
      case 'sales': return activity.type === 'sale';
      case 'adjustments': return activity.type === 'adjustment';
      default: return true;
    }
  });

  const getActivityTitle = (activity) => {
    switch (activity.type) {
      case 'receipt': return 'Receipt from Store';
      case 'sale': return 'Sale to Customer';
      case 'adjustment': return 'Stock Adjustment';
      default: return 'Inventory Activity';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'receipt': return <FaBoxOpen className="receipt-icon" />;
      case 'sale': return <FaShoppingCart className="sale-icon" />;
      default: return <FaHistory className="default-icon" />;
    }
  };

  if (isLoading) return <div className="loading">Loading history...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="shop-history-container">
      <div className="history-header">
        <div className="header-top">
          <Link to="/owner/dashboard/overview" className="back-button">
            ← Back to Inventory
          </Link>
          <h1>
            <FaStore className="header-icon" />
            {shop?.name || 'Shop'} Inventory History
          </h1>
        </div>
        
        {shop && (
          <div className="shop-info">
            <span className="shop-name">{shop.name}</span>
            {shop.location && <span className="shop-location">{shop.location}</span>}
          </div>
        )}
        
        <div className="filter-controls">
          <button className={`filter-button ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All Activities ({history.length})
          </button>
          <button className={`filter-button ${filter === 'receipts' ? 'active' : ''}`} onClick={() => setFilter('receipts')}>
            <FaBoxOpen /> Receipts ({history.filter(a => a.type === 'receipt').length})
          </button>
          <button className={`filter-button ${filter === 'sales' ? 'active' : ''}`} onClick={() => setFilter('sales')}>
            <FaShoppingCart /> Sales ({history.filter(a => a.type === 'sale').length})
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
                      {activity.type === 'receipt' ? 'From:' : 'To:'}
                    </span>
                    <span className="detail-value">{activity.locationName}</span>
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
                      <span className="detail-value">{activity.description}</span>
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
                ? 'This shop has no recorded inventory activities yet.'
                : `No ${filter} activities found for this shop.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopHistory;