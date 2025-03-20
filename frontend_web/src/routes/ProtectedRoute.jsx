import PropTypes from 'prop-types';
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, hasRole } = useContext(AuthContext);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required
  if (requiredRoles.length > 0) {
    // Get roles directly from localStorage as a backup check
    let hasRequiredRole = false;
    
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      // First check using the context function
      hasRequiredRole = requiredRoles.some(role => hasRole(role));
      
      // If that fails, check directly from localStorage data
      if (!hasRequiredRole && userData && userData.roles) {
        hasRequiredRole = requiredRoles.some(role => userData.roles.includes(role));
      }
      
      console.log('Role check result:', { requiredRoles, hasRequiredRole, userRoles: userData?.roles });
    } catch (error) {
      console.error('Error checking roles:', error);
    }
    
    if (!hasRequiredRole) {
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