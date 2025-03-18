import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <svg 
            className="h-16 w-16 text-red-500 mx-auto"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          
          <h1 className="mt-4 text-3xl font-bold text-gray-800">Unauthorized Access</h1>
          <p className="mt-2 text-lg text-gray-600">
            You don&apos;t have permission to access this page.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <Link
            to="/dashboard"
            className="w-full py-2 px-4 text-center text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="w-full py-2 px-4 text-center text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 