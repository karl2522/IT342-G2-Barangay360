import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import Sidebar from '../../components/layout/Sidebar.jsx';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { useToast } from '../../contexts/ToastContext';

const Services = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
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
    { value: 'Barangay Certificate', label: 'Barangay Certificate', description: 'General certification for various purposes' },
    { value: 'Barangay Clearance', label: 'Barangay Clearance', description: 'Required for employment, business, or legal purposes' },
    { value: 'Barangay ID Card', label: 'Barangay ID Card', description: 'Official barangay identification card' },
    { value: 'Business Permit', label: 'Business Permit', description: 'Required for operating a business within the barangay' },
    { value: 'Certificate of Residency', label: 'Certificate of Residency', description: 'Proof of residency in the barangay' },
    { value: 'Certificate of Indigency', label: 'Certificate of Indigency', description: 'For those who need financial assistance' },
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
          status: 'PENDING',
          residentName: `${user.firstName} ${user.lastName}`,
          residentEmail: user.email,
          residentPhone: user.phone || formData.contactNumber
        };
        
        await serviceRequestService.createServiceRequest(requestData);
        showToast('Service request submitted successfully!', 'success');
      }
      
      // Reset form
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
      default:
        return null;
    }
  };

  const filteredRequests = statusFilter === 'ALL' 
    ? activeRequests 
    : activeRequests.filter(request => request.status === statusFilter);

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
  };

  const handleCloseRequest = () => {
    setSelectedRequest(null);
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
      await serviceRequestService.updateServiceRequestStatus(
        requestToCancel.id, 
        'CANCELLED', 
        { cancellationReason: cancelReason }
      );
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
    const createdAt = new Date(request.createdAt);
    const deadline = new Date(createdAt);
    deadline.setHours(deadline.getHours() + 24);
    
    const now = new Date();
    const diffMs = deadline - now;
    
    if (diffMs <= 0) return 'Time expired';
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m remaining`;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex w-full">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-[#861A2D]">Barangay Services</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Welcome,</span>
                <span className="text-sm font-medium text-[#861A2D]">{user?.username}</span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Resident</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
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
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-3">Filter by status:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                      statusFilter === 'ALL' 
                        ? 'bg-gray-200 text-gray-800' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('PENDING')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                      statusFilter === 'PENDING' 
                        ? 'bg-yellow-200 text-yellow-800' 
                        : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setStatusFilter('APPROVED')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                      statusFilter === 'APPROVED' 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => setStatusFilter('REJECTED')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                      statusFilter === 'REJECTED' 
                        ? 'bg-red-200 text-red-800' 
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    Rejected
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{filteredRequests.length}</span> of <span className="font-medium">{activeRequests.length}</span> requests
              </div>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#861A2D]"></div>
              </div>
            ) : activeRequests.length === 0 ? (
              <div className="text-center py-16">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No service requests</h3>
                <p className="mt-1 text-base text-gray-500">You haven&apos;t submitted any service requests yet.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 px-4 py-2 bg-[#861A2D] text-white rounded-md font-medium shadow-sm hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:ring-offset-2 transition-colors"
                >
                  Create New Request
                </button>
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        View Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              className="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent rounded-md text-xs font-medium bg-[#861A2D]/10 text-[#861A2D] hover:bg-[#861A2D]/20 transition-colors"
                              onClick={() => handleViewRequest(request)}
                            >
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

      {/* Modal for New/Edit Service Request */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-6 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => {
              if (!isSubmitting) {
                setShowModal(false);
                if (isEditing) {
                  setIsEditing(false);
                  setFormData({
                    serviceType: '',
                    purpose: '',
                    details: '',
                    contactNumber: '',
                    address: '',
                  });
                }
              }
            }}>
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>
            
            {/* Modal content */}
            <div className="inline-block w-full max-w-md overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-xl">
              <div className="bg-[#861A2D]/5 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-[#861A2D]">
                    {isEditing ? 'Edit Service Request' : 'New Service Request'}
                  </h3>
                  <button
                    onClick={() => {
                      if (!isSubmitting) {
                        setShowModal(false);
                        if (isEditing) {
                          setIsEditing(false);
                          setFormData({
                            serviceType: '',
                            purpose: '',
                            details: '',
                            contactNumber: '',
                            address: '',
                          });
                        }
                      }
                    }}
                    className="text-gray-400 hover:text-[#861A2D] focus:outline-none transition-colors"
                    disabled={isSubmitting}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {isEditing && (
                  <p className="mt-1 text-sm text-gray-600">
                    You can edit this request within 24 hours of submission.
                  </p>
                )}
              </div>
                
              <div className="px-6 py-5">
                <form onSubmit={handleSubmit}>
                  {/* Service Type */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="serviceType"
                        value={formData.serviceType}
                        onChange={handleChange}
                        className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-[#861A2D] focus:border-[#861A2D] transition-colors appearance-none ${
                          errors.serviceType ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select a service type</option>
                        {serviceTypes.map((service) => (
                          <option key={service.value} value={service.value}>
                            {service.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.serviceType && (
                      <p className="mt-1 text-xs text-red-500">{errors.serviceType}</p>
                    )}
                    {formData.serviceType && (
                      <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-md italic">
                        {serviceTypes.find(s => s.value === formData.serviceType)?.description}
                      </p>
                    )}
                  </div>

                  {/* Purpose */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      placeholder="e.g., Employment, School Requirement, etc."
                      className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-[#861A2D] focus:border-[#861A2D] transition-colors ${
                        errors.purpose ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.purpose && (
                      <p className="mt-1 text-xs text-red-500">{errors.purpose}</p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="details"
                      value={formData.details}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Provide any additional information regarding your request"
                      className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-[#861A2D] focus:border-[#861A2D] transition-colors ${
                        errors.details ? 'border-red-500' : 'border-gray-300'
                      }`}
                    ></textarea>
                    {errors.details && (
                      <p className="mt-1 text-xs text-red-500">{errors.details}</p>
                    )}
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        placeholder="+63 912 345 6789"
                        className={`w-full pl-10 p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-[#861A2D] focus:border-[#861A2D] transition-colors ${
                          errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.contactNumber && (
                      <p className="mt-1 text-xs text-red-500">{errors.contactNumber}</p>
                    )}
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-0 flex items-start pl-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Your complete address within the barangay"
                        className={`w-full pl-10 p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-[#861A2D] focus:border-[#861A2D] transition-colors ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      ></textarea>
                    </div>
                    {errors.address && (
                      <p className="mt-1 text-xs text-red-500">{errors.address}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        if (isEditing) {
                          setIsEditing(false);
                          setFormData({
                            serviceType: '',
                            purpose: '',
                            details: '',
                            contactNumber: '',
                            address: '',
                          });
                        }
                      }}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {isEditing ? 'Updating...' : 'Submitting...'}
                        </span>
                      ) : (
                        isEditing ? 'Update Request' : 'Submit Request'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Request Details Modal */}
      {selectedRequest && !isEditing && !showModal && (
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
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Request
                    </button>
                    <button
                      onClick={() => handleCancelRequest(selectedRequest)}
                      className="inline-flex items-center justify-center px-3 py-2 border border-red-200 rounded-md text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
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
    </div>
  );
};

export default Services; 