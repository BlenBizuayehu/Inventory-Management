const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
dotenv.config();

// Helper function to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const selectUserFields = (user) => {
    if (!user) return null;
    const { passwordHash, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
};


// Configure Cloudinary (add to your env variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Register User with permissions
exports.registerUser = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only the owner can register new users.' });
    }

    const { username, password, role, email, showInTeam, permissions } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ success: false, error: 'Username, password, and email are required.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'A user with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    let parsedPermissions = {};
    if (typeof permissions === 'string') {
        try { parsedPermissions = JSON.parse(permissions); }
        catch (e) { return res.status(400).json({ success: false, error: 'Invalid permissions format.'}) }
    } else {
        parsedPermissions = permissions;
    }

    const user = await User.create({
      username,
      email,
      passwordHash,
      role: role || 'staff',
      showInTeam: showInTeam === 'true',
      permissions: parsedPermissions||getDefaultPermissions,
      // Handle image upload with Cloudinary or similar in a separate step if needed
    });

    res.status(201).json({ success: true, data: selectUserFields(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error during registration.' });
  }
};


// Helper function for default permissions
function getDefaultPermissions(role) {
  const basePermissions = {
    inventoryManagement: { view: false, edit: false, delete: false },
    priceManagement: { view: false, edit: false },
    // ... other permission categories with default false values
  };

  if (role === 'admin') {
    // Set some default permissions for admin
    basePermissions.inventoryManagement.view = true;
    basePermissions.userManagement.view = true;
  }

  return basePermissions;
}



// Upload profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image file uploaded' 
      });
    }

    // Construct proper URL - adjust based on your setup
    const imageUrl = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: imageUrl },
      { new: true }
    ).select('-passwordHash');

    res.status(200).json({
      success: true,
      data: {
        profileImage: imageUrl, // Make sure this is the correct path
        user
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload profile image' 
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user._id, user.role);
    res.status(200).json({ success: true, token, data: selectUserFields(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error during login.' });
  }
};


// Update last login timestamp
exports.updateLastLogin = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, { 
      lastLogin: new Date() 
    });
  } catch (error) {
    console.error('Error updating last login:', error);
  }
};


exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, error: 'All password fields are required.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'New passwords do not match.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // --- THIS IS THE FIX ---
    // Compare the PLAIN TEXT currentPassword with the HASHED password in the database.
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Your current password is incorrect.' });
    }

    // If it matches, now we can hash the NEW password and save it.
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ success: false, error: 'Server error while changing password.' });
  }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-passwordHash');
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users.' });
  }
};

exports.getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
  res.status(200).json({ success: true, data: user });
};



// Get current user (requires auth)
exports.getCurrentUser = async (req, res) => {
    // req.user is populated by the 'protect' middleware. We just need to select fields.
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    res.status(200).json({ success: true, data: user });
};

/**
 * @desc    Update any user's details (Admin/Owner only) or self
 * @route   PUT /api/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const userIdToUpdate = req.params.id;
    const requestingUserRole = req.user.role;
    const userToUpdate = await User.findById(userIdToUpdate);
    if (!userToUpdate) return res.status(404).json({ success: false, error: 'User not found' });

    if (requestingUserRole !== 'owner' && !req.user.permissions?.userManagement?.editOthers) {
        return res.status(403).json({ success: false, error: 'You are not authorized to update this user.' });
    }
    const { username, email, role, showInTeam, permissions } = req.body;
    userToUpdate.username = username || userToUpdate.username;
    userToUpdate.email = email || userToUpdate.email;
    userToUpdate.showInTeam = typeof showInTeam !== 'undefined' ? showInTeam : userToUpdate.showInTeam;
    
    // Only owner can change roles and permissions
    if (requestingUserRole === 'owner') {
        userToUpdate.role = role || userToUpdate.role;
        userToUpdate.permissions = permissions || userToUpdate.permissions;
    }
    const updatedUser = await userToUpdate.save();
    res.status(200).json({ success: true, data: selectUserFields(updatedUser) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error during update.' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ success: false, error: 'User not found' });
    if (userToDelete.role === 'owner') return res.status(400).json({ success: false, error: 'Cannot delete the owner account.' });
    await userToDelete.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error during deletion.' });
  }
};


// controllers/userController.js

// Update current user's profile (not for admin editing other users)
exports.updateProfile = async (req, res) => {
  try {
    const { username, email, showInTeam } = req.body;
    const userId = req.user.id; // Only update the logged-in user

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Update allowed fields
    user.username = username || user.username;
    user.email = email || user.email;
    user.showInTeam = typeof showInTeam !== 'undefined' ? showInTeam : user.showInTeam;

    const updatedUser = await user.save();
    res.status(200).json({ 
      success: true, 
      data: selectUserFields(updatedUser) 
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update profile' 
    });
  }
};

exports.getMe = (async (req, res, next) => {

  res.status(200).json({
    success: true,
    data: req.user 
  });
});