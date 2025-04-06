import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

const AppealForm = () => {
  const [username, setUsername] = useState('');
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
    if (!message.trim()) {
      showToast('Please enter your appeal message', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Update API endpoint if necessary. Assuming a new endpoint /api/appeals or similar
      // that accepts username in the body instead of ID in the path.
      // For now, demonstrating sending username in the body.
      const response = await fetch(`http://localhost:8080/api/appeals`, { // Changed endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, message }), // Send username and message
      });

      const responseData = await response.json(); // Read response body

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to submit appeal');
      }

      // Always show the static success message, ignore responseData.message
      showToast('Appeal submitted successfully. Please wait for review.', 'success');
      navigate('/login'); // Redirect to login after successful submission
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
        </form>
      </div>
    </div>
  );
};

export default AppealForm; 