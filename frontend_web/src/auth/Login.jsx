import { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext';
import { QRCodeSVG } from 'qrcode.react';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [showQRLogin, setShowQRLogin] = useState(false);
  const [qrLoginData, setQRLoginData] = useState('');
  const [qrLoginSessionId, setQRLoginSessionId] = useState('');
  const [qrExpiration, setQrExpiration] = useState(300); // 5 minutes in seconds
  const [isRotating, setIsRotating] = useState(false);
  const [scanningAnimation, setScanningAnimation] = useState(false);
  const timerRef = useRef(null);
  
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

  // Generate QR code login session when QR login is shown
  useEffect(() => {
    if (showQRLogin) {
      generateQRLoginSession();
      startExpirationTimer();
      // Start the scanning animation
      setTimeout(() => setScanningAnimation(true), 1000);
    } else {
      setScanningAnimation(false);
      clearExpirationTimer();
    }
    
    return () => {
      clearExpirationTimer();
    };
  }, [showQRLogin]);

  // Create polling mechanism to check QR login status when QR login is active
  useEffect(() => {
    let interval;
    if (showQRLogin && qrLoginSessionId) {
      interval = setInterval(() => {
        checkQRLoginStatus();
      }, 3000); // Check every 3 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showQRLogin, qrLoginSessionId]);

  // Timer for QR code expiration
  const startExpirationTimer = () => {
    setQrExpiration(300); // Reset timer to 5 minutes
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setQrExpiration(prev => {
        if (prev <= 1) {
          clearExpirationTimer();
          refreshQRCode(); // Auto-refresh when expired
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const clearExpirationTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  // Format the remaining time in mm:ss format
  const formatRemainingTime = () => {
    const minutes = Math.floor(qrExpiration / 60);
    const seconds = qrExpiration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Function to generate a new QR login session
  const generateQRLoginSession = () => {
    // Generate a unique session ID 
    const sessionId = 'qr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
    setQRLoginSessionId(sessionId);
    
    // Create QR code data (in a real application, this would be coming from your backend)
    const qrData = {
      type: 'QRLOGIN',
      sessionId: sessionId,
      appName: 'Barangay360',
      timestamp: new Date().toISOString(),
      expires: new Date(Date.now() + 5 * 60000).toISOString() // 5 minutes
    };
    
    setQRLoginData(JSON.stringify(qrData));
  };
  
  // Function to check if mobile device has authenticated the QR login
  const checkQRLoginStatus = async () => {
    try {
      // This is a mock function. In a real implementation, you would make an API call
      // to check if the session has been authenticated by the mobile app
      
      // For this frontend-only implementation, we'll simulate success after 
      // 15 seconds of the QR code being displayed
      
      // For demo purposes, the code will create a successful login after 15 seconds
      const timeElapsed = Date.now() - parseInt(qrLoginSessionId.split('-')[1]);
      if (timeElapsed > 15000) {
        // Mock successful login
        showToast('Successfully authenticated via mobile app', 'success');
        setShowQRLogin(false);
        
        // In a real implementation, the server would return the user data
        // For demo purposes, let's assume a regular user login
        const mockUser = {
          id: 123,
          username: 'mobileuser',
          firstName: 'Mobile',
          lastName: 'User',
          roles: ['ROLE_USER']
        };
        
        // Store the mock user data as if it was returned from the server
        localStorage.setItem('user', JSON.stringify(mockUser));
        navigate('/resident/dashboard');
      }
    } catch (error) {
      console.error('Error checking QR login status:', error);
    }
  };
  
  // Function to refresh the QR code
  const refreshQRCode = () => {
    setIsRotating(true);
    generateQRLoginSession();
    startExpirationTimer();
    
    // Reset rotating animation after a short delay
    setTimeout(() => {
      setIsRotating(false);
    }, 1000);
  };
  
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

  // Toggle between QR login and traditional login
  const toggleLoginMethod = () => {
    setShowQRLogin(!showQRLogin);
  };
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-[#861A2D]">
            Barangay360
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {showQRLogin ? 'Sign in with your mobile app' : 'Sign in to your account'}
          </p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border-t-4 border-[#861A2D] relative overflow-hidden">
          {/* Background pattern elements for decoration */}
          <div className="absolute -right-12 -top-12 w-24 h-24 bg-[#861A2D]/5 rounded-full"></div>
          <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-[#861A2D]/5 rounded-full"></div>
          
          {showQRLogin ? (
            <div className="flex flex-col items-center space-y-6 relative z-10">
              <div className="text-center mb-1">
                <h3 className="text-lg font-medium text-gray-900">Secure QR Code Login</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Open the Barangay360 mobile app and scan this code to login
                </p>
              </div>
              
              <div className="relative">
                {/* Timer/expiration indicator */}
                <div className="absolute -top-3 -right-3 bg-white shadow-md rounded-full px-2 py-1 text-xs font-medium text-gray-700 border border-gray-200 z-20">
                  <span className="flex items-center">
                    <svg className="h-3 w-3 mr-1 text-[#861A2D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatRemainingTime()}
                  </span>
                </div>
                
                {/* QR Code container with animations */}
                <div className={`bg-gradient-to-br from-white to-gray-50 p-6 rounded-lg border-2 ${isRotating ? 'border-green-400 animate-pulse' : 'border-[#861A2D]/20'} shadow-lg relative transition-all duration-300 transform ${isRotating ? 'rotate-y-180' : ''}`}>
                  {/* Scanner animation overlay */}
                  {scanningAnimation && (
                    <div className="absolute inset-0 overflow-hidden rounded-lg z-10 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#861A2D]/10 to-transparent h-20 w-full animate-scan"></div>
                    </div>
                  )}
                  
                  {qrLoginData ? (
                    <div className="relative">
                      <QRCodeSVG
                        value={qrLoginData}
                        size={240}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"H"}
                        includeMargin={true}
                      />
                      {/* Removing the B360 logo overlay to ensure optimal QR code scanning */}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-[240px] h-[240px]">
                      <svg className="animate-spin h-12 w-12 text-[#861A2D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Status indicator */}
                <div className="flex justify-center mt-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <span className="animate-pulse relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Waiting for scan...
                  </span>
                </div>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg w-full shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 font-medium mb-1">
                      How to login with QR code:
                    </p>
                    <ol className="list-decimal pl-5 text-sm text-blue-700 space-y-1">
                      <li>Open the Barangay360 mobile app</li>
                      <li>Tap on the &quot;Scan QR&quot; button</li>
                      <li>Point your camera at this QR code</li>
                      <li>Confirm the login on your mobile device</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              <div className="flex w-full space-x-3">
                <button
                  onClick={refreshQRCode}
                  className="flex-1 flex justify-center items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-all"
                >
                  <svg className={`w-5 h-5 mr-2 ${isRotating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Refresh QR Code
                </button>
                <button
                  onClick={toggleLoginMethod}
                  className="flex-1 flex justify-center items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
                  </svg>
                  Password Login
                </button>
              </div>
            </div>
          ) : (
            <>
              <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
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
              
              <div className="mt-6 relative z-10">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={toggleLoginMethod}
                    className="group w-full flex justify-center items-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-all relative overflow-hidden"
                  >
                    <span className="absolute inset-0 w-0 bg-gradient-to-r from-[#861A2D]/5 to-[#861A2D]/10 transition-all duration-500 ease-out group-hover:w-full"></span>
                    <span className="mr-4 relative flex items-center justify-center">
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg className="h-6 w-6 text-[#861A2D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <span className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md group-hover:bg-[#861A2D]/5 transition-colors duration-300">
                        <svg className="h-6 w-6 text-gray-500 group-hover:text-[#861A2D] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                        </svg>
                      </span>
                    </span>
                    <span className="relative">
                      <span className="text-gray-800 font-medium transition-colors duration-300 group-hover:text-[#861A2D]">Quick QR Code Login</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Securely login with the Barangay360 mobile app
                      </p>
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="mt-6 relative z-10">
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
            </>
          )}
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

// Add the necessary animation to the global styles
const style = document.createElement('style');
style.textContent = `
@keyframes rotate-y-180 {
  from { transform: rotateY(0deg); }
  to { transform: rotateY(180deg); }
}
@keyframes scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(400%); }
}
.rotate-y-180 {
  animation: rotate-y-180 0.5s ease-in-out;
}
.animate-scan {
  animation: scan 2s linear infinite;
}
`;
document.head.appendChild(style);

export default Login; 