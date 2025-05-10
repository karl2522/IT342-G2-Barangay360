import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: Verify Code, 3: Reset Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showToast('Please enter your email address', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('https://barangay360-nja7q.ondigitalocean.app/api/password/forgot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      console.log('Password reset response:', response.status, data);
      
      if (response.ok) {
        showToast('Verification code sent to your email', 'success');
        setStep(2); // Move to verification step
      } else {
        // Check for specific error cases
        if (response.status === 404 || 
            data.message?.toLowerCase().includes('not found') || 
            data.message?.toLowerCase().includes('email not registered') ||
            data.message === 'Invalid username or password') {
          showToast('Email address not found. Please input a valid email address.', 'error');
        } else {
          showToast(data.message || 'Failed to send verification code', 'error');
        }
      }
    } catch (error) {
      console.error('Error sending reset email:', error);
      showToast('Failed to send verification code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      showToast('Please enter the verification code', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/password/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast('Code verified successfully', 'success');
        setStep(3); // Move to reset password step
      } else {
        showToast(data.message || 'Invalid or expired code', 'error');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      showToast('Failed to verify code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword.trim() || !confirmPassword.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!*()]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      showToast('Password must be at least 8 characters and include at least one digit, one lowercase letter, one uppercase letter, and one special character', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, newPassword }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast('Password reset successfully', 'success');
        // Redirect to login page after short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        showToast(data.message || 'Failed to reset password', 'error');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showToast('Failed to reset password. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const resendCode = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/password/forgot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      console.log('Resend code response:', response.status, data);
      
      if (response.ok) {
        showToast('New verification code sent to your email', 'success');
      } else {
        // Check for specific error cases
        if (response.status === 404 || 
            data.message?.toLowerCase().includes('not found') || 
            data.message?.toLowerCase().includes('email not registered') ||
            data.message === 'Invalid username or password') {
          showToast('Email address not found. Please input a valid email address.', 'error');
        } else {
          showToast(data.message || 'Failed to send new verification code', 'error');
        }
      }
    } catch (error) {
      console.error('Error resending code:', error);
      showToast('Failed to send new verification code. Please try again.', 'error');
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
            {step === 1 && "Reset your password"}
            {step === 2 && "Verify your email"}
            {step === 3 && "Create new password"}
          </p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border-t-4 border-[#861A2D] relative overflow-hidden">
          {/* Background pattern elements for decoration */}
          <div className="absolute -right-12 -top-12 w-24 h-24 bg-[#861A2D]/5 rounded-full"></div>
          <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-[#861A2D]/5 rounded-full"></div>
          
          {/* Step indicator */}
          <div className="relative z-10 mb-8">
            <div className="flex items-center justify-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-[#861A2D] text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${step > 1 ? 'bg-[#861A2D]' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-[#861A2D] text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <div className={`flex-1 h-1 mx-2 ${step > 2 ? 'bg-[#861A2D]' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-[#861A2D] text-white' : 'bg-gray-200 text-gray-600'}`}>
                3
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span className="w-16 text-center">Email</span>
              <span className="w-16 text-center">Verify</span>
              <span className="w-16 text-center">Reset</span>
            </div>
          </div>
          
          {/* Email Step */}
          {step === 1 && (
            <form className="space-y-6 relative z-10" onSubmit={handleEmailSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D] sm:text-sm bg-white text-gray-900"
                    placeholder="Enter your registered email"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  We&apos;ll send a verification code to this email
                </p>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors duration-200"
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
              
              <div className="text-center mt-4">
                <Link to="/login" className="font-medium text-sm text-[#861A2D] hover:text-[#9b3747]">
                  Back to Login
                </Link>
              </div>
            </form>
          )}
          
          {/* Verification Step */}
          {step === 2 && (
            <form className="space-y-6 relative z-10" onSubmit={handleVerifyCode}>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <div className="mt-1">
                  <input
                    id="code"
                    name="code"
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D] sm:text-sm bg-white text-gray-900"
                    placeholder="Enter the 6-digit code"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Enter the 6-digit code sent to your email: {email}
                </p>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors duration-200"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
              
              <div className="text-center mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  Didn&apos;t receive the code?{' '}
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={loading}
                    className="font-medium text-[#861A2D] hover:text-[#9b3747]"
                  >
                    Resend Code
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-medium text-sm text-gray-600 hover:text-gray-900"
                >
                  Change Email
                </button>
              </div>
            </form>
          )}
          
          {/* Reset Password Step */}
          {step === 3 && (
            <form className="space-y-6 relative z-10" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="new-password"
                    name="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D] sm:text-sm bg-white text-gray-900"
                    placeholder="Create a strong password"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Password must be at least 8 characters and include at least one digit, one lowercase letter, one uppercase letter, and one special character.
                </p>
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D] sm:text-sm bg-white text-gray-900"
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors duration-200"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="font-medium text-sm text-gray-600 hover:text-gray-900"
                >
                  Back to Verification
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 