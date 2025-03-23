import PropTypes from 'prop-types';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ResidentDashboard from './pages/resident/ResidentDashboard.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Login from './auth/Login.jsx';
import Signup from './auth/Signup.jsx';
import OfficialDashboard from './pages/official/OfficialDashboard.jsx';
import Unauthorized from './contexts/Unauthorized.jsx';
import { AuthProvider } from './contexts/AuthContext';
import Services from './pages/resident/Services.jsx';
import RequestsManagement from './pages/official/RequestsManagement.jsx';
import './index.css';
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { ToastProvider } from './contexts/ToastContext';

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

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Resident User Routes */}
            <Route 
              path="/resident-dashboard"
              element={
                <ProtectedRoute requiredRoles={['ROLE_USER']}>
                  <ResidentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/services" 
              element={
                <ProtectedRoute requiredRoles={['ROLE_USER']}>
                  <Services />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/announcements" 
              element={
                <ProtectedRoute requiredRoles={['ROLE_USER']}>
                  <PlaceholderPage title="Announcements" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/community" 
              element={
                <ProtectedRoute requiredRoles={['ROLE_USER']}>
                  <PlaceholderPage title="Community Forum" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute requiredRoles={['ROLE_USER']}>
                  <PlaceholderPage title="User Profile" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute requiredRoles={['ROLE_USER']}>
                  <PlaceholderPage title="Account Settings" />
                </ProtectedRoute>
              } 
            />
            
            {/* Official Routes */}
            <Route 
              path="/official-dashboard" 
              element={
                <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
                  <OfficialDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/requests" 
              element={
                <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
                  <RequestsManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manage-announcements" 
              element={
                <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
                  <PlaceholderPage title="Manage Announcements" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/residents" 
              element={
                <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
                  <PlaceholderPage title="Resident Management" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
                  <PlaceholderPage title="Reports" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events" 
              element={
                <ProtectedRoute requiredRoles={['ROLE_OFFICIAL']}>
                  <PlaceholderPage title="Events Calendar" />
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
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
