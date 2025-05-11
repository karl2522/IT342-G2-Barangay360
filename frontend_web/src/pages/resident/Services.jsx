import { DateTime } from 'luxon';
import { QRCodeCanvas } from 'qrcode.react'; // Import the correct QR code library
import { useContext, useEffect, useRef, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import TopNavigation from '../../components/layout/TopNavigation.jsx';
import PDFViewerComponent from '../../components/PDFViewerComponent';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { createViewerUrl, isEdgeBrowser } from '../../utils/documentViewerUtils.jsx';


const Services = () => {
  const authContext = useContext(AuthContext);
  const { user } = authContext;
  const { showToast } = useToast();
  const [error, setError] = useState(null);

  // Set the AuthContext in the serviceRequestService
  useEffect(() => {
    serviceRequestService.setAuthContext(authContext);
  }, [authContext]);
  const [formData, setFormData] = useState({
    serviceType: '',
    purpose: '',
    details: '',
    contactNumber: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRequests, setActiveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [requestToCancel, setRequestToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const qrCodeRef = useRef(null);
  const [requestMethod, setRequestMethod] = useState(null); // State for choosing QR or Form
  // Pagination states for service requests
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(8);
  const [documentViewerUrl, setDocumentViewerUrl] = useState('');
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  
  // Add document preview functionality - MOVED UP before the useEffect that uses these
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState('');
  const [isDocLoading, setIsDocLoading] = useState(false);
  const [docPreviewError, setDocPreviewError] = useState(null);

  // Add refs for detecting clicks outside modals
  const requestDetailsModalRef = useRef(null);
  const documentViewerModalRef = useRef(null);
  const docPreviewModalRef = useRef(null);
  const cancelModalRef = useRef(null);
  const serviceFormModalRef = useRef(null);
  
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
      
      // For Cancel Confirmation Modal
      if (showCancelModal && 
          cancelModalRef.current && 
          !cancelModalRef.current.contains(event.target) &&
          !isCancelling) {
        setShowCancelModal(false);
        setCancelReason('');
        setRequestToCancel(null);
      }
      
      // For Service Request Form Modal
      if (showModal && 
          serviceFormModalRef.current && 
          !serviceFormModalRef.current.contains(event.target) && 
          !isSubmitting) {
        closeModal();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedRequest, showDocumentViewer, showDocPreview, showCancelModal, isCancelling, showModal, isSubmitting]);

  // Load user's requests from the database on component mount
  useEffect(() => {
    if (user && user.id) {
      loadUserRequests();
    }
  }, [user]);

  const loadUserRequests = async () => {
    setIsLoading(true);
    try {
      const data = await serviceRequestService.getServiceRequestsByUserId(user.id);
      // Sort requests with newest first
      const sortedData = [...data].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setActiveRequests(sortedData);
    } catch (error) {
      console.error('Error loading service requests:', error);
      showToast('Failed to load your service requests', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const serviceTypes = [
    { value: 'Barangay Certificate', label: 'Barangay Certificate', description: 'General certification for various purposes', mode: 'auto' },
    { value: 'Barangay Clearance', label: 'Barangay Clearance', description: 'Required for employment, business, or legal purposes', mode: 'form' },
    { value: 'Barangay ID Card', label: 'Barangay ID Card', description: 'Official barangay identification card', mode: 'form' },
    { value: 'Business Permit', label: 'Business Permit', description: 'Required for operating a business within the barangay', mode: 'form' },
    { value: 'Certificate of Residency', label: 'Certificate of Residency', description: 'Proof of residency in the barangay', mode: 'auto' },
    { value: 'Certificate of Indigency', label: 'Certificate of Indigency', description: 'For those who need financial assistance', mode: 'form' },
    { value: 'Good Moral Certificate', label: 'Good Moral Certificate', description: 'For employment or school applications', mode: 'form' },
    { value: 'Solo Parent ID', label: 'Solo Parent ID', description: 'Identification for solo parents to access benefits', mode: 'auto' },
    { value: 'Senior Citizen ID', label: 'Senior Citizen ID', description: 'ID for senior citizens to avail benefits and assistance', mode: 'form' },
    { value: 'PWD ID Application', label: 'PWD ID Application', description: 'Application for persons with disabilities ID', mode: 'form' },
    { value: 'Travel Permit', label: 'Travel Permit', description: 'For residents traveling outside the province or region', mode: 'form' },
    { value: 'Barangay Endorsement', label: 'Barangay Endorsement', description: 'Required for applying to government programs or assistance', mode: 'form' },
    { value: 'Medical Assistance Request', label: 'Medical Assistance Request', description: 'For requesting medical financial support', mode: 'form' },
    { value: 'Calamity Assistance', label: 'Calamity Assistance', description: 'For residents affected by natural disasters', mode: 'form' },
    { value: 'Funeral Assistance', label: 'Funeral Assistance', description: 'Request for support due to death of a family member', mode: 'form' },
    { value: 'Livelihood Assistance', label: 'Livelihood Assistance', description: 'Request to support small business or livelihood programs', mode: 'form' }
  ];


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }

    // Generate QR code when service type is selected, but don't reset the submission method
    if (name === 'serviceType') {
      if (value) {
        const selectedService = serviceTypes.find(s => s.value === value);

        const qrData = {
          userId: user?.id || '',
          userName: user ? `${user.firstName} ${user.lastName}` : '',
          serviceType: value,
          serviceDescription: selectedService?.description || '',
          mode: selectedService?.mode || 'form', // 'auto' or 'form'
          timestamp: new Date().toISOString(),
          validUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
          requestId: `REQ-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        };

        setQrValue(JSON.stringify(qrData));
      }
    }
  };

  // Function to download QR code as image
  const downloadQRCode = () => {
    if (qrCodeRef.current) {
      const canvas = qrCodeRef.current;
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");

      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${formData.serviceType.replace(/\s+/g, '_')}_QRCode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.serviceType) newErrors.serviceType = 'Service type is required';
    if (!formData.purpose) newErrors.purpose = 'Purpose is required';
    if (!formData.details) newErrors.details = 'Details are required';
    if (!formData.contactNumber) newErrors.contactNumber = 'Contact number is required';
    if (!formData.address) newErrors.address = 'Address is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!user) {
      showToast('User information is missing. Please log in again.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && selectedRequest) {
        // Update existing request
        await serviceRequestService.updateServiceRequest(selectedRequest.id, {
          ...formData,
          status: 'PENDING', // Reset to pending if edited
        });
        showToast('Service request updated successfully!', 'success');
      } else {
        // Create new request
        const requestData = {
          ...formData,
          userId: user.id,
          residentName: `${user.firstName} ${user.lastName}`,
          residentEmail: user.email,
          residentPhone: user.phone || formData.contactNumber, // Ensure fallback logic is correct
        };

        await serviceRequestService.createServiceRequest(requestData);
        showToast('Service request submitted successfully!', 'success');
      }

      // Reset form only after successful submission
      setFormData({
        serviceType: '',
        purpose: '',
        details: '',
        contactNumber: '',
        address: '',
      });

      // Close modal and reset editing state
      setShowModal(false);
      setIsEditing(false);
      setSelectedRequest(null);

      // Reload user requests to show the new/updated one
      loadUserRequests();

    } catch (error) {
      console.error('Error submitting service request:', error);
      showToast('Error submitting request. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return (
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        );
      case 'APPROVED':
        return (
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
        );
      case 'REJECTED':
        return (
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        );
      case 'CANCELLED':
        return (
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        );
      default:
        return null;
    }
  };

  // Get filtered and paginated requests
  const filteredRequests = statusFilter === 'ALL'
      ? [...activeRequests].sort((a, b) => {
          // If one is cancelled and the other is not, put cancelled at the bottom
          if (a.status === 'CANCELLED' && b.status !== 'CANCELLED') return 1;
          if (a.status !== 'CANCELLED' && b.status === 'CANCELLED') return -1;
          // Otherwise, maintain the original sorting (newest first)
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
      : activeRequests.filter(request => request.status === statusFilter);

  // Pagination calculations
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when changing status filter
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
  };

  const handleCloseRequest = () => {
    setSelectedRequest(null);
  };

  // Add document download functionality for residents
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

  const handlePreviewDocument = async (requestId) => {
    setIsDocLoading(true);
    setDocPreviewError(null);
    
    try {
      console.log(`Starting document preview process for request ID: ${requestId}`);
      
      // Check for Edge browser
      const isEdge = isEdgeBrowser();
      if (isEdge) {
        console.log('Microsoft Edge detected - using compatible viewing mode');
      }
      
      // Get the document URL
      const docUrl = await serviceRequestService.getDocumentPreviewUrl(requestId);
      
      // For Microsoft Edge, try to create a specialized URL
      if (isEdge && !docUrl.startsWith('blob:')) {
        try {
          const token = serviceRequestService.getToken();
          const edgeUrl = await createViewerUrl(docUrl, token);
          setDocPreviewUrl(edgeUrl);
        } catch (edgeError) {
          console.warn('Failed to create Edge-compatible URL:', edgeError);
          setDocPreviewUrl(docUrl);
        }
      } else {
        setDocPreviewUrl(docUrl);
      }
      
      setShowDocPreview(true);
    } catch (error) {
      console.error('Error setting up document preview:', error);
      setDocPreviewError(`Error loading document: ${error.message || 'Unknown error'}`);
      setError('Could not load document preview. Please try again later.');
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

  const handleEditRequest = (request) => {
    setFormData({
      serviceType: request.serviceType,
      purpose: request.purpose,
      details: request.details,
      contactNumber: request.contactNumber || '',
      address: request.address || '',
    });
    setIsEditing(true);
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleCancelRequest = (request) => {
    setRequestToCancel(request);
    setShowCancelModal(true);
  };

  const submitCancelRequest = async () => {
    if (!cancelReason.trim()) {
      showToast('Please provide a reason for cancellation', 'error');
      return;
    }

    setIsCancelling(true);
    try {
      await serviceRequestService.cancelServiceRequest(requestToCancel.id);
      showToast('Request cancelled successfully', 'success');
      setShowCancelModal(false);
      setCancelReason('');
      setRequestToCancel(null);
      loadUserRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      showToast('Failed to cancel request', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // Check if a request is within the editable/cancellable time frame (24 hours)
  const isRequestEditable = (request) => {
    if (request.status !== 'PENDING') return false;

    const createdAt = new Date(request.createdAt);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

    return hoursDiff <= 24; // Editable within 24 hours
  };

  // Get remaining time for editable window
  const getRemainingEditTime = (request) => {
    const createdAt = DateTime.fromISO(request.createdAt, { zone: 'Asia/Manila' });
    const deadline = createdAt.plus({ hours: 24 });
    const now = DateTime.now().setZone('Asia/Manila');

    const diff = deadline.diff(now, ['hours', 'minutes']).toObject();

    if (diff.hours < 0 || (diff.hours === 0 && diff.minutes <= 0)) {
      return 'Time expired';
    }

    const diffHrs = Math.floor(diff.hours);
    const diffMins = Math.floor(diff.minutes);

    return `${diffHrs}h ${diffMins}m remaining`;
  };


  // Close modal - reset form data, QR code state, and method choice
  const closeModal = () => {
    if (!isSubmitting) {
      setShowModal(false);
      setIsEditing(false);
      setSelectedRequest(null);
      setRequestMethod(null); // Reset method choice
      setFormData({
        serviceType: '',
        purpose: '',
        details: '',
        contactNumber: '',
        address: '',
      });
      setQrValue(''); // Clear QR value
      setErrors({}); // Clear errors
    }
  };

  // Handle viewing the attached document
  const handleViewAttachedDocument = async (requestId) => {
    try {
      setIsLoading(true);
      
      // Check if we're running in Edge and log a message
      const isEdge = isEdgeBrowser();
      if (isEdge) {
        console.log('Microsoft Edge detected - using Edge-compatible viewing mode for request ID:', requestId);
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
      setError('Failed to load attached document: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Close document viewer
  const handleCloseDocumentViewer = () => {
    setShowDocumentViewer(false);
    setDocumentViewerUrl('');
  };

  return (
      <div className="min-h-screen bg-gray-100 flex w-full">
        <Sidebar isOfficial={false} />

        <div className="flex-1 flex flex-col ml-64">
          {/* Top Navigation */}
          <TopNavigation title="Request Services" />

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-6">
            {/* Header and Action Button */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl font-bold text-gray-800">My Service Requests</h2>
                <p className="text-sm text-gray-600 mt-1">
                  View and manage all your barangay service requests
                </p>
              </div>
              <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-[#861A2D] text-white rounded-md font-medium shadow-sm hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:ring-offset-2 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                New Service Request
              </button>
            </div>

            {/* Filter */}
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex">
                    <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`${
                            statusFilter === 'ALL'
                                ? 'border-b-2 border-[#861A2D] text-[#861A2D]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } relative flex-1 min-w-0 py-4 px-4 border-b-2 font-medium text-sm text-center focus:outline-none`}
                    >
                      All
                      <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {activeRequests.length}
                    </span>
                    </button>
                    <button
                        onClick={() => setStatusFilter('PENDING')}
                        className={`${
                            statusFilter === 'PENDING'
                                ? 'border-b-2 border-[#861A2D] text-[#861A2D]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } relative flex-1 min-w-0 py-4 px-4 border-b-2 font-medium text-sm text-center focus:outline-none`}
                    >
                      Pending
                      <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      {activeRequests.filter(req => req.status === 'PENDING').length}
                    </span>
                    </button>
                    <button
                        onClick={() => setStatusFilter('APPROVED')}
                        className={`${
                            statusFilter === 'APPROVED'
                                ? 'border-b-2 border-[#861A2D] text-[#861A2D]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } relative flex-1 min-w-0 py-4 px-4 border-b-2 font-medium text-sm text-center focus:outline-none`}
                    >
                      Approved
                      <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {activeRequests.filter(req => req.status === 'APPROVED').length}
                    </span>
                    </button>
                    <button
                        onClick={() => setStatusFilter('REJECTED')}
                        className={`${
                            statusFilter === 'REJECTED'
                                ? 'border-b-2 border-[#861A2D] text-[#861A2D]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } relative flex-1 min-w-0 py-4 px-4 border-b-2 font-medium text-sm text-center focus:outline-none`}
                    >
                      Rejected
                      <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      {activeRequests.filter(req => req.status === 'REJECTED').length}
                    </span>
                    </button>
                    <button
                        onClick={() => setStatusFilter('CANCELLED')}
                        className={`${
                            statusFilter === 'CANCELLED'
                                ? 'border-b-2 border-[#861A2D] text-[#861A2D]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } relative flex-1 min-w-0 py-4 px-4 border-b-2 font-medium text-sm text-center focus:outline-none`}
                    >
                      Cancelled
                      <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {activeRequests.filter(req => req.status === 'CANCELLED').length}
                    </span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              {isLoading ? (
                  <div className="flex flex-col justify-center items-center py-16">
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
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purpose
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {currentRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{request.serviceType}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 line-clamp-1">{request.purpose}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(request.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center w-fit ${getStatusBadgeClass(request.status)}`}>
                              {getStatusIcon(request.status)}
                              {request.status}
                            </span>
                                {request.status === 'PENDING' && isRequestEditable(request) && (
                                    <div className="mt-1 text-xs text-blue-600">
                                      <svg className="w-3 h-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {getRemainingEditTime(request)}
                                    </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-[#861A2D] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                                    onClick={() => handleViewRequest(request)}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View
                                </button>
                                {request.status === 'PENDING' && isRequestEditable(request) && (
                                    <>
                                      <button
                                          onClick={() => handleEditRequest(request)}
                                          className="inline-flex items-center px-2.5 py-1.5 border border-blue-300 text-xs font-medium rounded shadow-sm text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                      >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                      </button>
                                      <button
                                          onClick={() => handleCancelRequest(request)}
                                          className="inline-flex items-center px-2.5 py-1.5 border border-red-300 text-xs font-medium rounded shadow-sm text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                      >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Cancel
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
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </main>
        </div>

        {/* Modal for New Service Request */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div ref={serviceFormModalRef} className="bg-white rounded-lg max-w-xl w-full shadow-xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-[#861A2D]">
                    {isEditing ? 'Edit Service Request' : 'New Service Request'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-500"
                    disabled={isSubmitting}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                {!formData.serviceType ? (
                  <div className="mb-4">
                    <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Service Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="serviceType"
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border ${
                        errors.serviceType ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D]`}
                      disabled={isSubmitting}
                    >
                      <option value="">Select a service type</option>
                      {serviceTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.serviceType && (
                      <p className="mt-1 text-sm text-red-600">{errors.serviceType}</p>
                    )}
                  </div>
                ) : requestMethod === null ? (
                  /* Step 2: Choose between QR code or Form */
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Choose Request Method</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => setRequestMethod('form')}
                        className="flex flex-col items-center p-4 border-2 border-gray-300 rounded-lg hover:border-[#861A2D] hover:bg-[#861A2D]/5 transition-all"
                      >
                        <svg className="w-12 h-12 text-[#861A2D] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span className="font-medium">Fill Form</span>
                        <p className="text-xs text-gray-500 text-center mt-1">
                          Fill in the required details manually
                        </p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setRequestMethod('qr')}
                        className="flex flex-col items-center p-4 border-2 border-gray-300 rounded-lg hover:border-[#861A2D] hover:bg-[#861A2D]/5 transition-all"
                      >
                        <svg className="w-12 h-12 text-[#861A2D] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                        </svg>
                        <span className="font-medium">Use QR Code</span>
                        <p className="text-xs text-gray-500 text-center mt-1">
                          Scan with Barangay360 mobile app
                        </p>
                      </button>
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({...formData, serviceType: ''});
                          setQrValue('');
                        }}
                        className="px-3 py-2 text-sm text-gray-700 hover:text-[#861A2D] flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Back to services
                      </button>
                    </div>
                  </div>
                ) : requestMethod === 'form' ? (
                  /* Step 3 Option 1: Show Form */
                  <form onSubmit={handleSubmit}>
                    {/* Service Type Already Selected - Show as readonly */}
                    <div className="mb-4">
                      <div className="flex justify-between items-start">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Service Type
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({...formData, serviceType: ''});
                            setRequestMethod(null);
                          }}
                          className="text-sm text-[#861A2D] hover:underline"
                        >
                          Change
                        </button>
                      </div>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                        {formData.serviceType}
                      </div>
                    </div>
                    
                    {/* Purpose */}
                    <div className="mb-4">
                      <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                        Purpose <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="purpose"
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleChange}
                        className={`block w-full px-3 py-2 border ${
                          errors.purpose ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D]`}
                        disabled={isSubmitting}
                      />
                      {errors.purpose && (
                        <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
                      )}
                    </div>

                    {/* Details */}
                    <div className="mb-4">
                      <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
                        Details <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="details"
                        name="details"
                        rows="3"
                        value={formData.details}
                        onChange={handleChange}
                        className={`block w-full px-3 py-2 border ${
                          errors.details ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D]`}
                        disabled={isSubmitting}
                      ></textarea>
                      {errors.details && (
                        <p className="mt-1 text-sm text-red-600">{errors.details}</p>
                      )}
                    </div>

                    {/* Contact Number */}
                    <div className="mb-4">
                      <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="contactNumber"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        className={`block w-full px-3 py-2 border ${
                          errors.contactNumber ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D]`}
                        disabled={isSubmitting}
                      />
                      {errors.contactNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.contactNumber}</p>
                      )}
                    </div>

                    {/* Address */}
                    <div className="mb-4">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="address"
                        name="address"
                        rows="2"
                        value={formData.address}
                        onChange={handleChange}
                        className={`block w-full px-3 py-2 border ${
                          errors.address ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D]`}
                        disabled={isSubmitting}
                      ></textarea>
                      {errors.address && (
                        <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setRequestMethod(null)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                        disabled={isSubmitting}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </span>
                        ) : (
                          <>
                            {isEditing ? 'Update Request' : 'Submit Request'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Step 3 Option 2: Show QR Code */
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Service Type</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({...formData, serviceType: ''});
                            setRequestMethod(null);
                            setQrValue('');
                          }}
                          className="text-sm text-[#861A2D] hover:underline"
                        >
                          Change
                        </button>
                      </div>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 text-left">
                        {formData.serviceType}
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border-2 border-[#861A2D]/20 shadow-md inline-block mb-4">
                      {qrValue ? (
                        <div>
                          <div className="relative w-64 h-64 mx-auto">
                            <QRCodeCanvas
                              value={qrValue}
                              size={256}
                              level="H"
                              includeMargin={true}
                              ref={qrCodeRef}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={downloadQRCode}
                            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                            </svg>
                            Download QR Code
                          </button>
                        </div>
                      ) : (
                        <div className="w-64 h-64 flex items-center justify-center">
                          <svg className="animate-spin h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-2 mb-4 text-left">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700 font-medium mb-1">
                            How to use QR code:
                          </p>
                          <ol className="list-decimal pl-5 text-sm text-blue-700 space-y-1">
                            <li>Open the Barangay360 mobile app</li>
                            <li>Go to the Services section</li>
                            <li>Tap on &quot;Scan QR&quot; button</li>
                            <li>Point your camera at this QR code</li>
                            <li>Complete the service request on your mobile device</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <button
                        type="button"
                        onClick={() => setRequestMethod(null)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Request Details Modal */}
        {selectedRequest && !isEditing && !showModal && (
            <div ref={requestDetailsModalRef} className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
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
                        {selectedRequest.status === 'PENDING' && isRequestEditable(selectedRequest) && (
                            <span className="ml-2 text-xs text-blue-600">
                        {getRemainingEditTime(selectedRequest)}
                      </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Date Requested</h4>
                      <p className="mt-1 text-sm text-gray-900">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Contact Number</h4>
                      <p className="mt-1 text-sm text-gray-900">{selectedRequest.contactNumber || "Not provided"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-500">Purpose</h4>
                      <p className="mt-1 text-sm text-gray-900">{selectedRequest.purpose}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-500">Details</h4>
                      <p className="mt-1 text-sm text-gray-900">{selectedRequest.details}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-500">Address</h4>
                      <p className="mt-1 text-sm text-gray-900">{selectedRequest.address}</p>
                    </div>

                    {/* Document Section */}
                    {selectedRequest.documentStatus && selectedRequest.documentStatus !== 'NOT_GENERATED' && (
                      <div className="md:col-span-2 mt-2">
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <svg className="h-5 w-5 text-gray-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Document
                          </h4>
                          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                              <div className="mb-3 sm:mb-0">
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  {selectedRequest.serviceType} Document
                                </p>
                                <div className="flex items-center">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full 
                                    ${selectedRequest.documentStatus === 'ATTACHED' ? 'bg-blue-100 text-blue-800' : 
                                      selectedRequest.documentStatus === 'GENERATED' ? 'bg-green-100 text-green-800' : 
                                      'bg-purple-100 text-purple-800'}`}>
                                    {selectedRequest.documentStatus}
                                  </span>
                                  {selectedRequest.documentStatus === 'DELIVERED' && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      Document is ready for pickup
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => selectedRequest.attachedDocumentPath 
                                    ? handleViewAttachedDocument(selectedRequest.id) 
                                    : handlePreviewDocument(selectedRequest.id)}
                                  disabled={isDocLoading}
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none"
                                >
                                  {isDocLoading ? (
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                  )}
                                  {isDocLoading ? "Loading..." : "View"}
                                </button>
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
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedRequest.status === 'REJECTED' && selectedRequest.rejectionReason && (
                        <div className="md:col-span-2 bg-red-50 p-3 rounded-md">
                          <h4 className="text-sm font-medium text-red-800">Reason for Rejection</h4>
                          <p className="mt-1 text-sm text-red-700">{selectedRequest.rejectionReason}</p>
                        </div>
                    )}
                    {selectedRequest.status === 'CANCELLED' && selectedRequest.cancellationReason && (
                        <div className="md:col-span-2 bg-gray-50 p-3 rounded-md">
                          <h4 className="text-sm font-medium text-gray-800">Reason for Cancellation</h4>
                          <p className="mt-1 text-sm text-gray-700">{selectedRequest.cancellationReason}</p>
                        </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    {selectedRequest.status === 'PENDING' && isRequestEditable(selectedRequest) && (
                        <>
                          <button
                              onClick={() => {
                                handleEditRequest(selectedRequest);
                                handleCloseRequest();
                              }}
                              className="inline-flex items-center justify-center px-3 py-2 border border-blue-200 rounded-md text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Request
                          </button>
                          <button
                              onClick={() => handleCancelRequest(selectedRequest)}
                              className="inline-flex items-center justify-center px-3 py-2 border border-red-200 rounded-md text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Request
                          </button>
                        </>
                    )}
                    <button
                        onClick={handleCloseRequest}
                        className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Cancel Request Confirmation Modal */}
        {showCancelModal && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
              <div ref={cancelModalRef} className="bg-white roundedlg max-w-md w-full shadow-xl">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-red-600">Cancel Service Request</h3>
                    <button
                        onClick={() => {
                          if (!isCancelling) {
                            setShowCancelModal(false);
                            setCancelReason('');
                            setRequestToCancel(null);
                          }
                        }}
                        className="text-gray-400 hover:text-gray-500"
                        disabled={isCancelling}
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="mb-4">
                    <p className="text-gray-700 mb-4">
                      Are you sure you want to cancel this service request? This action cannot be undone.
                    </p>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            Cancelling a request will notify the barangay officials and remove this request from their approval queue.
                          </p>
                        </div>
                      </div>
                    </div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Cancellation <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        rows="3"
                        placeholder="Please provide a reason for cancelling this request"
                        disabled={isCancelling}
                    ></textarea>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => {
                          if (!isCancelling) {
                            setShowCancelModal(false);
                            setCancelReason('');
                            setRequestToCancel(null);
                          }
                        }}
                        className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={isCancelling}
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Go Back
                    </button>
                    <button
                        onClick={submitCancelRequest}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                        disabled={isCancelling || !cancelReason.trim()}
                    >
                      {isCancelling ? (
                          <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cancelling...
                    </span>
                      ) : (
                          <>
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Confirm Cancellation
                          </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Update the Document Preview Modal with PDFViewerComponent */}
        {showDocPreview && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75"
            onClick={closeDocPreview}
          >
            <div 
              ref={docPreviewModalRef} 
              className="bg-white rounded-lg shadow-lg w-11/12 h-5/6 max-w-6xl max-h-screen flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full w-full">
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
                    title="Document Preview"
                    onClose={closeDocPreview}
                  />
                )}
              </div>
              <div className="p-2 bg-gray-800 flex justify-between items-center">
                <button
                  onClick={closeDocPreview}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Viewer Modal - Replace with our improved component */}
        {showDocumentViewer && (
          <div 
            className="fixed inset-0 bg-gray-800 bg-opacity-90 flex items-center justify-center p-4 z-50"
            onClick={handleCloseDocumentViewer}
          >
            <div 
              ref={documentViewerModalRef} 
              className="bg-white rounded-lg w-full max-w-6xl h-[80vh] shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 overflow-hidden">
                <PDFViewerComponent 
                  url={documentViewerUrl}
                  title="Document Viewer"
                  onClose={handleCloseDocumentViewer}
                />
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Services;
