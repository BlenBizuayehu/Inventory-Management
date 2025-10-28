const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// Protect routes - verify JWT token
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header or cookie
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.headers['x-access-token']) {
    // Alternative header
    token = req.headers['x-access-token'];
  } else if (req.query.token) {
    // URL parameter
    token = req.query.token;
  }

  // For FormData requests, also check the body
  if (!token  && req.body && req.body.token) {
    token = req.body.token;
  }


  if (!token) {
    return next(new ErrorResponse('Not authorized, no token provided', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new ErrorResponse('No user found with this ID', 404));
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized, token failed', 401));
  }
});

// Role-based authorization (single consistent implementation)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists and has a role
    if (!req.user?.role) {
      return next(
        new ErrorResponse('User not authenticated or role not found', 401)
      );
    }
    
    // Check if user's role is included in allowed roles
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`, 
          403
        )
      );
    }
    
    next();
  };
};