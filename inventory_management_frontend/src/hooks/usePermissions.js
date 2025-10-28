// src/hooks/usePermissions.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const usePermissions = () => {
  const { currentUser } = useContext(AuthContext);
  
  const hasPermission = (category, action) => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner') return true;
    
    // Handle nested permissions (like editSelf/editOthers)
    if (action === 'edit') {
      return currentUser.permissions?.[category]?.edit || 
             currentUser.permissions?.[category]?.editSelf || 
             currentUser.permissions?.[category]?.editOthers;
    }
    
    if (action === 'delete') {
      return currentUser.permissions?.[category]?.delete || 
             currentUser.permissions?.[category]?.deleteSelf || 
             currentUser.permissions?.[category]?.deleteOthers;
    }
    
    return currentUser.permissions?.[category]?.[action] || false;
  };

  // Helper to check if user can edit a specific item (for editSelf cases)
  const canEdit = (category, resourceOwnerId) => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner') return true;
    
    const isOwner = currentUser._id === resourceOwnerId;
    return currentUser.permissions?.[category]?.editOthers || 
          (currentUser.permissions?.[category]?.editSelf && isOwner);
  };

  // Helper to check if user can delete a specific item
  const canDelete = (category, resourceOwnerId) => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner') return true;
    
    const isOwner = currentUser._id === resourceOwnerId;
    return currentUser.permissions?.[category]?.deleteOthers || 
          (currentUser.permissions?.[category]?.deleteSelf && isOwner);
  };

  return { hasPermission, canEdit, canDelete };
};