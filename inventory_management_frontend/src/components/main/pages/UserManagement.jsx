import axios from 'axios';
import React, { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp, FaEdit, FaImage, FaTrash, FaUser, FaUserPlus, FaUserShield, FaUserTie } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './UserManagement.css';
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [token] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();

  // Initial states for new user and edit forms
  const initialPermissions = {
    inventoryManagement: { view: false, edit: false, delete: false },
    priceManagement: { view: false, edit: false },
    settings: { view: false, edit: false },
    suppliers: { view: false, add: false, edit: false, delete: false },
    purchases: { view: false, create: false, edit: false, delete: false },
    sales: { view: false, create: false, edit: false, delete: false },
    userManagement: { view: false, editSelf: false, editOthers: false, deleteSelf: false, deleteOthers: false },
    categories: { view: false, add: false, edit: false, delete: false },
    products: { view: false, add: false, edit: false, delete: false },
    shops: { view: false, add: false, edit: false, delete: false },
    transfers: { view: false, create: false, edit: false, delete: false },
    reports: { view: false, generate: false, export: false }
  };

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'staff',
    email: '',
    showInTeam: true,
    permissions: JSON.parse(JSON.stringify(initialPermissions))
  });

  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    role: 'staff',
    showInTeam: true,
    permissions: JSON.parse(JSON.stringify(initialPermissions))
  });

  // Fetch users and current user data
  useEffect(() => {
    const fetchData = async () => {

      try {
        setLoading(true);
        setError('');
        const [currentUserRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users/me', { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get('http://localhost:5000/api/users', { 
          headers: { Authorization: `Bearer ${token}` } 
        })
      ]);
      
      // Validate responses
      if (!currentUserRes.data?.data || !usersRes.data?.data) {
        throw new Error('Invalid response structure');
      }
      
    setCurrentUser(currentUserRes.data?.data || currentUserRes.data);
    setUsers(Array.isArray(usersRes.data?.data) ? usersRes.data.data : 
          Array.isArray(usersRes.data) ? usersRes.data : []);
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

  // Add new user
  const handleAddUser = async () => {
    try {
      setError('');
      
      const formData = new FormData();
      formData.append('username', newUser.username);
      formData.append('password', newUser.password);
      formData.append('role', newUser.role);
      formData.append('email', newUser.email);
      formData.append('showInTeam', newUser.showInTeam.toString());
      formData.append('permissions', JSON.stringify(newUser.permissions));
      
      if (imageFile) {
        formData.append('image', imageFile);
      }
      console.log('Current token:', token);
      console.log('Current user role:', currentUser?.role);
      const res = await axios.post('http://localhost:5000/api/users/register', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUsers([...users, res.data.data]);
      setShowAddModal(false);
      resetNewUser();
    } catch (err) {
      console.error('Full error object:', err);
      setError(err.response?.data?.message || 
              err.response?.data?.details || 
              'Failed to add user. Please check the data and try again.');
    }
  };

  // Reset new user form
  const resetNewUser = () => {
    setNewUser({
      username: '',
      password: '',
      role: 'staff',
      email: '',
      showInTeam: true,
      permissions: JSON.parse(JSON.stringify(initialPermissions))
    });
    setImageFile(null);
  };

  // Delete user
  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter(user => user._id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };

  // Toggle permissions in new user form
  const togglePermission = (category, action) => {
    setNewUser(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [category]: {
          ...prev.permissions[category],
          [action]: !prev.permissions[category][action]
        }
      }
    }));
  };

  // Toggle permissions in edit form
  const handleEditPermissionToggle = (category, action) => {
    setEditFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [category]: {
          ...prev.permissions[category],
          [action]: !prev.permissions[category][action]
        }
      }
    }));
  };

  // Expand/collapse user details
const toggleExpandUser = (userId) => {
  // Only toggle if we're not currently editing
  if (editingUser !== userId) {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  }
};
  // Start editing a user
