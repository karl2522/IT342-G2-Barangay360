import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { forumService } from '../../services/ForumService';
import { useToast } from '../../contexts/ToastContext';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

const ReportManagement = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedReportPost, setSelectedReportPost] = useState(null);
  const [reportToAction, setReportToAction] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ALL
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Function to get reports data from backend with proper authentication
  const getReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') ? JSON.parse(localStorage.getItem('token')).token : null;
      
      if (!token) {
        showToast('Authentication token not found', 'error');
        return;
      }
      
      let url = `http://localhost:8080/api/reports?page=${currentPage}&size=10`;
      if (statusFilter !== 'ALL') {
        url = `http://localhost:8080/api/reports/status/${statusFilter}?page=${currentPage}&size=10`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setReports(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching reports:', error);
      showToast('Error loading reports', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Load reports when component mounts or filter changes
  useEffect(() => {
    getReports();
  }, [currentPage, statusFilter]);
  
  // Function to handle viewing a report details
  const handleViewReport = async (report) => {
    setSelectedReport(report);
    
    try {
      // Fetch the post details
      const post = await forumService.getPostById(report.post.id);
      setSelectedReportPost(post);
    } catch (error) {
      console.error('Error fetching post details:', error);
      showToast('Error loading post details', 'error');
    }
  };
  
  // Function to close report details modal
  const handleCloseReportModal = () => {
    setSelectedReport(null);
    setSelectedReportPost(null);
  };
  
  // Function to show approve confirmation modal
  const handleShowApproveModal = (report) => {
    setReportToAction(report);
    setShowApproveModal(true);
  };
  
  // Function to show reject confirmation modal
  const handleShowRejectModal = (report) => {
    setReportToAction(report);
    setRejectionReason(''); // Reset rejection reason on modal open
    setShowRejectModal(true);
  };
  
  // Function to show delete post confirmation modal
  const handleShowDeleteModal = (report) => {
    setReportToAction(report);
    setShowDeleteModal(true);
  };
  
  // Function to cancel any action modal
  const handleCancelAction = () => {
    setReportToAction(null);
    setShowApproveModal(false);
    setShowRejectModal(false);
    setShowDeleteModal(false);
    setRejectionReason(''); // Reset rejection reason on cancel
  };
  
  // Function to update report status
  const updateReportStatus = async (reportId, newStatus, reason = null) => {
    try {
      const token = localStorage.getItem('token') ? JSON.parse(localStorage.getItem('token')).token : null;
      
      if (!token) {
        showToast('Authentication token not found', 'error');
        return;
      }
      
      let url = `http://localhost:8080/api/reports/${reportId}/status?status=${newStatus}`;
      let data = {};
      
      // Add rejection reason if provided
      if (reason) {
        data = { rejectionReason: reason };
      }
      
      await axios.put(url, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      showToast(`Report ${newStatus.toLowerCase()} successfully`, 'success');
      
      // Update the local state
      setReports(reports.map(report => 
        report.id === reportId ? { 
          ...report, 
          status: newStatus,
          rejectionReason: reason || report.rejectionReason 
        } : report
      ));
      
      // Close modal if the status was updated for the selected report
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({ 
          ...selectedReport, 
          status: newStatus,
          rejectionReason: reason || selectedReport.rejectionReason 
        });
      }
      
      // Refresh reports list if filtering by status
      if (statusFilter !== 'ALL') {
        getReports();
      }
      
      // Reset action state
      handleCancelAction();
    } catch (error) {
      console.error(`Error updating report status to ${newStatus}:`, error);
      showToast(`Error updating report status`, 'error');
    }
  };
  
  // Function to handle report approval
  const handleApproveReport = () => {
    if (!reportToAction) return;
    updateReportStatus(reportToAction.id, 'APPROVED');
  };
  
  // Function to handle report rejection
  const handleRejectReport = () => {
    if (!reportToAction) return;
    if (!rejectionReason.trim()) {
      showToast('Please provide a reason for rejection', 'error');
      return;
    }
    updateReportStatus(reportToAction.id, 'REJECTED', rejectionReason);
  };
  
  // Function to delete a post based on an approved report
  const handleDeletePost = async () => {
    if (!reportToAction) return;
    
    try {
      await forumService.deletePost(reportToAction.post.id);
      showToast('Post deleted successfully', 'success');
      
      // Close modals
      setShowDeleteModal(false);
      setReportToAction(null);
      
      // Close report modal if open
      if (selectedReport && selectedReport.id === reportToAction.id) {
        setSelectedReport(null);
        setSelectedReportPost(null);
      }
      
      // Refresh reports list
      getReports();
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Error deleting post', 'error');
    }
  };
  
  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'some time ago';
    }
  };
  
  // Filter reports based on search term
  const filteredReports = reports.filter(report => {
    const searchContent = 
      (report.reason || '').toLowerCase() + 
      (report.post?.title || '').toLowerCase() + 
      (report.reporter?.firstName || '').toLowerCase() + 
      (report.reporter?.lastName || '').toLowerCase();
    
    return searchContent.includes(searchTerm.toLowerCase());
  });
  
  // Helper function to get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar isOfficial={true} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <h1 className="text-2xl font-semibold text-[#861A2D]">Report Management</h1>
        </header>

        {/* Header */}
        <div className="flex justify-between py-6 px-8">
          <div>
            <h2 className="text-lg font-medium text-gray-800">Content Reports</h2>
            <p className="mt-1 text-sm text-gray-600">Review and manage user-reported content from community forum</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
                onClick={getReports}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search reports by reason, post title, or reporter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#861A2D] focus:border-[#861A2D]"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(0); // Reset to first page when filter changes
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#861A2D] focus:border-[#861A2D]"
                >
                  <option value="ALL">All Reports</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#861A2D]"></div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-700">No reports found</h3>
                <p className="mt-1 text-sm text-gray-500">Try changing your search terms or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post Title</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {report.post?.title || 'Unknown post'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 truncate max-w-xs">
                            {report.reason || 'No reason provided'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-[#861A2D] text-white flex items-center justify-center font-bold">
                              {report.reporter?.firstName?.charAt(0) || 'U'}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {report.reporter?.firstName} {report.reporter?.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(report.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center justify-center space-x-2">
                            {report.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleShowApproveModal(report)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleShowRejectModal(report)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Reject
                                </button>
                                <button
                                    onClick={() => handleViewReport(report)}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-[#861A2D] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                  </svg>
                                  View
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{currentPage * 10 + 1}</span> to <span className="font-medium">{Math.min((currentPage + 1) * 10, totalPages * 10)}</span> of <span className="font-medium">{totalPages * 10}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {[...Array(totalPages).keys()].map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border ${currentPage === page ? 'bg-[#861A2D] text-white border-[#861A2D] z-10' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} text-sm font-medium`}
                        >
                          {page + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Report Details Modal */}
          {selectedReport && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">Report Details</h3>
                  <button
                    onClick={handleCloseReportModal}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] rounded-md p-1"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Report Info */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                      <svg className="h-5 w-5 text-[#861A2D] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Report Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Report ID</p>
                        <p className="text-sm font-medium text-gray-900">{selectedReport.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <div>{getStatusBadge(selectedReport.status)}</div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Reported By</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedReport.reporter?.firstName} {selectedReport.reporter?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date Reported</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(selectedReport.createdAt)}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Reason</p>
                        <p className="text-sm font-medium text-gray-900 bg-white p-2 rounded border border-gray-200 mt-1">
                          {selectedReport.reason || 'No reason provided'}
                        </p>
                      </div>
                      {/* Display rejection reason if available */}
                      {selectedReport.status === 'REJECTED' && selectedReport.rejectionReason && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500">Rejection Reason</p>
                          <p className="text-sm font-medium text-gray-900 bg-white p-2 rounded border border-gray-200 mt-1">
                            {selectedReport.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  {selectedReportPost && (
                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                        <svg className="h-5 w-5 text-[#861A2D] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        Reported Post
                      </h4>
                      <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center mb-4">
                          <div className="h-10 w-10 rounded-full bg-[#861A2D] text-white flex items-center justify-center font-bold mr-3">
                            {selectedReportPost.author?.firstName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedReportPost.author?.firstName} {selectedReportPost.author?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(selectedReportPost.createdAt)}
                            </p>
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{selectedReportPost.title}</h3>
                        <p className="text-gray-700 whitespace-pre-line mb-4">{selectedReportPost.content}</p>
                        {selectedReportPost.imageUrl && (
                          <div className="mb-4 border rounded-lg p-1 bg-gray-50">
                            <img
                              src={selectedReportPost.imageUrl}
                              alt={selectedReportPost.title}
                              className="max-h-96 rounded-lg mx-auto"
                            />
                          </div>
                        )}
                        
                        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            <span>{selectedReportPost.likes?.length || 0} likes</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{selectedReportPost.comments?.length || 0} comments</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-between">
                  <div>
                    {selectedReport.status === 'APPROVED' && (
                      <button
                        onClick={() => handleShowDeleteModal(selectedReport)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Post
                      </button>
                    )}
                  </div>
                  
                  {selectedReport.status === 'PENDING' && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleShowRejectModal(selectedReport)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                      >
                        <svg className="mr-2 h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject Report
                      </button>
                      <button
                        onClick={() => handleShowApproveModal(selectedReport)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#861A2D] hover:bg-[#9e2235] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Approve Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Approve Report Confirmation Modal */}
          {showApproveModal && reportToAction && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  
                  <h3 className="text-lg font-medium text-gray-900 mt-4">Approve Report</h3>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Are you sure you want to approve this report? This action will mark the content as inappropriate and may lead to its removal.
                    </p>
                  </div>
                  
                  <div className="mt-6 flex justify-center space-x-3">
                    <button
                      onClick={handleCancelAction}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApproveReport}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Reject Report Confirmation Modal */}
          {showRejectModal && reportToAction && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div>
                  <div className="flex items-center justify-center">
                    <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mt-4 text-center">Reject Report</h3>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Are you sure you want to reject this report? This action will mark the reported content as appropriate and it will remain visible to users.
                    </p>
                    
                    <div className="mb-4">
                      <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Rejection <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="rejectionReason"
                        rows="3"
                        placeholder="Please provide a reason for rejecting this report..."
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
                      onClick={handleCancelAction}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRejectReport}
                      disabled={!rejectionReason.trim()}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        rejectionReason.trim() ? 'bg-red-600 hover:bg-red-700' : 'bg-red-400 cursor-not-allowed'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Delete Post Confirmation Modal */}
          {showDeleteModal && reportToAction && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  
                  <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Post</h3>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Are you sure you want to delete this post? This action cannot be undone and all associated data will be permanently removed.
                    </p>
                  </div>
                  
                  <div className="mt-6 flex justify-center space-x-3">
                    <button
                      onClick={handleCancelAction}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ReportManagement; 