import React, { useEffect, useState } from 'react';
import { FaChevronDown, FaChevronUp, FaEdit, FaTrash, FaUser, FaUserPlus, FaUserShield, FaUserTie } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../../api'; // Adjust path as needed
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();

  // Define the base structure for permissions
  const initialPermissions = {
    inventoryManagement: { view: false, edit: false, delete: false },
    priceManagement: { view: false, edit: false },
    settings: { view: false, edit: false },
    suppliers: { view: false, add: false, edit: false, delete: false },
    purchases: { view: false, create: false, edit: false, delete: false },
    sales: { view: false, create: false, edit: false, delete: false },
    userManagement: { view: false, create: false, editOthers: false, deleteOthers: false },
    categories: { view: false, add: false, edit: false, delete: false },
    products: { view: false, add: false, edit: false, delete: false },
    shops: { view: false, add: false, edit: false, delete: false },
    transfers: { view: false, create: false, edit: false, delete: false },
    reports: { view: false, generate: false, export: false }
  };

  const [newUser, setNewUser] = useState({
    username: '', password: '', role: 'staff', email: '', showInTeam: true,
    permissions: JSON.parse(JSON.stringify(initialPermissions))
  });

  const [editFormData, setEditFormData] = useState({
    username: '', email: '', role: 'staff', showInTeam: true,
    permissions: JSON.parse(JSON.stringify(initialPermissions))
  });

  // A single, reliable data fetching function
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [currentUserRes, usersRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/users')
      ]);
      setCurrentUser(currentUserRes.data.data);
      setUsers(usersRes.data.data);
    } catch (err) {
      setError('Failed to load user data.');
      // The api.js interceptor will handle the redirect on 401
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Function to display a temporary success message
  const handleSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  // --- API HANDLERS ---
  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.email) {
      setError("Username, password, and email are required.");
      return;
    }
    try {
      setError('');
      // Note: Image upload logic is handled by the backend.
      // We send the data as JSON, not FormData, unless an image is present.
      await api.post('/users/register', newUser);
      handleSuccess('User added successfully!');
      setShowAddModal(false);
      fetchData(); // Refresh the user list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add user.');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      handleSuccess('User deleted successfully!');
      fetchData(); // Refresh the user list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user.');
    }
  };

  const handleEditSubmit = async (userId) => {
    try {
      await api.put(`/users/${userId}`, editFormData);
      handleSuccess('User updated successfully!');
      setEditingUser(null);
      fetchData(); // Refresh the user list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user.');
    }
  };

  // --- UI HANDLERS ---
  const handleEditClick = (user) => {
    setEditingUser(user._id);
    setExpandedUserId(user._id); // Auto-expand when editing starts
    setEditFormData({
        username: user.username,
        email: user.email,
        role: user.role,
        showInTeam: user.showInTeam,
        permissions: JSON.parse(JSON.stringify(user.permissions || initialPermissions))
    });
  };
  
  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const resetNewUser = () => {
    setNewUser({
      username: '', password: '', role: 'staff', email: '', showInTeam: true,
      permissions: JSON.parse(JSON.stringify(initialPermissions))
    });
    setImageFile(null);
  };

  const toggleExpandUser = (userId) => {
    if (editingUser !== userId) {
        setExpandedUserId(prevId => (prevId === userId ? null : userId));
    }
  };

  const togglePermission = (form, setForm, category, action) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [category]: { ...prev.permissions[category], [action]: !prev.permissions[category][action] }
      }
    }));
  };

  // --- RENDER HELPERS ---
  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'owner': return <FaUserShield className="role-icon owner" />;
      case 'admin': return <FaUserTie className="role-icon admin" />;
      default: return <FaUser className="role-icon staff" />;
    }
  };

  const hasPermission = (permissionString) => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner') return true;
    // Safely checks nested permission properties
    return permissionString.split('.').reduce((o, i) => o?.[i], currentUser.permissions) || false;
  };
  
  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (!hasPermission('userManagement.view')) return <div className="alert-error">Access Denied. You do not have permission to view this page.</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        {hasPermission('userManagement.create') && (
          <button className="action-button" onClick={() => setShowAddModal(true)}>
            <FaUserPlus /> Add User
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

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
            {users.map(user => (
              <React.Fragment key={user._id}>
                <tr onClick={() => toggleExpandUser(user._id)} className={`clickable-row ${expandedUserId === user._id ? 'expanded' : ''}`}>
                  <td className="expand-icon">{expandedUserId === user._id ? <FaChevronUp /> : <FaChevronDown />}</td>
                  <td>
                    {user.profileImage ? <img src={user.profileImage} alt={user.username} className="profile-image" /> : <FaUser className="default-profile-icon" />}
                  </td>
                  <td>{user.username}</td>
                  <td>{user.email || '—'}</td>
                  <td>
                    <div className="role-cell">{getRoleIcon(user.role)}<span className="role-text">{user.role}</span></div>
                  </td>
                  <td>{user.showInTeam ? 'Visible' : 'Hidden'}</td>
                  <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                  <td className="actions">
                    {hasPermission('userManagement.editOthers') && (
                      <button className="edit-btn" onClick={(e) => { e.stopPropagation(); handleEditClick(user); }}><FaEdit /></button>
                    )}
                    {hasPermission('userManagement.deleteOthers') && user.role !== 'owner' && (
                      <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(user._id); }}><FaTrash /></button>
                    )}
                  </td>
                </tr>
                {expandedUserId === user._id && (
                  <tr className="expanded-details">
                    <td colSpan="8">
                      <div className="user-details-container">
                        {editingUser === user._id ? (
                          <div className="edit-user-form">
                            <h3>Edit User: {user.username}</h3>
                            <div className="form-grid">
                              {/* Edit form fields */}
                              <div className="form-group"><label>Username</label><input type="text" value={editFormData.username} onChange={(e) => setEditFormData({...editFormData, username: e.target.value})} /></div>
                              <div className="form-group"><label>Email</label><input type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} /></div>
                              <div className="form-group"><label>Role</label>
                                <select value={editFormData.role} onChange={(e) => setEditFormData({...editFormData, role: e.target.value})} disabled={currentUser.role !== 'owner'}>
                                  <option value="staff">Staff</option>
                                  <option value="admin">Admin</option>
                                  {user.role === 'owner' && <option value="owner">Owner</option>}
                                </select>
                              </div>
                              <div className="form-group checkbox-group"><label><input type="checkbox" checked={editFormData.showInTeam} onChange={(e) => setEditFormData({...editFormData, showInTeam: e.target.checked})} /> Show in Team Page</label></div>
                            </div>
                            <div className="permissions-section">
                              <h4>Permissions</h4>
                              <div className="permissions-grid">
                                {Object.entries(editFormData.permissions).map(([category, actions]) => (
                                  <div key={category} className="permission-category">
                                    <h5>{category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h5>
                                    <div className="permission-actions">
                                      {Object.entries(actions).map(([action, value]) => (
                                        <label key={action} className="permission-toggle"><input type="checkbox" checked={value} onChange={() => togglePermission(editFormData, setEditFormData, category, action)} /><span>{action}</span></label>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="form-actions"><button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button><button className="confirm-btn" onClick={() => handleEditSubmit(user._id)}>Save Changes</button></div>
                          </div>
                        ) : (
                          <div className="user-details">
                            {/* Details view */}
                            <h4>Permissions for {user.username}</h4>
                            <div className="permissions-list">
                              {Object.entries(user.permissions || {}).map(([category, actions]) => {
                                const active = Object.entries(actions || {}).filter(([_, v]) => v).map(([k]) => k);
                                if (active.length === 0) return null;
                                return (<div key={category}><strong>{category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {active.join(', ')}</div>);
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="add-user-modal-overlay">
          <div className="add-user-modal">
            <h2>Add New User</h2>
            {/* Form for adding a new user */}
            <div className="form-group"><label>Username *</label><input type="text" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} required/></div>
            <div className="form-group"><label>Password *</label><input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required/></div>
            <div className="form-group"><label>Email *</label><input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required/></div>
            <div className="form-group"><label>Role</label>
                <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div className="form-group checkbox-group"><label><input type="checkbox" checked={newUser.showInTeam} onChange={(e) => setNewUser({...newUser, showInTeam: e.target.checked})}/> Show in Team Page</label></div>
            
            <div className="permissions-section">
              <h3>Permissions</h3>
              <div className="permissions-grid">
                {Object.entries(newUser.permissions).map(([category, actions]) => (
                  <div key={category} className="permission-category">
                    <h4>{category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                    <div className="permission-actions">
                      {Object.entries(actions).map(([action, value]) => (
                        <label key={action} className="permission-toggle"><input type="checkbox" checked={value} onChange={() => togglePermission(newUser, setNewUser, category, action)}/><span>{action}</span></label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => { setShowAddModal(false); resetNewUser(); }}>Cancel</button>
              <button className="confirm-btn" onClick={handleAddUser}>Add User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;