import PropTypes from 'prop-types';
import { createContext, useCallback, useState } from 'react';
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
      if (!userStr) return null;
      
      const userData = JSON.parse(userStr);
      
      // Ensure roles have ROLE_ prefix and handle resident/user role mapping
      if (userData && userData.roles) {
        userData.roles = userData.roles.map(role => {
          // Convert to uppercase for consistent comparison
          const normalizedRole = typeof role === 'string' ? role.toUpperCase() : role;
          
          // Special mapping for resident/user role
          if (normalizedRole === 'RESIDENT') {
            return 'ROLE_USER';
          }
          
          // Regular role formatting
          return normalizedRole.startsWith('ROLE_') ? normalizedRole : `ROLE_${normalizedRole}`;
        });
        
        // Update storage with properly formatted roles
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('User loaded from storage with formatted roles:', userData.roles);
      }
      
      return userData;
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
        credentials: 'include',
        mode: 'cors' // Ensure CORS is enabled
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
        
        // If the refresh token is invalid/expired, clean up
        if (response.status === 401 || response.status === 403) {
          console.error('Refresh token invalid or expired, logging out');
          // Clear tokens but don't navigate away - let caller decide
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setToken(null);
          setRefreshToken(null);
        }
        
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  // Add a public method that other services can use to refresh the token
  const refreshTokenMethod = async () => {
    const success = await refreshAccessToken();
    if (!success) {
      showToast('Your session has expired. Please login again.', 'error');
      logout();
      navigate('/login');
      return false;
    }
    return true;
  }

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

      // Debug response headers
      console.log('Login response status:', response.status);
      console.log('Login response headers:', Array.from(response.headers.entries()));

      const data = await response.json();
      console.log('Login raw data:', JSON.stringify(data));

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

      // Special handling for roles with detailed logging
      console.log("Raw roles from server:", data.roles);
      console.log("Roles data type:", typeof data.roles);
      console.log("Is roles array:", Array.isArray(data.roles));
      
      // Handle case where roles might not be an array
      let rolesArray = Array.isArray(data.roles) ? data.roles : 
                       (typeof data.roles === 'string' ? [data.roles] : []);
      
      console.log("Roles after ensuring array:", rolesArray);
      
      // Normalize the roles with special handling for 'resident' role
      const formattedRoles = rolesArray.map(role => {
        if (!role) return 'ROLE_USER'; // Default to USER if role is undefined
        
        // Convert to uppercase for consistent comparison
        const normalizedRole = typeof role === 'string' ? role.toUpperCase() : String(role).toUpperCase();
        
        // Special mapping for resident/user role
        if (normalizedRole === 'RESIDENT') {
          console.log('Converting RESIDENT to ROLE_USER');
          return 'ROLE_USER';
        }
        
        // Regular role formatting
        return normalizedRole.startsWith('ROLE_') ? normalizedRole : `ROLE_${normalizedRole}`;
      });
      
      // If no roles were found, default to ROLE_USER
      if (formattedRoles.length === 0) {
        console.log('No roles found, defaulting to ROLE_USER');
        formattedRoles.push('ROLE_USER');
      }
      
      console.log("Original roles from server:", rolesArray);
      console.log("Formatted roles after mapping:", formattedRoles);

      // Store user data and tokens
      const userData = {
        id: data.id,
        username: data.username,
        email: data.email,
        roles: formattedRoles, // Use formatted roles here
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        isActive: data.isActive,
        warnings: data.warnings || 0
      };

      console.log("Final user data to store:", userData);

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', JSON.stringify(data.accessToken));
      localStorage.setItem('refreshToken', JSON.stringify(data.refreshToken));

      setUser(userData);
      setToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      // Show success message
      showToast('Login successful!', 'success');

      // Redirect based on formatted roles - do this AFTER all authentication is complete
      if (formattedRoles.includes('ROLE_ADMIN')) {
        navigate('/admin-dashboard');
      } else if (formattedRoles.includes('ROLE_OFFICIAL')) {
        navigate('/official/dashboard');
      } else if (formattedRoles.includes('ROLE_USER')) {
        navigate('/resident/dashboard');
      } else {
        console.warn('No recognized role found, defaulting to resident dashboard');
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
    console.log("isAuthenticated check:", {
      hasToken: !!token?.token,
      hasUser: !!user,
      isTokenExpired: token ? isTokenExpired(token) : true,
      token: token,
      user: user
    });
    return !!token?.token && !!user && !isTokenExpired(token);
  };

  const hasRole = (role) => {
    const roleToCheck = role.startsWith('ROLE_') ? role : `ROLE_${role.toUpperCase()}`;
    
    console.log(`Detailed hasRole check for ${roleToCheck}:`, {
      userRoles: user?.roles,
      roleToCheck: roleToCheck,
      userRolesType: user?.roles ? typeof user.roles : 'undefined',
      isArray: user?.roles ? Array.isArray(user.roles) : false,
      stringifiedRoles: user?.roles ? JSON.stringify(user.roles) : 'undefined',
      directComparison: user?.roles?.includes(roleToCheck),
      caseInsensitiveCheck: user?.roles?.some(r => r.toUpperCase() === roleToCheck.toUpperCase()),
      userData: user
    });
    
    // Try case-insensitive comparison as fallback
    if (user && user.roles) {
      // First try direct comparison
      if (user.roles.includes(roleToCheck)) {
        console.log(`Role ${roleToCheck} found with direct comparison`);
        return true;
      }
      
      // Then try case-insensitive comparison
      const hasRoleCaseInsensitive = user.roles.some(r => 
        r.toUpperCase() === roleToCheck.toUpperCase()
      );
      
      if (hasRoleCaseInsensitive) {
        console.log(`Role ${roleToCheck} found with case-insensitive comparison`);
        return true;
      }
      
      // Special handling for USER and RESIDENT roles
      if (roleToCheck === 'ROLE_USER' && 
          user.roles.some(r => 
            r.toUpperCase() === 'RESIDENT' || 
            r.toUpperCase() === 'ROLE_RESIDENT'
          )) {
        console.log('ROLE_USER access granted based on RESIDENT role');
        return true;
      }
    }
    
    console.log(`Role ${roleToCheck} NOT found in user roles`);
    return false;
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
      refreshTokenMethod,
      handleApiRequest
    }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
}; 
