import { useEffect, useState } from 'react';
import api from '../../api';
import './ShopsPage.css';

function ShopsPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState({
    name: '',
    location: ''
  });

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await api.get('/shops');
        setShops(response.data);
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  useEffect(() => {
    if (selectedShopId && activeTab === 'edit') {
      const fetchShop = async () => {
        try {
          const response = await api.get(`/shops/${selectedShopId}`);
          setShop(response.data);
        } catch (error) {
          console.error('Error fetching shop:', error);
        }
      };
      fetchShop();
    } else if (activeTab === 'add') {
      setShop({ name: '', location: '' });
    }
  }, [selectedShopId, activeTab]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/shops/${id}`);
      setShops(shops.filter(shop => shop._id !== id));
      if (selectedShopId === id) {
        setActiveTab('list');
        setSelectedShopId(null);
      }
    } catch (error) {
      console.error('Error deleting shop:', error);
    }
  };

  const handleChange = (e) => {
    setShop({
      ...shop,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedShopId) {
        await api.put(`/shops/${selectedShopId}`, shop);
      } else {
        const response = await api.post('/shops', shop);
        setShops([...shops, response.data]);
      }
      setActiveTab('list');
      setSelectedShopId(null);
    } catch (error) {
      console.error('Error saving shop:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="shops-container">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('list');
            setSelectedShopId(null);
          }}
        >
          Shop List
        </button>
        <button
          className={`tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('add');
            setSelectedShopId(null);
          }}
        >
          Add New Shop
        </button>
        {selectedShopId && (
          <button
            className={`tab ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
            disabled={!selectedShopId}
          >
            Edit Shop
          </button>
        )}
        {selectedShopId && (
          <button
            className={`tab ${activeTab === 'detail' ? 'active' : ''}`}
            onClick={() => setActiveTab('detail')}
            disabled={!selectedShopId}
          >
            Shop Details
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'list' && (
          <div className="shop-list">
            <h2>Shops</h2>
            <div className="shop-items">
              {shops.map(shopItem => (
                <div key={shopItem._id} className="shop-item">
                  <div 
                    className="shop-info"
                    onClick={() => {
                      setSelectedShopId(shopItem._id);
                      setActiveTab('detail');
                    }}
                  >
                    <h3>{shopItem.name}</h3>
                    <p className="location">{shopItem.location}</p>
                    <p className="created-date">
                      Created: {new Date(shopItem.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shop-actions">
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setSelectedShopId(shopItem._id);
                        setActiveTab('edit');
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(shopItem._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <div className="shop-form">
            <h2>Add New Shop</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Shop Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={shop.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={shop.location}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save">Save</button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setActiveTab('list')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'edit' && selectedShopId && (
          <div className="shop-form">
            <h2>Edit Shop</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Shop Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={shop.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={shop.location}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save">Save</button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setActiveTab('detail')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'detail' && selectedShopId && (
          <div className="shop-detail">
            {shops.find(s => s._id === selectedShopId) ? (
              <>
                <div className="shop-header">
                  <h2>{shop.name}</h2>
                  <div className="shop-actions">
                    <button
                      className="btn-edit"
                      onClick={() => setActiveTab('edit')}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(selectedShopId)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="shop-content">
                  <p><strong>Location:</strong> {shop.location}</p>
                  <p className="created-date">
                    <strong>Created:</strong> {new Date(shop.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className="btn-back"
                  onClick={() => setActiveTab('list')}
                >
                  Back to List
                </button>
              </>
            ) : (
              <div className="not-found">Shop not found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShopsPage;