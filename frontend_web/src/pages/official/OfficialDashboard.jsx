import { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import Sidebar from '../../components/layout/Sidebar.jsx';
import { webSocketService } from '../../services/WebSocketService';

const OfficialDashboard = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Connect to WebSocket
    webSocketService.connect();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex w-full">
      {/* Sidebar */}
      <Sidebar isOfficial={true} />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ml-64`}>
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-[#861A2D]">Official Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Welcome,</span>
                <span className="text-sm font-medium text-[#861A2D]">{user?.username}</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Official</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-[#861A2D]">
                <img 
                  src="/images/default-profile.png" 
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${user?.firstName || 'User'}&background=861A2D&color=fff`;
                  }}
                />
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-full mx-auto">
            <div className="mb-8 bg-gradient-to-r from-[#861A2D] to-[#9b3747] text-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-2">Welcome to the Official Dashboard</h2>
              <p className="opacity-90">
                As a barangay official, you have access to enhanced tools and management features to better serve the community.
              </p>
            </div>

            {/* New Forum Management Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Community Forum Management</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-full bg-[#861A2D] bg-opacity-10 mr-4">
                      <svg className="h-6 w-6 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-[#861A2D]">Posts Management</h3>
                      <p className="text-gray-600">Manage community forum posts and activity</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <Link to="/forum-management" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors duration-200">
                      Manage Forum Posts
                    </Link>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Monitor community discussions, review post metrics, and moderate content to ensure community guidelines are followed.</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-full bg-[#861A2D] bg-opacity-10 mr-4">
                      <svg className="h-6 w-6 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-[#861A2D]">Reports Management</h3>
                      <p className="text-gray-600">Handle user reports and content moderation</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <Link to="/reports-management" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors duration-200">
                      Manage Content Reports
                    </Link>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Review and process user-submitted reports on inappropriate content, take action on violations, and maintain community standards.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-[#861A2D] bg-opacity-10 mr-4">
                    <svg className="h-8 w-8 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#861A2D]">Announcements</h3>
                    <p className="text-gray-600">Create and manage community announcements</p>
                  </div>
                </div>
                <div className="mb-4">
                  <Link to="/official/announcements" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors duration-200">
                    Manage Announcements
                  </Link>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Create and manage announcements for the community. Keep residents informed about important updates and events.</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-[#861A2D] bg-opacity-10 mr-4">
                    <svg className="h-6 w-6 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#861A2D]">Reports</h3>
                    <p className="text-gray-600">View and generate reports</p>
                  </div>
                </div>
                <div className="mb-4">
                  <Link to="/official/reports" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors duration-200">
                    View Reports
                  </Link>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Access and generate various reports about community activities, service requests, and resident statistics.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-[#861A2D] bg-opacity-10 mr-4">
                    <svg className="h-6 w-6 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#861A2D]">Announcements</h3>
                    <p className="text-gray-600">Create and manage community announcements</p>
                  </div>
                </div>
                <div className="mb-4">
                  <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors duration-200">
                    Create New Announcement
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-800">COVID-19 Vaccination Schedule</h4>
                      <span className="text-xs text-gray-500">2 days ago</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">Schedule for this week&apos;s vaccination program at the community center.</p>
                    <div className="flex space-x-2">
                      <button className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors">
                        Edit
                      </button>
                      <button className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-800">Monthly Clean-up Drive</h4>
                      <span className="text-xs text-gray-500">3 days ago</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">Community clean-up drive scheduled for this Saturday, 7:00 AM.</p>
                    <div className="flex space-x-2">
                      <button className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors">
                        Edit
                      </button>
                      <button className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-[#861A2D] bg-opacity-10 mr-4">
                    <svg className="h-6 w-6 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#861A2D]">Resident Management</h3>
                    <p className="text-gray-600">View and manage resident records</p>
                  </div>
                </div>
                <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors duration-200 mb-3">
                  View Resident Directory
                </button>
                <div className="text-center text-sm text-gray-600">
                  <p>Total Registered Residents: 1,245</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-[#861A2D] bg-opacity-10 mr-4">
                    <svg className="h-6 w-6 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#861A2D]">Reports</h3>
                    <p className="text-gray-600">View and generate reports</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors flex justify-between items-center">
                    <span>Monthly Service Requests</span>
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors flex justify-between items-center">
                    <span>Resident Demographics</span>
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-[#861A2D] bg-opacity-10 mr-4">
                    <svg className="h-6 w-6 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#861A2D]">Events Calendar</h3>
                    <p className="text-gray-600">Manage community events</p>
                  </div>
                </div>
                <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors duration-200 mb-3">
                  Schedule New Event
                </button>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 mb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Barangay Assembly</p>
                      <p className="text-xs text-gray-500">June 15, 2023 • 9:00 AM</p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Upcoming</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Medical Mission</p>
                      <p className="text-xs text-gray-500">June 25, 2023 • 8:00 AM</p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Upcoming</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-[#861A2D] bg-opacity-10 mr-4">
                    <svg className="h-6 w-6 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#861A2D]">Service Requests</h3>
                    <p className="text-gray-600">Manage resident service requests</p>
                  </div>
                </div>
                <Link to="/requests" className="w-full inline-block text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors duration-200">
                  Manage Service Requests
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OfficialDashboard; 