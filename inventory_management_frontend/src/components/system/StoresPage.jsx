import { useEffect, useState } from 'react';
import api from '../../api';
import './StoresPage.css';

function StoresPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState({
    name: '',
    address: ''
  });

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await api.get('/stores');
        setStores(response.data);
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStoreId && activeTab === 'edit') {
      const fetchStore = async () => {
        try {
          const response = await api.get(`/stores/${selectedStoreId}`);
          setStore(response.data);
        } catch (error) {
          console.error('Error fetching store:', error);
        }
      };
      fetchStore();
    } else if (activeTab === 'add') {
      setStore({ 
        name: '', 
        address: ''
      });
    }
  }, [selectedStoreId, activeTab]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/stores/${id}`);
      setStores(stores.filter(store => store._id !== id));
      if (selectedStoreId === id) {
        setActiveTab('list');
        setSelectedStoreId(null);
      }
    } catch (error) {
      console.error('Error deleting store:', error);
    }
  };

  const handleChange = (e) => {
    setStore({
      ...store,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedStoreId) {
        await api.put(`/stores/${selectedStoreId}`, store);
      } else {
        const response = await api.post('/stores', store);
        setStores([...stores, response.data]);
      }
      setActiveTab('list');
      setSelectedStoreId(null);
    } catch (error) {
      console.error('Error saving store:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="stores-container">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('list');
            setSelectedStoreId(null);
          }}
        >
          Store List
        </button>
        <button
          className={`tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('add');
            setSelectedStoreId(null);
          }}
        >
          Add New Store
        </button>
        {selectedStoreId && (
          <button
            className={`tab ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
            disabled={!selectedStoreId}
          >
            Edit Store
          </button>
        )}
        {selectedStoreId && (
          <button
            className={`tab ${activeTab === 'detail' ? 'active' : ''}`}
            onClick={() => setActiveTab('detail')}
            disabled={!selectedStoreId}
          >
            Store Details
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'list' && (
          <div className="store-list">
            <h2>Stores</h2>
            <div className="store-items">
              {stores.map(storeItem => (
                <div key={storeItem._id} className="store-item">
                  <div 
                    className="store-info"
                    onClick={() => {
                      setSelectedStoreId(storeItem._id);
                      setActiveTab('detail');
                    }}
                  >
                    <h3>{storeItem.name}</h3>
                    <p className="category">{storeItem.category}</p>
                    <p className="address">{storeItem.address}</p>
                    <p className="created-date">
                      Created: {new Date(storeItem.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="store-actions">
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setSelectedStoreId(storeItem._id);
                        setActiveTab('edit');
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(storeItem._id)}
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
          <div className="store-form">
            <h2>Add New Store</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Store Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={store.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={store.address}
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

        {activeTab === 'edit' && selectedStoreId && (
          <div className="store-form">
            <h2>Edit Store</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Store Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={store.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={store.address}
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

        {activeTab === 'detail' && selectedStoreId && (
          <div className="store-detail">
            {stores.find(s => s._id === selectedStoreId) ? (
              <>
                <div className="store-header">
                  <h2>{store.name}</h2>
                  <div className="store-actions">
                    <button
                      className="btn-edit"
                      onClick={() => setActiveTab('edit')}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(selectedStoreId)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="store-content">
                  <p><strong>Category:</strong> {store.category}</p>
                  <p><strong>Address:</strong> {store.address}</p>
                  <p><strong>Contact:</strong> {store.contact}</p>
                  <p className="created-date">
                    <strong>Created:</strong> {new Date(store.createdAt).toLocaleDateString()}
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
              <div className="not-found">Store not found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StoresPage;