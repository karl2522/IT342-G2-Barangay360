import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Sidebar from '../../components/layout/Sidebar';
import { forumService } from '../../services/ForumService';
import { useToast } from '../../contexts/ToastContext';
import { formatDistanceToNow } from 'date-fns';
import Cropper from 'react-easy-crop';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// Report Modal Component
const ReportModal = ({ isOpen, onClose, onSubmit, contentType, loading }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [reportCategories, setReportCategories] = useState([]);
  
  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setReason('');
      setDetails('');
      
      // Load report categories
      const loadCategories = async () => {
        try {
          const categories = await forumService.getReportCategories();
          setReportCategories(categories);
        } catch (error) {
          console.error('Error loading report categories:', error);
        }
      };
      
      loadCategories();
    }
  }, [isOpen]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ reason, details });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Report {contentType}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Report
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861A2D]"
              required
            >
              <option value="">Select a reason</option>
              {reportCategories.map(category => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Details
            </label>
            <textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide additional details about why you're reporting this content..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861A2D]"
            ></textarea>
            <p className="mt-1 text-xs text-gray-500">This information will help moderators review the content.</p>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#861A2D] text-white rounded-md hover:bg-[#9e2235] disabled:opacity-70 text-sm"
              disabled={loading || !reason}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// PropTypes for ReportModal component
ReportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  contentType: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired
};

// Post Modal Component
const PostModal = ({ isOpen, onClose, editingPost, handleSubmit, submitting }) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Image cropping states
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title);
      setContent(editingPost.content);
      setImagePreview(editingPost.imageUrl);
    } else {
      setTitle('');
      setContent('');
      setImage(null);
      setImagePreview(null);
    }
    
    // Reset crop/zoom states when modal opens/closes
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setUploadProgress(0);
    setIsUploading(false);
  }, [editingPost, isOpen]);
  
  useEffect(() => {
    // Set up drag and drop event listeners
    const dropArea = dropAreaRef.current;
    if (!dropArea || !isOpen) return;

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
  }, [isOpen]);
  
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
      
      // Update state with the cropped image
      setImage(croppedFile);
      
      // Set the preview
      const croppedPreview = URL.createObjectURL(blob);
      setImagePreview(croppedPreview);
      
      // Close the crop modal
      setShowCropModal(false);
    } catch (error) {
      console.error('Error creating cropped image:', error);
      showToast('Error cropping image. Please try again.', 'error');
    }
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

  const resetForm = () => {
    setTitle('');
    setContent('');
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
    }
    
    // Simulate upload progress
    setIsUploading(true);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);
    
    handleSubmit(formData, resetForm)
      .finally(() => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      });
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    setOriginalImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderImageUploadSection = () => {
    return (
      <div className="mb-4">
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
          Image (Optional)
        </label>
        <div className="flex flex-col gap-2">
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
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
            id="image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {!imagePreview && (
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">{editingPost ? 'Edit Post' : 'Create New Post'}</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861A2D]"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861A2D]"
                required
              ></textarea>
            </div>
            
            {renderImageUploadSection()}
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#861A2D] text-white rounded-md hover:bg-[#9e2235] disabled:opacity-70 text-sm"
                disabled={submitting || isUploading}
              >
                {submitting || isUploading ? 'Submitting...' : editingPost ? 'Update Post' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Image Cropper Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
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
                  className="px-4 py-2 bg-[#861A2D] text-white rounded-md hover:bg-[#9e2235]"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// PropTypes for PostModal component
PostModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editingPost: PropTypes.object,
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired
};

const CommunityForum = () => {
  const { user, logout } = useContext(AuthContext);
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Report related states
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingContentType, setReportingContentType] = useState(''); // 'post' or 'comment'
  const [reportingContentId, setReportingContentId] = useState(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  
  const navigate = useNavigate();

  // Load posts on component mount and when page changes
  useEffect(() => {
    // Define a function to load posts with error handling
    const fetchPosts = async () => {
      try {
        await loadPosts();
      } catch (error) {
        console.error('Error in useEffect when loading posts:', error);
        // Note: loadPosts already has its own error handling,
        // so we don't need to duplicate the logic here
      }
    };
    
    fetchPosts();
    
    // Set up an interval to periodically check token validity
    // This helps catch cases where the token might expire while using the app
    const tokenCheckInterval = setInterval(() => {
      // Simple check to see if we have a valid token
      const tokenValid = forumService.getToken() !== null;
      if (!tokenValid) {
        console.warn('Token has become invalid during session, logging out...');
        showToast('Your session has expired. Please log in again.', 'error');
        logout();
        navigate('/login');
        clearInterval(tokenCheckInterval);
      }
    }, 60000); // Check once per minute
    
    return () => {
      // Clean up the interval on component unmount
      clearInterval(tokenCheckInterval);
    };
  }, [currentPage, logout, navigate, showToast]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await forumService.getAllPosts(currentPage, 5);
      setPosts(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error loading posts:', error);
      
      // Handle authentication errors
      if (error.response && error.response.status === 401) {
        console.error('Authentication error when loading posts:', error);
        showToast('Your session has expired. Please log in again.', 'error');
        logout();
        navigate('/login');
        return;
      }
      
      showToast('Error loading posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setModalOpen(true);
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await forumService.deletePost(postId);
        showToast('Post deleted successfully', 'success');
        loadPosts();
      } catch (error) {
        console.error('Error deleting post:', error);
        
        // Handle authentication errors
        if (error.response && error.response.status === 401) {
          console.error('Authentication error when deleting post:', error);
          showToast('Your session has expired. Please log in again.', 'error');
          logout();
          navigate('/login');
          return;
        }
        
        showToast('Error deleting post', 'error');
      }
    }
  };

  const handleLikePost = async (postId) => {
    try {
      // Find the post to apply optimistic update
      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex === -1) return;
      
      const post = posts[postIndex];
      
      // Prevent liking your own post
      if (post.author.id === user.id) {
        return; // Simply return without doing anything
      }
      
      const currentUserLiked = post.likes.some(like => like.id === user.id);
      
      // Create a new likes array for optimistic update
      let newLikes;
      if (currentUserLiked) {
        // Remove like
        newLikes = post.likes.filter(like => like.id !== user.id);
      } else {
        // Add like
        newLikes = [...post.likes, { id: user.id }];
      }
      
      // Update post state optimistically
      const updatedPosts = [...posts];
      updatedPosts[postIndex] = {
        ...post,
        likes: newLikes
      };
      
      setPosts(updatedPosts);
      
      // Make the API call
      try {
        await forumService.toggleLikePost(postId);
        // No need to refresh since we've already updated optimistically
      } catch (error) {
        // Handle specific error cases
        if (error.response && error.response.status === 401) {
          console.error('Authentication error when liking post:', error);
          showToast('Your session has expired. Please log in again.', 'error');
          
          // Use the logout function and redirect
          logout();
          navigate('/login');
          return;
        }
        
        throw error; // Re-throw for the outer catch block to handle other errors
      }
    } catch (error) {
      console.error('Error liking post:', error);
      
      // Only show toast if it's not a network error or if the error is severe
      if (error.message !== 'Network Error') {
        showToast('Error processing like action', 'error');
      }
      
      // Revert the optimistic update
      loadPosts(); // Reload all posts to get the correct state
    }
  };

  const handleSubmitComment = async (postId) => {
    if (!commentContent.trim()) {
      showToast('Comment cannot be empty', 'error');
      return;
    }

    setSubmittingComment(true);
    
    // Create an optimistic comment to immediately show in the UI
    const optimisticComment = {
      id: 'temp-' + Date.now(),
      content: commentContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName
      },
      likes: []
    };
    
    // Optimistically update the UI - add at the beginning since we show newest first
    if (expandedPost && expandedPost.id === postId) {
      setExpandedPost(prev => ({
        ...prev,
        comments: [optimisticComment, ...prev.comments]
      }));
    }
    
    // Store the comment content and clear the input for better UX
    const commentToSubmit = commentContent;
    setCommentContent('');

    try {
      // Send the request to the server
      const newComment = await forumService.createComment(postId, commentToSubmit);
      
      // Update the UI with the actual comment from the server - keep at the beginning
      if (expandedPost && expandedPost.id === postId) {
        setExpandedPost(prev => ({
          ...prev,
          comments: prev.comments.map(comment => 
            comment.id === optimisticComment.id ? newComment : comment
          )
        }));
      }
      
      // Also update the comments count in the posts list
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [newComment, ...post.comments]
            };
          }
          return post;
        })
      );
      
      showToast('Comment added successfully', 'success');
    } catch (error) {
      console.error('Error adding comment:', error);
      
      // Handle authentication errors
      if (error.response && error.response.status === 401) {
        console.error('Authentication error when adding comment:', error);
        showToast('Your session has expired. Please log in again.', 'error');
        
        // Remove the optimistic comment
        if (expandedPost && expandedPost.id === postId) {
          setExpandedPost(prev => ({
            ...prev,
            comments: prev.comments.filter(comment => comment.id !== optimisticComment.id)
          }));
        }
        
        logout();
        navigate('/login');
        return;
      }
      
      showToast('Error adding comment', 'error');
      
      // Remove the optimistic comment if there was an error
      if (expandedPost && expandedPost.id === postId) {
        setExpandedPost(prev => ({
          ...prev,
          comments: prev.comments.filter(comment => comment.id !== optimisticComment.id)
        }));
      }
      
      // Restore the comment content for the user to try again
      setCommentContent(commentToSubmit);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleViewComments = async (postId) => {
    // Toggle comments display if already expanded
    if (expandedPost && expandedPost.id === postId) {
      setExpandedPost(null);
      return;
    }
    
    // Show loading indicator while fetching comments
    setLoadingComments(true);
    
    // Pre-populate the expandedPost with current post data to avoid UI jump
    const currentPost = posts.find(p => p.id === postId);
    if (currentPost) {
      setExpandedPost({
        ...currentPost,
        comments: []
      });
    }
    
    try {
      // Use Promise.all to fetch post and comments in parallel
      const [post, comments] = await Promise.all([
        forumService.getPostById(postId),
        forumService.getCommentsByPost(postId)
      ]);
      
      // Sort comments newest first before setting to state
      post.comments = comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setExpandedPost(post);
    } catch (error) {
      console.error('Error loading comments:', error);
      
      // Handle authentication errors
      if (error.response && error.response.status === 401) {
        console.error('Authentication error when loading comments:', error);
        showToast('Your session has expired. Please log in again.', 'error');
        setExpandedPost(null); // Reset expanded post
        logout();
        navigate('/login');
        return;
      }
      
      showToast('Error loading comments', 'error');
      
      // Reset expanded post to avoid showing empty comments
      setExpandedPost(null);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      // Find the comment in the current expanded post
      if (!expandedPost) return;
      
      const commentIndex = expandedPost.comments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) return;
      
      const comment = expandedPost.comments[commentIndex];
      
      // Prevent liking your own comment
      if (comment.author.id === user.id) {
        return; // Simply return without doing anything
      }
      
      const currentUserLiked = comment.likes.some(like => like.id === user.id);
      
      // Create a new likes array for optimistic update
      let newLikes;
      if (currentUserLiked) {
        // Remove like
        newLikes = comment.likes.filter(like => like.id !== user.id);
      } else {
        // Add like
        newLikes = [...comment.likes, { id: user.id }];
      }
      
      // Update the comment in state optimistically
      const updatedComments = [...expandedPost.comments];
      updatedComments[commentIndex] = {
        ...comment,
        likes: newLikes
      };
      
      setExpandedPost(prev => ({
        ...prev,
        comments: updatedComments
      }));
      
      // Make the API call
      try {
        await forumService.toggleLikeComment(commentId);
        // No need to refresh all comments since we've already updated the UI
      } catch (error) {
        // Handle specific error cases
        if (error.response && error.response.status === 401) {
          console.error('Authentication error when liking comment:', error);
          showToast('Your session has expired. Please log in again.', 'error');
          
          // Use the properly accessed logout function
          logout();
          navigate('/login');
          return;
        }
        
        throw error; // Re-throw for the outer catch block to handle other errors
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      // Only show toast if it's not a network error or if the error is severe
      if (error.message !== 'Network Error') {
        showToast('Error processing like action', 'error');
      }
      
      // Revert the optimistic update if needed
      if (expandedPost) {
        const comments = await forumService.getCommentsByPost(expandedPost.id);
        setExpandedPost({ ...expandedPost, comments });
      }
    }
  };

  const handleReportPost = (postId) => {
    // Check if user is authenticated first
    if (!user) {
      showToast('You must be logged in to report content.', 'error');
      return;
    }
    
    setReportingContentType('Post');
    setReportingContentId(postId);
    setReportModalOpen(true);
  };
  
  const handleReportComment = (commentId) => {
    // Check if user is authenticated first
    if (!user) {
      showToast('You must be logged in to report content.', 'error');
      return;
    }
    
    setReportingContentType('Comment');
    setReportingContentId(commentId);
    setReportModalOpen(true);
  };
  
  const handleSubmitReport = async (reportData) => {
    if (reportSubmitting) {
      console.log('Already submitting a report, please wait...');
      return;
    }
    
    try {
      setReportSubmitting(true);
      console.log(`DEBUG: Starting report submission for ${reportingContentType} with ID ${reportingContentId}`);
      console.log('DEBUG: Report data:', reportData);
      
      let response;
      if (reportingContentType === 'Post') {
        console.log('DEBUG: Calling forumService.reportPost...');
        response = await forumService.reportPost(reportingContentId, reportData.reason);
      } else if (reportingContentType === 'Comment') {
        console.log('DEBUG: Calling forumService.reportComment...');
        response = await forumService.reportComment(reportingContentId, reportData.reason, reportData.details);
      }
      
      console.log('DEBUG: Report response received:', response);
      
      // We know from backend implementation that even 401 responses are successful
      // forumService is already handling this properly, so we just need to check success flag
      if (response && response.success) {
        console.log('DEBUG: Report was successful, showing success toast');
        showToast(`${reportingContentType} reported successfully. Our moderators will review it.`, 'success');
      } else {
        // Handle error case
        console.log('DEBUG: Report failed, showing error toast');
        const errorMessage = response?.message || `Failed to report ${reportingContentType.toLowerCase()}.`;
        showToast(errorMessage, 'error');
      }
      
      console.log('DEBUG: Closing report modal and cleaning up state');
      // Close the modal and reset state regardless of success/failure
      setReportModalOpen(false);
      setReportingContentId(null);
      setReportingContentType('');
    } catch (error) {
      console.error('DEBUG: Unexpected error in handleSubmitReport:', error);
      showToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      console.log('DEBUG: Report submission complete');
      setReportSubmitting(false);
    }
  };
  
  const cancelReport = () => {
    setReportModalOpen(false);
    setReportingContentId(null);
    setReportingContentType('');
  };

  const handleSubmitPost = async (formData, resetFormCallback) => {
    try {
      setSubmitting(true);
      
      return new Promise((resolve, reject) => {
        const submitData = async () => {
          try {
            if (editingPost) {
              await forumService.updatePost(editingPost.id, formData);
              showToast('Post updated successfully', 'success');
            } else {
              await forumService.createPost(formData);
              showToast('Post created successfully', 'success');
            }
    
            if (resetFormCallback) resetFormCallback();
            setEditingPost(null);
            setModalOpen(false);
            loadPosts();
            resolve();
          } catch (error) {
            console.error('Error submitting post:', error);
            
            // Handle authentication errors
            if (error.response && error.response.status === 401) {
              console.error('Authentication error when submitting post:', error);
              showToast('Your session has expired. Please log in again.', 'error');
              
              // Close the modal
              setModalOpen(false);
              setEditingPost(null);
              
              logout();
              navigate('/login');
              reject(error);
              return;
            }
            
            showToast('Error submitting post', 'error');
            reject(error);
          } finally {
            setSubmitting(false);
          }
        };
        
        submitData();
      });
    } catch (error) {
      setSubmitting(false);
      throw error;
    }
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setModalOpen(false);
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'some time ago';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar isOfficial={false} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-[#861A2D]">Community Forum</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Welcome,</span>
                <span className="text-sm font-medium text-[#861A2D]">{user?.username}</span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Resident</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#861A2D] text-white flex items-center justify-center font-bold">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Left Sidebar - Quick Actions */}
            <div className="md:col-span-1 bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-bold text-lg mb-3">Create Content</h2>
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full px-4 py-2 bg-[#861A2D] text-white rounded-md shadow-sm hover:bg-[#9e2235] transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Create New Post
                </button>

                {loading ? null : (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Forum Statistics</p>
                    <div className="flex justify-between text-sm">
                      <span>Total Posts:</span>
                      <span className="font-semibold">{totalPages * 5}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Current Page:</span>
                      <span className="font-semibold">{currentPage + 1} of {totalPages}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Quick Navigation */}
              <div className="p-4">
                <h2 className="font-bold text-lg mb-2">Quick Links</h2>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="flex items-center text-gray-700 hover:text-[#861A2D]">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                      </svg>
                      My Saved Posts
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center text-gray-700 hover:text-[#861A2D]">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      My Posts
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center text-gray-700 hover:text-[#861A2D]">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Recent Activity
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Main Content - Posts */}
            <div className="md:col-span-3">
              {/* Posts List */}
              <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#861A2D]"></div>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      ></path>
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No posts yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Be the first to start a discussion in the community!
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#861A2D] hover:bg-[#9e2235]"
                      >
                        <svg
                          className="-ml-1 mr-2 h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          ></path>
                        </svg>
                        Create a post
                      </button>
                    </div>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="p-4">
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-[#861A2D] text-white flex-shrink-0 overflow-hidden flex items-center justify-center font-bold">
                            {post.author.firstName?.charAt(0) || 'U'}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {post.author.firstName} {post.author.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                          </div>
                        </div>
                        {post.author.id === user.id && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditPost(post)}
                              className="text-gray-500 hover:text-[#861A2D] p-1"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-gray-500 hover:text-red-600 p-1"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        )}
                        {post.author.id !== user.id && (
                          <button
                            onClick={() => handleReportPost(post.id)}
                            className="text-gray-500 hover:text-[#861A2D] p-1"
                            title="Report post"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              ></path>
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Post Content */}
                      <div className="mb-3">
                        <h2 className="text-lg font-semibold mb-2">{post.title}</h2>
                        <p className="text-gray-700 whitespace-pre-line">{post.content}</p>
                        {post.imageUrl && (
                          <div className="mt-3 relative bg-gray-50 rounded-md overflow-hidden" style={{ maxHeight: '500px' }}>
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="w-full h-full object-contain mx-auto"
                              style={{ maxHeight: '500px' }}
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleLikePost(post.id)}
                            className={`flex items-center space-x-1 ${
                              post.author.id === user.id
                                ? 'text-gray-400 cursor-not-allowed'
                                : post.likes.some(like => like.id === user.id)
                                  ? 'text-[#861A2D] font-medium'
                                  : 'text-gray-500 hover:text-[#861A2D]'
                            }`}
                            disabled={post.author.id === user.id}
                          >
                            <svg
                              className="w-5 h-5"
                              fill={post.likes.some(like => like.id === user.id) ? "currentColor" : "none"}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              ></path>
                            </svg>
                            <span>{post.likes.length}</span>
                          </button>
                          <button
                            onClick={() => handleViewComments(post.id)}
                            className="flex items-center space-x-1 text-gray-500 hover:text-[#861A2D]"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                              ></path>
                            </svg>
                            <span>{post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}</span>
                          </button>
                        </div>
                        <div className="text-xs text-gray-500">
                          {post.updatedAt !== post.createdAt && 
                            <span className="italic">Edited {formatDate(post.updatedAt)}</span>
                          }
                        </div>
                      </div>

                      {/* Comments Section */}
                      {expandedPost && expandedPost.id === post.id && (
                        <div className="mt-4 pt-3 border-t">
                          <h3 className="text-sm font-medium mb-3">Comments</h3>
                          
                          {/* Add Comment */}
                          <div className="flex items-start mb-4">
                            <div className="h-8 w-8 rounded-full bg-[#861A2D] text-white flex-shrink-0 flex items-center justify-center font-bold text-xs">
                              {user?.firstName?.charAt(0) || 'U'}
                            </div>
                            <div className="ml-2 flex-1">
                              <div className="relative">
                                <textarea
                                  value={commentContent}
                                  onChange={(e) => setCommentContent(e.target.value)}
                                  placeholder="Write a comment..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#861A2D] pr-10"
                                  rows="2"
                                ></textarea>
                                <button
                                  onClick={() => handleSubmitComment(post.id)}
                                  disabled={submittingComment || !commentContent.trim()}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-1.5 bg-[#861A2D] text-white hover:bg-[#9e2235] disabled:opacity-50 transition-colors"
                                  title="Submit comment"
                                >
                                  {submittingComment ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M21.7 11.5C22.1 11.3 22.1 10.7 21.7 10.5L3.3 2.3C2.9 2.1 2.5 2.4 2.5 2.9L4.8 10.2C4.9 10.4 5 10.6 5.2 10.7L10.2 11.9C10.5 12 10.5 12.5 10.2 12.6L5.2 13.8C5 13.9 4.9 14.1 4.8 14.3L2.4 21.1C2.4 21.5 2.8 21.9 3.2 21.7L21.7 11.5Z" fill="currentColor"/>
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Comments List */}
                          <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {loadingComments ? (
                              <div className="flex justify-center items-center py-6">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#861A2D]"></div>
                                <span className="ml-2 text-sm text-gray-600">Loading comments...</span>
                              </div>
                            ) : expandedPost.comments.length === 0 ? (
                              <p className="text-center text-gray-500 py-4 text-sm">No comments yet. Be the first to comment!</p>
                            ) : (
                              // Sort comments to show newest first
                              [...expandedPost.comments]
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                .map((comment) => (
                                <div key={comment.id} className="bg-gray-50 rounded-md p-3 border border-gray-100">
                                  <div className="flex items-start">
                                    <div className="h-6 w-6 rounded-full bg-[#861A2D] text-white flex-shrink-0 flex items-center justify-center font-bold text-xs">
                                      {comment.author.firstName?.charAt(0) || 'U'}
                                    </div>
                                    <div className="ml-2 flex-1">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="text-sm text-gray-900">
                                            {comment.author.firstName} {comment.author.lastName}
                                          </p>
                                          <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                                        </div>
                                        {comment.author.id === user.id && (
                                          <button
                                            onClick={() => {
                                              // Handle delete comment
                                            }}
                                            className="text-xs text-gray-500 hover:text-red-600"
                                          >
                                            Delete
                                          </button>
                                        )}
                                        {comment.author.id !== user.id && (
                                          <button
                                            onClick={() => handleReportComment(comment.id)}
                                            className="text-xs text-gray-500 hover:text-[#861A2D]"
                                            title="Report comment"
                                          >
                                            <svg
                                              className="w-4 h-4"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                              ></path>
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                                      <div className="mt-2">
                                        <button
                                          onClick={() => handleLikeComment(comment.id)}
                                          className={`flex items-center space-x-1 text-xs ${
                                            comment.author.id === user.id 
                                              ? 'text-gray-400 cursor-not-allowed' 
                                              : comment.likes.some(like => like.id === user.id)
                                                ? 'text-[#861A2D]'
                                                : 'text-gray-500 hover:text-[#861A2D]'
                                          }`}
                                          disabled={comment.author.id === user.id}
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill={comment.likes.some(like => like.id === user.id) ? "currentColor" : "none"}
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                            ></path>
                                          </svg>
                                          <span>{comment.likes.length}</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                  <div className="flex justify-center py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-3 py-1 border border-gray-300 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {currentPage + 1} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Post Modal */}
      <PostModal
        isOpen={modalOpen}
        onClose={cancelEdit}
        editingPost={editingPost}
        handleSubmit={handleSubmitPost}
        submitting={submitting}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={cancelReport}
        onSubmit={handleSubmitReport}
        contentType={reportingContentType}
        loading={reportSubmitting}
      />
    </div>
  );
};

export default CommunityForum; 