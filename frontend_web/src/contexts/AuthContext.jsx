import PropTypes from 'prop-types';
import { createContext, useState } from 'react';

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
      return localStorage.getItem('token');
    } catch (e) {
      console.error('Error getting token from storage:', e);
      return null;
    }
  };

  const [user, setUser] = useState(getUserFromStorage());
  const [token, setToken] = useState(getTokenFromStorage());

  const login = async (username, password) => {
    try {
      console.log('Attempting login for:', username);
      const response = await fetch('http://localhost:8080/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful');
        
        if (!data.accessToken) {
          console.error('No access token received from server');
          return { success: false, message: 'No access token received from server' };
        }
        
        // Store the token
        const accessToken = data.accessToken;
        localStorage.setItem('token', accessToken);
        
        // Store user data
        const userData = {
          id: data.id,
          username: data.username,
          email: data.email,
          roles: data.roles
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update state
        setToken(accessToken);
        setUser(userData);
        
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        return { success: false, message: errorData.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error occurred' };
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
          'Content-Type': 'application/json'
        },
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

  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);
    
    // Clear storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    console.log('Logged out successfully');
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (role) => {
    console.log(`Checking for role: ${role}`, user?.roles);
    return user && user.roles && user.roles.includes(role);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser,
      token,
      setToken,
      login, 
      logout, 
      register, 
      isAuthenticated, 
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
}; 