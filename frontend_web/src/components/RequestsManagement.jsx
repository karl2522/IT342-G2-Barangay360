import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const RequestsManagement = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Mock data for service requests
  const mockRequests = [
    {
      id: '1001',
      serviceType: 'certificate',
      serviceName: 'Barangay Certificate',
      userId: '101',
      username: 'john_doe',
      fullName: 'John Doe',
      status: 'pending',
      requestDate: '2023-06-15T10:30:00Z',
      purpose: 'Employment',
      details: 'Needed for job application at ABC Company',
      contactNumber: '+63 912 345 6789',
      address: '123 Main St, Barangay Example, City',
      createdAt: '2023-06-14T08:45:00Z',
    },
    {
      id: '1002',
      serviceType: 'clearance',
      serviceName: 'Barangay Clearance',
      userId: '102',
      username: 'maria_santos',
      fullName: 'Maria Santos',
      status: 'pending',
      requestDate: '2023-06-16T14:00:00Z',
      purpose: 'School Requirement',
      details: 'Required for school enrollment',
      contactNumber: '+63 923 456 7890',
      address: '456 Oak St, Barangay Example, City',
      createdAt: '2023-06-14T09:30:00Z',
    },
    {
      id: '1003',
      serviceType: 'business-permit',
      serviceName: 'Business Permit',
      userId: '103',
      username: 'james_wilson',
      fullName: 'James Wilson',
      status: 'approved',
      requestDate: '2023-06-17T11:00:00Z',
      purpose: 'Business',
      details: 'Opening a small convenience store',
      contactNumber: '+63 934 567 8901',
      address: '789 Pine St, Barangay Example, City',
      createdAt: '2023-06-14T10:15:00Z',
      processedBy: 'admin1',
      processedDate: '2023-06-15T13:45:00Z',
    },
    {
      id: '1004',
      serviceType: 'id-card',
      serviceName: 'Barangay ID Card',
      userId: '104',
      username: 'anna_cruz',
      fullName: 'Anna Cruz',
      status: 'rejected',
      requestDate: '2023-06-18T09:00:00Z',
      purpose: 'Personal',
      details: 'For general identification',
      contactNumber: '+63 945 678 9012',
      address: '321 Maple St, Barangay Example, City',
      createdAt: '2023-06-14T11:00:00Z',
      processedBy: 'admin1',
      processedDate: '2023-06-15T14:30:00Z',
      rejectionReason: 'Incomplete information provided. Please submit complete identification documents.',
    },
    {
      id: '1005',
      serviceType: 'clearance',
      serviceName: 'Barangay Clearance',
      userId: '105',
      username: 'robert_tan',
      fullName: 'Robert Tan',
      status: 'pending',
      requestDate: '2023-06-19T15:30:00Z',
      purpose: 'Bank Requirement',
      details: 'For loan application',
      contactNumber: '+63 956 789 0123',
      address: '567 Cedar St, Barangay Example, City',
      createdAt: '2023-06-14T13:20:00Z',
    },
  ];

  useEffect(() => {
    // In a real app, you would fetch data from an API
    // For this example, we'll use the mock data
    setLoading(true);
    try {
      // Simulate API delay
      setTimeout(() => {
        setRequests(mockRequests);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to load service requests');
      setLoading(false);
    }
  }, []);

  const filteredRequests = requests.filter(request => {
    return request.status === activeTab;
  });

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
  };

  const handleCloseRequest = () => {
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const handleApproveRequest = async (requestId) => {
    setProcessing(true);
    try {
      // In a real app, you would make an API call here
      // For this example, we'll update the local state

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update local state
      const updatedRequests = requests.map(request => 
        request.id === requestId 
          ? { 
              ...request, 
              status: 'approved', 
              processedBy: user?.username,
              processedDate: new Date().toISOString()
            } 
          : request
      );
      
      setRequests(updatedRequests);
      setSelectedRequest(null);
      setSuccessMessage('Request approved successfully');
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error approving request:', error);
      setError('Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenRejectionModal = () => {
    setShowRejectionModal(true);
  };

  const handleRejectRequest = async (requestId) => {
    if (!rejectionReason.trim()) {
      return;
    }
    
    setProcessing(true);
    try {
      // In a real app, you would make an API call here
      // For this example, we'll update the local state

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update local state
      const updatedRequests = requests.map(request => 
        request.id === requestId 
          ? { 
              ...request, 
              status: 'rejected', 
              processedBy: user?.username,
              processedDate: new Date().toISOString(),
              rejectionReason
            } 
          : request
      );
      
      setRequests(updatedRequests);
      setSelectedRequest(null);
      setRejectionReason('');
      setShowRejectionModal(false);
      setSuccessMessage('Request rejected successfully');
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTabClass = (tab) => {
    return activeTab === tab
      ? 'border-[#861A2D] text-[#861A2D] whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm';
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
            <h1 className="text-2xl font-semibold text-[#861A2D]">Service Requests Management</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Welcome,</span>
                <span className="text-sm font-medium text-[#861A2D]">{user?.username}</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Official</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    className={getTabClass('pending')}
                    onClick={() => setActiveTab('pending')}
                  >
                    Pending
                    <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      {requests.filter(r => r.status === 'pending').length}
                    </span>
                  </button>
                  <button
                    className={getTabClass('approved')}
                    onClick={() => setActiveTab('approved')}
                  >
                    Approved
                  </button>
                  <button
                    className={getTabClass('rejected')}
                    onClick={() => setActiveTab('rejected')}
                  >
                    Rejected
                  </button>
                </nav>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-[#861A2D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-500">Loading requests...</span>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeTab} requests</h3>
                  <p className="mt-1 text-sm text-gray-500">There are no {activeTab} service requests at this time.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Request ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requester
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Request Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purpose
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{request.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.serviceName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.fullName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(request.requestDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.purpose}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleViewRequest(request)}
                              className="text-[#861A2D] hover:text-[#9b3747]"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-gray-900">
                Request Details - #{selectedRequest.id}
              </h3>
              <button
                type="button"
                onClick={handleCloseRequest}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Service Type</h4>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.serviceName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <p className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedRequest.status)}`}>
                      {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </span>
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Requester</h4>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.fullName} ({selectedRequest.username})</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Contact Number</h4>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.contactNumber}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Address</h4>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.address}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Purpose</h4>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.purpose}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Request Date</h4>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.requestDate)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Date Submitted</h4>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500">Additional Details</h4>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200">
                  {selectedRequest.details || 'No additional details provided.'}
                </p>
              </div>

              {selectedRequest.status === 'rejected' && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500">Rejection Reason</h4>
                  <p className="mt-1 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}

              {selectedRequest.status === 'approved' && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500">Processed By</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.processedBy} on {formatDate(selectedRequest.processedDate)}
                  </p>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={handleOpenRejectionModal}
                    disabled={processing}
                    className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Reject Request
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveRequest(selectedRequest.id)}
                    disabled={processing}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                  >
                    {processing ? 'Processing...' : 'Approve Request'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Provide Rejection Reason</h3>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  id="rejectionReason"
                  name="rejectionReason"
                  rows={4}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#861A2D] focus:border-[#861A2D]"
                  placeholder="Please provide a reason for rejecting this request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowRejectionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectRequest(selectedRequest.id)}
                  disabled={processing || !rejectionReason.trim()}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Submit Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsManagement; 