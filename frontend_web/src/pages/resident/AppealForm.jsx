import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

const AppealForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      showToast('Please enter your username', 'error');
      return;
    }
    if (!password.trim()) {
      showToast('Please enter your password', 'error');
      return;
    }
    if (!message.trim()) {
      showToast('Please enter your appeal message', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // First authenticate the user to verify credentials
      const authResponse = await fetch('https://barangay360-nja7q.ondigitalocean.app/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const authData = await authResponse.json();
      
      if (!authResponse.ok) {
        // Handle authentication errors
        if (authData.message && authData.message.includes('Account is disabled')) {
          // This is expected - account is disabled, continue with appeal
          console.log('Account is disabled as expected, proceeding with appeal');
        } else {
          // Authentication failed
          throw new Error(authData.message || 'Invalid username or password');
        }
      }
      
      // Now submit the appeal
      const response = await fetch(`https://barangay360-nja7q.ondigitalocean.app/api/appeals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, message, password }), // Include password for verification
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Check specifically for user not found errors and provide a clearer message
        if (responseData.message && responseData.message.includes('User not found')) {
          throw new Error('Username not found. Please check your username and try again.');
        } else {
          throw new Error(responseData.message || 'Failed to submit appeal');
        }
      }

      showToast('Appeal submitted successfully. Please wait for review.', 'success');
      navigate('/login');
    } catch (error) { 
      console.error('Error submitting appeal:', error);
      showToast(error.message || 'Failed to submit appeal. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border-t-4 border-[#861A2D]">
        <h2 className="text-2xl font-bold text-center text-[#861A2D] mb-6">Submit Appeal</h2>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Please submit an appeal to reactivate your account. Enter your credentials and explain why your account should be reactivated.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D] sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D] sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Reason for Appeal
            </label>
            <textarea
              id="message"
              rows="4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#861A2D] focus:border-[#861A2D] sm:text-sm"
              placeholder="Explain why your account should be reactivated..."
            ></textarea>
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition duration-150 ease-in-out"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
            </button>
          </div>
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-[#861A2D] hover:underline"
            >
              Return to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppealForm; 