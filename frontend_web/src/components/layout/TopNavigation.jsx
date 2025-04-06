import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import PropTypes from 'prop-types';

const TopNavigation = ({ title }) => {
  const { user, hasRole } = useContext(AuthContext);

  // Determine role and badge color
  let userRole = 'Resident';
  let roleColor = 'bg-green-100 text-green-800';

  if (hasRole && hasRole('ROLE_ADMIN')) {
    userRole = 'Admin';
    roleColor = 'bg-red-100 text-red-800';
  } else if (hasRole && hasRole('ROLE_OFFICIAL')) {
    userRole = 'Official';
    roleColor = 'bg-blue-100 text-blue-800';
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-[#861A2D]">{title}</h1>
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Welcome,</span>
              <span className="text-sm font-medium text-[#861A2D]">{user?.firstName} {user?.lastName}</span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${roleColor}`}>
                {userRole}
              </span>
            </div>
          ) : (
            // Optional: Placeholder or loading state if user is not yet available
            <div className="text-sm text-gray-500">Loading user...</div>
          )}
          {/* Profile Icon removed as per previous request */}
        </div>
      </div>
    </nav>
  );
};

TopNavigation.propTypes = {
    title: PropTypes.string.isRequired,
};

export default TopNavigation; 