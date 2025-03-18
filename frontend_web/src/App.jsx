import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Signup from './components/Signup'
import Unauthorized from './components/Unauthorized'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'


function App() {
  
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
