const UserShop = require('../models/UserShop');
const User = require('../models/User');
const Shop = require('../models/Shop');

// Assign user to shop
exports.assignUserToShop = async (req, res) => {
  try {
    const { userId, shopId, role } = req.body;

    // Validate input
    if (!userId || !shopId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID and Shop ID are required' 
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ 
        success: false,
        error: 'Shop not found' 
      });
    }

    // Check if assignment already exists
    const existingAssignment = await UserShop.findOne({ user: userId, shop: shopId });
    if (existingAssignment) {
      return res.status(400).json({ 
        success: false,
        error: 'User is already assigned to this shop' 
      });
    }

    // Create new assignment
    const userShop = await UserShop.create({
      user: userId,
      shop: shopId,
      role: role || 'staff'
    });

    // Populate the references for the response
    await userShop.populate('user shop');

    res.status(201).json({
      success: true,
      data: userShop
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// Get all shop assignments for a user
exports.getUserAssignments = async (req, res) => {
  try {
    const { userId } = req.params;

    const assignments = await UserShop.find({ user: userId })
      .populate('shop', 'name location')
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      data: assignments
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// Get all users assigned to a shop
// Modify your controller responses to be consistent
exports.getShopAssignments = async (req, res) => {
  try {
    const { shopId } = req.params;
    const assignments = await UserShop.find({ shop: shopId })
      .populate('user', 'name email role')
      .populate('shop', 'name location');

    res.status(200).json({
      success: true,
      data: assignments // Consistent structure
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// Update user's shop assignment (e.g., change role)
exports.updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { role, isActive } = req.body;

    const assignment = await UserShop.findByIdAndUpdate(
      assignmentId,
      { role, isActive },
      { new: true, runValidators: true }
    ).populate('user shop');

    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        error: 'Assignment not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// Remove user from shop
exports.removeAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await UserShop.findByIdAndDelete(assignmentId);

    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        error: 'Assignment not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};