const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

// Helper function to generate JWT
generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// controllers/userController.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary (add to your env variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Register User with permissions
exports.registerUser = async (req, res) => {
  try {
    // Verify requester is owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({ 
        success: false,
        message: 'Only owner can register users' 
      });
    }

    // Log incoming request body for debugging
    console.log('Request body:', req.body);
    
    // Extract data from form
    const { username, password, role, email, showInTeam } = req.body;
    
    // Validate required fields
    if (!username || !password || !role || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Parse permissions from stringified JSON or use empty object
    let permissions = {};
    try {
      permissions = req.body.permissions ? JSON.parse(req.body.permissions) : {};
    } catch (err) {
      console.error('Error parsing permissions:', err);
      return res.status(400).json({
        success: false,
        message: 'Invalid permissions structure',
        details: err.message
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    if (!['admin', 'staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object with default permissions if none provided
    const userData = {
      username,
      email,
      passwordHash: hashedPassword,
      role,
      showInTeam: showInTeam === 'true',
      permissions: permissions || getDefaultPermissions(role)
    };

    // Handle file upload if exists
    if (req.file) {
      userData.profileImage = req.file.path;
    }

    // Create and save user
    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        showInTeam: user.showInTeam,
        permissions: user.permissions,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
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
    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const file = req.files.image;
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'user-profiles',
      width: 500,
      height: 500,
      crop: 'limit'
    });

    // Delete temp file
    fs.unlinkSync(file.tempFilePath);

    // Update user profile image
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: result.secure_url },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login User - Fixed version
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await this.updateLastLogin(user._id);

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    return res.status(200).json({ 
      message: 'Login successful', 
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,

      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
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

exports.updateUser = async (req, res) => {
  try {
    // First check if body exists and is properly formatted
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Request body is missing or empty" 
      });
    }

    // Get the raw body data
    const { username, email, role, showInTeam, permissions } = req.body;
    
    // Validate required fields
    if (!username) {
      return res.status(400).json({ 
        success: false,
        message: "Username is required" 
      });
    }

    const userId = req.params.id;
    
    // Verify permissions
    const requestingUser = await User.findById(req.user.id);
    
    // Only owner can change roles or update other users
    if (requestingUser.role !== 'owner' && userId !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this user' 
      });
    }
    
    // Find user to update
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Update fields
    user.username = username;
    if (email) user.email = email;
    
    // Only owner can change roles
    if (role && requestingUser.role === 'owner') {
      user.role = role;
    }
    
    if (typeof showInTeam !== 'undefined') {
      user.showInTeam = showInTeam;
    }
    
    // Only owner can update permissions
    if (permissions && requestingUser.role === 'owner') {
      user.permissions = permissions;
    }
    
    await user.save();
    
     const responseData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      showInTeam: user.showInTeam,
      permissions: user.permissions,
      // Include any other necessary fields
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

       res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser // Return the complete user document
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Can only change own password
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    await user.save();
    
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single user by ID
// Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users
// In your getUsers controller
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.status(200).json({
      success: true,
      data: users // Ensure we're returning { success, data } format
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get current user (requires auth)
// In your backend controller
exports.getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by protect middleware
    const user = {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      lastLogin: req.user.lastLogin
    };
    
    res.status(200).json({
      success: true,
      data: user  // Make sure role is included here
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update user (only owner or admin can update)
exports.updateUser = async (req, res) => {
  try {
    const { username, email, role } = req.body;
    const userId = req.params.id;
    
    // Verify permissions
    const requestingUser = await User.findById(req.user.id);
    
    // Only owner can change roles or update other users
    if (requestingUser.role !== 'owner' && userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }
    
    // Only owner can change roles
    if (role && requestingUser.role !== 'owner') {
      return res.status(403).json({ message: 'Only owner can change roles' });
    }
    
    // Find user to update
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (role && requestingUser.role === 'owner') user.role = role;
    
    await user.save();
    
    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};