const handleEditClick = (user, e) => {
  e.stopPropagation(); // This is crucial to prevent row click handler from interfering
  
  console.log('Editing user:', user); // Debug log
  
  setEditingUser(user._id);
  setEditFormData({
    username: user.username,
    email: user.email,
    role: user.role,
    showInTeam: user.showInTeam,
    permissions: user.permissions 
      ? JSON.parse(JSON.stringify(user.permissions))
      : JSON.parse(JSON.stringify(initialPermissions))
  });
};

  // Submit edited user data
const handleEditSubmit = async (userId) => {
  try {
    const updateData = {
      username: editFormData.username,
      email: editFormData.email,
      role: editFormData.role,
      showInTeam: editFormData.showInTeam,
      permissions: editFormData.permissions
    };

    const res = await axios.put(
      `http://localhost:5000/api/users/${userId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Get the updated basic fields from response
    const updatedBasicFields = res.data?.user;
    
    if (!updatedBasicFields) {
      throw new Error('No user data in response');
    }

    // Merge with existing user data to preserve all fields
    setUsers(users.map(user => {
      if (user._id === userId) {
        return {
          ...user, // Keep all existing fields
          ...updatedBasicFields, // Update changed fields
          _id: updatedBasicFields._id || updatedBasicFields.id || user._id,
          permissions: editFormData.permissions // Ensure permissions are updated
        };
      }
      return user;
    }));

    setEditingUser(null);
    setError('User updated successfully!');
    setTimeout(() => setError(null), 3000);
    
  } catch (err) {
    console.error('Update error:', err);
    setError(err.response?.data?.message || 
            'Failed to update user. Please try again.');
  }
};


  // Cancel editing
  const handleCancelEdit = () => {
    setEditingUser(null);
  };

const getRoleIcon = (role) => {
  if (!role || typeof role !== 'string') {
    return <FaUser className="role-icon staff" />; // default icon
  }

  switch (role.toLowerCase()) {
    case 'owner':
      return <FaUserShield className="role-icon owner" />;
    case 'admin':
      return <FaUserTie className="role-icon admin" />;
    default:
      return <FaUser className="role-icon staff" />;
  }
};


  // Check permissions
  const hasPermission = (category, action) => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner') return true;
    return currentUser.permissions?.[category]?.[action] || false;
  };
  
  if (!hasPermission('userManagement', 'view')) {
    return (
      <div className="dashboard-page">
        <div className="alert alert-error">
          You don't have permission to view this page
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        {hasPermission('userManagement', 'create') && (
          <button 
            className="action-button"
            onClick={() => setShowAddModal(true)}
          >
            <FaUserPlus /> Add User
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-spinner">Loading users...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Profile</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Team Visibility</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
               {Array.isArray(users) && users.length > 0 ? (
                users.filter(user => user && user._id).map(user => (
                  
                  <React.Fragment key={user._id}>
                    <tr 
                      onClick={(e) => {
    // Ignore clicks on action buttons or their children
    if (e.target.closest('.actions') || 
        e.target.closest('.edit-btn') || 
        e.target.closest('.delete-btn')) {
      return;
    }
    toggleExpandUser(user._id);
  }}
  className={`clickable-row ${expandedUserId === user._id ? 'expanded' : ''}`}
                    >
                      <td className="expand-icon">
                        {expandedUserId === user._id ? <FaChevronUp /> : <FaChevronDown />}
                      </td>
                      <td>
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt={user.username} 
                            className="profile-image" 
                          />
                        ) : (
                          <FaUser className="default-profile-icon" />
                        )}
                      </td>
                      <td>{user.username}</td>
                      <td>{user.email || '—'}</td>
                      <td>
                        <div className="role-cell">
                          {getRoleIcon(user.role)}
                          <span className="role-text">{user.role}</span>
                        </div>
                      </td>
                      <td>{user.showInTeam ? 'Visible' : 'Hidden'}</td>
                      <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                      <td className="actions">
                        {hasPermission('userManagement', 'editOthers') && (
                          <button 
                            className="edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedUserId(user._id);
                              handleEditClick(user, e);
                            }}
                          >
                            <FaEdit />
                          </button>
                        )}
                        {hasPermission('userManagement', 'deleteOthers') && user.role !== 'owner' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(user._id);
                            }} 
                            className="delete-btn"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </td>
                    </tr>
                    
                    {expandedUserId === user._id && (
                      <tr className="expanded-details">
                        <td colSpan="8">
                          <div className="user-details-container">
                            {editingUser === user._id ? (
                              <div className="edit-user-form">
                                <h3>Edit User</h3>
                                <div className="form-grid">
                                  <div className="form-group">
                                    <label>Username</label>
                                    <input
                                      type="text"
                                      value={editFormData.username}
                                      onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>Email</label>
                                    <input
                                      type="email"
                                      value={editFormData.email}
                                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>Role</label>
                                    <select
                                      value={editFormData.role}
                                      onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                                    >
                                      <option value="staff">Staff</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                  </div>
                                  <div className="form-group checkbox-group">
                                    <label>
                                      <input
                                        type="checkbox"
                                        checked={editFormData.showInTeam}
                                        onChange={(e) => setEditFormData({...editFormData, showInTeam: e.target.checked})}
                                      />
                                      Show in Team Page
                                    </label>
                                  </div>
                                </div>

                                <div className="permissions-section">
                                  <h4>Permissions</h4>
                                  <div className="permissions-grid">
                                    {Object.entries(editFormData.permissions).map(([category, actions]) => (
                                      <div key={category} className="permission-category">
                                        <h5>{category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h5>
                                        <div className="permission-actions">
                                          {Object.entries(actions).map(([action, value]) => (
                                            <label key={action} className="permission-toggle">
                                              <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={() => handleEditPermissionToggle(category, action)}
                                              />
                                              <span>{action}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="form-actions">
                                  <button 
                                    className="cancel-btn"
                                    onClick={handleCancelEdit}
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    className="confirm-btn"
                                    onClick={() => handleEditSubmit(user._id)}
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="user-details">
                                <div className="details-grid">
                                  <div>
                                    <h4>User Details</h4>
                                    <p><strong>Username:</strong> {user.username}</p>
                                    <p><strong>Email:</strong> {user.email || '—'}</p>
                                    <p><strong>Role:</strong> {user.role}</p>
                                    <p><strong>Team Visibility:</strong> {user.showInTeam ? 'Visible' : 'Hidden'}</p>
                                    <p><strong>Account Created:</strong> {new Date(user.createdAt).toLocaleString()}</p>
                                  </div>
                                  <div className="permissions-display">
                                    <h4>Permissions</h4>
                                    <div className="permissions-list">
                                      {Object.entries(user.permissions || {}).map(([category, actions]) => {
                                        const activePermissions = Object.entries(actions || {})
                                          .filter(([_, value]) => value)
                                          .map(([action]) => action);
                                        
                                        if (activePermissions.length === 0) return null;
                                        
                                        return (
                                          <div key={category} className="permission-item">
                                            <strong>{category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong>
                                            <span>{activePermissions.join(', ')}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-users">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="form-section">
              <h2>Add New User</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Profile Image</label>
                  <div className="file-upload">
                    <label className="file-upload-label">
                      <FaImage className="upload-icon" />
                      <span>{imageFile ? imageFile.name : 'Choose image'}</span>
                      <input 
                        type="file" 
                        onChange={(e) => setImageFile(e.target.files[0])}
                        accept="image/*"
                        className="file-input"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="Enter email"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newUser.showInTeam}
                    onChange={(e) => setNewUser({...newUser, showInTeam: e.target.checked})}
                  />
                  Show in Team Page
                </label>
              </div>
            </div>
            
            <div className="permissions-section">
              <h3>Permissions</h3>
              <div className="permissions-grid">
                {Object.entries(newUser.permissions).map(([category, actions]) => (
                  <div key={category} className="permission-category">
                    <h4>{category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                    <div className="permission-actions">
                      {Object.entries(actions).map(([action, value]) => (
                        <label key={action} className="permission-toggle">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() => togglePermission(category, action)}
                          />
                          <span>{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowAddModal(false);
                  resetNewUser();
                }}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn"
                onClick={handleAddUser}
                disabled={!newUser.username || !newUser.password || !newUser.email}
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;