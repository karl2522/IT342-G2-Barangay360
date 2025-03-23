import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import Sidebar from '../../components/layout/Sidebar.jsx';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { webSocketService } from '../../services/WebSocketService';

const ResidentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceType, setServiceType] = useState('');
  const [details, setDetails] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Connect to WebSocket
    webSocketService.connect();

    // Load user's requests
    loadUserRequests();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  const loadUserRequests = async () => {
    setIsLoading(true);
    try {
      const data = await serviceRequestService.getServiceRequestsByUserId(user.id);
      // Sort requests with newest first
      const sortedData = [...data].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setMyRequests(sortedData);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSubmitServiceRequest = async (e) => {
    e.preventDefault();
    try {
      await serviceRequestService.createServiceRequest({
        serviceType,
        details,
        userId: user.id
      });
      setServiceType('');
      setDetails('');
      setShowServiceForm(false);
      loadUserRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
    }
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
                <button
                  onClick={() => setShowServiceForm(true)}
                  className="w-full mt-4 px-4 py-2 bg-[#861A2D] text-white rounded-md hover:bg-[#9b3747] transition-colors text-sm"
                >
                  Request a service
                </button>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <h3 className="text-lg font-medium text-[#861A2D] mb-2">My Requests</h3>
                <p className="text-gray-600 mb-4">Track the status of your service requests.</p>

                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#861A2D]"></div>
                  </div>
                ) : myRequests.length > 0 ? (
                  <div className="space-y-3">
                    {/* Only show the first 3 requests */}
                    {myRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-3 bg-gray-50 rounded-md border border-gray-200 hover:shadow-sm transition-all duration-200">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-800">{request.serviceType}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs rounded-full ${
                            request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {request.status === 'PENDING' && (
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                            )}
                            {request.status === 'APPROVED' && (
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                            {request.status === 'REJECTED' && (
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            )}
                            {request.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Requested on {new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                    
                    {/* View More button */}
                    <Link 
                      to="/services"
                      className="mt-3 w-full inline-block text-center py-2 px-4 border border-[#861A2D] rounded-md text-sm font-medium text-[#861A2D] bg-white hover:bg-[#861A2D] hover:text-white transition-colors duration-200"
                    >
                      View All Requests
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-md border border-gray-200">
                    <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No requests</h3>
                    <p className="mt-1 text-xs text-gray-500">You haven&apos;t submitted any requests yet.</p>
                    <Link 
                      to="/resident/request" 
                      className="mt-3 inline-block py-2 px-4 border border-[#861A2D] rounded-md text-xs font-medium text-[#861A2D] hover:bg-[#861A2D] hover:text-white transition-colors duration-200"
                    >
                      Make a Request
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Service Request Form Modal */}
            {showServiceForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-lg font-medium text-[#861A2D] mb-4">Submit Service Request</h3>
                  <form onSubmit={handleSubmitServiceRequest}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Type
                      </label>
                      <select
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#861A2D]"
                        required
                      >
                        <option value="">Select a service</option>
                        <option value="Barangay Certificate">Barangay Certificate</option>
                        <option value="Business Permit">Business Permit</option>
                        <option value="Barangay Clearance">Barangay Clearance</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Details
                      </label>
                      <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#861A2D]"
                        rows="4"
                        required
                      ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowServiceForm(false)}
                        className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#861A2D] text-white rounded-md hover:bg-[#9b3747] transition-colors text-sm"
                      >
                        Submit Request
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

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

export default ResidentDashboard;