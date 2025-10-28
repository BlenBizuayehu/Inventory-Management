const PermissionWrapper = ({ children, requiredPermission, currentUser }) => {
  const hasPermission = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner') return true;
    
    const [category, action] = requiredPermission.split('.');
    return currentUser.permissions?.[category]?.[action] || false;
  };

  return hasPermission() ? children : null;
};

export default PermissionWrapper;