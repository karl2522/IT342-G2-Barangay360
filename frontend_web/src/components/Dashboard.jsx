import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex w-full">
      {/* Sidebar */}
      <Sidebar isOfficial={false} />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ml-64`}>
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-[#861A2D]">Resident Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Welcome,</span>
                <span className="text-sm font-medium text-[#861A2D]">{user?.username}</span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Resident</span>
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
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user?.firstName || user?.username}!</h2>
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
                <h3 className="text-lg font-medium text-[#861A2D] mb-2">Quick Services</h3>
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
                <Link to="/services" className="mt-4 inline-block px-4 py-2 bg-[#861A2D] text-white rounded-md hover:bg-[#9b3747] transition-colors text-sm">
                  Request a service
                </Link>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <h3 className="text-lg font-medium text-[#861A2D] mb-2">My Requests</h3>
                <p className="text-gray-600 mb-4">Track the status of your service requests.</p>
                
                <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No requests</h3>
                  <p className="mt-1 text-sm text-gray-500">You haven't submitted any requests yet.</p>
                  <Link to="/services" className="mt-4 inline-block text-sm text-[#861A2D] hover:text-[#9b3747]">
                    Submit a new request
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
              <h3 className="text-lg font-medium text-[#861A2D] mb-2">Community Events Calendar</h3>
              <p className="text-gray-600 mb-4">Upcoming events in our barangay.</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Barangay Assembly</p>
                    <p className="text-xs text-gray-500">June 15, 2023 • 9:00 AM • Barangay Hall</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Upcoming</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Medical Mission</p>
                    <p className="text-xs text-gray-500">June 25, 2023 • 8:00 AM • Covered Court</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Upcoming</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Community Clean-up</p>
                    <p className="text-xs text-gray-500">July 2, 2023 • 7:00 AM • Meeting point: Barangay Hall</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Volunteer</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 