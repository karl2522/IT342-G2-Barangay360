import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { forumService } from '../../services/ForumService';
import { useToast } from '../../contexts/ToastContext';
import { formatDistanceToNow } from 'date-fns';

const ForumManagement = () => {
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // all, mostLiked, mostCommented
  
  // Function to get posts data from backend
  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await forumService.getAllPosts(currentPage, 10);
      setPosts(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching posts:', error);
      showToast('Error loading posts', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Load posts when component mounts
  useEffect(() => {
    loadPosts();
  }, [currentPage]);
  
  // Function to handle viewing post details
  const handleViewPostDetails = (post) => {
    setSelectedPost(post);
  };
  
  // Function to close post details modal
  const handleCloseModal = () => {
    setSelectedPost(null);
  };
  
  // Function to show delete confirmation modal
  const handleConfirmDelete = (post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };
  
  // Function to cancel delete operation
  const handleCancelDelete = () => {
    setPostToDelete(null);
    setShowDeleteModal(false);
  };
  
  // Function to handle deleting a post
  const handleDeletePost = async () => {
    if (!postToDelete) return;
    
    try {
      await forumService.deletePost(postToDelete.id);
      showToast('Post deleted successfully', 'success');
      loadPosts(); // Reload posts after deletion
      setShowDeleteModal(false);
      setPostToDelete(null);
      if (selectedPost && selectedPost.id === postToDelete.id) {
        setSelectedPost(null); // Close the modal if showing the deleted post
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Error deleting post', 'error');
    }
  };
  
  // Function to format date
  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'some time ago';
    }
  };
  
  // Filter posts based on search term and active filter
  const filteredPosts = posts
    .filter(post => {
      const searchContent = 
        (post.title || '').toLowerCase() + 
        (post.content || '').toLowerCase() + 
        (post.author?.firstName || '').toLowerCase() + 
        (post.author?.lastName || '').toLowerCase();
      
      return searchContent.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (filterActive === 'mostLiked') {
        return (b.likes?.length || 0) - (a.likes?.length || 0);
      } else if (filterActive === 'mostCommented') {
        return (b.comments?.length || 0) - (a.comments?.length || 0);
      }
      return new Date(b.createdAt) - new Date(a.createdAt); // Default: newest first
    });

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar isOfficial={true} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <h1 className="text-2xl font-semibold text-[#861A2D]">Forum Management</h1>
        </header>

        {/* Header */}
        <div className="flex justify-between py-6 px-8">
          <div>
            <h2 className="text-lg font-medium text-gray-800">Community Forum Posts</h2>
            <p className="mt-1 text-sm text-gray-600">Manage and moderate all forum posts and community discussions</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
                onClick={() => loadPosts()}
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
                  placeholder="Search posts by title, content, or author..."
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
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterActive('all')}
                  className={`px-3 py-2 text-sm font-medium rounded-md shadow-sm ${
                    filterActive === 'all'
                      ? 'bg-[#861A2D] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All Posts
                </button>
                <button
                  onClick={() => setFilterActive('mostLiked')}
                  className={`px-3 py-2 text-sm font-medium rounded-md shadow-sm ${
                    filterActive === 'mostLiked'
                      ? 'bg-[#861A2D] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Most Liked
                </button>
                <button
                  onClick={() => setFilterActive('mostCommented')}
                  className={`px-3 py-2 text-sm font-medium rounded-md shadow-sm ${
                    filterActive === 'mostCommented'
                      ? 'bg-[#861A2D] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Most Commented
                </button>
              </div>
            </div>
          </div>

          {/* Posts Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#861A2D]"></div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-700">No posts found</h3>
                <p className="mt-1 text-sm text-gray-500">Try changing your search terms or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Post
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Engagement
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-[#861A2D] text-white flex items-center justify-center font-bold">
                              {post.author?.firstName?.charAt(0) || 'U'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {post.author?.firstName} {post.author?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{post.author?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 mb-1 truncate max-w-xs">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {post.content}
                          </div>
                          {post.imageUrl && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                <svg className="mr-1.5 h-2 w-2 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
                                  <circle cx="4" cy="4" r="3" />
                                </svg>
                                Has image
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <span className="inline-flex items-center text-sm text-gray-500">
                              <svg className="h-5 w-5 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              {post.likes?.length || 0}
                            </span>
                            <span className="inline-flex items-center text-sm text-gray-500">
                              <svg className="h-5 w-5 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {post.comments?.length || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(post.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleViewPostDetails(post)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-[#861A2D] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                              </svg>
                              View Details
                            </button>
                            <button
                              onClick={() => handleConfirmDelete(post)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
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
        </main>
      </div>

      {/* Post Details Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Post Details</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] rounded-md p-1"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* Post Author Info */}
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-full bg-[#861A2D] text-white flex items-center justify-center font-bold">
                  {selectedPost.author?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    {selectedPost.author?.firstName} {selectedPost.author?.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {selectedPost.author?.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    Posted {formatDate(selectedPost.createdAt)}
                  </p>
                </div>
              </div>
              
              {/* Post Content */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold mb-3">{selectedPost.title}</h2>
                <p className="text-gray-700 whitespace-pre-line mb-4">{selectedPost.content}</p>
                
                {selectedPost.imageUrl && (
                  <div className="mb-4 border rounded-lg p-1 bg-white">
                    <img
                      src={selectedPost.imageUrl}
                      alt={selectedPost.title}
                      className="max-h-96 rounded-lg mx-auto"
                    />
                  </div>
                )}
              </div>
              
              {/* Post Stats */}
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span className="text-lg font-medium text-gray-900">{selectedPost.likes?.length || 0}</span>
                  <span className="ml-1 text-sm text-gray-500">likes</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-lg font-medium text-gray-900">{selectedPost.comments?.length || 0}</span>
                  <span className="ml-1 text-sm text-gray-500">comments</span>
                </div>
              </div>
              
              {/* Comments Section */}
              {selectedPost.comments && selectedPost.comments.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Comments</h4>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {selectedPost.comments.map(comment => (
                      <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center mb-2">
                          <div className="h-8 w-8 rounded-full bg-gray-500 text-white flex items-center justify-center font-bold mr-2">
                            {comment.author?.firstName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {comment.author?.firstName} {comment.author?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => handleConfirmDelete(selectedPost)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Post
              </button>
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
              
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Post</h3>
              
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this post? This action cannot be undone and all associated data will be permanently removed.
                </p>
              </div>
              
              <div className="mt-6 flex justify-center space-x-3">
                <button
                  onClick={handleCancelDelete}
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
    </div>
  );
};

export default ForumManagement; 