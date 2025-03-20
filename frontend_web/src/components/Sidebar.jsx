import PropTypes from 'prop-types';
import { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

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

const ChevronLeftIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
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

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
  </svg>
);

const Sidebar = ({ isOfficial }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRole, logout, user } = useContext(AuthContext);
  
  // Check if the user is actually an official from localStorage
  const [actualIsOfficial, setActualIsOfficial] = useState(isOfficial);
  
  useEffect(() => {
    // If isOfficial prop doesn't match the role check, use localStorage as source of truth
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userHasOfficialRole = userData?.roles?.includes('official') || userData?.roles?.includes('ROLE_OFFICIAL');
    
    // Only update if there's a mismatch
    if (isOfficial !== userHasOfficialRole) {
      console.log('Role mismatch detected in Sidebar', { propIsOfficial: isOfficial, userHasOfficialRole });
      setActualIsOfficial(userHasOfficialRole);
    }
  }, [isOfficial]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Determine user's role for display
  const userRole = actualIsOfficial ? 'Official' : 'Resident';
  const roleColor = actualIsOfficial ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  // Define navigation items for regular residents
  const residentNavItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: <DashboardIcon />
    },
    { 
      name: 'Services', 
      path: '/services', 
      icon: <ServicesIcon />
    },
    { 
      name: 'Announcements', 
      path: '/announcements', 
      icon: <AnnouncementIcon />
    },
    { 
      name: 'Community', 
      path: '/community', 
      icon: <CommunityIcon />
    },
    { 
      name: 'Profile', 
      path: '/profile', 
      icon: <ProfileIcon />
    },
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: <SettingsIcon />
    },
  ];

  // Define navigation items for officials
  const officialNavItems = [
    { 
      name: 'Dashboard', 
      path: '/official-dashboard', 
      icon: <DashboardIcon />
    },
    { 
      name: 'Manage Requests', 
      path: '/requests', 
      icon: <RequestsIcon />
    },
    { 
      name: 'Announcements', 
      path: '/manage-announcements', 
      icon: <AnnouncementIcon />
    },
    { 
      name: 'Residents', 
      path: '/residents', 
      icon: <ResidentsIcon />
    },
    { 
      name: 'Reports', 
      path: '/reports', 
      icon: <ReportsIcon />
    },
    { 
      name: 'Events Calendar', 
      path: '/events', 
      icon: <CalendarIcon />
    },
    { 
      name: 'Profile', 
      path: '/profile', 
      icon: <ProfileIcon />
    },
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: <SettingsIcon />
    }
  ];

  // Add admin panel if user has admin role
  if (hasRole('ROLE_ADMIN')) {
    officialNavItems.push({ 
      name: 'Admin Panel', 
      path: '/admin', 
      icon: <AdminIcon />
    });
  }

  // Choose which navigation items to display based on user role
  const navItems = actualIsOfficial ? officialNavItems : residentNavItems;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div 
      className={`h-screen fixed left-0 top-0 transition-all duration-300 ease-in-out bg-[#861A2D] text-white shadow-lg ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-[#9b3747]">
        {!isCollapsed && (
          <h1 className="text-xl font-bold">Barangay360</h1>
        )}
        <button 
          onClick={toggleSidebar} 
          className={`p-2 rounded-full hover:bg-[#9b3747] transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
        >
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>

      {!isCollapsed && (
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
      )}

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
                  {!isCollapsed && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
          
          {/* Logout item at the bottom */}
          <li className="absolute bottom-4 left-0 right-0 px-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center p-3 rounded-lg transition-colors hover:bg-[#9b3747]"
            >
              <span className="flex-shrink-0"><LogoutIcon /></span>
              {!isCollapsed && (
                <span className="ml-3">Logout</span>
              )}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

Sidebar.propTypes = {
  isOfficial: PropTypes.bool
};

Sidebar.defaultProps = {
  isOfficial: false
};

export default Sidebar; 