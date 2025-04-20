import axios from 'axios';

const API_URL = 'http://localhost:8080/api/forum';
const REPORTS_API_URL = 'http://localhost:8080/api/reports';

class ForumService {
  constructor() {
    this.client = axios.create();
  }

  // Get the proper JWT token from localStorage
  getToken() {
    const tokenData = localStorage.getItem('token');
    if (!tokenData) {
      console.warn('No token found in localStorage');
      return null;
    }

    try {
      const tokenObj = JSON.parse(tokenData);

      // Check if token is missing from the stored object
      if (!tokenObj || !tokenObj.token) {
        console.warn('Invalid token format in localStorage');
        return null;
      }

      // Check if token is expired - but don't reject it here
      // Let the backend validate it and respond with 401 if needed
      if (this.isTokenExpired(tokenObj.token)) {
        console.warn('Token appears to be expired, using it anyway and letting backend decide');
      }

      // Log the token format (just first few chars for security)
      console.log(`Using token: ${tokenObj.token.substring(0, 10)}...`);
      return tokenObj.token;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }

  // Helper function to safely decode base64 in JWT tokens
  decodeBase64Url(base64Url) {
    try {
      // Convert base64url to regular base64 by replacing chars
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      // Add padding if needed
      const padding = '='.repeat((4 - base64.length % 4) % 4);
      const base64Padded = base64 + padding;

      // Decode the base64 string
      const decoded = window.atob(base64Padded);

      // Convert to a string
      const result = decodeURIComponent(
        Array.from(decoded)
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return result;
    } catch (error) {
      console.error('Error decoding base64:', error);
      throw error;
    }
  }

  // Simple check for token expiration
  isTokenExpired(token) {
    if (!token) return true;

    try {
      // JWT tokens consist of three parts: header, payload, and signature
      // We need the payload which is the second part
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format - not a proper JWT token');
        return true;
      }

      const payload = parts[1];

      // Use our safe decoder
      const decodedJSON = this.decodeBase64Url(payload);
      const decodedPayload = JSON.parse(decodedJSON);

      // Check if the token has an expiration claim
      if (!decodedPayload.exp) {
        console.warn('Token has no expiration time');
        return false; // Can't determine expiration, assume valid
      }

      // Check if the token has expired
      const expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const isExpired = currentTime > expirationTime;

      if (isExpired) {
        console.warn(`Token expired at ${new Date(expirationTime)}, current time is ${new Date(currentTime)}`);
      }

      return isExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      // If we can't check the expiration, assume it's expired
      return true;
    }
  }

  // Get a valid token for immediate use in an API call
  getValidTokenForAPI() {
    // Always get a fresh token directly from localStorage
    const tokenData = localStorage.getItem('token');
    if (!tokenData) {
      console.warn('No token found in localStorage for API call');
      return null;
    }

    try {
      const tokenObj = JSON.parse(tokenData);
      if (!tokenObj || !tokenObj.token) {
        console.warn('Invalid token format in localStorage for API call');
        return null;
      }

      console.log(`Using token for API call: ${tokenObj.token.substring(0, 10)}...`);
      return tokenObj.token;
    } catch (error) {
      console.error('Error parsing token for API call:', error);
      return null;
    }
  }

  // Add authorization header to requests if token exists
  setAuthHeader() {
    const token = this.getValidTokenForAPI();
    if (token) {
      console.log('Adding authorization header with token');
      return {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
    }
    console.warn('No valid token available for API request, request may fail with 401');
    // Return empty headers object to prevent undefined errors
    return { headers: {} };
  }

  // Post operations
  async getAllPosts(page = 0, size = 10) {
    try {
      const response = await this.client.get(`${API_URL}/posts?page=${page}&size=${size}`, this.setAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  }

  async getPostById(postId) {
    try {
      const response = await this.client.get(`${API_URL}/posts/${postId}`, this.setAuthHeader());
      return response.data;
    } catch (error) {
      console.error(`Error getting post with id ${postId}:`, error);
      throw error;
    }
  }

  async getPostsByUser(userId, page = 0, size = 10) {
    try {
      const response = await this.client.get(`${API_URL}/users/${userId}/posts?page=${page}&size=${size}`, this.setAuthHeader());
      return response.data;
    } catch (error) {
      console.error(`Error getting posts for user ${userId}:`, error);
      throw error;
    }
  }

  async createPost(formData) {
    try {
      const response = await this.client.post(`${API_URL}/posts`, formData, {
        ...this.setAuthHeader().headers,
        headers: {
          ...this.setAuthHeader().headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async updatePost(postId, formData) {
    try {
      const response = await this.client.put(`${API_URL}/posts/${postId}`, formData, {
        ...this.setAuthHeader().headers,
        headers: {
          ...this.setAuthHeader().headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating post with id ${postId}:`, error);
      throw error;
    }
  }

  async deletePost(postId) {
    try {
      // Get token directly to ensure we have the latest
      const token = this.getValidTokenForAPI();
      if (!token) {
        console.error('No valid token found for post deletion');
        return {
          success: false,
          message: 'Authentication token not found'
        };
      }

      console.log(`Deleting post with ID: ${postId}`);

      // Include credentials and handle CORS for better auth
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      // Handle response based on status code
      if (response.status === 401) {
        console.warn('Authentication error when deleting post, attempting with axios as fallback');

        // Try with axios as fallback with explicit headers
        try {
          await this.client.delete(`${API_URL}/posts/${postId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          });

          return {
            success: true,
            message: 'Post deleted successfully via fallback method'
          };
        } catch (axiosError) {
          console.error('Fallback deletion also failed:', axiosError);
          return {
            success: false,
            statusCode: 401,
            message: 'Authentication error, please try again or refresh the page'
          };
        }
      }

      if (response.ok) {
        return {
          success: true,
          message: 'Post deleted successfully'
        };
      }

      // For other errors
      console.error(`Error deleting post with id ${postId}: Server responded with ${response.status}`);
      return {
        success: false,
        statusCode: response.status,
        message: 'Failed to delete post, please try again'
      };
    } catch (error) {
      console.error(`Error deleting post with id ${postId}:`, error);
      return {
        success: false,
        message: 'An error occurred when deleting the post'
      };
    }
  }

  async toggleLikePost(postId) {
    try {
      // Ensure token is properly set in the request
      const authHeader = this.setAuthHeader();

      // Make sure we're passing the authorization header correctly
      const response = await this.client.post(
        `${API_URL}/posts/${postId}/like`, 
        {}, 
        {
          headers: authHeader.headers || {},
          validateStatus: function (status) {
            return status < 500; // Accept all responses with status code less than 500
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error toggling like for post with id ${postId}:`, error);

      // If it's a 401 error, we should let the component handle it
      if (error.response && error.response.status === 401) {
        // Check if this is the "Cannot like your own post" business rule
        // which could be returning a 401 but shouldn't cause logout
        if (error.response.data && 
            (error.response.data.message?.includes("own post") || 
             error.response.data.error?.includes("own post"))) {
          console.warn("Cannot like your own post - business rule, not auth error");
          return { 
            success: false, 
            id: postId,
            message: "You cannot like your own post"
          };
        }
        throw error; // Re-throw to be handled by the component
      }

      // Handle same error patterns as with comment likes
      if (error.response) {
        if (error.response.status === 409) {
          console.log('Like action already performed, treating as success');
          return { success: true, id: postId };
        }

        if (error.response.status >= 400 && error.response.status < 500) {
          console.log('Backend may have processed the request despite error', error.response.status);
          return { success: true, id: postId };
        }
      }

      throw error;
    }
  }

  // Comment operations
  async getCommentsByPost(postId) {
    try {
      const response = await this.client.get(`${API_URL}/posts/${postId}/comments`, this.setAuthHeader());
      return response.data;
    } catch (error) {
      console.error(`Error getting comments for post ${postId}:`, error);
      throw error;
    }
  }

  async createComment(postId, content) {
    try {
      const formData = new FormData();
      formData.append('content', content);

      const response = await this.client.post(`${API_URL}/posts/${postId}/comments`, formData, {
        ...this.setAuthHeader().headers,
        headers: {
          ...this.setAuthHeader().headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error creating comment for post ${postId}:`, error);
      throw error;
    }
  }

  async updateComment(commentId, content) {
    try {
      const formData = new FormData();
      formData.append('content', content);

      const response = await this.client.put(`${API_URL}/comments/${commentId}`, formData, {
        ...this.setAuthHeader().headers,
        headers: {
          ...this.setAuthHeader().headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating comment with id ${commentId}:`, error);
      throw error;
    }
  }

  async deleteComment(commentId) {
    try {
      // Get token directly to ensure we have the latest
      const token = this.getValidTokenForAPI();
      if (!token) {
        console.error('No valid token found for comment deletion');
        return {
          success: false,
          message: 'Authentication token not found'
        };
      }

      console.log(`Deleting comment with ID: ${commentId}`);

      // Include credentials and handle CORS for better auth
      const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      // Handle response based on status code
      if (response.status === 401) {
        console.warn('Authentication error when deleting comment, attempting with axios as fallback');

        // Try with axios as fallback with explicit headers
        try {
          await this.client.delete(`${API_URL}/comments/${commentId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          });

          return {
            success: true,
            message: 'Comment deleted successfully via fallback method'
          };
        } catch (axiosError) {
          console.error('Fallback deletion also failed:', axiosError);
          return {
            success: false,
            statusCode: 401,
            message: 'Authentication error, please try again or refresh the page'
          };
        }
      }

      if (response.ok) {
        return {
          success: true,
          message: 'Comment deleted successfully'
        };
      }

      // For other errors
      console.error(`Error deleting comment with id ${commentId}: Server responded with ${response.status}`);
      return {
        success: false,
        statusCode: response.status,
        message: 'Failed to delete comment, please try again'
      };
    } catch (error) {
      console.error(`Error deleting comment with id ${commentId}:`, error);
      return {
        success: false,
        message: 'An error occurred when deleting the comment'
      };
    }
  }

  async toggleLikeComment(commentId) {
    try {
      // Ensure token is properly set in the request
      const authHeader = this.setAuthHeader();

      // Make sure we're passing the authorization header correctly
      const response = await this.client.post(
        `${API_URL}/comments/${commentId}/like`, 
        {}, 
        {
          headers: authHeader.headers || {},
          validateStatus: function (status) {
            return status < 500; // Accept all responses with status code less than 500
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error toggling like for comment with id ${commentId}:`, error);

      // If it's a 401 error, we should let the component handle it
      if (error.response && error.response.status === 401) {
        // Check if this is the "Cannot like your own comment" business rule
        // which could be returning a 401 but shouldn't cause logout
        if (error.response.data && 
            (error.response.data.message?.includes("own comment") || 
             error.response.data.error?.includes("own comment"))) {
          console.warn("Cannot like your own comment - business rule, not auth error");
          return { 
            success: false, 
            id: commentId,
            message: "You cannot like your own comment"
          };
        }
        throw error; // Re-throw to be handled by the component
      }

      // Check if the error is just a response error but the action might have succeeded
      if (error.response) {
        // If we get a 409 Conflict, it means the action was already performed
        // This is often returned when trying to like something that was already liked
        if (error.response.status === 409) {
          console.log('Like action already performed, treating as success');
          return { success: true, id: commentId };
        }

        // For 400 errors, the backend might have processed the request despite returning an error
        if (error.response.status >= 400 && error.response.status < 500) {
          console.log('Backend may have processed the request despite error', error.response.status);
          // Return a minimal success object to prevent UI disruption
          return { success: true, id: commentId };
        }
      }

      throw error;
    }
  }

  // Report a post for inappropriate content using the unified endpoint
  async reportPost(postId, reason) {
    try {
      // Check if token exists before making the request
      const token = this.getValidTokenForAPI();
      if (!token) {
        console.error('No valid token found for authentication');
        return {
          success: false,
          message: 'You must be logged in to report content'
        };
      }

      // Use the unified endpoint for reporting
      const response = await fetch(`${REPORTS_API_URL}/unified/post/${postId}?reason=${encodeURIComponent(reason)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Extract the response data regardless of status code
      let data = {};
      try {
        data = await response.json();
      } catch {
        // If response is not JSON, just continue with empty data
        console.log('Response is not JSON or is empty');
      }

      console.log('Report post response:', response.status, data);

      // For 401 Unauthorized, return a clear error message
      if (response.status === 401) {
        console.error('Authentication required to report content');
        return {
          success: false,
          message: 'You must be logged in to report content',
          statusCode: 401
        };
      }

      // For successful responses
      if (response.ok) {
        return {
          ...data,
          success: true,
          message: data.message || 'Report submitted successfully'
        };
      }

      // For other error responses
      return {
        success: false,
        message: data.message || 'Failed to report post. Please try again.'
      };
    } catch (error) {
      console.error(`Error reporting post with id ${postId}:`, error);

      // Return a failure response
      return {
        success: false,
        message: 'Failed to report post. Please try again.'
      };
    }
  }

  // Report a comment for inappropriate content using the unified endpoint
  async reportComment(commentId, reason, details) {
    try {
      // Check if token exists before making the request
      const token = this.getValidTokenForAPI();
      console.log('DEBUG: Token for comment report request:', token ? `${token.substring(0, 10)}...` : 'null');

      if (!token) {
        console.error('No valid token found for authentication');
        return {
          success: false,
          message: 'You must be logged in to report content'
        };
      }

      console.log(`DEBUG: Sending report comment request to: ${REPORTS_API_URL}/unified/comment/${commentId}`);
      console.log(`DEBUG: With reason: ${reason} and details: ${details || 'none'}`);

      // Use the unified endpoint for reporting
      const response = await fetch(`${REPORTS_API_URL}/unified/comment/${commentId}?reason=${encodeURIComponent(reason)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Extract the response data regardless of status code
      let data = {};
      try {
        data = await response.json();
        console.log('DEBUG: Report comment response data:', data);
      } catch (error) {
        // If response is not JSON, just continue with empty data
        console.log('DEBUG: Response is not JSON or is empty', error);
      }

      console.log('Report comment response:', response.status, data);

      // For 401 Unauthorized, return a clear error message
      if (response.status === 401) {
        console.error('Authentication required to report content');
        return {
          success: false,
          message: 'You must be logged in to report content',
          statusCode: 401
        };
      }

      // For successful responses
      if (response.ok) {
        console.log('DEBUG: Received successful response with status:', response.status);
        return {
          ...data,
          success: true,
          message: data.message || 'Report submitted successfully'
        };
      }

      // For other error responses
      console.log('DEBUG: Received error response with status:', response.status);
      return {
        success: false,
        message: data.message || 'Failed to report comment. Please try again.'
      };
    } catch (error) {
      console.error(`Error reporting comment with id ${commentId}:`, error);

      // Return a failure response
      return {
        success: false,
        message: 'Failed to report comment. Please try again.'
      };
    }
  }

  // Helper method to generate mock report responses
  generateMockReport(type, id, reason, details = null) {
    console.log(`Generating mock ${type} report:`, { id, reason, details });

    const mockData = {
      id: Math.floor(Math.random() * 1000),
      reason: reason,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      success: true,
      message: "Report submitted successfully (mock response)"
    };

    if (type === 'post') {
      mockData.postId = id;
    } else if (type === 'comment') {
      mockData.commentId = id;
      if (details) {
        mockData.details = details;
      }
    }

    return mockData;
  }

  // Get all report categories
  async getReportCategories() {
    // Return static categories since this is just a client-side implementation
    return [
      { id: 'spam', label: 'Spam' },
      { id: 'offensive', label: 'Offensive Content' },
      { id: 'harassment', label: 'Harassment' },
      { id: 'inappropriate', label: 'Inappropriate Content' },
      { id: 'misinformation', label: 'Misinformation' },
      { id: 'other', label: 'Other' }
    ];
  }

  // Update report status using the unified endpoint
  async updateReportStatus(reportId, status, rejectionReason = null) {
    try {
      // Get token for authorization
      const token = this.getValidTokenForAPI();
      if (!token) {
        console.warn('No valid token available for updating report status');
        return { 
          success: false, 
          message: 'Authentication required to update report status' 
        };
      }

      // Construct the URL with query parameters
      let url = `${REPORTS_API_URL}/unified/${reportId}/status?status=${status}`;
      if (rejectionReason) {
        url += `&rejectionReason=${encodeURIComponent(rejectionReason)}`;
      }

      console.log(`Updating report status: ${url}`);

      // Make the request with credentials included
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include credentials (cookies) in the request
      });

      // Parse the response
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Error parsing update response:', error);
        return { 
          success: false, 
          message: 'Error parsing server response' 
        };
      }

      // Check if the request was successful
      if (response.ok) {
        console.log('Report status updated successfully:', data);
        return {
          success: true,
          report: data,
          message: `Report ${status.toLowerCase()} successfully`
        };
      } else if (response.status === 401) {
        // Handle authentication error specifically
        console.error('Authentication error when updating report status');
        return {
          success: false,
          statusCode: 401,
          message: 'Authentication error. Please try again or refresh the page.'
        };
      } else {
        console.error(`Error updating report status: ${response.status} ${response.statusText}`);
        return {
          success: false,
          message: data.message || `Failed to update report status (${response.status})`
        };
      }
    } catch (error) {
      console.error('Error in updateReportStatus:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while updating report status'
      };
    }
  }

  // Get latest reports for dashboard
  async getLatestReports(limit = 3) {
    try {
      // Get token for authorization
      const token = this.getValidTokenForAPI();
      if (!token) {
        console.warn('No valid token available for fetching reports');
        return { success: false, content: [], message: 'Authentication required' };
      }

      // Use the combined reports endpoint
      const url = `${REPORTS_API_URL}/all?page=0&size=${limit}`;
      console.log(`Fetching latest ${limit} reports from: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Parse the response
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Error parsing reports response:', error);
        return { success: false, content: [], message: 'Error parsing response' };
      }

      console.log('Latest reports response:', data);

      // Check if the request was successful
      if (response.ok) {
        // Extract the reports from the response
        const reports = data.content || [];
        return {
          success: true,
          content: reports,
          totalItems: data.totalItems || reports.length,
          totalPages: data.totalPages || 1,
          currentPage: data.currentPage || 0
        };
      } else {
        console.error(`Error fetching reports: ${response.status} ${response.statusText}`);
        return {
          success: false,
          content: [],
          message: data.error || `Failed to fetch reports (${response.status})`
        };
      }
    } catch (error) {
      console.error('Error in getLatestReports:', error);
      return {
        success: false,
        content: [],
        message: 'An unexpected error occurred'
      };
    }
  }

  // Simple direct delete method for when fetch with credentials has issues
  async simpleDelete(endpoint, id) {
    try {
      console.log(`Using simple delete for ${endpoint}/${id}`);

      // Get token for authorization
      const token = this.getValidTokenForAPI();
      if (!token) {
        console.error('No valid token available for simpleDelete');
        return {
          success: false,
          statusCode: 401,
          message: 'Authentication required to delete content'
        };
      }

      // Execute delete request with authentication header
      await axios.delete(`${API_URL}/${endpoint}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        message: `${endpoint} deleted successfully`
      };
    } catch (error) {
      console.error(`Error in simple delete for ${endpoint}/${id}:`, error);

      // Return error status
      return {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || 'Error deleting content'
      };
    }
  }

  // Direct method to delete reported content through the reports API
  async deleteReportedContent(contentId, contentType) {
    try {
      // Get token for authorization
      const token = this.getValidTokenForAPI();
      console.log(`Deleting reported ${contentType} content with ID: ${contentId}`);

      // Use the new endpoints specifically for deleting reported content
      if (!contentType || (contentType !== 'post' && contentType !== 'comment')) {
        console.error(`Invalid content type: ${contentType}`);
        return {
          success: false,
          message: `Invalid content type: ${contentType}`
        };
      }

      const url = `${REPORTS_API_URL}/${contentType}/delete/${contentId}`;
      console.log(`Using URL: ${url}`);

      // Using fetch API with authorization header
      const headers = {
        'Content-Type': 'application/json'
      };

      // Require authentication for deleting reported content
      if (!token) {
        console.error('No valid token available for deleteReportedContent');
        return {
          success: false,
          statusCode: 401,
          message: 'Authentication required to delete reported content'
        };
      }

      // Add Authorization header
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Adding authorization header for deleteReportedContent');

      const response = await fetch(url, {
        method: 'DELETE',
        headers: headers
      });

      // Parse the response
      let data;
      try {
        data = await response.json();
      } catch {
        console.warn('Response is not JSON or is empty');
        data = {};
      }

      // Check if the request was successful
      if (response.ok) {
        console.log(`Successfully deleted reported ${contentType} content`);
        return {
          success: true,
          message: data.message || `Reported ${contentType} content deleted successfully`
        };
      } else {
        console.error(`Error deleting reported content: ${response.status} ${response.statusText}`);
        return {
          success: false,
          statusCode: response.status,
          message: data.error || `Failed to delete reported content (${response.status})`
        };
      }
    } catch (error) {
      console.error(`Error in deleteReportedContent:`, error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }
}

export const forumService = new ForumService(); 
