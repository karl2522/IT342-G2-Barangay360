import PropTypes from 'prop-types';
import { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, hasRole, user } = useContext(AuthContext);
  
  // Only log role checking when needed, not on every render
  useEffect(() => {
    // Only log details when there are required roles and user is authenticated
    if (requiredRoles.length > 0 && user) {
      console.log('ProtectedRoute checking roles for:', requiredRoles);
    }
  }, [requiredRoles, user]);

  // Check for authentication first
  if (!isAuthenticated()) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required
  if (requiredRoles.length > 0) {
    // Special handling for USER/RESIDENT role
    let hasSpecialRoleMatch = false;
    
    // Check if we're looking for ROLE_USER/USER/RESIDENT and user has any matching role
    if (requiredRoles.some(role => 
      role === 'USER' || 
      role === 'ROLE_USER' || 
      role === 'RESIDENT' || 
      role === 'ROLE_RESIDENT'
    )) {
      // Check if user has either ROLE_USER or ROLE_RESIDENT
      if (user?.roles?.some(role => 
        role === 'ROLE_USER' || 
        role === 'ROLE_RESIDENT' || 
        role === 'USER' || 
        role === 'RESIDENT'
      )) {
        hasSpecialRoleMatch = true;
      }
    }
    
    // Regular role checking (normalized to ROLE_ format)
    const normalizedRequiredRoles = requiredRoles.map(role => 
      role.startsWith('ROLE_') ? role : `ROLE_${role.toUpperCase()}`
    );
    
    // Check if user has any of the required roles
    const hasRequiredRole = hasSpecialRoleMatch || normalizedRequiredRoles.some(role => hasRole(role));
    
    if (!hasRequiredRole) {
      console.log('Access denied - user does not have required role');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRoles: PropTypes.arrayOf(PropTypes.string)
};

export default ProtectedRoute; 