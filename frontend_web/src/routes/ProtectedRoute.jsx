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
    // Convert all roles to ROLE_ prefixed format
    const normalizedRequiredRoles = requiredRoles.map(role => 
      role.startsWith('ROLE_') ? role : `ROLE_${role.toUpperCase()}`
    );
    
    // Check if user has any of the required roles
    const hasRequiredRole = normalizedRequiredRoles.some(role => hasRole(role));
    
    console.log('Role check:', { 
      requiredRoles: normalizedRequiredRoles, 
      hasRequiredRole,
      userRoles: JSON.parse(localStorage.getItem('user') || '{}')?.roles 
    });
    
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