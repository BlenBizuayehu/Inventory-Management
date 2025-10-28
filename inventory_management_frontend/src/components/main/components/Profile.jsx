import { useEffect, useRef, useState } from 'react';
import { FaCamera, FaEdit, FaLock, FaSave, FaUser } from 'react-icons/fa';
import api, { API_BASE_URL } from '../../../api'; // Import API_BASE_URL
import './Profile.css';

const Profile = () => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    showInTeam: false,
    profileImage: ''
  });

  // --- THIS IS A KEY FIX ---
  // Use the exact key names your backend expects.
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // A single, reliable function to fetch user data
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me');
      const user = response.data.data;
      setFormData({
        username: user.username,
        email: user.email,
        showInTeam: user.showInTeam,
        // Construct the full URL for display
        profileImage: user.profileImage ? `${API_BASE_URL}${user.profileImage}` : ''
      });
    } catch (error) {
      handleDisplayMessage('Failed to load profile data.', 'error');
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Helper to show temporary messages
  const handleDisplayMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };
  
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await api.put('/users/me', {
        username: formData.username,
        email: formData.email,
        showInTeam: formData.showInTeam
      });

      // --- FIX: Update state with the fresh data from the server ---
      const updatedUser = response.data.data;
      setFormData(prev => ({
          ...prev, // Keep the existing image URL
          username: updatedUser.username,
          email: updatedUser.email,
          showInTeam: updatedUser.showInTeam,
      }));

      handleDisplayMessage('Profile updated successfully', 'success');
      setEditMode(false);
    } catch (error) {
      handleDisplayMessage(error.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      
      const response = await api.post('/users/me/upload-image', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // --- FIX: Update the profileImage state with the new full URL ---
      setFormData(prev => ({
        ...prev,
        profileImage: `${API_BASE_URL}${response.data.data.profileImage}`
      }));
      handleDisplayMessage('Profile image updated', 'success');
    } catch (error) {
      handleDisplayMessage(error.response?.data?.error || 'Failed to upload image', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault(); // This is a form, so prevent default submission
    
    // --- THIS IS A KEY FIX ---
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      handleDisplayMessage('New passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      // The `passwordData` object now has the correct keys
      await api.put('/users/me/change-password', passwordData);
      
      handleDisplayMessage('Password changed successfully', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      handleDisplayMessage(error.response?.data?.error || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="profile-page-container">
      <div className="profile-page-card">
        {/* Profile Image Section */}
        <div className="profile-page-image-section">
          <div className="image-wrapper">
            {formData.profileImage ? (
              <img src={formData.profileImage} alt="Profile" className="profile-page-image" />
            ) : (
              <div className="profile-page-image-placeholder"><FaUser size={48} /></div>
            )}
            <button className="upload-btn" onClick={triggerFileInput} disabled={loading}>
              <FaCamera /> Change
            </button>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Profile Details & Forms Section */}
        <div className="profile-details-section">
          {message.text && (<div className={`profile-page-alert ${message.type}`}>{message.text}</div>)}

          {editMode ? (
            <div className="edit-form">
              <h2>Edit Profile</h2>
              <div className="profile-page-form-group"><label>Username</label><input type="text" name="username" value={formData.username} onChange={handleInputChange} /></div>
              <div className="profile-page-form-group"><label>Email</label><input name="email" type="email" value={formData.email} onChange={handleInputChange} /></div>
              <div className="profile-page-checkbox-group"><input type="checkbox" id="showInTeam" name="showInTeam" checked={formData.showInTeam} onChange={handleInputChange} /><label htmlFor="showInTeam">Show on Team Page</label></div>
              <div className="profile-page-button-group">
                <button className="profile-page-btn btn-cancel" onClick={() => setEditMode(false)} disabled={loading}>Cancel</button>
                <button className="profile-page-btn btn-save" onClick={handleSaveProfile} disabled={loading}><FaSave /> Save Changes</button>
              </div>
            </div>
          ) : (
            <div className="view-mode">
              <h2>{formData.username}</h2>
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Visible on Team:</strong> {formData.showInTeam ? 'Yes' : 'No'}</p>
              <button className="profile-page-btn btn-edit" onClick={() => setEditMode(true)}><FaEdit /> Edit Profile</button>
            </div>
          )}

          {/* --- CORRECTED PASSWORD CHANGE FORM --- */}
          <form className="profile-page-password-section" onSubmit={handlePasswordChange}>
            <h3><FaLock /> Change Password</h3>
            <div className="profile-page-form-group">
              <label>Current Password</label>
              <input name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordInputChange} required />
            </div>
            <div className="profile-page-form-group">
              <label>New Password</label>
              <input name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordInputChange} required />
            </div>
            <div className="profile-page-form-group">
              <label>Confirm New Password</label>
              <input name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordInputChange} required />
            </div>
            <button type="submit" className="profile-page-btn btn-change-password" disabled={loading}>
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;