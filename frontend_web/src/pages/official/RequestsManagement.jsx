import { useEffect, useState, useContext, useRef } from 'react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import TopNavigation from '../../components/layout/TopNavigation';
import { useToast } from '../../contexts/ToastContext';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { AuthContext } from '../../contexts/AuthContext';
import PDFViewerComponent from '../../components/PDFViewerComponent';
import { isEdgeBrowser, createViewerUrl } from '../../utils/documentViewerUtils.jsx';

const API_URL = 'https://barangay360-nja7q.ondigitalocean.app/api';

const RequestsManagement = () => {
  const { showToast } = useToast();
  const authContext = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processing, setProcessing] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionRequest, setRejectionRequest] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(8);
  // Document handling states
  const [isAttachingDocument, setIsAttachingDocument] = useState(false);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  // Approval modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalRequest, setApprovalRequest] = useState(null);

  // Add document preview functionality
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState('');
  const [isDocLoading, setIsDocLoading] = useState(false);
  const [docPreviewError, setDocPreviewError] = useState(null);

  // Document viewer states
  const [documentViewerUrl, setDocumentViewerUrl] = useState('');
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  // Add refs for detecting clicks outside modals
  const requestDetailsModalRef = useRef(null);
  const documentViewerModalRef = useRef(null);
  const docPreviewModalRef = useRef(null);
  const approvalModalRef = useRef(null);
  const rejectionModalRef = useRef(null);
  
  // Handle clicks outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      // For Request Details Modal
      if (selectedRequest && 
          requestDetailsModalRef.current && 
          !requestDetailsModalRef.current.contains(event.target)) {
        handleCloseRequest();
      }
      
      // For Document Viewer Modal
      if (showDocumentViewer && 
          documentViewerModalRef.current && 
          !documentViewerModalRef.current.contains(event.target)) {
        handleCloseDocumentViewer();
      }
      
      // For Document Preview Modal
      if (showDocPreview && 
          docPreviewModalRef.current && 
          !docPreviewModalRef.current.contains(event.target)) {
        closeDocPreview();
      }
      
      // For Approval Modal
      if (showApprovalModal && 
          approvalModalRef.current && 
          !approvalModalRef.current.contains(event.target) &&
          !processing) {
        setShowApprovalModal(false);
        setSelectedFile(null);
        setDocumentError(null);
      }
      
      // For Rejection Modal
      if (showRejectionModal && 
          rejectionModalRef.current && 
          !rejectionModalRef.current.contains(event.target) &&
          !processing) {
        setShowRejectionModal(false);
        setRejectionReason('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedRequest, showDocumentViewer, showDocPreview, showApprovalModal, showRejectionModal, processing]);

  // Set the AuthContext in the serviceRequestService
  useEffect(() => {
    serviceRequestService.setAuthContext(authContext);
  }, [authContext]);
  
  const handlePreviewDocument = async (requestId) => {
    setIsDocLoading(true);
    setDocPreviewError(null);
    
    try {
      console.log(`Starting document preview process for request ID: ${requestId}`);
      
      // First get the API URL for the document
      const apiUrl = `${API_URL}/service-requests/${requestId}/document?_cb=${Date.now()}`;
      
      // Use our improved PDF URL processor which has retry and fallbacks
      const processedUrl = await processPdfUrl(apiUrl);
      console.log(`Document preview URL generated successfully: ${processedUrl.substring(0, 30)}...`);
      
      // Set state for preview
      setDocPreviewUrl(processedUrl);
      setShowDocPreview(true);
      
    } catch (error) {
      console.error('Error setting up document preview:', error);
      setDocPreviewError(`Error loading document: ${error.message || 'Unknown error'}`);
      showToast('Could not load document preview. Please try again later.', 'error');
    } finally {
      setIsDocLoading(false);
    }
  };

  // Close document preview
  const closeDocPreview = () => {
    // If we have a blob URL, revoke it to free up memory
    if (docPreviewUrl && docPreviewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(docPreviewUrl);
        console.log('Successfully revoked blob URL');
      } catch (err) {
        console.warn('Error revoking URL:', err);
      }
    }
    
    // Reset all state related to document preview
    setShowDocPreview(false);
    setDocPreviewUrl('');
    setDocPreviewError(null);
  };

  // Calculate request counts by status
  const requestCounts = {
    PENDING: requests.filter(req => req.status === 'PENDING').length,
    APPROVED: requests.filter(req => req.status === 'APPROVED').length,
    REJECTED: requests.filter(req => req.status === 'REJECTED').length,
    CANCELLED: requests.filter(req => req.status === 'CANCELLED').length,
    ALL: requests.length
  };

  useEffect(() => {
    loadServiceRequests();
  }, []);

  const loadServiceRequests = async () => {
    setIsLoading(true);
    try {
      const data = await serviceRequestService.getAllServiceRequests();

      // Sort requests with newest first (by createdAt date)
      const sortedData = [...data].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setRequests(sortedData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showToast('Failed to load service requests', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = statusFilter === 'ALL'
    ? [...requests].sort((a, b) => {
        // If one is cancelled and the other is not, put cancelled at the bottom
        if (a.status === 'CANCELLED' && b.status !== 'CANCELLED') return 1;
        if (a.status !== 'CANCELLED' && b.status === 'CANCELLED') return -1;
        // Otherwise, maintain the original sorting (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
    : requests.filter(request => request.status === statusFilter);

  // Get current requests for pagination
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when changing tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
  };

  const handleCloseRequest = () => {
    setSelectedRequest(null);
  };

  // Handle file selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Handle document attachment
  const handleAttachDocument = async (requestId) => {
    if (!selectedFile) {
      setDocumentError('Please select a file to attach');
      showToast('Please select a file to attach', 'error');
      return;
    }

    setIsAttachingDocument(true);
    setDocumentError(null);
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);

      await serviceRequestService.attachDocumentToRequest(requestId, formData);
      showToast('Document attached successfully', 'success');
      setSelectedFile(null); // Clear the selected file after successful upload

      // Refresh the requests list
      loadServiceRequests();

      // Refresh the selected request
      if (selectedRequest && selectedRequest.id === requestId) {
        const updatedRequests = await serviceRequestService.getAllServiceRequests();
        const updatedRequest = updatedRequests.find(req => req.id === requestId);
        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
        }
      }
    } catch (error) {
      console.error('Error attaching document:', error);
      setDocumentError('Failed to attach document to request: ' + (error.message || 'Unknown error'));
      showToast('Failed to attach document', 'error');
    } finally {
      setIsAttachingDocument(false);
    }
  };

  // Handle document approval (previously document generation)
  const handleGenerateDocument = async (requestId) => {
    setIsGeneratingDocument(true);
    setDocumentError(null);
    try {
      // Update the status to APPROVED instead of generating document
      await serviceRequestService.updateServiceRequestStatus(requestId, 'APPROVED');
      showToast('Request approved successfully', 'success');
      loadServiceRequests();
      // Refresh the selected request
      if (selectedRequest && selectedRequest.id === requestId) {
        const updatedRequests = await serviceRequestService.getAllServiceRequests();
        const updatedRequest = updatedRequests.find(req => req.id === requestId);
        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
        }
      }
    } catch (error) {
      console.error('Error approving request:', error);
      setDocumentError(error.message || 'Failed to approve request');
      showToast(error.message || 'Failed to approve request', 'error');
    } finally {
      setIsGeneratingDocument(false);
    }
  };

  // Handle document download with better error handling
  const handleDownloadDocument = async (requestId) => {
    try {
      showToast('Preparing document for download...', 'info');
      const blob = await serviceRequestService.downloadDocument(requestId);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Set filename with timestamp for uniqueness
      const date = new Date().toISOString().split('T')[0];
      a.download = `document_${requestId}_${date}.pdf`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      showToast('Document downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading document:', error);
      showToast(`Failed to download document: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  // Handle mark as delivered
  const handleMarkAsDelivered = async (requestId) => {
    setProcessing(true);
    try {
      await serviceRequestService.markDocumentAsDelivered(requestId);
      showToast('Document marked as delivered', 'success');
      loadServiceRequests();
      handleCloseRequest();
    } catch (error) {
      console.error('Error marking document as delivered:', error);
      showToast('Failed to mark document as delivered', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveRequest = (request) => {
    // Show the approval modal with the selected request
    setApprovalRequest(request);
    setShowApprovalModal(true);
  };

  const handleApproveWithDocument = async (requestId) => {
    if (!selectedFile) {
      setDocumentError('Please select a file to attach');
      showToast('Please select a file to attach', 'error');
      return;
    }

    // Validate file type (PDF only)
    if (!selectedFile.type.includes('pdf')) {
      setDocumentError('Only PDF files are allowed');
      showToast('Only PDF files are allowed', 'error');
      return;
    }

    // Validate file size (maximum 5MB)
    const maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
    if (selectedFile.size > maxFileSize) {
      setDocumentError('File size exceeds the maximum limit of 5MB');
      showToast('File size exceeds the maximum limit of 5MB', 'error');
      return;
    }

    setProcessing(true);
    setDocumentError(null);
    try {
      // First attach the document
      const formData = new FormData();
      formData.append('document', selectedFile);
      await serviceRequestService.attachDocumentToRequest(requestId, formData);

      // Then update the status to APPROVED (instead of generating document)
      await serviceRequestService.updateServiceRequestStatus(requestId, 'APPROVED');

      showToast('Request approved and document attached successfully', 'success');
      setSelectedFile(null); // Clear the selected file
      setShowApprovalModal(false); // Close the modal
      loadServiceRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      setDocumentError(error.message || 'Failed to approve request');
      showToast('Failed to approve request: ' + (error.message || 'Unknown error'), 'error');
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
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle viewing the attached document
  const handleViewAttachedDocument = async (requestId) => {
    try {
      setIsDocLoading(true);
      
      // Check if we're running in Edge and log a message
      const isEdge = isEdgeBrowser();
      if (isEdge) {
        console.log('Microsoft Edge detected - using Edge-compatible viewing mode');
      }
      
      const documentUrl = await serviceRequestService.getAttachedDocument(requestId);
      
      // For Edge, we'll try to create a blob URL which can help bypass some restrictions
      let displayUrl = documentUrl;
      if (isEdge && !documentUrl.startsWith('blob:')) {
        try {
          // Get token for authenticated fetch
          const token = serviceRequestService.getToken();
          displayUrl = await createViewerUrl(documentUrl, token);
          console.log('Created Edge-compatible document URL');
        } catch (edgeError) {
          console.warn('Failed to create Edge-compatible URL:', edgeError);
          // Continue with original URL
        }
      }
      
      setDocumentViewerUrl(displayUrl);
      setShowDocumentViewer(true);
    } catch (error) {
      console.error('Error viewing attached document:', error);
      showToast('Failed to load attached document: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setIsDocLoading(false);
    }
  };

  // Close document viewer
  const handleCloseDocumentViewer = () => {
    // Clean up any blob URLs
    if (documentViewerUrl && documentViewerUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(documentViewerUrl);
        console.log('Successfully revoked document viewer blob URL');
      } catch (err) {
        console.warn('Error revoking document viewer URL:', err);
      }
    }
    
    setShowDocumentViewer(false);
    setDocumentViewerUrl('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex w-full">
      <Sidebar isOfficial={true} />

      <div className="flex-1 flex flex-col ml-64">
        {/* Top Navigation */}
        <TopNavigation title="Service Requests Management" />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto flex flex-col h-[calc(100vh-64px)]">
          {/* Header and Action Button */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Request Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Review and manage all service requests from residents
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`${
                      statusFilter === 'ALL'
                        ? 'border-[#861A2D] text-[#861A2D]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } relative flex-1 min-w-0 py-4 px-4 border-b-2 font-medium text-sm text-center focus:outline-none`}
                  >
                    All
                    <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {requestCounts.ALL}
                    </span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('PENDING')}
                    className={`${
                      statusFilter === 'PENDING'
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
                    onClick={() => setStatusFilter('APPROVED')}
                    className={`${
                      statusFilter === 'APPROVED'
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
                    onClick={() => setStatusFilter('REJECTED')}
                    className={`${
                      statusFilter === 'REJECTED'
                        ? 'border-[#861A2D] text-[#861A2D]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } relative flex-1 min-w-0 py-4 px-4 border-b-2 font-medium text-sm text-center focus:outline-none`}
                  >
                    Rejected
                    <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      {requestCounts.REJECTED}
                    </span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('CANCELLED')}
                    className={`${
                      statusFilter === 'CANCELLED'
                        ? 'border-[#861A2D] text-[#861A2D]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } relative flex-1 min-w-0 py-4 px-4 border-b-2 font-medium text-sm text-center focus:outline-none`}
                  >
                    Cancelled
                    <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {requestCounts.CANCELLED}
                    </span>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Requests List */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#861A2D]"></div>
                  <p className="mt-3 text-gray-600 font-medium">Loading service requests...</p>
                </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-16">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No {statusFilter.toLowerCase()} requests</h3>
                <p className="mt-1 text-sm text-gray-500">There are no {statusFilter.toLowerCase()} service requests at this time.</p>
              </div>
            ) : (
              <div className="w-full">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Requested</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentRequests.map((request) => (
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
                                  onClick={() => handleApproveRequest(request)}
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

                {/* Pagination - Only show when there are more than 8 requests */}
                {filteredRequests.length > requestsPerPage && (
                  <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{indexOfFirstRequest + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(indexOfLastRequest, filteredRequests.length)}
                          </span>{' '}
                          of <span className="font-medium">{filteredRequests.length}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                              currentPage === 1 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>

                          {/* Page numbers */}
                          {[...Array(Math.ceil(filteredRequests.length / requestsPerPage)).keys()].map(number => (
                            <button
                              key={number + 1}
                              onClick={() => paginate(number + 1)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === number + 1
                                  ? 'z-10 bg-[#861A2D] border-[#861A2D] text-white'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {number + 1}
                            </button>
                          ))}

                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredRequests.length / requestsPerPage)))}
                            disabled={currentPage === Math.ceil(filteredRequests.length / requestsPerPage)}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                              currentPage === Math.ceil(filteredRequests.length / requestsPerPage)
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
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
            )}
          </div>
        </main>
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div ref={requestDetailsModalRef} className="bg-white rounded-lg max-w-2xl w-full shadow-xl">
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

              {/* Document Status Section */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <svg className="h-5 w-5 text-gray-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Document Status
                </h4>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="mb-3 sm:mb-0">
                      <div className="flex items-center mb-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${selectedRequest.documentStatus === 'NOT_GENERATED' ? 'bg-gray-100 text-gray-800' : 
                            selectedRequest.documentStatus === 'ATTACHED' ? 'bg-blue-100 text-blue-800' : 
                            selectedRequest.documentStatus === 'GENERATED' ? 'bg-green-100 text-green-800' : 
                            'bg-purple-100 text-purple-800'}`}>
                          {selectedRequest.documentStatus || 'NOT_GENERATED'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {!selectedRequest.documentStatus || selectedRequest.documentStatus === 'NOT_GENERATED'
                          ? 'No document attached yet'
                          : selectedRequest.documentStatus === 'ATTACHED'
                            ? 'Document attached but not yet approved'
                            : selectedRequest.documentStatus === 'GENERATED'
                              ? 'Document approved and ready for delivery'
                              : 'Document is ready for pickup or has been delivered'}
                      </p>
                    </div>

                    {/* Document Actions Buttons - only show if document is attached or generated */}
                    {(selectedRequest.documentStatus === 'ATTACHED' || 
                      selectedRequest.documentStatus === 'GENERATED' || 
                      selectedRequest.documentStatus === 'DELIVERED') && (
                      <div className="flex space-x-2">
                        {/* View Document Button */}
                        <button
                          onClick={() => selectedRequest.attachedDocumentPath 
                            ? handleViewAttachedDocument(selectedRequest.id) 
                            : handlePreviewDocument(selectedRequest.id)}
                          disabled={isDocLoading}
                          className="inline-flex items-center px-3 py-1.5 border border-indigo-300 text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none"
                        >
                          {isDocLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Loading...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                              </svg>
                              Preview
                            </>
                          )}
                        </button>

                        {/* Download Document Button */}
                        <button
                          onClick={() => handleDownloadDocument(selectedRequest.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                          </svg>
                          Download
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                {/* Document Actions */}
                {selectedRequest.status === 'PENDING' && (
                  <>
                    {/* Attach Document Section - Show only if document is not attached */}
                    {(!selectedRequest.documentStatus || selectedRequest.documentStatus === 'NOT_GENERATED') && (
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            id="document-upload"
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                          <label
                            htmlFor="document-upload"
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                            </svg>
                            {selectedFile ? selectedFile.name : 'Choose File'}
                          </label>
                          <button
                            onClick={() => handleAttachDocument(selectedRequest.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                            disabled={isAttachingDocument || !selectedFile}
                          >
                            {isAttachingDocument ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Attaching...
                              </span>
                            ) : (
                              'Attach Document'
                            )}
                          </button>
                        </div>
                        {selectedFile && (
                          <p className="text-sm text-gray-600">
                            Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                          </p>
                        )}
                      </div>
                    )}

                    {/* Generate Document Button - Show only if document is attached but not generated */}
                    {selectedRequest.documentStatus === 'ATTACHED' && (
                      <button
                        onClick={() => handleGenerateDocument(selectedRequest.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        disabled={isGeneratingDocument}
                      >
                        {isGeneratingDocument ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                          </span>
                        ) : (
                          'Generate Document'
                        )}
                      </button>
                    )}

                    {/* Reject Button */}
                    <button
                      onClick={() => {
                        setRejectionRequest(selectedRequest);
                        setShowRejectionModal(true);
                      }}
                      className="px-4 py-2 bg-white border border-red-500 text-red-500 rounded hover:bg-red-50"
                      disabled={processing}
                    >
                      Reject Request
                    </button>
                  </>
                )}

                {/* Mark as Delivered Button - Show if document is generated but not delivered */}
                {selectedRequest.documentStatus === 'GENERATED' && selectedRequest.status === 'APPROVED' && (
                  <button
                    onClick={() => handleMarkAsDelivered(selectedRequest.id)}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Mark as Delivered'}
                  </button>
                )}

                <button
                  onClick={handleCloseRequest}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>

              {/* Error Message */}
              {documentError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{documentError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && approvalRequest && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div ref={approvalModalRef} className="bg-white rounded-lg max-w-2xl w-full shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#861A2D]">Approve Service Request</h3>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedFile(null);
                    setDocumentError(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-4">
                  Please attach a document to approve this service request. Only PDF files up to 5MB are accepted.
                </p>

                {/* Request Details */}
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Request Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Service Type:</span> {approvalRequest.serviceType}
                    </div>
                    <div>
                      <span className="font-medium">Requester:</span> {approvalRequest.residentName}
                    </div>
                    <div>
                      <span className="font-medium">Contact:</span> {approvalRequest.contactNumber || approvalRequest.residentPhone}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {new Date(approvalRequest.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Purpose:</span> {approvalRequest.purpose}
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div className="mb-4">
                  <label htmlFor="document-upload-approval" className="block text-sm font-medium text-gray-700 mb-1">
                    Attach Document <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      id="document-upload-approval"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf"
                    />
                    <label
                      htmlFor="document-upload-approval"
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                      </svg>
                      {selectedFile ? selectedFile.name : 'Choose PDF File'}
                    </label>
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                    </p>
                  )}
                  {documentError && (
                    <p className="text-sm text-red-600 mt-1">{documentError}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedFile(null);
                    setDocumentError(null);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApproveWithDocument(approvalRequest.id)}
                  disabled={!selectedFile || processing}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    selectedFile && !processing ? 'bg-green-600 hover:bg-green-700' : 'bg-green-400 cursor-not-allowed'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                >
                  {processing ? 'Processing...' : 'Approve with Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div ref={rejectionModalRef} className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
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

      {/* Document Preview Modal */}
      {showDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div ref={docPreviewModalRef} className="w-full h-full max-w-6xl max-h-full flex flex-col">
            <div className="flex-1 bg-white rounded-t shadow-2xl overflow-hidden">
              {docPreviewError ? (
                <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-6">
                  <div className="text-red-600 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <h3 className="text-lg font-semibold text-center mt-2">Error Loading Document</h3>
                  </div>
                  <p className="text-gray-600 text-center mb-4">{docPreviewError}</p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handlePreviewDocument(selectedRequest.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={closeDocPreview}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <PDFViewerComponent
                  url={docPreviewUrl}
                  title={`Document for Request #${selectedRequest?.id}`}
                  onClose={closeDocPreview}
                />
              )}
            </div>
            <div className="bg-gray-800 rounded-b p-3 flex justify-end items-center">
              <button
                onClick={closeDocPreview}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocumentViewer && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div ref={documentViewerModalRef} className="bg-white rounded-lg w-full max-w-6xl h-[80vh] shadow-xl flex flex-col">
            <div className="flex-1 overflow-hidden">
              {documentViewerUrl ? (
                <PDFViewerComponent 
                  url={documentViewerUrl}
                  title="Document Viewer"
                  onClose={handleCloseDocumentViewer}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <p className="text-gray-500">No document URL provided</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsManagement;
