import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopNavigation from '../../components/layout/TopNavigation';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, handleApiRequest } = useContext(AuthContext);
  const { showToast } = useToast();
  const [isOfficial, setIsOfficial] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if the user is an official
      setIsOfficial(user.roles && user.roles.some(role => 
        typeof role === 'string' 
          ? role.includes('OFFICIAL') 
          : role.name && role.name.includes('OFFICIAL')
      ));
    }
  }, [user]);

  // Password validation rules
  const validatePassword = (password) => {
    const rules = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    return rules;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Validate passwords match when typing in either field
    if (name === 'newPassword' || name === 'confirmPassword') {
      if (name === 'newPassword' && passwordData.confirmPassword && 
          passwordData.confirmPassword !== value) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else if (name === 'confirmPassword' && passwordData.newPassword !== value) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else if (name === 'confirmPassword' && passwordData.newPassword === value) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Check if fields are empty
    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
      isValid = false;
    }
    
    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
      isValid = false;
    }
    
    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    }
    
    // Check password strength if not empty
    if (passwordData.newPassword.trim()) {
      const validationRules = validatePassword(passwordData.newPassword);
      if (!validationRules.minLength) {
        newErrors.newPassword = 'Password must be at least 8 characters long';
        isValid = false;
      } else if (!(validationRules.hasUppercase && validationRules.hasLowercase)) {
        newErrors.newPassword = 'Password must include both upper and lowercase letters';
        isValid = false;
      } else if (!validationRules.hasNumber) {
        newErrors.newPassword = 'Password must include at least one number';
        isValid = false;
      } else if (!validationRules.hasSpecial) {
        newErrors.newPassword = 'Password must include at least one special character';
        isValid = false;
      }
    }
    
    // Check if passwords match
    if (passwordData.newPassword.trim() && 
        passwordData.confirmPassword.trim() && 
        passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    // Check if new password is the same as current password
    if (passwordData.currentPassword.trim() && 
        passwordData.newPassword.trim() && 
        passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await handleApiRequest(
        `https://barangay360-nja7q.ondigitalocean.app/api/users/${user.id}/change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific errors
        if (response.status === 401) {
          setErrors({ currentPassword: 'Current password is incorrect' });
          showToast('Current password is incorrect', 'error');
        } else {
          throw new Error(errorData.message || 'Failed to change password');
        }
      } else {
        setIsSuccess(true);
        showToast('Password changed successfully!', 'success');
        
        // Clear form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate(isOfficial ? '/official/profile' : '/resident/profile');
        }, 2000);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showToast(error.message || 'Failed to change password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPasswordStrength = () => {
    if (!passwordData.newPassword) return null;
    
    const rules = validatePassword(passwordData.newPassword);
    const strengths = [
      { rule: rules.minLength, text: 'At least 8 characters' },
      { rule: rules.hasUppercase, text: 'Contains uppercase letter' },
      { rule: rules.hasLowercase, text: 'Contains lowercase letter' },
      { rule: rules.hasNumber, text: 'Contains number' },
      { rule: rules.hasSpecial, text: 'Contains special character' }
    ];
    
    // Calculate password strength
    const passedRules = strengths.filter(s => s.rule).length;
    let strengthLevel = 'Weak';
    let strengthColor = 'bg-red-500';
    
    if (passedRules === 5) {
      strengthLevel = 'Strong';
      strengthColor = 'bg-green-500';
    } else if (passedRules >= 3) {
      strengthLevel = 'Medium';
      strengthColor = 'bg-yellow-500';
    }
    
    return (
      <div className="mt-2">
        <div className="flex justify-between items-center mb-1">
          <p className="text-xs text-gray-600">Password strength: <span className={`font-medium ${
            strengthLevel === 'Strong' ? 'text-green-700' : 
            strengthLevel === 'Medium' ? 'text-yellow-700' : 'text-red-700'
          }`}>{strengthLevel}</span></p>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${strengthColor}`} style={{ width: `${(passedRules / 5) * 100}%` }}></div>
        </div>
        <ul className="mt-2 space-y-1 text-xs">
          {strengths.map((strength, index) => (
            <li key={index} className="flex items-center">
              {strength.rule ? (
                <svg className="w-3 h-3 text-green-500 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                <svg className="w-3 h-3 text-red-500 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              )}
              <span className={strength.rule ? 'text-gray-600' : 'text-gray-400'}>
                {strength.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex w-full">
      <Sidebar isOfficial={isOfficial} />

      <div className="flex-1 flex flex-col ml-64">
        <TopNavigation title="Change Password" />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-lg mx-auto">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                  </svg>
                  Change Your Password
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Keep your account secure by using a strong, unique password
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {isSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex">
                      <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <p className="text-sm text-green-700">Your password has been changed successfully!</p>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${errors.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-[#861A2D] transition-all duration-200`}
                      disabled={isSubmitting || isSuccess}
                      required
                    />
                  </div>
                  {errors.currentPassword && (
                    <p className="mt-1 text-xs text-red-600">{errors.currentPassword}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${errors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-[#861A2D] transition-all duration-200`}
                      disabled={isSubmitting || isSuccess}
                      required
                    />
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>
                  )}
                  {passwordData.newPassword && renderPasswordStrength()}
                </div>

                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-[#861A2D] transition-all duration-200`}
                      disabled={isSubmitting || isSuccess}
                      required
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate(isOfficial ? '/official/profile' : '/resident/profile')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className="px-4 py-2 bg-[#861A2D] text-white rounded-md hover:bg-[#9b2a40] focus:outline-none transition-all duration-200 flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : 'Change Password'}
                  </button>
                </div>
              </form>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">Password Security Tips</h3>
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      <p>• Use a unique password for each of your accounts</p>
                      <p>• Never share your password with others</p>
                      <p>• Consider using a password manager to generate and store strong passwords</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChangePassword; 