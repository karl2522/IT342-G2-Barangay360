import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const Services = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    serviceType: '',
    purpose: '',
    details: '',
    contactNumber: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeRequests, setActiveRequests] = useState([
    {
      id: '2001',
      serviceType: 'certificate',
      serviceName: 'Barangay Certificate',
      status: 'pending',
      requestDate: '2023-06-20T14:30:00Z',
      purpose: 'Employment',
    },
    {
      id: '2002',
      serviceType: 'clearance',
      serviceName: 'Barangay Clearance',
      status: 'approved',
      requestDate: '2023-06-15T10:00:00Z',
      purpose: 'School Requirement',
      processedDate: '2023-06-17T09:15:00Z',
    },
    {
      id: '2003',
      serviceType: 'id-card',
      serviceName: 'Barangay ID Card',
      status: 'rejected',
      requestDate: '2023-06-10T16:45:00Z',
      purpose: 'Personal',
      processedDate: '2023-06-12T11:30:00Z',
      rejectionReason: 'Missing required identification documents. Please resubmit with complete requirements.',
    },
  ]);

  const serviceTypes = [
    { value: 'certificate', label: 'Barangay Certificate', description: 'General certification for various purposes' },
    { value: 'clearance', label: 'Barangay Clearance', description: 'Required for employment, business, or legal purposes' },
    { value: 'id-card', label: 'Barangay ID Card', description: 'Official barangay identification card' },
    { value: 'business-permit', label: 'Business Permit', description: 'Required for operating a business within the barangay' },
    { value: 'residency', label: 'Certificate of Residency', description: 'Proof of residency in the barangay' },
    { value: 'indigency', label: 'Certificate of Indigency', description: 'For those who need financial assistance' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.serviceType) newErrors.serviceType = 'Please select a service type';
    if (!formData.purpose) newErrors.purpose = 'Please provide a purpose';
    if (!formData.contactNumber) newErrors.contactNumber = 'Please provide a contact number';
    if (!formData.address) newErrors.address = 'Please provide your address';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would make an API call here
      // For this example, we'll simulate a successful request
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a new mock request
      const newRequest = {
        id: `2${Math.floor(Math.random() * 1000)}`,
        serviceType: formData.serviceType,
        serviceName: serviceTypes.find(type => type.value === formData.serviceType)?.label,
        status: 'pending',
        requestDate: new Date().toISOString(),
        purpose: formData.purpose,
        details: formData.details,
        contactNumber: formData.contactNumber,
        address: formData.address,
      };
      
      // Add to active requests
      setActiveRequests([newRequest, ...activeRequests]);
      
      // Reset form
      setFormData({
        serviceType: '',
        purpose: '',
        details: '',
        contactNumber: '',
        address: '',
      });
      
      // Show success message
      setSuccessMessage('Service request submitted successfully. You can track its status below.');
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error submitting request:', error);
      setErrors({ submit: 'Failed to submit request. Please try again.' });
    } finally {
      setIsSubmitting(false);
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
          {/* Success message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
              <p className="font-medium">{successMessage}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Request Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Request a Service</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Fill out the form below to request a barangay service. Officials will review your request.
                  </p>
                </div>
                
                <div className="p-6">
                  <form onSubmit={handleSubmit}>
                    {/* Service Type */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Type*
                      </label>
                      <select
                        name="serviceType"
                        value={formData.serviceType}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded-md focus:ring-[#861A2D] focus:border-[#861A2D] ${
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
                      {errors.serviceType && (
                        <p className="mt-1 text-xs text-red-500">{errors.serviceType}</p>
                      )}
                      {formData.serviceType && (
                        <p className="mt-1 text-xs text-gray-500">
                          {serviceTypes.find(s => s.value === formData.serviceType)?.description}
                        </p>
                      )}
                    </div>

                    {/* Purpose */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purpose*
                      </label>
                      <input
                        type="text"
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleChange}
                        placeholder="e.g., Employment, School Requirement, etc."
                        className={`w-full p-2 border rounded-md focus:ring-[#861A2D] focus:border-[#861A2D] ${
                          errors.purpose ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.purpose && (
                        <p className="mt-1 text-xs text-red-500">{errors.purpose}</p>
                      )}
                    </div>

                    {/* Details */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Details
                      </label>
                      <textarea
                        name="details"
                        value={formData.details}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Provide any additional information regarding your request"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#861A2D] focus:border-[#861A2D]"
                      ></textarea>
                    </div>

                    {/* Contact Number */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number*
                      </label>
                      <input
                        type="text"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        placeholder="e.g., +63 912 345 6789"
                        className={`w-full p-2 border rounded-md focus:ring-[#861A2D] focus:border-[#861A2D] ${
                          errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.contactNumber && (
                        <p className="mt-1 text-xs text-red-500">{errors.contactNumber}</p>
                      )}
                    </div>

                    {/* Address */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address*
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Your complete address within the barangay"
                        className={`w-full p-2 border rounded-md focus:ring-[#861A2D] focus:border-[#861A2D] ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      ></textarea>
                      {errors.address && (
                        <p className="mt-1 text-xs text-red-500">{errors.address}</p>
                      )}
                    </div>

                    {/* Submit error */}
                    {errors.submit && (
                      <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{errors.submit}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </span>
                        ) : (
                          'Submit Request'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Active Requests */}
            <div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">My Requests</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Track the status of your service requests
                  </p>
                </div>
                
                <div className="p-6">
                  {activeRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No requests</h3>
                      <p className="mt-1 text-sm text-gray-500">You haven't submitted any requests yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeRequests.map((request) => (
                        <div key={request.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{request.serviceName}</h3>
                              <p className="text-xs text-gray-500 mt-1">
                                Requested on {new Date(request.requestDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">Purpose: {request.purpose}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(request.status)}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                          
                          {request.status === 'approved' && (
                            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-green-700">
                              <p>Your request has been approved! Visit the barangay office to collect your document.</p>
                              <p className="mt-1">Processed on: {new Date(request.processedDate).toLocaleDateString()}</p>
                            </div>
                          )}
                          
                          {request.status === 'rejected' && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-medium text-red-700">Request Rejected</p>
                              <p className="text-xs text-gray-700 mt-1">Reason: {request.rejectionReason}</p>
                            </div>
                          )}
                          
                          {request.status === 'pending' && (
                            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                              <p>Your request is pending review by barangay officials.</p>
                              <p className="italic mt-1">Average processing time: 1-2 business days</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Services; 