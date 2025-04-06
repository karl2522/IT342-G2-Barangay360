import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { forumService } from '../../services/ForumService';
import { useToast } from '../../contexts/ToastContext';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import TopNavigation from '../../components/layout/TopNavigation';

const ReportManagement = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedReportPost, setSelectedReportPost] = useState(null);
  const [selectedReportComment, setSelectedReportComment] = useState(null);
  const [reportToAction, setReportToAction] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ALL
  const [rejectionReason, setRejectionReason] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('ALL'); // ALL, POST, COMMENT
  const [manualDeletionInfo, setManualDeletionInfo] = useState(null);
  const { user, handleApiRequest } = useContext(AuthContext);
  
  // Function to get reports data from backend with proper authentication
  const getReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') ? JSON.parse(localStorage.getItem('token')).token : null;
      
      if (!token) {
        showToast('Authentication token not found', 'error');
        return;
      }
      
      // Use the combined all reports endpoint instead of separate endpoints
      let url = `http://localhost:8080/api/reports/all?page=${currentPage}&size=10`;
      
      // Apply filters
      if (statusFilter !== 'ALL') {
        url = `${url}&status=${statusFilter}`;
      }
      
      if (reportTypeFilter !== 'ALL') {
        url = `${url}&type=${reportTypeFilter}`;
      }
      
      console.log('Fetching reports from URL:', url);
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Reports API response:', response.data);
      setReports(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching reports:', error);
      showToast('Error loading reports', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Load reports when component mounts or filters change
  useEffect(() => {
    getReports();
  }, [currentPage, statusFilter, reportTypeFilter]);
  
  // Helper function to check if a report is for a comment
  const isCommentReport = (report) => {
    return report && report.comment;
  };

  // Helper function to check if a report is for a post
  const isPostReport = (report) => {
    return report && report.post;
  };

  // Function to handle viewing a report details
  const handleViewReport = async (report) => {
    setSelectedReport(report);
    setSelectedReportPost(null);
    setSelectedReportComment(null);
    
    try {
      console.log('Viewing report details:', report);
      
      // Determine report type and fetch corresponding content
      if (isPostReport(report)) {
        // This is a post report
        console.log('Fetching post details for report ID:', report.id);
        const post = await forumService.getPostById(report.post.id);
        setSelectedReportPost(post);
      } else if (isCommentReport(report)) {
        // This is a comment report
        // Fetch the comment and its parent post
        console.log('Fetching comment details for report ID:', report.id);
        const comment = await getCommentDetails(report.comment.id);
        setSelectedReportComment(comment);
        
        // If we have a parent post ID, fetch the post too for context
        if (comment && comment.postId) {
          console.log('Fetching parent post details for comment ID:', comment.id);
          const post = await forumService.getPostById(comment.postId);
          setSelectedReportPost(post);
        }
      }
    } catch (error) {
      console.error('Error fetching report content details:', error);
      showToast('Error loading content details', 'error');
    }
  };
  
  // Helper function to get comment details
  const getCommentDetails = async (commentId) => {
    try {
      const token = localStorage.getItem('token') ? JSON.parse(localStorage.getItem('token')).token : null;
      
      if (!token) {
        showToast('Authentication token not found', 'error');
        return null;
      }
      
      console.log('Fetching comment details for comment ID:', commentId);
      const response = await axios.get(`http://localhost:8080/api/comments/${commentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Comment details response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching comment with id ${commentId}:`, error);
      showToast('Error loading comment details', 'error');
      return null;
    }
  };
  
  // Function to close report details modal
  const handleCloseReportModal = () => {
    setSelectedReport(null);
    setSelectedReportPost(null);
    setSelectedReportComment(null);
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
  
  // Function to cancel any action modal
  const handleCancelAction = () => {
    setReportToAction(null);
    setShowApproveModal(false);
    setShowRejectModal(false);
    setRejectionReason(''); // Reset rejection reason on cancel
  };
  
  // Function to update report status - handle both post and comment reports
  const updateReportStatus = async (reportId, newStatus, reason = null) => {
    try {
      const token = localStorage.getItem('token') ? JSON.parse(localStorage.getItem('token')).token : null;
      
      if (!token) {
        showToast('Authentication token not found', 'error');
        return Promise.reject('No token found');
      }
      
      // Determine the correct URL based on report type
      let url;
      let reportType = 'content';
      
      if (reportToAction && isCommentReport(reportToAction)) {
        // Comment report
        reportType = 'comment';
        url = `http://localhost:8080/api/reports/comment/${reportId}/status?status=${newStatus}`;
        if (reason) {
          url += `&rejectionReason=${encodeURIComponent(reason)}`;
        }
      } else {
        // Post report (default)
        reportType = 'post';
        url = `http://localhost:8080/api/reports/${reportId}/status?status=${newStatus}`;
        if (reason) {
          url += `&rejectionReason=${encodeURIComponent(reason)}`;
        }
      }
      
      console.log(`Updating ${reportType} report status with URL:`, url);
      
      const response = await axios.put(url, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Status update response:', response.data);
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
      
      // Return the response for further processing
      return response.data;
    } catch (error) {
      console.error(`Error updating report status to ${newStatus}:`, error);
      showToast(`Error updating report status`, 'error');
      return Promise.reject(error);
    }
  };
  
  // Helper function to refresh the token
  const refreshToken = () => {
    // Get the current token object 
    const tokenString = localStorage.getItem('token');
    if (!tokenString) {
      showToast('No token found. Please log in again.', 'error');
      return false;
    }
    
    try {
      const tokenObj = JSON.parse(tokenString);
      
      // Add a timestamp to force token refresh
      tokenObj.refreshedAt = new Date().getTime();
      
      // Clear and re-set token
      localStorage.removeItem('token');
      
      // Wait a moment to ensure the token is cleared
      setTimeout(() => {
        localStorage.setItem('token', JSON.stringify(tokenObj));
        console.log('Token refreshed with timestamp');
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };
  
  // Function to handle report approval
  const handleApproveReport = async () => {
    if (!reportToAction) return;
    
    try {
      // Refresh the token before starting the approval process
      refreshToken();
      
      // Give the token refresh a moment to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // First approve the report
      await updateReportStatus(reportToAction.id, 'APPROVED');
      
      // Then delete the content using our specialized method for reported content
      console.log('Deleting content after report approval using specialized API:', reportToAction);
      
      // Determine the content type based on report
      const contentType = isPostReport(reportToAction) ? 'post' : 'comment';
      const contentId = isPostReport(reportToAction) ? reportToAction.post.id : reportToAction.comment.id;
      
      // Try to delete through the reports API first (this is a more direct approach)
      const deleteResult = await forumService.deleteReportedContent(
        reportToAction.id, 
        contentType
      );
      
      if (deleteResult.success) {
        showToast(`${contentType === 'post' ? 'Post' : 'Comment'} deleted successfully after report approval`, 'success');
        setManualDeletionInfo(null); // Clear any previous manual deletion info
      } else {
        // If specialized deletion fails, try the regular methods as fallback
        console.warn('Specialized deletion failed, attempting regular methods');
        
        let regularDeleteResult;
        
        if (contentType === 'post') {
          // Try regular post deletion
          regularDeleteResult = await forumService.deletePost(reportToAction.post.id);
        } else {
          // Try regular comment deletion
          regularDeleteResult = await forumService.deleteComment(reportToAction.comment.id);
        }
        
        if (regularDeleteResult.success) {
          showToast(`${contentType === 'post' ? 'Post' : 'Comment'} deleted successfully using standard method`, 'success');
          setManualDeletionInfo(null); // Clear any previous manual deletion info
        } else {
          // If that fails too, try the simple delete method as a last resort
          const simpleDeleteResult = await forumService.simpleDelete(
            contentType === 'post' ? 'posts' : 'comments',
            contentType === 'post' ? reportToAction.post.id : reportToAction.comment.id
          );
          
          if (simpleDeleteResult.success) {
            showToast(`${contentType === 'post' ? 'Post' : 'Comment'} deleted successfully using alternative method`, 'success');
            setManualDeletionInfo(null); // Clear any previous manual deletion info
          } else {
            // All deletion attempts failed - provide manual deletion option
            console.error('All deletion methods failed', {
              specializedResult: deleteResult,
              regularResult: regularDeleteResult,
              simpleResult: simpleDeleteResult
            });
            
            // Generate manual deletion link
            const manualLink = generateManualDeletionLink(contentType, contentId);
            
            setManualDeletionInfo({
              reportId: reportToAction.id,
              contentType: contentType,
              contentId: contentId,
              link: manualLink
            });
            
            showToast(`Report approved, but automatic deletion failed. Manual deletion may be required.`, 'warning');
          }
        }
      }
      
      // Close report modal if open
      if (selectedReport && selectedReport.id === reportToAction.id) {
        setSelectedReport(null);
        setSelectedReportPost(null);
        setSelectedReportComment(null);
      }
      
      // Refresh reports list
      getReports();
    } catch (error) {
      console.error('Error in approval process:', error);
      showToast(`Error during report approval process`, 'error');
    }
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
      (report.comment?.content || '').toLowerCase() + 
      (report.reporter?.firstName || '').toLowerCase() + 
      (report.reporter?.lastName || '').toLowerCase();
    
    return searchContent.includes(searchTerm.toLowerCase());
  });
  
  // Helper function to get content type badge
  const getContentTypeBadge = (report) => {
    if (report.comment) {
      return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Comment</span>;
    } else if (report.post) {
      return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Post</span>;
    } else {
      return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

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

  // Get content description for report modal title
  const getReportContentDescription = () => {
    if (!selectedReport) return '';
    
    if (isPostReport(selectedReport)) {
      return 'Post';
    } else if (isCommentReport(selectedReport)) {
      return 'Comment';
    }
    
    return 'Content';
  };

  // Helper function to handle filtering the report table
  const applyFilters = () => {
    // Reset page when applying new filters
    setCurrentPage(0);
    getReports();
  };

  // Function to generate direct URL for manual deletion
  const generateManualDeletionLink = (contentType, contentId) => {
    // This will create a special URL that the admin can click to directly delete the content
    const token = localStorage.getItem('token') ? JSON.parse(localStorage.getItem('token')).token : null;
    if (!token) return null;
    
    const encodedToken = encodeURIComponent(token);
    return `http://localhost:8080/api/admin/${contentType}s/delete/${contentId}?token=${encodedToken}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar isOfficial={true} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <TopNavigation title="Report Management" />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search reports by reason, content, or reporter..."
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
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(0); // Reset to first page when filter changes
                      applyFilters(); // Apply the new filter
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#861A2D] focus:border-[#861A2D]"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-700 mr-2">Type:</label>
                  <select
                    value={reportTypeFilter}
                    onChange={(e) => {
                      setReportTypeFilter(e.target.value);
                      setCurrentPage(0); // Reset to first page when filter changes
                      applyFilters(); // Apply the new filter
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#861A2D] focus:border-[#861A2D]"
                  >
                    <option value="ALL">All Types</option>
                    <option value="POST">Posts</option>
                    <option value="COMMENT">Comments</option>
                  </select>
                </div>
                
                <button
                  onClick={applyFilters}
                  className="ml-2 px-3 py-2 bg-[#861A2D] text-white rounded-md hover:bg-[#9b3747] focus:outline-none"
                >
                  Apply Filters
                </button>
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReports.map((report) => (
                      <tr 
                        key={`${isCommentReport(report) ? 'comment' : 'post'}-report-${report.id}`} 
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getContentTypeBadge(report)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {report.post?.title || (report.comment ? 'Comment on post' : 'Unknown content')}
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
                      
                      {/* Pagination buttons */}
                      {[...Array(totalPages).keys()].map((page) => (
                        <button
                          key={`page-${page}`}
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
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl mx-auto my-8 w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="mr-2">{getReportContentDescription()} Report Details</span>
                    {getContentTypeBadge(selectedReport)}
                    {getStatusBadge(selectedReport.status)}
                  </h3>
                  <button
                    onClick={handleCloseReportModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto">
                  {/* Report Info */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                      <svg className="h-5 w-5 text-[#861A2D] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Report Information
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Report ID:</p>
                          <p className="text-sm font-medium">{selectedReport.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status:</p>
                          <p className="text-sm font-medium">{selectedReport.status}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Reporter:</p>
                          <p className="text-sm font-medium">{selectedReport.reporter?.firstName} {selectedReport.reporter?.lastName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date Reported:</p>
                          <p className="text-sm font-medium">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <p className="text-sm text-gray-500">Reason:</p>
                          <p className="text-sm font-medium">{selectedReport.reason}</p>
                        </div>
                        {selectedReport.status === 'REJECTED' && selectedReport.rejectionReason && (
                          <div className="col-span-1 md:col-span-2">
                            <p className="text-sm text-gray-500">Rejection Reason:</p>
                            <p className="text-sm font-medium">{selectedReport.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reported Content - Post */}
                  {isPostReport(selectedReport) && selectedReportPost && (
                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                        <svg className="h-5 w-5 text-[#861A2D] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        Reported Post
                      </h4>
                      <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center mb-3">
                          <div className="h-8 w-8 rounded-full bg-[#861A2D] text-white flex items-center justify-center font-bold mr-2">
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
                        <h3 className="text-lg font-semibold mb-2">{selectedReportPost.title}</h3>
                        <p className="text-gray-700 whitespace-pre-line">{selectedReportPost.content}</p>
                        {selectedReportPost.imageUrl && (
                          <div className="mt-3">
                            <img 
                              src={selectedReportPost.imageUrl} 
                              alt="Post attachment" 
                              className="max-h-64 rounded-lg border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reported Content - Comment */}
                  {isCommentReport(selectedReport) && selectedReportComment && (
                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                        <svg className="h-5 w-5 text-[#861A2D] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Reported Comment
                      </h4>
                      <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm border-l-4 border-l-purple-500">
                        <div className="flex items-center mb-3">
                          <div className="h-8 w-8 rounded-full bg-[#861A2D] text-white flex items-center justify-center font-bold mr-2">
                            {selectedReportComment.author?.firstName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedReportComment.author?.firstName} {selectedReportComment.author?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(selectedReportComment.createdAt)}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-700 whitespace-pre-line">{selectedReportComment.content}</p>
                      </div>
                    </div>
                  )}

                  {/* Parent Post for Comment */}
                  {isCommentReport(selectedReport) && selectedReportPost && (
                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                        <svg className="h-5 w-5 text-[#861A2D] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        Parent Post
                      </h4>
                      <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm border-l-4 border-l-blue-500">
                        <div className="flex items-center mb-3">
                          <div className="h-8 w-8 rounded-full bg-[#861A2D] text-white flex items-center justify-center font-bold mr-2">
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
                        <h3 className="text-lg font-semibold mb-2">{selectedReportPost.title}</h3>
                        <p className="text-gray-700 whitespace-pre-line">{selectedReportPost.content}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedReport.status === 'PENDING' && (
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleShowApproveModal(selectedReport)}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Approve Report
                      </button>
                      <button
                        onClick={() => handleShowRejectModal(selectedReport)}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject Report
                      </button>
                    </div>
                  )}

                  {selectedReport.status === 'APPROVED' && (
                    <div className="mt-4">
                      <div className="bg-gray-100 rounded-md p-3 border border-gray-300">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>
                            This report has been approved and the {isPostReport(selectedReport) ? 'post' : 'comment'} has been automatically deleted.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Approve Report Confirmation Modal */}
          {showApproveModal && reportToAction && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Approve Report & Delete Content</h3>
                <p className="mb-4">
                  Are you sure you want to approve this report? This action will:
                </p>
                <ul className="list-disc ml-6 mb-4 text-sm text-gray-700">
                  <li className="mb-1">Mark the report as valid</li>
                  <li className="mb-1 font-semibold text-red-600">Automatically delete the reported {isPostReport(reportToAction) ? 'post' : 'comment'}</li>
                </ul>
                <p className="mb-4 text-sm text-gray-500">
                  This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelAction}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveReport}
                    className="px-4 py-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Approve & Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reject Report Modal */}
          {showRejectModal && reportToAction && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Report</h3>
                <p className="mb-4">
                  Please provide a reason for rejecting this report about a {isPostReport(reportToAction) ? 'post' : 'comment'}:
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this report is being rejected..."
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D] mb-4"
                  required
                ></textarea>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelAction}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectReport}
                    className="px-4 py-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    disabled={!rejectionReason.trim()}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Manual Deletion Notice */}
      {manualDeletionInfo && (
        <div className="fixed bottom-5 right-5 w-96 bg-white rounded-lg shadow-xl border-l-4 border-yellow-500 p-4 z-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3 w-full">
              <h3 className="text-sm font-medium text-yellow-800">Manual Deletion Required</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Automated deletion failed for {manualDeletionInfo.contentType} (ID: {manualDeletionInfo.contentId})</p>
                <p className="mt-1">You can try the following options:</p>
                <ul className="list-disc pl-5 mt-1 text-xs">
                  <li>Refresh the page and try approving again</li>
                  <li>Log out and log back in to refresh your session</li>
                  <li>Contact the system administrator</li>
                </ul>
              </div>
              <div className="mt-3 flex justify-between">
                <button
                  onClick={() => setManualDeletionInfo(null)}
                  className="text-sm text-yellow-800 hover:text-yellow-900 font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement; 