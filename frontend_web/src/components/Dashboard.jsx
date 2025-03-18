import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const Dashboard = () => {
  const { user, logout, hasRole } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex w-full">
      {/* Sidebar */}
      <Sidebar hasRole={hasRole} />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ml-64`}>
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-[#861A2D]">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Welcome,</span>
                <span className="text-sm font-medium text-[#861A2D]">{user?.username}</span>
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
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user?.username}!</h2>
              <p className="text-gray-600">
                This is your Barangay360 dashboard. Here you can access all community services and stay updated with the latest announcements.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <h3 className="text-lg font-medium text-[#861A2D] mb-2">Latest Announcements</h3>
                <p className="text-gray-600 mb-4">Stay updated with the latest barangay announcements and events.</p>
                <div className="p-3 bg-gray-50 rounded-md mb-2 border border-gray-200">
                  <p className="text-sm text-gray-800">COVID-19 vaccination schedule for this week.</p>
                  <p className="text-xs text-gray-500 mt-1">Posted 2 days ago</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm text-gray-800">Monthly clean-up drive this Saturday.</p>
                  <p className="text-xs text-gray-500 mt-1">Posted 3 days ago</p>
                </div>
                <Link to="/announcements" className="mt-4 inline-block text-sm text-[#861A2D] hover:underline">
                  View all announcements →
                </Link>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <h3 className="text-lg font-medium text-[#861A2D] mb-2">Services</h3>
                <p className="text-gray-600 mb-4">Request certificates, permits, and other barangay services.</p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <svg className="h-5 w-5 text-[#861A2D] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Barangay Certificate
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg className="h-5 w-5 text-[#861A2D] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Business Permit
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg className="h-5 w-5 text-[#861A2D] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Barangay Clearance
                  </li>
                </ul>
                <Link to="/services" className="mt-4 inline-block text-sm text-[#861A2D] hover:underline">
                  Request a service →
                </Link>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <h3 className="text-lg font-medium text-[#861A2D] mb-2">Community</h3>
                <p className="text-gray-600 mb-4">Connect with your community and participate in discussions.</p>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md mb-2 border border-gray-200">
                  <span className="text-sm font-medium text-gray-800">Community Forum</span>
                  <span className="bg-[#861A2D] bg-opacity-10 text-[#861A2D] text-xs px-2 py-1 rounded-full">12 new posts</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                  <span className="text-sm font-medium text-gray-800">Community Projects</span>
                  <span className="bg-[#861A2D] bg-opacity-10 text-[#861A2D] text-xs px-2 py-1 rounded-full">3 active</span>
                </div>
                <Link to="/community" className="mt-4 inline-block text-sm text-[#861A2D] hover:underline">
                  Join the community →
                </Link>
              </div>
            </div>

            {hasRole('ROLE_OFFICIAL') && (
              <div className="mt-8 bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <h3 className="text-lg font-medium text-[#861A2D] mb-2">Official&apos;s Portal</h3>
                <p className="text-gray-600 mb-4">Manage community announcements and requests.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h4 className="font-medium text-gray-800">Pending Requests</h4>
                    <p className="text-sm text-gray-600 mt-1">8 pending certificate requests</p>
                    <button className="mt-2 text-sm text-[#861A2D] hover:underline">View all</button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h4 className="font-medium text-gray-800">Create Announcement</h4>
                    <p className="text-sm text-gray-600 mt-1">Post new updates to the community</p>
                    <button className="mt-2 text-sm text-[#861A2D] hover:underline">Create new</button>
                  </div>
                </div>
              </div>
            )}

            {hasRole('ROLE_ADMIN') && (
              <div className="mt-8 bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <h3 className="text-lg font-medium text-[#861A2D] mb-2">Admin Panel</h3>
                <p className="text-gray-600 mb-4">System administration and user management.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h4 className="font-medium text-gray-800">User Management</h4>
                    <p className="text-sm text-gray-600 mt-1">Manage user accounts and roles</p>
                    <button className="mt-2 text-sm text-[#861A2D] hover:underline">Manage users</button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h4 className="font-medium text-gray-800">System Logs</h4>
                    <p className="text-sm text-gray-600 mt-1">View system activity and logs</p>
                    <button className="mt-2 text-sm text-[#861A2D] hover:underline">View logs</button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h4 className="font-medium text-gray-800">Barangay Settings</h4>
                    <p className="text-sm text-gray-600 mt-1">Configure barangay information</p>
                    <button className="mt-2 text-sm text-[#861A2D] hover:underline">Settings</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 