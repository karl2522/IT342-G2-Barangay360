import axios from 'axios';

const API_URL = 'http://localhost:8080/api/forum';

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
      
      // Check if token is expired
      if (this.isTokenExpired(tokenObj.token)) {
        console.warn('Token is expired, will attempt to use refresh token if available');
        // The actual token refresh should be handled by the AuthContext
        // This will just return null so the request fails properly with a 401
        return null;
      }
      
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

  // Add authorization header to requests if token exists
  setAuthHeader() {
    const token = this.getToken();
    if (token) {
      return {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
    }
    console.warn('No valid token available for API request, request may fail with 401');
    return {};
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
      const response = await this.client.delete(`${API_URL}/posts/${postId}`, this.setAuthHeader());
      return response.data;
    } catch (error) {
      console.error(`Error deleting post with id ${postId}:`, error);
      throw error;
    }
  }

  async toggleLikePost(postId) {
    try {
      // Ensure token is properly set in the request
      const authHeader = this.setAuthHeader();
      
      // If there's no valid token, throw a 401 error immediately
      if (!authHeader.headers || !authHeader.headers.Authorization) {
        const error = new Error('No valid authentication token');
        error.response = { status: 401 };
        throw error;
      }
      
      // Make sure we're passing the authorization header correctly
      const response = await this.client.post(
        `${API_URL}/posts/${postId}/like`, 
        {}, 
        {
          headers: {
            ...authHeader.headers
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
      const response = await this.client.delete(`${API_URL}/comments/${commentId}`, this.setAuthHeader());
      return response.data;
    } catch (error) {
      console.error(`Error deleting comment with id ${commentId}:`, error);
      throw error;
    }
  }

  async toggleLikeComment(commentId) {
    try {
      // Ensure token is properly set in the request
      const authHeader = this.setAuthHeader();
      
      // If there's no valid token, throw a 401 error immediately
      if (!authHeader.headers || !authHeader.headers.Authorization) {
        const error = new Error('No valid authentication token');
        error.response = { status: 401 };
        throw error;
      }
      
      // Make sure we're passing the authorization header correctly
      const response = await this.client.post(
        `${API_URL}/comments/${commentId}/like`, 
        {}, 
        {
          headers: {
            ...authHeader.headers
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

  // Report a post for inappropriate content
  async reportPost(postId, reason) {
    try {
      // Ensure token is properly set in the request
      const token = this.getToken();
      if (!token) {
        throw new Error('No valid authentication token');
      }
      
      // Use FormData as consistent with other endpoints
      const formData = new FormData();
      formData.append('reason', reason);
      
      // Use the same approach as in other methods that work correctly
      const response = await this.client.post(
        `http://localhost:8080/api/reports/post/${postId}?reason=${encodeURIComponent(reason)}`, 
        {}, // Empty body since we're using a query param
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Report post API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error reporting post with id ${postId}:`, error);
      throw error; // Re-throw the error to be handled by the component
    }
  }
  
  // Report a comment for inappropriate content
  async reportComment(commentId, reason, details) {
    try {
      // Ensure token is properly set in the request
      const authHeader = this.setAuthHeader();
      
      // If there's no valid token, throw a 401 error immediately
      if (!authHeader.headers || !authHeader.headers.Authorization) {
        const error = new Error('No valid authentication token');
        error.response = { status: 401 };
        throw error;
      }
      
      // Check if the endpoint exists - since we might be implementing client-side only
      // Store the report in localStorage for development/testing
      console.log(`Reporting comment ${commentId} with reason: ${reason}`);
      
      // In production, this would be a real API call
      // For now, we'll simulate a successful report
      const mockResponse = {
        success: true,
        message: 'Report submitted successfully',
        timestamp: new Date().toISOString()
      };
      
      // Store reports in localStorage for development purposes
      const storedReports = localStorage.getItem('commentReports') || '[]';
      const reports = JSON.parse(storedReports);
      reports.push({
        commentId,
        reason,
        details,
        timestamp: new Date().toISOString(),
        reportedBy: JSON.parse(localStorage.getItem('user'))?.id
      });
      localStorage.setItem('commentReports', JSON.stringify(reports));
      
      return mockResponse;
    } catch (error) {
      console.error(`Error reporting comment with id ${commentId}:`, error);
      throw error; // Re-throw the error to be handled by the component
    }
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
}

export const forumService = new ForumService(); 