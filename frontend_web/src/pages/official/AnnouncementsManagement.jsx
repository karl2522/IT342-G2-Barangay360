import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import Sidebar from '../../components/layout/Sidebar.jsx';
import { announcementService } from '../../services/AnnouncementService';
import { useToast } from '../../contexts/ToastContext';
import Cropper from 'react-easy-crop';
import TopNavigation from '../../components/layout/TopNavigation';

const AnnouncementsManagement = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Image cropping states
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  
  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    thumbnail: null
  });
  
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    // Set up drag and drop event listeners
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;

    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const highlight = () => setIsDragging(true);
    const unhighlight = () => setIsDragging(false);
    
    const handleDrop = (e) => {
      preventDefaults(e);
      unhighlight();
      
      const dt = e.dataTransfer;
      const files = dt.files;
      
      if (files && files.length) {
        handleImageFile(files[0]);
      }
    };
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    return () => {
      if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
          dropArea.removeEventListener(eventName, preventDefaults);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
          dropArea.removeEventListener(eventName, highlight);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
          dropArea.removeEventListener(eventName, unhighlight);
        });
        
        dropArea.removeEventListener('drop', handleDrop);
      }
    };
  }, []);

  // Add the onCropComplete handler
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Function to create a cropped image
  const createCroppedImage = async () => {
    try {
      const canvas = document.createElement('canvas');
      const image = new Image();
      image.src = originalImage;
      
      await new Promise((resolve) => {
        image.onload = resolve;
      });
      
      // Adjust canvas size to match the cropped area
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      
      const ctx = canvas.getContext('2d');
      
      // Rotate and position the image
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      
      // Draw the cropped image on the canvas
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });
      
      // Create a File object from the blob
      const croppedFile = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
      
      // Update the form data with the cropped image
      setFormData(prev => ({
        ...prev,
        thumbnail: croppedFile
      }));
      
      // Set the preview
      const croppedPreview = URL.createObjectURL(blob);
      setThumbnailPreview(croppedPreview);
      
      // Close the crop modal
      setShowCropModal(false);
    } catch (error) {
      console.error('Error creating cropped image:', error);
      showToast('Error cropping image. Please try again.', 'error');
    }
  };

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementService.getAllAnnouncements();
      // Sort with newest first
      const sortedData = [...data].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setAnnouncements(sortedData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      showToast('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      title: '',
      content: '',
      thumbnail: null
    });
    setThumbnailPreview(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      thumbnail: null
    });
    // If there is a thumbnail, set the preview
    if (announcement.thumbnailUrl) {
      setThumbnailPreview(announcement.thumbnailUrl);
    } else {
      setThumbnailPreview(null);
    }
    setIsEditing(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      thumbnail: null
    });
    setThumbnailPreview(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to validate and process the image file
  const handleImageFile = (file) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Please select a valid image file (JPEG, PNG, GIF, WEBP)', 'error');
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }
    
    // Create preview URL and store the file for cropping
    const previewUrl = URL.createObjectURL(file);
    setOriginalImage(previewUrl);
    
    // Open the crop modal
    setShowCropModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    setModalLoading(true);
    setIsUploading(true);
    
    try {
      // Simulating upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      // Debug: log token information
      const tokenData = localStorage.getItem('token');
      console.log('Token data in storage:', tokenData);
      
      if (isEditing && selectedAnnouncement) {
        // Update existing announcement
        try {
          await announcementService.updateAnnouncement(selectedAnnouncement.id, formData);
          showToast('Announcement updated successfully!', 'success');
        } catch (error) {
          console.error('Error updating announcement:', error);
          
          // Check if it's a GCS error
          if (error.message && error.message.includes('403 Forbidden') && formData.thumbnail) {
            // Try again without the thumbnail
            const dataWithoutThumbnail = { ...formData, thumbnail: null };
            await announcementService.updateAnnouncement(selectedAnnouncement.id, dataWithoutThumbnail);
            showToast('Announcement updated successfully, but image upload failed due to permissions. Please contact your administrator.', 'warning');
          } else {
            throw error;
          }
        }
      } else {
        // Create new announcement
        const announcementData = {
          ...formData,
          officialId: user.id
        };
        
        console.log('Creating announcement with data:', {
          title: announcementData.title,
          content: announcementData.content.substring(0, 30) + '...',
          officialId: announcementData.officialId,
          hasThumbnail: !!announcementData.thumbnail
        });
        
        try {
          const result = await announcementService.createAnnouncement(announcementData);
          console.log('Announcement created successfully:', result);
          showToast('Announcement created successfully!', 'success');
        } catch (error) {
          console.error('Error creating announcement:', error);
          
          // Check if it's a GCS error
          if (error.message && error.message.includes('403 Forbidden') && announcementData.thumbnail) {
            // Try again without the thumbnail
            const dataWithoutThumbnail = { ...announcementData, thumbnail: null };
            const result = await announcementService.createAnnouncement(dataWithoutThumbnail);
            console.log('Announcement created without image:', result);
            showToast('Announcement created successfully, but image upload failed due to permissions. Please contact your administrator.', 'warning');
          } else {
            // More detailed error message
            showToast(`Error creating announcement: ${error.message}`, 'error');
            throw error; // Re-throw to handle in the outer catch
          }
        }
      }
      
      // Complete progress
      setUploadProgress(100);
      setTimeout(() => {
        // Reset form and close modal
        closeModal();
        
        // Reload announcements
        loadAnnouncements();
      }, 500);
      
    } catch (error) {
      console.error('Error submitting announcement:', error);
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setModalLoading(false);
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      thumbnail: null
    }));
    setThumbnailPreview(null);
    setOriginalImage(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openDeleteModal = (announcement) => {
    setAnnouncementToDelete(announcement);
    setShowDeleteModal(true);
  };
  
  const closeDeleteModal = () => {
    setAnnouncementToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDelete = async () => {
    if (!announcementToDelete) return;
    
    try {
      await announcementService.deleteAnnouncement(announcementToDelete.id);
      showToast('Announcement deleted successfully!', 'success');
      loadAnnouncements();
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      showToast('Failed to delete announcement', 'error');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderImageUploadSection = () => {
    return (
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Thumbnail Image (Optional)
        </label>
        <div className="flex flex-col gap-2">
          {thumbnailPreview ? (
            <div className="relative">
              <img 
                src={thumbnailPreview} 
                alt="Thumbnail Preview" 
                className="w-full h-48 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <div 
              ref={dropAreaRef}
              className={`border-dashed border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50`}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-1 text-sm text-gray-600">Click to upload an image or drag and drop</p>
              <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {!thumbnailPreview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              Browse files
            </button>
          )}
          
          {isUploading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              <p className="text-xs text-gray-500 mt-1">Uploading: {uploadProgress}%</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex w-full">
      <Sidebar isOfficial={true} />
      
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Navigation */}
        <TopNavigation title="Announcements Management" />
        
        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Top Controls */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-medium text-gray-800">All Announcements</h2>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#861A2D] text-white rounded-md hover:bg-[#6e1624] transition-colors"
            >
              + Create Announcement
            </button>
          </div>
          
          {/* Announcements List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#861A2D]"></div>
              <p className="mt-3 text-gray-600 font-medium">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
              <p className="mt-1 text-sm text-gray-500">Create your first announcement to share with residents.</p>
              <div className="mt-6">
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#861A2D] hover:bg-[#6e1624] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Announcement
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {announcement.thumbnailUrl && (
                    <div className="h-48 w-full relative">
                      <img 
                        src={announcement.thumbnailUrl} 
                        alt={announcement.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-[#861A2D]">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{announcement.content}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {formatDate(announcement.createdAt)}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(announcement)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openDeleteModal(announcement)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      
      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {isEditing ? 'Edit Announcement' : 'Create New Announcement'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D]"
                    placeholder="Enter announcement title"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="content" className="block text-gray-700 text-sm font-bold mb-2">
                    Content *
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    rows="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D]"
                    placeholder="Enter announcement content"
                    required
                  ></textarea>
                </div>
                
                {renderImageUploadSection()}
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-2"
                    disabled={modalLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#861A2D] text-white rounded-md hover:bg-[#6e1624] disabled:bg-[#a3677a] disabled:cursor-not-allowed"
                    disabled={modalLoading}
                  >
                    {modalLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isEditing ? 'Updating...' : 'Creating...'}
                      </div>
                    ) : (
                      <>{isEditing ? 'Update' : 'Create'}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Cropper Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Adjust Image</h3>
              <button 
                onClick={() => setShowCropModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="relative h-96">
              <Cropper
                image={originalImage}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="mb-4">
                <label htmlFor="zoom" className="block text-sm font-medium text-gray-700 mb-1">Zoom</label>
                <input
                  type="range"
                  id="zoom"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="rotation" className="block text-sm font-medium text-gray-700 mb-1">Rotation</label>
                <input
                  type="range"
                  id="rotation"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCropModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createCroppedImage}
                  className="px-4 py-2 bg-[#861A2D] text-white rounded-md hover:bg-[#6e1624]"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Announcement</h3>
              
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete the announcement &ldquo;{announcementToDelete?.title}&rdquo;? This action cannot be undone.
                </p>
              </div>
              
              <div className="mt-6 flex justify-center space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsManagement; 