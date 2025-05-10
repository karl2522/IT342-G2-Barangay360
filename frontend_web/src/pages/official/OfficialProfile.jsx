import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import Sidebar from '../../components/layout/Sidebar.jsx';
import TopNavigation from '../../components/layout/TopNavigation.jsx';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

// Default profile image
const DEFAULT_PROFILE_IMAGE = '/images/default-profile.png';

const OfficialProfile = () => {
  const { user, handleApiRequest, setUser } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    position: '',
    bio: '',
    address: '',
    department: '',
    joinDate: '',
    profilePictureUrl: DEFAULT_PROFILE_IMAGE
  });
  
  useEffect(() => {
    if (user) {
      // Initialize form with user data
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phone || '',
        position: user.position || 'Barangay Official',
        bio: user.bio || 'No bio provided',
        address: user.address || '',
        department: user.department || 'Administration',
        joinDate: user.createdAt || new Date().toISOString(),
        profilePictureUrl: user.profilePictureUrl || DEFAULT_PROFILE_IMAGE
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Position is excluded from update data
      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phoneNumber,
        bio: profileData.bio,
        address: profileData.address,
        department: profileData.department
      };
      
      const response = await handleApiRequest(
        `https://barangay360-nja7q.ondigitalocean.app/api/users/${user.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(updateData)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      // Update the user data in AuthContext - keep existing position
      const updatedUser = {
        ...user,
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phone: updateData.phone,
        bio: updateData.bio,
        address: updateData.address,
        department: updateData.department
      };
      
      // Update localStorage with new user data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update the user context
      setUser(updatedUser);
      
      showToast('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Format a date string to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle both ISO strings and date objects
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Recent member';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Recent member';
    }
  };

  // Function to get initials from name
  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  // Function to generate a consistent color based on name
  const generateAvatarColor = (name) => {
    const colors = [
      '#861A2D', // Primary brand color
      '#b43e53', // Secondary brand color
      '#2563eb', // Blue
      '#7c3aed', // Violet
      '#db2777', // Pink
      '#059669', // Emerald
      '#d97706', // Amber
      '#475569', // Slate
    ];
    
    // Simple hash function to determine color
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#861A2D]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex w-full">
      {/* Sidebar */}
      <Sidebar isOfficial={true} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Navigation */}
        <TopNavigation title="Official Profile" />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Profile Header Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300">
              <div className="bg-gradient-to-r from-[#861A2D] via-[#9b2a40] to-[#b43e53] h-40 relative">
                <div className="absolute inset-0 bg-pattern opacity-10"></div>
                {!isEditing && (
                  <div className="absolute right-4 top-4">
                    <button 
                      onClick={toggleEdit}
                      className="flex items-center bg-white text-[#861A2D] px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                      </svg>
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 flex flex-col md:flex-row gap-6 relative">
                <div className="absolute -top-20 left-6 ring-4 ring-white rounded-full shadow-xl">
                  <div 
                    className="h-40 w-40 rounded-full flex items-center justify-center text-white font-bold text-4xl border-4 border-white"
                    style={{ 
                      backgroundColor: generateAvatarColor(`${profileData.firstName} ${profileData.lastName}`),
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    {getInitials(profileData.firstName, profileData.lastName)}
                  </div>
                </div>
                
                <div className="md:ml-44 mt-20 md:mt-0">
                  <h1 className="text-3xl font-bold text-gray-800 mb-1">{`${profileData.firstName} ${profileData.lastName}`}</h1>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="bg-[#861A2D]/10 text-[#861A2D] px-3 py-1 rounded-full text-sm font-medium">{profileData.position}</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{profileData.department}</span>
                  </div>
                  <div className="mt-3 flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Joined on {formatDate(profileData.joinDate)}
                  </div>

                </div>
              </div>
            </div>
            
            {/* Profile Details */}
            {!isEditing ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    Profile Information
                  </h2>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Full Name
                      </h3>
                      <p className="mt-1 text-gray-800 font-medium">{`${profileData.firstName} ${profileData.lastName}`}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        Email Address
                      </h3>
                      <p className="mt-1 text-gray-800 font-medium">{profileData.email}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        Phone Number
                      </h3>
                      <p className="mt-1 text-gray-800 font-medium">{profileData.phoneNumber || 'Not provided'}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        Position
                      </h3>
                      <p className="mt-1 text-gray-800 font-medium">{profileData.position}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        Department
                      </h3>
                      <p className="mt-1 text-gray-800 font-medium">{profileData.department}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        Address
                      </h3>
                      <p className="mt-1 text-gray-800 font-medium">{profileData.address || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      Bio
                    </h3>
                    <p className="mt-1 text-gray-800">{profileData.bio}</p>
                  </div>
                </div>
              </div>
            ) : (
              // Edit Profile Form
              <form onSubmit={handleSaveProfile} className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                    Edit Profile Information
                  </h2>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-[#861A2D] transition-all duration-200"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-[#861A2D] transition-all duration-200"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    
                    <div>
                      <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={profileData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-[#861A2D] transition-all duration-200"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <input
                        type="text"
                        id="position"
                        name="position"
                        value={profileData.position}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">Position cannot be changed</p>
                    </div>
                    
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <select
                        id="department"
                        name="department"
                        value={profileData.department}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-[#861A2D] transition-all duration-200"
                      >
                        <option key="administration" value="Administration">Administration</option>
                        <option key="community" value="Community Affairs">Community Affairs</option>
                        <option key="health" value="Health Services">Health Services</option>
                        <option key="security" value="Security">Security</option>
                        <option key="social" value="Social Services">Social Services</option>
                        <option key="other" value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={profileData.address}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-[#861A2D] transition-all duration-200"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows="4"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-[#861A2D] transition-all duration-200"
                    ></textarea>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={toggleEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white focus:outline-none transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-gradient-to-r from-[#861A2D] to-[#b43e53] text-white rounded-md focus:outline-none flex items-center transition-all duration-200 shadow-md"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
            
            {/* Security Section */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  Security
                </h2>
              </div>
              
              <div className="p-6">
                <button 
                  className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-md focus:outline-none transition-all duration-200 shadow-md flex items-center"
                  onClick={() => navigate('/change-password')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                  </svg>
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OfficialProfile; 