import { useState, useEffect } from 'react';
import { announcementService } from '../../services/AnnouncementService';
import { useToast } from '../../contexts/ToastContext';
import Sidebar from '../../components/layout/Sidebar.jsx';
import TopNavigation from '../../components/layout/TopNavigation.jsx';

const Announcements = () => {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementService.getAllAnnouncements();
      // Sort with newest first
      const sortedData = [...data].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setAnnouncements(sortedData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      showToast('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const openAnnouncementModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAnnouncement(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex w-full">
      <Sidebar isOfficial={false} />
      
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Navigation */}
        <TopNavigation title="Barangay Announcements" />
        
        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="mb-6">
            <h2 className="text-xl font-medium text-gray-800">Latest Announcements</h2>
            <p className="text-gray-600 mt-1">Stay updated with the latest news and events in our barangay</p>
          </div>
          
          {/* Announcements List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#861A2D]"></div>
              <p className="mt-3 text-gray-600 font-medium">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
              <p className="mt-1 text-sm text-gray-500">There are no announcements at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-6">
              {announcements.map((announcement) => (
                <div 
                  key={announcement.id} 
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
                  onClick={() => openAnnouncementModal(announcement)}
                >
                  {announcement.thumbnailUrl && (
                    <div className="h-48 w-full relative">
                      <img 
                        src={announcement.thumbnailUrl} 
                        alt={announcement.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-[#861A2D]">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{announcement.content}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {formatDate(announcement.createdAt)}
                      </div>
                      <div className="text-xs font-medium text-blue-600">
                        Click to read more
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      
      {/* Announcement Detail Modal */}
      {showModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {selectedAnnouncement.thumbnailUrl && (
                <div className="h-64 w-full">
                  <img 
                    src={selectedAnnouncement.thumbnailUrl} 
                    alt={selectedAnnouncement.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-[#861A2D] mb-2">{selectedAnnouncement.title}</h2>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(selectedAnnouncement.createdAt)}</span>
                </div>
                <div className="prose max-w-none">
                  {selectedAnnouncement.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements; 