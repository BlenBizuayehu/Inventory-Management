// components/ShopSelector.js
import { FaStore } from 'react-icons/fa';
import { useShop } from '../context/ShopContext';

const ShopSelector = () => {
  const { currentShop, userShops, changeShop, loading } = useShop();

  if (loading) return <div className="shop-selector loading">Loading shops...</div>;
  
  // Don't show selector if user has no shop assignments (unless owner/admin)
  if (userShops.length === 0) {
    return (
      <div className="shop-selector">
        <FaStore />
        <span>All Shops</span>
      </div>
    );
  }

  // Don't show selector if user has only one shop
  if (userShops.length === 1) {
    return (
      <div className="shop-selector">
        <FaStore />
        <span>{currentShop?.shopName}</span>
      </div>
    );
  }

  return (
    <div className="shop-selector">
      <FaStore />
      <select 
        value={currentShop?.shopId || ''} 
        onChange={(e) => changeShop(e.target.value)}
      >
        <option value="">Select Shop...</option>
        {userShops.map(shop => (
          <option key={shop.shopId} value={shop.shopId}>
            {shop.shopName} ({shop.role})
          </option>
        ))}
      </select>
    </div>
  );
};

export default ShopSelector;