import PropTypes from 'prop-types';
import { useContext } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ForgotPassword from './auth/ForgotPassword';
import Login from './auth/Login.jsx';
import Signup from './auth/Signup.jsx';
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Unauthorized from './contexts/Unauthorized.jsx';
import './index.css';
import ChangePassword from './pages/auth/ChangePassword.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AnnouncementsManagement from './pages/official/AnnouncementsManagement.jsx';
import AppealsManagement from './pages/official/AppealsManagement.jsx';
import EventsManagement from './pages/official/EventsManagement.jsx';
import ForumManagement from './pages/official/ForumManagement.jsx';
import OfficialDashboard from './pages/official/OfficialDashboard.jsx';
import OfficialProfile from './pages/official/OfficialProfile.jsx';
import ReportManagement from './pages/official/ReportManagement.jsx';
import RequestsManagement from './pages/official/RequestsManagement.jsx';
import ResidentsManagement from './pages/official/ResidentsManagement.jsx';
import ResidentAnnouncements from './pages/resident/Announcements';
import AppealForm from './pages/resident/AppealForm';
import CommunityForum from './pages/resident/CommunityForum.jsx';
import ResidentDashboard from './pages/resident/ResidentDashboard.jsx';
import ResidentProfile from "./pages/resident/ResidentProfile.jsx";
import Services from './pages/resident/Services.jsx';
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

// Define a placeholder component for routes that haven't been fully implemented
const PlaceholderPage = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
      <h1 className="text-2xl font-bold text-[#861A2D] mb-2">{title}</h1>
      <p className="text-gray-600">This page is under construction. Please check back later.</p>
    </div>
  </div>
);

PlaceholderPage.propTypes = {
  title: PropTypes.string.isRequired
};

// Debugging component to show authentication details
const DebugAuthPage = () => {
  const { user, isAuthenticated, hasRole } = useContext(AuthContext);
  
  // Function to safely stringify objects for display
  const safeStringify = (obj) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return `Error stringifying: ${e.message}`;
    }
  };
  
  // Test various role checks
  const roleChecks = [
    { role: 'ROLE_USER', hasRole: hasRole('ROLE_USER') },
    { role: 'USER', hasRole: hasRole('USER') },
    { role: 'ROLE_RESIDENT', hasRole: hasRole('ROLE_RESIDENT') },
    { role: 'RESIDENT', hasRole: hasRole('RESIDENT') },
    { role: 'ROLE_OFFICIAL', hasRole: hasRole('ROLE_OFFICIAL') },
    { role: 'OFFICIAL', hasRole: hasRole('OFFICIAL') }
  ];
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-[#861A2D] mb-6">Authentication Debug</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p className="font-medium">isAuthenticated: <span className={isAuthenticated() ? "text-green-600" : "text-red-600"}>{isAuthenticated() ? "Yes" : "No"}</span></p>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Role Checks</h2>
          <div className="bg-gray-100 p-4 rounded overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="py-2 px-4 text-left">Role</th>
                  <th className="py-2 px-4 text-left">Has Role</th>
                </tr>
              </thead>
              <tbody>
                {roleChecks.map((check, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2 px-4">{check.role}</td>
                    <td className={`py-2 px-4 ${check.hasRole ? "text-green-600" : "text-red-600"}`}>
                      {check.hasRole ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">User Object</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-x-auto">{user ? safeStringify(user) : "Not logged in"}</pre>
          </div>
        </div>
        
        <div className="mt-6 flex space-x-4">
          <a href="/resident/dashboard" className="px-4 py-2 bg-[#861A2D] text-white rounded hover:bg-[#6e142a] transition-colors">
            Try Resident Dashboard
          </a>
          <a href="/login" className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </Router>
  )
}

function AppRoutes() {
  const { isAuthenticated } = useContext(AuthContext);
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={!isAuthenticated() ? <Signup /> : <Navigate to="/resident/dashboard" />} />
      <Route path="/forgot-password" element={!isAuthenticated() ? <ForgotPassword /> : <Navigate to="/resident/dashboard" />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/debug-auth" element={<DebugAuthPage />} />
      
      {/* Shared Routes */}
      <Route 
        path="/change-password"
        element={
          <ProtectedRoute requiredRoles={['ROLE_USER', 'ROLE_OFFICIAL']}>
            <ChangePassword />
          </ProtectedRoute>
        } 
      />
      
      {/* Resident User Routes */}
      <Route 
        path="/resident/dashboard"
        element={
          <ProtectedRoute requiredRoles={['USER', 'ROLE_USER', 'RESIDENT', 'ROLE_RESIDENT']}>
            <ResidentDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/resident/services"
        element={
          <ProtectedRoute requiredRoles={['ROLE_USER']}>
            <Services />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/resident/announcements"
        element={
          <ProtectedRoute allowedRoles={['ROLE_USER']}>
            <ResidentAnnouncements />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/resident/community"
        element={
          <ProtectedRoute requiredRoles={['ROLE_USER']}>
            <CommunityForum />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/resident/profile"
        element={
          <ProtectedRoute requiredRoles={['ROLE_USER']}>
            <ResidentProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/resident/settings"
        element={
          <ProtectedRoute requiredRoles={['ROLE_USER']}>
            <PlaceholderPage title="Account Settings" />
          </ProtectedRoute>
        } 
      />
      <Route path="/resident/appeal" element={<AppealForm />} />
      
      {/* Official Routes */}
      <Route 
        path="/official/dashboard"
        element={
          <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
            <OfficialDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/official/requests"
        element={
          <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
            <RequestsManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/official/manage-announcements"
        element={
          <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
            <AnnouncementsManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/official/forum-management"
        element={
          <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
            <ForumManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/official/reports-management"
        element={
          <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
            <ReportManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/official/residents"
        element={
          <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
            <ResidentsManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/official/events"
        element={
          <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
            <EventsManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/official/profile"
        element={
          <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
            <OfficialProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRoles={['ROLE_ADMIN']}>
            <PlaceholderPage title="Admin Panel" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/official/residents" 
        element={
          <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
            <ResidentsManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/official/appeals" 
        element={
          <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
            <AppealsManagement />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App
