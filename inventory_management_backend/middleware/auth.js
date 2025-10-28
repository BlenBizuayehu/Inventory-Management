// middleware/auth.js - UPDATED VERSION
const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const User = require('../models/User');
const UserShop = require('../models/UserShop');
const ErrorResponse = require('../utils/errorResponse');

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  const tokenSources = [
    req.headers.authorization?.startsWith('Bearer') && req.headers.authorization.split(' ')[1],
    req.cookies?.token,
    req.headers['x-access-token'],
    req.query.token,
    req.body?.token
  ];

  token = tokenSources.find(t => t);

  if (!token) {
    return next(new ErrorResponse('Not authorized, no token provided', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+role');
    
    if (!user) {
      return next(new ErrorResponse('No user found with this ID', 404));
    }

    // CRITICAL FIX: For owners/admins, don't fetch shop assignments
    let assignedShops = [];
    
    // Only fetch shop assignments for non-owner/admin users
    if (user.role !== 'owner' && user.role !== 'admin') {
      const shopAssignments = await UserShop.find({ user: user._id, isActive: true })
        .populate('shop', 'name location')
        .lean();

      assignedShops = shopAssignments.map(assignment => ({
        shopId: assignment.shop._id,
        shopName: assignment.shop.name,
        location: assignment.shop.location,
        role: assignment.role
      }));
    }

    req.user = {
      _id: user._id,
      id: user._id,
      role: user.role,
      username: user.username,
      email: user.email,
      assignedShops: assignedShops, // Empty for owners/admins
      ...user._doc
    };

   
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized, token failed', 401));
  }
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.role) {
      return next(new ErrorResponse('User not authenticated or role not found', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`User role '${req.user.role}' is not authorized to access this route`, 403));
    }
    
    next();
  };
};