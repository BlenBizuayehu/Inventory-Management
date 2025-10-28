// context/shopContext.js - COMPLETELY FIXED VERSION
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const ShopContext = createContext();

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

export const ShopProvider = ({ children }) => {
  const [currentShop, setCurrentShop] = useState(null);
  const [userShops, setUserShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);

  // Debug function to log current state
  const logState = (message) => {
    console.log(`ShopContext - ${message}:`, {
      userRole,
      userShopsCount: userShops.length,
      currentShop,
      hasFullAccess: hasFullAccess(),
      userData: userData ? { role: userData.role, username: userData.username } : null
    });
  };

  // Helper function to check if user has full access
  const hasFullAccess = () => {
    // Check multiple sources to be sure
    const role = userRole || localStorage.getItem('userRole');
    return role === 'owner' || role === 'admin';
  };

  useEffect(() => {
    const initializeShopContext = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('No token found in localStorage');
          setLoading(false);
          return;
        }

        console.log('Token found, initializing shop context...');

        // Get current user info from /auth/me endpoint
        const userRes = await api.get('/users/me');
        const userData = userRes.data.data || userRes.data;
        
        setUserData(userData);
        setUserRole(userData.role);

        // Store role in localStorage for consistency
        localStorage.setItem('userRole', userData.role);

        console.log('User data received:', {
          role: userData.role,
          username: userData.username,
          assignedShops: userData.assignedShops || []
        });

        // CRITICAL FIX: Handle owners/admins differently
        if (hasFullAccess()) {
          console.log('User is owner/admin - granting full access to all shops');
          setUserShops([]); // Empty array indicates full access
          setCurrentShop(null); // No specific shop selected
        } else {
          // For regular users, use their assigned shops
          const assignedShops = userData.assignedShops || [];
          console.log('Regular user with assigned shops:', assignedShops);
          setUserShops(assignedShops);

          // Set current shop for regular users
          const savedShopId = localStorage.getItem('currentShopId');
          if (savedShopId && assignedShops.find(s => s.shopId === savedShopId)) {
            setCurrentShop(assignedShops.find(s => s.shopId === savedShopId));
          } else if (assignedShops.length === 1) {
            setCurrentShop(assignedShops[0]);
            localStorage.setItem('currentShopId', assignedShops[0].shopId);
          } else {
            setCurrentShop(null);
          }
        }

        logState('Initialization complete');

      } catch (error) {
        console.error('Failed to initialize shop context:', error);
        // If there's an auth error, clear the token
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeShopContext();
  }, []);

  const changeShop = (shopId) => {
    if (hasFullAccess()) {
      // For owners, setting a shop is optional (for UI purposes only)
      if (shopId) {
        setCurrentShop({ shopId, shopName: 'All Shops', role: 'owner' });
      } else {
        setCurrentShop(null);
      }
    } else {
      // For regular users, only allow changing to assigned shops
      const shop = userShops.find(s => s.shopId === shopId);
      if (shop) {
        setCurrentShop(shop);
        localStorage.setItem('currentShopId', shopId);
      }
    }
  };

  const value = {
    currentShop,
    userShops,
    userRole,
    userData,
    changeShop,
    loading,
    hasFullAccess: hasFullAccess(),
    
    // Helper methods for components
    canAccessShop: (shopId) => {
      if (hasFullAccess()) {
        console.log('Owner/admin has access to all shops, including:', shopId);
        return true;
      }
      const canAccess = userShops.some(userShop => userShop.shopId === shopId);
      console.log('Regular user access check for shop', shopId, ':', canAccess);
      return canAccess;
    },
    
    getAccessibleShops: (allShops = []) => {
      if (hasFullAccess()) {
        console.log('Owner/admin can access all shops:', allShops.length);
        return allShops;
      }
      const accessible = allShops.filter(shop => 
        userShops.some(userShop => userShop.shopId === shop._id)
      );
      console.log('Regular user accessible shops:', accessible.length);
      return accessible;
    },
    
    // Debug method
    debugInfo: () => ({
      userRole,
      hasFullAccess: hasFullAccess(),
      userShopsCount: userShops.length,
      currentShop,
      localStorageRole: localStorage.getItem('userRole')
    })
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};