import PropTypes from 'prop-types';
import { createContext, useState, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage
  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error('Error getting user from storage:', e);
      return null;
    }
  };

  const getTokenFromStorage = () => {
    try {
      const tokenData = localStorage.getItem('token');
      return tokenData ? JSON.parse(tokenData) : null;
    } catch (e) {
      console.error('Error getting token from storage:', e);
      return null;
    }
  };

  const getRefreshTokenFromStorage = () => {
    try {
      const refreshTokenData = localStorage.getItem('refreshToken');
      return refreshTokenData ? JSON.parse(refreshTokenData) : null;
    } catch (e) {
      console.error('Error getting refresh token from storage:', e);
      return null;
    }
  };

  const [user, setUser] = useState(getUserFromStorage());
  const [token, setToken] = useState(getTokenFromStorage());
  const [refreshToken, setRefreshToken] = useState(getRefreshTokenFromStorage());

  // Function to check if a token is expired
  const isTokenExpired = useCallback((tokenData) => {
    if (!tokenData?.expiresAt) return true;
    const expirationTime = new Date(tokenData.expiresAt).getTime();
    const currentTime = new Date().getTime();
    return currentTime >= expirationTime;
  }, []);

  // Function to check if a token is about to expire (within 5 minutes)
  const isTokenExpiringSoon = useCallback((tokenData) => {
    if (!tokenData?.expiresAt) return true;
    const expirationTime = new Date(tokenData.expiresAt).getTime();
    const currentTime = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    return (expirationTime - currentTime) <= fiveMinutes;
  }, []);

  const refreshAccessToken = async () => {
    try {
      if (!refreshToken?.token) {
        console.error('No refresh token available');
        return false;
      }

      // Log the refresh token being used (first few chars only for security)
      console.log(`Using refresh token: ${refreshToken.token.substring(0, 10)}...`);

      const response = await fetch('http://localhost:8080/api/auth/refreshtoken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: refreshToken.token }),
        // Don't throw error on non-2xx responses
        credentials: 'include'
      });

      // Handle both successful and failed responses without throwing
      const data = await response.json().catch(() => ({}));
      
      if (response.ok && data.accessToken && data.refreshToken) {
        console.log('Token refresh successful');
        
        // Store the tokens with their metadata
        localStorage.setItem('token', JSON.stringify(data.accessToken));
        localStorage.setItem('refreshToken', JSON.stringify(data.refreshToken));
        
        // Update state
        setToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        return true;
      } else {
        console.warn('Token refresh failed with status:', response.status);
        // Return false instead of throwing - let caller decide what to do
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  // Function to handle API requests with automatic token refresh
  const handleApiRequest = async (url, options = {}) => {
    try {
      // Check if access token is expired or about to expire
      if (isTokenExpired(token) || isTokenExpiringSoon(token)) {
        console.log('Token expired or expiring soon, attempting refresh');
        const refreshSuccess = await refreshAccessToken();
        if (!refreshSuccess) {
          console.error('Failed to refresh token');
          logout(); // Force logout if refresh fails
          throw new Error('Authentication failed');
        }
      }

      // Add the current access token to the request headers
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token.token}`
      };

      const response = await fetch(url, { ...options, headers });

      // If the response is 401, try to refresh the token and retry the request
      if (response.status === 401) {
        const refreshSuccess = await refreshAccessToken();
        if (refreshSuccess) {
          // Retry the request with the new token
          headers['Authorization'] = `Bearer ${token.token}`;
          return await fetch(url, { ...options, headers });
        } else {
          logout(); // Force logout if refresh fails
          throw new Error('Authentication failed');
        }
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  };

  const login = async (username, password) => {
    try {
      console.log('Attempting login for:', username);
      const response = await fetch('http://localhost:8080/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        
        if (!data.accessToken || !data.refreshToken) {
          console.error('No tokens received from server');
          return { success: false, message: 'No tokens received from server' };
        }
        
        // Store the tokens with their metadata
        localStorage.setItem('token', JSON.stringify(data.accessToken));
        localStorage.setItem('refreshToken', JSON.stringify(data.refreshToken));
        
        // Prepare user data with proper checking
        const userData = {
          id: data.id || '',
          username: data.username || '',
          email: data.email || '',
          roles: Array.isArray(data.roles) ? data.roles : [],
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
          profileImage: data.profileImage || ''
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update state
        setToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        setUser(userData);
        
        // Return both success status and user data
        return { success: true, userData };
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        return { 
          success: false, 
          message: errorData.message || 'Login failed',
          status: response.status
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: 'Network error occurred',
        error: error.message
      };
    }
  };

  const register = async (userData) => {
    try {
      // Transform the role field to match backend expectations
      const formattedData = {
        ...userData,
        roles: userData.role === 'official' ? ['official'] : ['resident']
      };
      
      const response = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formattedData)
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if user is logged in
      if (user && user.id) {
        await fetch('http://localhost:8080/api/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: user.id })
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear state and storage regardless of API call success
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      console.log('Logged out successfully');
    }
  };

  const isAuthenticated = () => {
    return !!token?.token && !!user && !isTokenExpired(token);
  };

  const hasRole = (role) => {
    const roleToCheck = role.startsWith('ROLE_') ? role : `ROLE_${role.toUpperCase()}`;
    console.log(`Checking for role: ${roleToCheck}`, user?.roles);
    return user && user.roles && user.roles.includes(roleToCheck);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser,
      token,
      setToken,
      refreshToken,
      setRefreshToken,
      login, 
      logout, 
      register, 
      isAuthenticated, 
      hasRole,
      refreshAccessToken,
      handleApiRequest // Expose the new API request handler
    }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
}; 