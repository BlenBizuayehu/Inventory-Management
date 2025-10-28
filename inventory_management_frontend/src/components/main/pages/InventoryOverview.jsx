import { useEffect, useState } from 'react';
import { FaChartPie, FaOilCan, FaShopify, FaWarehouse } from 'react-icons/fa';
import api from '../../../api';
import './InventoryOverview.css';

const InventoryOverview = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [storeInventory, setStoreInventory] = useState([]);
  const [isLoading, setIsLoading] = useState({
    stores: true,
    inventory: false,
    stats: false
  });
  const [selectedStore, setSelectedStore] = useState('');
  const [stores, setStores] = useState([]);
  const [inventoryStats, setInventoryStats] = useState([
    { title: "Total Products", value: 0, icon: <FaOilCan />, color: "bg-blue-500" },
    { title: "Low Stock Items", value: 0, icon: <FaChartPie />, color: "bg-orange-500" },
    { title: "Warehouses", value: 0, icon: <FaWarehouse />, color: "bg-green-500" }
  ]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Fetch all initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch stores
        const storesResponse = await api.get('/stores');
        setStores(storesResponse.data);
        
        if (storesResponse.data.length > 0) {
          setSelectedStore(storesResponse.data[0]._id);
        }

        // Fetch stats
        const statsResponse = await api.get('/inventory/stats');
        setInventoryStats([
          { ...inventoryStats[0], value: statsResponse.data.totalProducts },
          { ...inventoryStats[1], value: statsResponse.data.lowStockItems },
          { ...inventoryStats[2], value: statsResponse.data.totalStores }
        ]);

        // Fetch recent activities
        const activitiesResponse = await api.get('/inventory/activities');
        setRecentActivities(activitiesResponse.data);

      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(prev => ({ ...prev, stores: false, stats: false }));
      }
    };

    fetchInitialData();
  }, []);

  // Fetch store inventory when selected store changes
  useEffect(() => {
      const fetchInventory = async () => {
  if (!selectedStore) return;
  
  setIsLoading(prev => ({ ...prev, inventory: true }));
  try {
    const response = await api.get(`/inventory/store/${selectedStore}`);
    console.log('Inventory data:', response.data);
    
    // Access the data array from the response
    const inventoryData = response.data.data || [];
    
    // Transform data to match frontend expectations
    const transformedData = inventoryData.map(item => ({
      ...item,
      product: item.product || { name: 'Unknown Product', sku: 'N/A' },
      batchBreakdown: item.batchBreakdown || [],
      totalQuantity: item.totalQuantity || 0,
      lastUpdated: item.lastUpdated || new Date().toISOString()
    }));
    
    setStoreInventory(transformedData);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    setStoreInventory([]);
  } finally {
    setIsLoading(prev => ({ ...prev, inventory: false }));
  }
};

    fetchInventory();
  }, [selectedStore]);

  const handleStoreChange = (e) => {
    setSelectedStore(e.target.value);
  };

  if (isLoading.stores) return <div className="loading">Loading stores...</div>;
  return (
    <div className="dashboard-page">
      <h1 className="page-title">Inventory Overview</h1>
      
      <div className="inventory-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'stores' ? 'active' : ''}`}
          onClick={() => setActiveTab('stores')}
        >
          <FaWarehouse /> Store Inventory
        </button>
        <button 
          className={`tab-button ${activeTab === 'shops' ? 'active' : ''}`}
          onClick={() => setActiveTab('shops')}
        >
          <FaShopify /> Shop Inventory
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            {inventoryStats.map((stat, index) => (
              <div key={index} className={`stat-card ${stat.color}`}>
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-info">
                  <h3>{stat.title}</h3>
                  <p>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="recent-activity">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <span>{activity.description}</span>
                    <small>{new Date(activity.createdAt).toLocaleString()}</small>
                  </div>
                ))
              ) : (
                <div className="no-activities">No recent activities found</div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'stores' && (
        <div className="inventory-section">
          <div className="store-selector">
            <label htmlFor="store-select">Select Store:</label>
            <select
              id="store-select"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              disabled={isLoading.inventory || isLoading.stores}
            >
              {isLoading.stores ? (
                <option value="">Loading stores...</option>
              ) : stores.length === 0 ? (
                <option value="">No stores available</option>
              ) : (
                <>
                  <option value="">Select a store</option>
                  {stores.map(store => (
                    <option key={store._id} value={store._id}>
                      {store.name} ({store.location || 'No location'})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {isLoading.inventory ? (
            <div className="loading">Loading inventory...</div>
          ) : (
            <div className="inventory-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Total Quantity</th>
                    <th>Batch Details</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {storeInventory.length > 0 ? (
                    storeInventory.map(item => (
                      <tr key={item._id}>
                        <td>
                          <strong>{item.product?.name || 'Unknown Product'}</strong>
                          <small>{item.product?.sku || 'N/A'}</small>
                        </td>
                        <td>{item.totalQuantity} units</td>
                        <td>
  {item.batchBreakdown?.length > 0 ? (
    <div className="batch-details">
      {item.batchBreakdown.map((batch, i) => {
        const totalPieces = (batch.packs * batch.packSize) + batch.pieces;
        return (
          <div key={i} className="batch-item">
            <div>Batch: {batch.batch?.batchNumber || 'N/A'}</div>
            <div>
              {batch.packs > 0 && `${batch.packs} pack${batch.packs !== 1 ? 's' : ''} (${batch.packSize} each)`}
              {batch.packs > 0 && batch.pieces > 0 && ' + '}
              {batch.pieces > 0 && `${batch.pieces} piece${batch.pieces !== 1 ? 's' : ''}`}
              {` (${totalPieces} total)`}
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    'No batch details'
  )}
</td>
                        <td>{new Date(item.lastUpdated).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-data">
                        {stores.length === 0 ? 'No stores available' : 'No inventory data available for this store'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'shops' && (
        <div className="inventory-section">
          <div className="coming-soon">
            <FaShopify size={48} />
            <h3>Shop Inventory Management</h3>
            <p>This feature is coming soon. You'll be able to view and manage shop inventory here.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryOverview;