import { useEffect, useState } from 'react';
import {
  FaChartPie,
  FaExchangeAlt,
  FaHistory,
  FaOilCan,
  FaShopify,
  FaShoppingCart,
  FaWarehouse
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../api';
import { useShop } from '../../../context/shopContext';
import './InventoryOverview.css';

const InventoryOverview = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [storeInventory, setStoreInventory] = useState([]);
  const [shopInventory, setShopInventory] = useState([]);
  const [isLoading, setIsLoading] = useState({
    stores: true,
    shops: true,
    inventory: false,
    stats: false
  });
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedShop, setSelectedShop] = useState('');
  const [stores, setStores] = useState([]);
  const [shops, setShops] = useState([]);
  const navigate = useNavigate();
  
  // Use shop context
  const { currentShop, userShops, userRole, loading: shopContextLoading, hasFullAccess, debugInfo } = useShop();
  
  const [inventoryStats, setInventoryStats] = useState([
    { title: "Total Products", value: 0, icon: <FaOilCan />, path: "/owner/dashboard/products", color: "bg-blue-500" },
    { title: "Low Stock Items", value: 0, icon: <FaChartPie />, path: "/owner/dashboard/inventory/low-stock", color: "bg-orange-500" },
    { title: "Warehouses", value: 0, icon: <FaWarehouse />, path: "/owner/dashboard/stores", color: "bg-green-500" },
    { title: "Shops", value: 0, icon: <FaShopify />, path: "/owner/dashboard/shops", color: "bg-purple-500" }
  ]);
  
  const [recentActivities, setRecentActivities] = useState([]);

  // DEBUG: Log context information
  
  // Get accessible shops for current user
  const getAccessibleShops = () => {
    if (hasFullAccess) {
      console.log('Owner/admin: Returning all shops', shops.length);
      return shops; // Owners/admins see all shops
    }
    // Regular users only see their assigned shops
    const accessibleShops = shops.filter(shop =>
      userShops.some(userShop => userShop.shopId === shop._id)
    );
    console.log('Regular user: Returning accessible shops', accessibleShops.length);
    return accessibleShops;
  };

  // Check if user can access a specific shop
  const canAccessShop = (shopId) => {
    if (hasFullAccess) {
      console.log('Owner/admin can access shop:', shopId);
      return true;
    }
    const canAccess = userShops.some(userShop => userShop.shopId === shopId);
    console.log('Regular user can access shop', shopId, ':', canAccess);
    return canAccess;
  };

  // Check if user can view store inventory (OWNER/ADMIN ONLY)
  const canViewStoreInventory = () => {
    // Only owners and admins can view store inventory
    const canView = userRole === 'owner' || userRole === 'admin';
    console.log('Can view store inventory:', canView, 'User role:', userRole);
    return canView;
  };

  // Helper function to generate activity descriptions
  const getActivityDescription = (activity) => {
    if (activity.activityType === 'sale') {
      return `Sale at ${activity.shop?.name || 'Shop'}`;
    } else if (activity.activityType === 'transfer') {
      return `Transfer from ${activity.source?.name || 'Store'} to ${activity.shop?.name || 'Shop'}`;
    } else if (activity.activityType === 'receipt') {
      return `Receipt at ${activity.shop?.name || 'Shop'}`;
    } else {
      return `Inventory activity at ${activity.shop?.name || 'Location'}`;
    }
  };

  const handleStatCardClick = (path) => {
    console.log('Clicked stat card with path:', path);
    navigate(path);
  };

  // Fetch store inventory with access control - OWNER/ADMIN ONLY
  const fetchStoreInventory = async (storeId) => {
    if (!storeId || !canViewStoreInventory()) {
      setStoreInventory([]);
      return;
    }

    setIsLoading(prev => ({ ...prev, inventory: true }));

    try {
      const inventoryRes = await api.get(`/inventory/store/${storeId}`);
      console.log('Store inventory response:', inventoryRes.data);

      const inventoryData = inventoryRes.data.data || inventoryRes.data || [];

      const processedInventory = inventoryData.map(item => {
        const totalPieces = item.batchBreakdown?.reduce((sum, batch) => {
          return sum + ((batch.packs || 0) * (batch.packSize || 1)) + (batch.pieces || 0);
        }, 0) || 0;

        return {
          ...item,
          totalQuantity: totalPieces,
          product: item.product || { name: 'Unknown Product', sku: 'N/A' },
          batchBreakdown: item.batchBreakdown || []
        };
      });

      setStoreInventory(processedInventory);

      // Update low stock count
      const lowStockCount = processedInventory.filter(item => item.totalQuantity < 10).length;
      setInventoryStats(prev => prev.map(stat => 
        stat.title === "Low Stock Items" ? { ...stat, value: lowStockCount } : stat
      ));

    } catch (error) {
      console.error('Error fetching store inventory:', error);
      if (error.response?.status === 403) {
        // User doesn't have access to this store
        setStoreInventory([]);
      } else {
        setStoreInventory([]);
      }
    } finally {
      setIsLoading(prev => ({ ...prev, inventory: false }));
    }
  };

  // Fetch shop inventory with access control
  const fetchShopInventory = async (shopId) => {
    if (!shopId || !canAccessShop(shopId)) {
      setShopInventory([]);
      return;
    }

    setIsLoading(prev => ({ ...prev, inventory: true }));

    try {
      const inventoryRes = await api.get(`/inventory/shop/${shopId}`);
      console.log('Shop inventory response:', inventoryRes.data);

      const inventoryData = inventoryRes.data.data || inventoryRes.data || [];

      const processedInventory = inventoryData.map(item => {
        const totalPieces = item.batchBreakdown?.reduce((sum, batch) => {
          return sum + ((batch.packs || 0) * (batch.packSize || 1)) + (batch.pieces || 0);
        }, 0) || 0;

        return {
          ...item,
          totalQuantity: totalPieces,
          product: item.product || { name: 'Unknown Product', sku: 'N/A' },
          batchBreakdown: item.batchBreakdown || []
        };
      });

      setShopInventory(processedInventory);

    } catch (error) {
      console.error('Error fetching shop inventory:', error);
      if (error.response?.status === 403) {
        // User doesn't have access to this shop
        setShopInventory([]);
      } else {
        setShopInventory([]);
      }
    } finally {
      setIsLoading(prev => ({ ...prev, inventory: false }));
    }
  };

  // Fetch all initial data with shop-based filtering
  useEffect(() => {
    const fetchInitialData = async () => {
      if (shopContextLoading) {
        console.log('Shop context still loading...');
        return;
      }

      console.log('Fetching initial data...');
      console.log('User has full access:', hasFullAccess);
      console.log('User role:', userRole);
      console.log('Can view store inventory:', canViewStoreInventory());

      try {
        // Fetch stores and shops from your actual endpoints
        const [storesResponse, shopsResponse, productsResponse] = await Promise.all([
          api.get('/stores'),
          api.get('/shops'),
          api.get('/products')
        ]);

        const storesData = storesResponse.data.data || storesResponse.data || [];
        const shopsData = shopsResponse.data.data || shopsResponse.data || [];
        const productsData = productsResponse.data.data || productsResponse.data || [];

        setStores(storesData);
        setShops(shopsData);

        // Filter shops based on user access
        const accessibleShops = getAccessibleShops();

        console.log('Accessible shops count:', accessibleShops.length);

        // Update stats with accessible data
        setInventoryStats(prevStats => prevStats.map(stat => {
          if (stat.title === "Total Products") {
            return { ...stat, value: productsData.length };
          } else if (stat.title === "Warehouses") {
            // Only show warehouses count for owners/admins
            return { 
              ...stat, 
              value: canViewStoreInventory() ? storesData.length : 0 
            };
          } else if (stat.title === "Shops") {
            return { ...stat, value: accessibleShops.length };
          }
          return stat;
        }));

        // Set default selections based on access
        if (accessibleShops.length > 0) {
          const defaultShop = currentShop 
            ? accessibleShops.find(shop => shop._id === currentShop.shopId)
            : accessibleShops[0];
          
          if (defaultShop) {
            setSelectedShop(defaultShop._id);
            console.log('Default shop set to:', defaultShop.name);
          }
        }

        // Only set default store for owners/admins
        if (canViewStoreInventory() && storesData.length > 0) {
          setSelectedStore(storesData[0]._id);
        }

        // Fetch recent activities
        try {
          const activitiesResponse = await api.get('/inventory/activities?limit=5');
          const activitiesData = activitiesResponse.data.data || activitiesResponse.data || [];
          
          setRecentActivities(activitiesData.slice(0, 5).map(activity => ({
            type: activity.activityType || 'transfer',
            description: getActivityDescription(activity),
            date: activity.date || activity.createdAt
          })));
        } catch (error) {
          console.log('Could not fetch activities, using empty array');
          setRecentActivities([]);
        }

      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(prev => ({ 
          ...prev, 
          stores: false, 
          shops: false,
          stats: false 
        }));
      }
    };

    fetchInitialData();
  }, [shopContextLoading, currentShop, userShops, hasFullAccess, userRole, shops]);

  useEffect(() => {
    if (activeTab === 'stores' && selectedStore && canViewStoreInventory()) {
      fetchStoreInventory(selectedStore);
    } else if (activeTab === 'shops' && selectedShop && canAccessShop(selectedShop)) {
      fetchShopInventory(selectedShop);
    }
  }, [selectedStore, selectedShop, refreshTrigger, activeTab]);

  const refreshInventory = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleStoreChange = (e) => {
    setSelectedStore(e.target.value);
  };

  const handleShopChange = (e) => {
    setSelectedShop(e.target.value);
  };

  // Display functions
  const formatQuantityDisplay = (item) => {
    if (!item.batchBreakdown || item.batchBreakdown.length === 0) {
      return <span className="quantity-display">0 pieces</span>;
    }

    let totalPacks = 0;
    let totalPieces = 0;
    const packSize = item.batchBreakdown[0].packSize || 1;

    item.batchBreakdown.forEach(batch => {
      totalPacks += batch.packs || 0;
      totalPieces += batch.pieces || 0;
    });

    const additionalPacks = Math.floor(totalPieces / packSize);
    totalPacks += additionalPacks;
    totalPieces = totalPieces % packSize;

    return (
      <div className="quantity-display">
        {totalPacks > 0 && (
          <span className="packs">
            {totalPacks} pack{totalPacks !== 1 ? 's' : ''}
          </span>
        )}
        {totalPacks > 0 && totalPieces > 0 && <span className="separator">+</span>}
        {totalPieces > 0 && (
          <span className="pieces">
            {totalPieces} piece{totalPieces !== 1 ? 's' : ''}
          </span>
        )}
        {totalPacks === 0 && totalPieces === 0 && (
          <span className="zero">0 pieces</span>
        )}
      </div>
    );
  };

  const formatBatchBreakdown = (batchBreakdown) => {
    if (!batchBreakdown || batchBreakdown.length === 0) {
      return <div className="no-batches">No batch information</div>;
    }

    return (
      <div className="batch-breakdown">
        {batchBreakdown.map((batch, index) => (
          <div key={index} className="batch-item">
            <div className="batch-header">
              <span className="batch-number">{batch.batchNumber || `Batch ${index + 1}`}</span>
              <span className="batch-quantity">
                {batch.packs > 0 && `${batch.packs} pack${batch.packs !== 1 ? 's' : ''}`}
                {batch.packs > 0 && batch.pieces > 0 && ' + '}
                {batch.pieces > 0 && `${batch.pieces} piece${batch.pieces !== 1 ? 's' : ''}`}
                {batch.packs === 0 && batch.pieces === 0 && '0 pieces'}
              </span>
            </div>
            {batch.packSize > 1 && (
              <div className="batch-details">
                {batch.packs > 0 && (
                  <span>{batch.packs} × {batch.packSize} = {batch.packs * batch.packSize} pieces</span>
                )}
                {batch.packs > 0 && batch.pieces > 0 && ' + '}
                {batch.pieces > 0 && (
                  <span>{batch.pieces} pieces</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? 'Invalid Date' 
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Show loading while shop context is loading
  if (shopContextLoading || isLoading.stores || isLoading.shops) {
    return <div className="loading">Loading data...</div>;
  }

  const accessibleShops = getAccessibleShops();
  const canViewStores = canViewStoreInventory();

  return (
    <div className="dashboard-page">
      <h1 className="page-title">Inventory Overview</h1>
      
      {/* Display current shop context */}
      {currentShop && (
        <div className="shop-context-banner">
          {userShops.length > 1 && ` (${userShops.length} shops assigned)`}
        </div>
      )}
      
      {!hasFullAccess && accessibleShops.length === 0 && (
        <div className="access-warning">
          <p>You are not assigned to any shops. Please contact an administrator.</p>
        </div>
      )}

      <div className="inventory-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        
        {/* Only show stores tab for OWNERS/ADMINS only (not staff) */}
        {canViewStores && (
          <button 
            className={`tab-button ${activeTab === 'stores' ? 'active' : ''}`}
            onClick={() => setActiveTab('stores')}
          >
            <FaWarehouse /> Store Inventory
          </button>
        )}
        
        {/* Only show shops tab if user has shop access */}
        {accessibleShops.length > 0 && (
          <button 
            className={`tab-button ${activeTab === 'shops' ? 'active' : ''}`}
            onClick={() => setActiveTab('shops')}
          >
            <FaShopify /> Shop Inventory
          </button>
        )}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            {inventoryStats.map((stat, index) => (
              <div 
                key={index} 
                className={`stat-card ${stat.color} ${stat.title === "Warehouses" && !canViewStores ? 'disabled' : ''}`} 
                onClick={() => {
                  if (stat.title === "Warehouses" && !canViewStores) {
                    return; // Don't navigate if staff tries to click warehouses
                  }
                  handleStatCardClick(stat.path);
                }}
              >
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-info">
                  <h3>{stat.title}</h3>
                  <p>{stat.value}</p>
                  {stat.title === "Warehouses" && !canViewStores && (
                    <small className="access-restricted">Owner/Admin only</small>
                  )}
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
                    <span className={`activity-type ${activity.type}`}>
                      {activity.type === 'transfer' ? <FaExchangeAlt /> : <FaShoppingCart />}
                    </span>
                    <div className="activity-details">
                      <span>{activity.description}</span>
                      <small>{formatDate(activity.date)}</small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-activities">No recent activities found</div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'stores' && canViewStores && (
        <div className="inventory-section">
          <div className="location-selector">
            <label htmlFor="store-select">Select Store:</label>
            <select
              id="store-select"
              value={selectedStore}
              onChange={handleStoreChange}
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
            <button onClick={refreshInventory} className="refresh-button">
              Refresh
            </button>
          </div>

          {isLoading.inventory ? (
            <div className="loading">Loading inventory...</div>
          ) : (
            <div className="inventory-table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Total Quantity</th>
                    <th>Batch Breakdown</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {storeInventory.length > 0 ? (
                    storeInventory.map(item => (
                      <tr key={item._id}>
                        <td>
                          <div className="product-info">
                            <strong>{item.product?.name || 'Unknown Product'}</strong>
                            <small>{item.product?.sku || 'N/A'}</small>
                          </div>
                        </td>
                        <td>
                          {formatQuantityDisplay(item)}
                        </td>
                        <td>
                          {formatBatchBreakdown(item.batchBreakdown)}
                        </td>
                        <td>
                          {formatDate(item.lastUpdated)}
                        </td>
                        <td>
                          <Link 
                            to={`/owner/dashboard/inventory/store-history/${selectedStore}`}
                            className="action-link"
                          >
                            <FaHistory /> History
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-data">
                        {selectedStore ? 'No inventory data available for this store' : 'Please select a store'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'shops' && accessibleShops.length > 0 && (
        <div className="inventory-section">
          <div className="location-selector">
            <label htmlFor="shop-select">Select Shop:</label>
            <select
              id="shop-select"
              value={selectedShop}
              onChange={handleShopChange}
              disabled={isLoading.inventory || isLoading.shops}
            >
              {isLoading.shops ? (
                <option value="">Loading shops...</option>
              ) : accessibleShops.length === 0 ? (
                <option value="">No shops available</option>
              ) : (
                <>
                  <option value="">Select a shop</option>
                  {accessibleShops.map(shop => (
                    <option key={shop._id} value={shop._id}>
                      {shop.name} ({shop.location || 'No location'})
                    </option>
                  ))}
                </>
              )}
            </select>
            <button onClick={refreshInventory} className="refresh-button">
              Refresh
            </button>
          </div>

          {isLoading.inventory ? (
            <div className="loading">Loading inventory...</div>
          ) : (
            <div className="inventory-table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Total Quantity</th>
                    <th>Batch Breakdown</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shopInventory.length > 0 ? (
                    shopInventory.map(item => (
                      <tr key={item._id}>
                        <td>
                          <div className="product-info">
                            <strong>{item.product?.name || 'Unknown Product'}</strong>
                            <small>{item.product?.sku || 'N/A'}</small>
                          </div>
                        </td>
                        <td>
                          {formatQuantityDisplay(item)}
                        </td>
                        <td>
                          {formatBatchBreakdown(item.batchBreakdown)}
                        </td>
                        <td>
                          {formatDate(item.lastUpdated)}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Link 
                              to={`/owner/dashboard/inventory/shop-history/${selectedShop}`}
                              className="action-link"
                            >
                              <FaHistory /> History
                            </Link>
                            {canAccessShop(selectedShop) && (
                              <Link 
                                to={`/owner/dashboard/shops/${selectedShop}/record-sale?product=${item.product?._id}`}
                                className="action-link"
                              >
                                <FaShoppingCart /> Sale
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-data">
                        {selectedShop ? 'No inventory data available for this shop' : 'Please select a shop'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryOverview;