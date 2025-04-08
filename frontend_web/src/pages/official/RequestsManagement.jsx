import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import Sidebar from '../../components/layout/Sidebar.jsx';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { useToast } from '../../contexts/ToastContext';
import TopNavigation from '../../components/layout/TopNavigation';

const RequestsManagement = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [requestCounts, setRequestCounts] = useState({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0
  });
  const [rejectionRequest, setRejectionRequest] = useState(null);

  useEffect(() => {
    loadServiceRequests();
  }, []);

  const loadServiceRequests = async () => {
    setLoading(true);
    try {
      const data = await serviceRequestService.getAllServiceRequests();
      
      // Sort requests with newest first (by createdAt date)
      const sortedData = [...data].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setRequests(sortedData);
      
      // Count requests by status
      const counts = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0
      };
      
      sortedData.forEach(request => {
        if (counts[request.status] !== undefined) {
          counts[request.status]++;
        }
      });
      
      setRequestCounts(counts);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showToast('Failed to load service requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    return request.status === activeTab;
  });

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
  };

  const handleCloseRequest = () => {
    setSelectedRequest(null);
  };

  const handleApproveRequest = async (requestId) => {
    setProcessing(true);
    try {
      await serviceRequestService.updateServiceRequestStatus(requestId, 'APPROVED');
      showToast('Request approved successfully', 'success');
      loadServiceRequests();
      handleCloseRequest();
    } catch (error) {
      console.error('Error approving request:', error);
      showToast('Failed to approve request', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!rejectionReason.trim()) {
      showToast('Rejection reason is required', 'error');
      return;
    }
    
    setProcessing(true);
    try {
      await serviceRequestService.updateServiceRequestStatus(requestId, 'REJECTED');
      showToast('Request rejected successfully', 'success');
      loadServiceRequests();
      setShowRejectionModal(false);
      setRejectionReason('');
      setRejectionRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      showToast('Failed to reject request', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex w-full">
      <Sidebar isOfficial={true} />
      
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Navigation */}
        <TopNavigation title="Service Requests Management" />
        
        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Tabs */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setActiveTab('PENDING')}
                    className={`${
                      activeTab === 'PENDING'
                        ? 'border-[#861A2D] text-[#861A2D]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } relative flex-1 min-w-0 py-4 px-4 border-b-2 font-medium text-sm text-center focus:outline-none`}
                  >
                    Pending
                    <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      {requestCounts.PENDING}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('APPROVED')}
                    className={`${
                      activeTab === 'APPROVED'
                        ? 'border-[#861A2D] text-[#861A2D]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } relative flex-1 min-w-0 py-4 px-4 border-b-2 font-medium text-sm text-center focus:outline-none`}
                  >
                    Approved
                    <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {requestCounts.APPROVED}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('REJECTED')}
                    className={`${
                      activeTab === 'REJECTED'
                        ? 'border-[#861A2D] text-[#861A2D]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } relative flex-1 min-w-0 py-4 px-4 border-b-2 font-medium text-sm text-center focus:outline-none`}
                  >
                    Rejected
                    <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      {requestCounts.REJECTED}
                    </span>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Requests List */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#861A2D]"></div>
                  <p className="mt-3 text-gray-600 font-medium">Loading service requests...</p>
                </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-16">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeTab.toLowerCase()} requests</h3>
                <p className="mt-1 text-sm text-gray-500">There are no {activeTab.toLowerCase()} service requests at this time.</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Service Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Requester</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Date Requested</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Status</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{request.serviceType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.residentName}</div>
                          <div className="text-xs text-gray-500">{request.residentEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{new Date(request.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{new Date(request.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-2">
                            {request.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApproveRequest(request.id)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  disabled={processing}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                  </svg>
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectionRequest(request);
                                    setShowRejectionModal(true);
                                  }}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  disabled={processing}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                                onClick={() => handleViewRequest(request)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-[#861A2D] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                              </svg>
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-[#861A2D]">Service Request Details</h3>
                <button
                  onClick={handleCloseRequest}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Service Type</h4>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.serviceType}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <p className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Requester</h4>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.residentName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Contact Number</h4>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.contactNumber || selectedRequest.residentPhone}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Email</h4>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.residentEmail}</p>
                </div>
                {selectedRequest.purpose && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Purpose</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.purpose}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Details</h4>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.details}</p>
                </div>
                {selectedRequest.address && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Address</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.address}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Request Date</h4>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedRequest.status === 'PENDING' && (
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowRejectionModal(true);
                    }}
                    className="px-4 py-2 bg-white border border-red-500 text-red-500 rounded hover:bg-red-50"
                    disabled={processing}
                  >
                    Reject Request
                  </button>
                  <button
                    onClick={() => handleApproveRequest(selectedRequest.id)}
                    className="px-4 py-2 bg-[#861A2D] text-white rounded hover:bg-[#9b3747]"
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Approve Request'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div>
              <div className="flex items-center justify-center">
                <svg className="h-12 w-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mt-4 text-center">Reject Request</h3>

              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to reject this request? This action cannot be undone.
                </p>

                <div className="mb-4">
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="rejectionReason"
                    rows="3"
                    placeholder="Please provide a reason for rejecting this request..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#861A2D] focus:border-[#861A2D] placeholder-gray-400"
                    required
                  />
                  {rejectionReason === '' && (
                    <p className="mt-1 text-sm text-red-600">Rejection reason is required</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => rejectionRequest && handleRejectRequest(rejectionRequest.id)}
                  disabled={!rejectionReason.trim() || processing}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    rejectionReason.trim() && !processing ? 'bg-red-600 hover:bg-red-700' : 'bg-red-400 cursor-not-allowed'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                >
                  {processing ? 'Processing...' : 'Reject'}
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