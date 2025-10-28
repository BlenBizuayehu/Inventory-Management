import { useEffect, useState } from 'react';
import { FaMinus, FaPlus, FaShoppingCart, FaStore } from 'react-icons/fa';
import api from '../../api';
import './SalesEntry.css';

const SalesEntry = () => {
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, shopsRes] = await Promise.all([
          api.get('/products'),
          api.get('/shops')
        ]);
        setProducts(productsRes.data.data);
        setShops(shopsRes.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product._id === product._id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item =>
        item.product._id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product._id !== productId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShop) {
      setError('Please select a shop');
      return;
    }
    if (cart.length === 0) {
      setError('Please add products to cart');
      return;
    }

    try {
      const saleData = {
        shop: selectedShop,
        items: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.sellingPrice
        })),
        totalAmount: cart.reduce(
          (sum, item) => sum + (item.product.sellingPrice * item.quantity),
          0
        )
      };

      await api.post('/sales', saleData);
      setCart([]);
      setSelectedShop('');
      alert('Sale recorded successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record sale');
    }
  };

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="dashboard-page">
      <h1 className="page-title">
        <FaShoppingCart /> New Sale
      </h1>

      <div className="sales-container">
        <div className="product-selection">
          <h2>Available Products</h2>
          <div className="product-grid">
            {products.map(product => (
              <div key={product._id} className="product-card">
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p>Price: ${product.sellingPrice.toFixed(2)}</p>
                  <p>Stock: {product.stock}</p>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className="add-button"
                  disabled={product.stock <= 0}
                >
                  <FaPlus /> Add
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-section">
          <div className="shop-selection">
            <label>
              <FaStore /> Shop Location:
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                required
              >
                <option value="">Select Shop</option>
                {shops.map(shop => (
                  <option key={shop._id} value={shop._id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <h2>Cart</h2>
          {cart.length === 0 ? (
            <p className="empty-cart">Your cart is empty</p>
          ) : (
            <div className="cart-items">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.product._id}>
                      <td>{item.product.name}</td>
                      <td>${item.product.sellingPrice.toFixed(2)}</td>
                      <td>
                        <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)}>
                          <FaMinus />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product._id, parseInt(e.target.value))}
                          min="1"
                          max={item.product.stock}
                        />
                        <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)}>
                          <FaPlus />
                        </button>
                      </td>
                      <td>${(item.product.sellingPrice * item.quantity).toFixed(2)}</td>
                      <td>
                        <button
                          onClick={() => removeFromCart(item.product._id)}
                          className="remove-button"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="cart-total">
                <h3>Total: $
                  {cart.reduce(
                    (sum, item) => sum + (item.product.sellingPrice * item.quantity),
                    0
                  ).toFixed(2)}
                </h3>
              </div>

              <button
                onClick={handleSubmit}
                className="submit-sale"
                disabled={!selectedShop || cart.length === 0}
              >
                Complete Sale
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesEntry;