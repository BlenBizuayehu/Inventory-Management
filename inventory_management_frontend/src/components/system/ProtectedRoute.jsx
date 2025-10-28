// src/components/ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

const ProtectedRoute = ({ children, requiredPermissions }) => {
  const { hasAllPermissions } = usePermissions();
  
  const hasAccess = requiredPermissions 
    ? hasAllPermissions(requiredPermissions)
    : true; // If no permissions specified, just require auth
  
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

export default ProtectedRoute;