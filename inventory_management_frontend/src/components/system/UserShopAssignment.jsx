import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaPlus, FaStore, FaTrash, FaUser, FaUserShield, FaUserTie } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api'; // Using your centralized api instance
import './UserShopAssignment.css';

const UserShopAssignmentPage = () => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const selectedShopId = watch("shopId");

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [currentUserRes, usersRes, shopsRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/users'),
          api.get('/shops')
        ]);
        
        // Handle response structure variations
        setCurrentUser(currentUserRes.data?.data || currentUserRes.data);
        setUsers(usersRes.data?.data || usersRes.data || []);
        setShops(shopsRes.data?.data || shopsRes.data || []);

      } catch (err) {
        handleApiError(err, 'Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch assignments when shop selection changes
  useEffect(() => {
    if (!selectedShopId) {
      setAssignments([]);
      return;
    }

    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/user-shops/shop/${selectedShopId}`);
        setAssignments(res.data?.data || res.data || []);
      } catch (err) {
        handleApiError(err, 'Failed to fetch assignments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignments();
  }, [selectedShopId]);

  const handleApiError = (err, defaultMessage) => {
    console.error('API Error:', err);
    const errorMessage = err.response?.data?.error || defaultMessage;
    setError(errorMessage);
    
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.post('/user-shops', data);
      const newAssignment = res.data?.data || res.data;
      
      setAssignments(prev => [...prev, newAssignment]);
      showSuccess('User assigned successfully');
      reset({ shopId: data.shopId, role: 'staff' });
      
    } catch (err) {
      handleApiError(err, 'Failed to assign user');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) return;
    
    try {
      await api.delete(`/user-shops/${assignmentId}`);
      setAssignments(prev => prev.filter(a => a._id !== assignmentId));
      showSuccess('Assignment removed successfully');
    } catch (err) {
      handleApiError(err, 'Failed to remove assignment');
    }
  };

  const getAvailableUsers = () => {
    if (!selectedShopId || !users.length) return [];
    
    const assignedUserIds = assignments.map(a => 
      a.user?._id || a.user // Handle both populated and unpopulated user references
    );
    
    return users.filter(user => 
      !assignedUserIds.includes(user._id) && 
      user.role !== 'owner' // Typically owners shouldn't be assigned to shops
    );
  };

  const currentShop = shops.find(shop => shop._id === selectedShopId);
  const availableUsers = getAvailableUsers();

  const getRoleIcon = (role) => {
    switch (role) {
      case 'manager': return <FaUserTie className="manager-icon" />;
      case 'cashier': return <FaUserShield className="cashier-icon" />;
      default: return <FaUser className="staff-icon" />;
    }
  };

  if (loading && !assignments.length) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="user-shop-assignment-page">
      <div className="page-header">
        <h2>
          <FaStore /> Shop Staff Management
          {currentUser && (
            <span className="current-user">
              Logged in as: {currentUser.username} ({currentUser.role})
            </span>
          )}
        </h2>
      </div>

      {error && (
        <div className="alert alert-error" onClick={() => setError(null)}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="assignment-container">
        {/* Assignment Form */}
        <div className="assignment-form">
          <h3>Assign User to Shop</h3>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label>Shop</label>
              <select
                {...register("shopId", { required: "Shop is required" })}
                disabled={loading}
              >
                <option value="">Select a shop...</option>
                {shops.map(shop => (
                  <option key={shop._id} value={shop._id}>
                    {shop.name} ({shop.location})
                  </option>
                ))}
              </select>
              {errors.shopId && (
                <span className="error">{errors.shopId.message}</span>
              )}
            </div>

            <div className="form-group">
              <label>User</label>
              <select
                {...register("userId", { required: "User is required" })}
                disabled={loading || !selectedShopId || !availableUsers.length}
              >
                <option value="">Select user...</option>
                {availableUsers.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
              {errors.userId && (
                <span className="error">{errors.userId.message}</span>
              )}
              {selectedShopId && !availableUsers.length && (
                <div className="info-message">
                  All available users are assigned to this shop
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                {...register("role")}
                defaultValue="staff"
                disabled={loading || !selectedShopId}
              >
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !selectedShopId || !availableUsers.length}
            >
              <FaPlus /> {loading ? 'Assigning...' : 'Assign User'}
            </button>
          </form>
        </div>

        {/* Assignments List */}
        <div className="assignments-list">
          <h3>
            {currentShop 
              ? `${currentShop.name} Staff (${assignments.length})` 
              : 'Select a shop to view assignments'}
          </h3>
          
          {!selectedShopId ? (
            <div className="empty-state">
              Please select a shop to view and manage assignments
            </div>
          ) : assignments.length === 0 ? (
            <div className="empty-state">
              No users currently assigned to this shop
            </div>
          ) : (
            <ul className="assignments-grid">
              {assignments.map(assignment => {
                const user = assignment.user?._id ? assignment.user : 
                  users.find(u => u._id === assignment.user) || {};
                const role = assignment.role || 'staff';
                
                return (
                  <li key={assignment._id} className="assignment-card">
                    <div className="user-info">
                      <div className={`user-avatar role-${role}`}>
                        {getRoleIcon(role)}
                      </div>
                      <div>
                        <h4>{user.username || 'Unknown User'}</h4>
                        <p>{user.email || 'No email'}</p>
                      </div>
                    </div>
                    
                    <div className="assignment-meta">
                      <span className={`role-badge role-${role}`}>
                        {role}
                      </span>
                      
                      <div className="assignment-actions">
                        
                        <button
                          className="btn-icon delete-btn"
                          title="Remove assignment"
                          onClick={() => handleRemove(assignment._id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserShopAssignmentPage;