import { useEffect, useState } from 'react';
import { FaEdit, FaLock, FaSave, FaUser } from 'react-icons/fa';
import './Profile.css';


const Profile = ({ currentUser, updateUser, changePassword }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        email: currentUser.email || '',
        role: currentUser.role || '',
        showInTeam: currentUser.showInTeam || false,
        profileImage: currentUser.profileImage || '',
      });
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveChanges = () => {
    updateUser(formData)
      .then(() => {
        setMessage('Profile updated successfully.');
        setEditMode(false);
      })
      .catch(() => setMessage('Failed to update profile.'));
  };

  const handleChangePassword = () => {
    const { current, new: newPwd, confirm } = passwordData;
    if (newPwd !== confirm) {
      setMessage('New passwords do not match.');
      return;
    }
    changePassword({ currentPassword: current, newPassword: newPwd })
      .then(() => setMessage('Password changed successfully.'))
      .catch(() => setMessage('Failed to change password.'));
  };

  return (
    <div className="profile-page">
      <h2>My Profile</h2>

      {message && <div className="alert">{message}</div>}

      <div className="profile-section">
        <div className="profile-image">
          {formData.profileImage ? (
            <img src={formData.profileImage} alt="Profile" />
          ) : (
            <FaUser size={60} />
          )}
        </div>

        <div className="profile-info">
          {editMode ? (
            <>
              <div>
                <label>Username:</label>
                <input name="username" value={formData.username} onChange={handleInputChange} />
              </div>
              <div>
                <label>Email:</label>
                <input name="email" value={formData.email} onChange={handleInputChange} />
              </div>
              <div>
                <label>Show on Team Page:</label>
                <input
                  type="checkbox"
                  name="showInTeam"
                  checked={formData.showInTeam}
                  onChange={handleInputChange}
                />
              </div>
              <button onClick={handleSaveChanges}><FaSave /> Save</button>
            </>
          ) : (
            <>
              <p><strong>Username:</strong> {formData.username}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Role:</strong> {formData.role}</p>
              <p><strong>Visible on Team Page:</strong> {formData.showInTeam ? 'Yes' : 'No'}</p>
              <button onClick={() => setEditMode(true)}><FaEdit /> Edit Profile</button>
            </>
          )}
        </div>
      </div>

      <div className="password-section">
        <h3><FaLock /> Change Password</h3>
        <div>
          <label>Current Password</label>
          <input
            type="password"
            value={passwordData.current}
            onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
          />
        </div>
        <div>
          <label>New Password</label>
          <input
            type="password"
            value={passwordData.new}
            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
          />
        </div>
        <div>
          <label>Confirm New Password</label>
          <input
            type="password"
            value={passwordData.confirm}
            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
          />
        </div>
        <button onClick={handleChangePassword}>Update Password</button>
      </div>
    </div>
  );
};

export default Profile;
