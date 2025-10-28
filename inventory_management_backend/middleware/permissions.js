// middleware/permissions.js
exports.checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    const user = req.user;
    
    // Owner has all permissions
    if (user.role === 'owner') return next();
    
    // Check if user has the required permission
    const [category, action] = requiredPermission.split('.');
    
    if (!user.permissions[category] || !user.permissions[category][action]) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
};