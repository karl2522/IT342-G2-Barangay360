import PropTypes from 'prop-types';
import { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext.jsx';

// Import icons
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
  </svg>
);

const AnnouncementIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
  </svg>
);

const ServicesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
  </svg>
);

const CommunityIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
  </svg>
);

const AdminIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

const RequestsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
  </svg>
);

const ResidentsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
  </svg>
);

const ReportsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
  </svg>
);

const ForumIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
  </svg>
);

const ContentReportIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
  </svg>
);

const Sidebar = ({ isOfficial }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRole, logout, user } = useContext(AuthContext);

  // Add null check for user
  if (!user) {
    return null; // Don't render anything if user is not loaded
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };
  
  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  // Determine user's role for display with null checks
  const userRole = isOfficial ? 'Official' : 'Resident';
  const roleColor = isOfficial ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  // Define navigation items for regular residents with null checks
  const residentNavItems = [
    { 
      name: 'Dashboard', 
      path: '/resident/dashboard',
      icon: <DashboardIcon />
    },
    { 
      name: 'Services', 
      path: '/resident/services',
      icon: <ServicesIcon />
    },
    { 
      name: 'Announcements', 
      path: '/resident/announcements', 
      icon: <AnnouncementIcon />
    },
    { 
      name: 'Community', 
      path: '/resident/community',
      icon: <CommunityIcon />
    },
    { 
      name: 'Profile', 
      path: '/resident/profile',
      icon: <ProfileIcon />
    },
    { 
      name: 'Settings', 
      path: '/resident/settings',
      icon: <SettingsIcon />
    },
  ];

  // Define navigation items for officials with null checks
  const officialNavItems = [
    { 
      name: 'Dashboard', 
      path: '/official/dashboard',
      icon: <DashboardIcon />
    },
    { 
      name: 'Manage Requests', 
      path: '/official/requests',
      icon: <RequestsIcon />
    },
    { 
      name: 'Announcements', 
      path: '/official/manage-announcements',
      icon: <AnnouncementIcon />
    },
    { 
      name: 'Forum Posts', 
      path: '/official/forum-management',
      icon: <ForumIcon />
    },
    { 
      name: 'Content Reports', 
      path: '/official/reports-management',
      icon: <ContentReportIcon />
    },
    { 
      name: 'Residents', 
      path: '/official/residents',
      icon: <ResidentsIcon />
    },
    {
      name: 'Appeals',
      path: '/official/appeals',
      icon: <ReportsIcon />
    },
    { 
      name: 'Events Calendar', 
      path: '/official/events',
      icon: <CalendarIcon />
    },
    { 
      name: 'Profile', 
      path: '/official/profile',
      icon: <ProfileIcon />
    },
    { 
      name: 'Settings', 
      path: '/official/settings',
      icon: <SettingsIcon />
    },
  ];

  // Add admin panel if user has admin role with null check
  if (hasRole && hasRole('ROLE_ADMIN')) {
    officialNavItems.push({ 
      name: 'Admin Panel', 
      path: '/admin', 
      icon: <AdminIcon />
    });
  }

  // Choose which navigation items to display based on user role with null check
  const navItems = isOfficial ? officialNavItems : residentNavItems;

  return (
    <>
      <div 
        className="h-screen fixed left-0 top-0 w-64 bg-[#861A2D] text-white shadow-lg"
      >
        <div className="flex items-center p-4 border-b border-[#9b3747]">
          <h1 className="text-xl font-bold">Barangay360</h1>
        </div>

        <div className="px-4 py-3 border-b border-[#9b3747]">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-[#9b3747] flex items-center justify-center text-lg font-bold">
                {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U"}
              </div>
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs truncate">
                <span className={`px-1.5 py-0.5 rounded-full ${roleColor}`}>
                  {userRole}
                </span>
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-6 px-2">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-white text-[#861A2D] font-medium' 
                        : 'hover:bg-[#9b3747]'
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="ml-3">{item.name}</span>
                  </Link>
                </li>
              );
            })}
            
            {/* Logout item at the bottom */}
            <li className="absolute bottom-4 left-0 right-0 px-2">
              <button
                onClick={openLogoutModal}
                className="w-full flex items-center p-3 rounded-lg transition-colors hover:bg-[#9b3747]"
              >
                <span className="flex-shrink-0"><LogoutIcon /></span>
                <span className="ml-3">Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to log out from your account?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeLogoutModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#861A2D] text-white rounded-md text-sm font-medium hover:bg-[#9b3747] transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

Sidebar.propTypes = {
  isOfficial: PropTypes.bool
};

Sidebar.defaultProps = {
  isOfficial: false
};

export default Sidebar;