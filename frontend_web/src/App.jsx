import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import OfficialDashboard from './components/OfficialDashboard';
import Unauthorized from './contexts/Unauthorized.jsx';
import { AuthProvider } from './contexts/AuthContext';
import Services from './components/Services';
import RequestsManagement from './components/RequestsManagement';
import './index.css';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Resident User Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/services" 
            element={
              <ProtectedRoute>
                <Services />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/announcements" 
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Announcements" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/community" 
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Community Forum" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <PlaceholderPage title="User Profile" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Account Settings" />
              </ProtectedRoute>
            } 
          />
          
          {/* Official Routes */}
          <Route 
            path="/official-dashboard" 
            element={
              <ProtectedRoute requiredRoles={['official', 'ROLE_OFFICIAL']}>
                <OfficialDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/requests" 
            element={
              <ProtectedRoute requiredRoles={['official', 'ROLE_OFFICIAL']}>
                <RequestsManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-announcements" 
            element={
              <ProtectedRoute requiredRoles={['official', 'ROLE_OFFICIAL']}>
                <PlaceholderPage title="Manage Announcements" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/residents" 
            element={
              <ProtectedRoute requiredRoles={['official', 'ROLE_OFFICIAL']}>
                <PlaceholderPage title="Resident Management" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute requiredRoles={['official', 'ROLE_OFFICIAL']}>
                <PlaceholderPage title="Reports" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/events" 
            element={
              <ProtectedRoute requiredRoles={['official', 'ROLE_OFFICIAL']}>
                <PlaceholderPage title="Events Calendar" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'admin']}>
                <PlaceholderPage title="Admin Panel" />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
