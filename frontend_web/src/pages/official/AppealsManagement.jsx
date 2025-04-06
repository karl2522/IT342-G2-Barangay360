import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Sidebar from '../../components/layout/Sidebar';
import TopNavigation from '../../components/layout/TopNavigation';
import { useNavigate } from 'react-router-dom';

// Helper function for status badges (similar to RequestsManagement)
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

const AppealsManagement = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appealCounts, setAppealCounts] = useState({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0
  });
  const { handleApiRequest, hasRole } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasRole('OFFICIAL') && !hasRole('ADMIN')) {
      showToast('Unauthorized access', 'error');
      navigate('/');
      return;
    }
    fetchAppeals();
  }, [hasRole, navigate, showToast]);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      const response = await handleApiRequest('http://localhost:8080/api/appeals', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        const sortedData = [...data].sort((a, b) => new Date(b.appealDate) - new Date(a.appealDate));
        setAppeals(sortedData);

        // Calculate counts
        const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
        sortedData.forEach(appeal => {
          // Ensure status matches expected enum/string values
          const status = appeal.status?.toUpperCase(); 
          if (counts[status] !== undefined) {
            counts[status]++;
          }
        });
        setAppealCounts(counts);

      } else {
        throw new Error('Failed to fetch appeals');
      }
    } catch (error) {
      console.error('Error fetching appeals:', error);
      showToast('Failed to fetch appeals', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter appeals based on active tab
  const filteredAppeals = appeals.filter(appeal => appeal.status === activeTab);

  const handleViewDetails = (appeal) => {
    setSelectedAppeal(appeal);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedAppeal(null);
  };

  const triggerApproveModal = () => {
    setShowDetailsModal(false);
    setShowApproveModal(true);
  };

  const triggerRejectModal = () => {
    setShowDetailsModal(false);
    setShowRejectModal(true);
  };

  const handleApproveAppeal = async () => {
    if (!selectedAppeal) return;
    const appealId = selectedAppeal.id;
    try {
      setIsSubmitting(true);
      const response = await handleApiRequest(`http://localhost:8080/api/appeals/${appealId}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        showToast('Appeal approved successfully', 'success');
        fetchAppeals();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to approve appeal');
      }
    } catch (error) {
      console.error('Error approving appeal:', error);
      showToast(error.message || 'Failed to approve appeal', 'error');
    } finally {
      setIsSubmitting(false);
      setShowApproveModal(false);
      setSelectedAppeal(null);
    }
  };

  const handleRejectAppeal = async () => {
    if (!selectedAppeal) return;
    const appealId = selectedAppeal.id;
    try {
      setIsSubmitting(true);
      const response = await handleApiRequest(`http://localhost:8080/api/appeals/${appealId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        showToast('Appeal rejected successfully', 'success');
        fetchAppeals();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reject appeal');
      }
    } catch (error) {
      console.error('Error rejecting appeal:', error);
      showToast(error.message || 'Failed to reject appeal', 'error');
    } finally {
      setIsSubmitting(false);
      setShowRejectModal(false);
      setSelectedAppeal(null);
    }
  };

  const AppealDetailsModal = ({ show, onClose, appeal }) => {
    if (!show || !appeal) return null;
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Appeal Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div className="p-6 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
             <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
               <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Username</dt><dd className="mt-1 text-sm text-gray-900">{appeal.username}</dd></div>
               <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Date Submitted</dt><dd className="mt-1 text-sm text-gray-900">{new Date(appeal.appealDate).toLocaleString()}</dd></div>
               <div className="sm:col-span-2"><dt className="text-sm font-medium text-gray-500">Status</dt><dd className="mt-1 text-sm text-gray-900"><span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appeal.status)}`}>{appeal.status}</span></dd></div>
               <div className="sm:col-span-2"><dt className="text-sm font-medium text-gray-500">Appeal Message</dt><dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-wrap">{appeal.message}</dd></div>
            </dl>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
             <button type="button" onClick={onClose} className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]">Close</button>
            {appeal.status === 'PENDING' && (
                <>
                    <button type="button" onClick={triggerRejectModal} className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50" disabled={isSubmitting}>Reject</button>
                    <button type="button" onClick={triggerApproveModal} className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50" disabled={isSubmitting}>Approve</button>
                </>
            )}
           </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex w-full">
        <Sidebar isOfficial={true} />
        <div className="flex-1 flex flex-col ml-64">
          <TopNavigation title="Appeals Management" />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#861A2D]"></div>
              <p className="mt-3 text-gray-600 font-medium">Loading appeals...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex w-full">
      <Sidebar isOfficial={true} />
      <div className="flex-1 flex flex-col ml-64">
        <TopNavigation title="Appeals Management" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  {['PENDING', 'APPROVED', 'REJECTED'].map((tabStatus) => (
                    <button
                      key={tabStatus}
                      onClick={() => setActiveTab(tabStatus)}
                      className={`relative flex-1 min-w-0 py-4 px-4 border-b-2 font-medium text-sm text-center focus:outline-none ${
                        activeTab === tabStatus
                          ? 'border-[#861A2D] text-[#861A2D]'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tabStatus.charAt(0) + tabStatus.slice(1).toLowerCase()}
                      <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${getStatusBadgeClass(tabStatus)}`}>
                        {appealCounts[tabStatus]}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {filteredAppeals.length === 0 ? (
              <div className="text-center py-16">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeTab.toLowerCase()} appeals</h3>
                <p className="mt-1 text-sm text-gray-500">There are currently no appeals with the status {activeTab}.</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Submitted</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAppeals.map((appeal) => (
                      <tr key={appeal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{appeal.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{new Date(appeal.appealDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appeal.status)}`}>
                            {appeal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          {appeal.status === 'PENDING' ? (
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedAppeal(appeal);
                                  setShowApproveModal(true);
                                }}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                title="Approve Appeal"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAppeal(appeal);
                                  setShowRejectModal(true);
                                }}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                title="Reject Appeal"
                              >
                                 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                 </svg>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <button
                                onClick={() => handleViewDetails(appeal)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                                title="View Details"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                                View
                            </button>
                          )}
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

      <AppealDetailsModal
        show={showDetailsModal}
        onClose={handleCloseDetails}
        appeal={selectedAppeal}
      />

      {showApproveModal && selectedAppeal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              
              <h3 className="text-lg font-medium text-gray-900 mt-4">Approve Appeal</h3>
              
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Are you sure you want to approve the appeal for <strong>{selectedAppeal.username}</strong>? This will reactivate their account.
                </p>
              </div>
              
              <div className="mt-6 flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedAppeal(null);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveAppeal}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  {isSubmitting ? 'Approving...' : 'Confirm Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedAppeal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              
              <h3 className="text-lg font-medium text-gray-900 mt-4">Reject Appeal</h3>
              
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-600">
                  Are you sure you want to reject the appeal for <strong>{selectedAppeal.username}</strong>? This action cannot be undone.
                </p>
              </div>
              
              <div className="mt-6 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowRejectModal(false); setSelectedAppeal(null); }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectAppeal}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                   {isSubmitting ? 'Rejecting...' : 'Confirm Reject'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppealsManagement; 