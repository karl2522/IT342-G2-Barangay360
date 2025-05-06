import PropTypes from 'prop-types';
import { createContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

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

      // Ensure credentials are included
      const requestOptions = {
        ...options,
        headers,
        credentials: 'include'
      };

      const response = await fetch(url, requestOptions);

      // If the response is 401, try to refresh the token and retry the request
      if (response.status === 401) {
        console.log('Received 401, attempting to refresh token');
        const refreshSuccess = await refreshAccessToken();
        if (refreshSuccess) {
          // Retry the request with the new token
          const retryHeaders = {
            ...options.headers,
            'Authorization': `Bearer ${token.token}`
          };
          const retryOptions = {
            ...options,
            headers: retryHeaders,
            credentials: 'include'
          };
          return await fetch(url, retryOptions);
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
      const response = await fetch('http://localhost:8080/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid username or password');
        }
        if (response.status === 403 && data.message?.includes("disabled")) {
          // Clear any existing tokens
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');

          // Throw error with deactivation reason
          throw new Error(data.message || 'Your account has been deactivated due to multiple warnings.');
        }
        throw new Error(data.message || 'Login failed');
      }

      if (!data || !data.accessToken || !data.refreshToken) {
        throw new Error('Invalid response from server');
      }

      // Store user data and tokens
      const userData = {
        id: data.id,
        username: data.username,
        email: data.email,
        roles: data.roles,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        isActive: data.isActive,
        warnings: data.warnings || 0
      };

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', JSON.stringify(data.accessToken));
      localStorage.setItem('refreshToken', JSON.stringify(data.refreshToken));

      setUser(userData);
      setToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      // Show success message
      showToast('Login successful!', 'success');

      // Redirect based on role
      const roles = data.roles.map(role => role.toUpperCase());
      if (roles.includes('ROLE_ADMIN')) {
        navigate('/admin-dashboard');
      } else if (roles.includes('ROLE_OFFICIAL')) {
        navigate('/official/dashboard');
      } else {
        navigate('/resident/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast(error.message || 'Login failed. Please check your credentials.', 'error');
      throw error;
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
