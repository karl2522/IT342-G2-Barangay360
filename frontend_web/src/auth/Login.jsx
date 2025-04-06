import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  
  const { login, isAuthenticated } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      // If already logged in, check user roles directly from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (userData && userData.roles && userData.roles.includes('ROLE_OFFICIAL')) {
        navigate('/official/dashboard');
      } else if (userData && userData.roles && userData.roles.includes('ROLE_USER')) {
        navigate('/resident/dashboard');
      } else {
        // Default fallback
        navigate('/resident/dashboard');
      }
    }
  }, [isAuthenticated, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.username.trim() || !formData.password.trim()) {
      showToast('Please enter both username and password', 'error');
      return;
    }
    
    setLoading(true);
    setShowDeactivatedModal(false);
    
    try {
      await login(formData.username, formData.password);
      
      // If login is successful, the AuthContext will handle navigation
      // and show success message
      
    } catch (error) {
      console.error('Login error:', error);
      if (error.message?.includes('deactivated') || error.message?.includes('disabled')) {
        setDeactivationReason(error.message);
        setShowDeactivatedModal(true);
      } else {
        showToast(error.message || 'Failed to login. Please check your credentials.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-[#861A2D]">
            Barangay360
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border-t-4 border-[#861A2D]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D] sm:text-sm bg-white text-gray-900"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D] sm:text-sm bg-white text-gray-900"
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors duration-200"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link to="/signup" className="font-medium text-[#861A2D] hover:text-[#9b3747]">
                  Sign up
                </Link>
              </p>
            </div>
            <div className="mt-3 text-center">
              <Link to="/" className="font-medium text-sm text-gray-600 hover:text-gray-900">
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Deactivated Account Modal */}
      {showDeactivatedModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowDeactivatedModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Account Deactivated
            </h3>
            
            <p className="text-sm text-gray-600 text-center mb-6">
              {deactivationReason}
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => setShowDeactivatedModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
              >
                Close
              </button>
              <Link
                to="/resident/appeal"
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
              >
                Submit Appeal
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login; 