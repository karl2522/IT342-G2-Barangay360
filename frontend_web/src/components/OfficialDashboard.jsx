import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const OfficialDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

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
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-md text-sm text-white bg-[#861A2D] hover:bg-[#9b3747] transition-colors"
              >
                Logout
              </button>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-[#861A2D] bg-opacity-10 mr-4">
                    <svg className="h-8 w-8 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#861A2D]">Pending Requests</h3>
                    <p className="text-gray-600">Manage and process resident requests</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Certificate Requests</p>
                      <p className="text-xs text-gray-500">12 pending requests</p>
                    </div>
                    <Link to="/requests" className="px-3 py-1 text-xs bg-[#861A2D] text-white rounded-md hover:bg-[#9b3747] transition-colors">
                      View All
                    </Link>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Clearance Requests</p>
                      <p className="text-xs text-gray-500">8 pending requests</p>
                    </div>
                    <Link to="/requests" className="px-3 py-1 text-xs bg-[#861A2D] text-white rounded-md hover:bg-[#9b3747] transition-colors">
                      View All
                    </Link>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Business Permit Applications</p>
                      <p className="text-xs text-gray-500">5 pending applications</p>
                    </div>
                    <Link to="/requests" className="px-3 py-1 text-xs bg-[#861A2D] text-white rounded-md hover:bg-[#9b3747] transition-colors">
                      View All
                    </Link>
                  </div>
                </div>
                <div className="mt-4">
                  <Link to="/requests" className="w-full inline-block text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors duration-200">
                    Manage All Service Requests
                  </Link>
                </div>
              </div>

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
                    <p className="text-xs text-gray-600 mb-2">Schedule for this week's vaccination program at the community center.</p>
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors flex justify-between items-center">
                    <span>Financial Summary</span>
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OfficialDashboard; 