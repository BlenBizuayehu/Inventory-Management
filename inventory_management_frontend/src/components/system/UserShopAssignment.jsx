import axios from 'axios';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaEdit, FaPlus, FaStore, FaTrash, FaUser, FaUserShield, FaUserTie } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
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
  const token = localStorage.getItem('token');

  // Watch shop selection to filter assignments
  const selectedShopId = watch("shopId");

  // Fetch initial data with your authentication mechanism
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch current user and all users in parallel
        const [currentUserRes, usersRes, shopsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/users/me', { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get('http://localhost:5000/api/users', { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get('http://localhost:5000/api/shops', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        // Validate responses
        if (!currentUserRes.data?.data || !usersRes.data?.data || !shopsRes.data?.data) {
          throw new Error('Invalid response structure');
        }
        
        setCurrentUser(currentUserRes.data?.data || currentUserRes.data);
        
        // Set users with proper fallback
        setUsers(
          Array.isArray(usersRes.data?.data) ? usersRes.data.data : 
          Array.isArray(usersRes.data) ? usersRes.data : []
        );
        
        // Set shops
        setShops(shopsRes.data?.data || shopsRes.data || []);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load user data');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token, navigate]);

  // Fetch assignments when shop selection changes
  useEffect(() => {
    if (selectedShopId) {
      const fetchAssignments = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/user-shops/shop/${selectedShopId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAssignments(res.data.data);
        } catch (err) {
          setError('Failed to fetch assignments');
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
          }
        }
      };
      fetchAssignments();
    } else {
      setAssignments([]);
    }
  }, [selectedShopId, token, navigate]);

  // Handle form submission
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/user-shops', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Add the new assignment to the list
      const newAssignment = res.data.data;
      setAssignments(prev => [...prev, newAssignment]);
      
      setSuccess('User assigned successfully');
      reset({ shopId: data.shopId }); // Keep shop selected but reset user
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign user');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle assignment removal
  const handleRemove = async (assignmentId) => {
    if (window.confirm('Are you sure you want to remove this assignment?')) {
      try {
        await axios.delete(`/api/user-shops/${assignmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssignments(prev => prev.filter(a => a._id !== assignmentId));
        setSuccess('Assignment removed successfully');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to remove assignment');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    }
  };

  // Get filtered users (users not already assigned to selected shop)
  const getAvailableUsers = () => {
    if (!selectedShopId) return users;
    const assignedUserIds = assignments.map(a => a.user._id);
    return users.filter(user => !assignedUserIds.includes(user._id));
  };

  // Get current shop name
  const currentShop = shops.find(shop => shop._id === selectedShopId);

  return (
    <div className="user-shop-assignment-page">
      <div className="page-header">
        <h2>
          <FaStore /> Shop Staff Management
          {currentUser && (
            <span className="current-user">
              Logged in as: {currentUser.name} ({currentUser.role})
            </span>
          )}
        </h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

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
                <option value="">Select Shop</option>
                {shops.map(shop => (
                  <option key={shop._id} value={shop._id}>
                    {shop.name} ({shop.location})
                  </option>
                ))}
              </select>
              {errors.shopId && <span className="error">{errors.shopId.message}</span>}
            </div>

            <div className="form-group">
              <label>User</label>
              <select
                {...register("userId", { required: "User is required" })}
                disabled={loading || !selectedShopId}
              >
                <option value="">Select User</option>
                {getAvailableUsers().map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {errors.userId && <span className="error">{errors.userId.message}</span>}
              {selectedShopId && getAvailableUsers().length === 0 && (
                <div className="info-message">All available users are already assigned to this shop</div>
              )}
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                {...register("role")}
                disabled={loading || !selectedShopId}
                defaultValue="staff"
              >
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading || !selectedShopId || getAvailableUsers().length === 0}
            >
              <FaPlus /> {loading ? 'Assigning...' : 'Assign User'}
            </button>
          </form>
        </div>

        {/* Assignments List */}
        <div className="assignments-list">
          <h3>
            {currentShop ? `${currentShop.name} Staff` : 'Select a shop to view assignments'}
          </h3>
          
          {loading && !selectedShopId ? (
            <div>Loading...</div>
          ) : !selectedShopId ? (
            <div className="no-shop-selected">
              Please select a shop to view and manage assignments
            </div>
          ) : assignments.length === 0 ? (
            <div className="no-assignments">
              No users currently assigned to this shop
            </div>
          ) : (
            <ul>
              {assignments.map(assignment => (
                <li key={assignment._id} className="assignment-item">
                  <div className="user-info">
                    <div className="user-avatar">
                      {assignment.role === 'manager' && <FaUserTie />}
                      {assignment.role === 'staff' && <FaUser />}
                      {assignment.role === 'cashier' && <FaUserShield />}
                    </div>
                    <div>
                      <h4>{assignment.user.name}</h4>
                      <p>{assignment.user.email}</p>
                    </div>
                  </div>
                  
                  <div className="assignment-details">
                    <span className={`role-badge ${assignment.role}`}>
                      {assignment.role}
                    </span>
                    <div className="assignment-actions">
                      <button className="edit-btn">
                        <FaEdit />
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleRemove(assignment._id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserShopAssignmentPage;