import { formatDistanceToNow } from 'date-fns';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar.jsx';
import TopNavigation from '../../components/layout/TopNavigation.jsx';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import { announcementService } from '../../services/AnnouncementService';
import { eventService } from '../../services/EventService';
import { forumService } from '../../services/ForumService';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { webSocketService } from '../../services/WebSocketService';

// Helper function to format date and time
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return 'Date not specified';
  try {
    const dateObj = new Date(dateTimeStr);
    if (isNaN(dateObj.getTime())) { // Check if date is valid
        console.warn("Invalid date string received:", dateTimeStr);
        return 'Invalid Date';
    }
    const optionsDate = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = dateObj.toLocaleDateString(undefined, optionsDate);
    // Check if it's an all-day event (time is midnight)
    // Note: This check might need adjustment based on how 'allDay' affects the 'start' time from backend
    const isMidnight = dateObj.getHours() === 0 && dateObj.getMinutes() === 0 && dateObj.getSeconds() === 0;
    if (isMidnight) {
        return date; // Don't show time for midnight/all-day events
    }
    const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
    const time = dateObj.toLocaleTimeString(undefined, optionsTime);
    return `${date} at ${time}`;
  } catch (error) {
      console.error("Error formatting date:", dateTimeStr, error);
      return 'Error formatting date';
  }
};

const ResidentDashboard = () => {
  const authContext = useContext(AuthContext);
  const { user } = authContext;
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceType, setServiceType] = useState('');
  const [details, setDetails] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [headlines, setHeadlines] = useState([]);
  const [headlinesLoading, setHeadlinesLoading] = useState(true);
  const [headlinesError, setHeadlinesError] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState(null);

  useEffect(() => {
    // Set AuthContext in services - only if the service has setAuthContext method
    if (eventService.setAuthContext) {
      eventService.setAuthContext(authContext);
    }
    if (serviceRequestService.setAuthContext) {
      serviceRequestService.setAuthContext(authContext);
    }
    // These services may not have setAuthContext implemented
    if (typeof announcementService.setAuthContext === 'function') {
      announcementService.setAuthContext(authContext);
    }
    if (typeof forumService.setAuthContext === 'function') {
      forumService.setAuthContext(authContext);
    }
    
    // Connect to WebSocket
    webSocketService.connect();

    // Load user's requests
    loadUserRequests();
    // Load community events
    loadEvents();
    // Load community headlines
    loadHeadlines();
    // Load announcements
    loadAnnouncements();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  const loadUserRequests = async () => {
    setIsLoading(true);
    try {
      const data = await serviceRequestService.getServiceRequestsByUserId(user.id);
      // Sort requests with newest first
      const sortedData = [...data].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setMyRequests(sortedData);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      // Using the EventService to fetch events
      const data = await eventService.getAllEvents();
      // Sort events, e.g., by start date (newest first)
      const sortedData = [...data].sort((a, b) => new Date(b.start) - new Date(a.start));
      setEvents(sortedData);
    } catch (error) {
      console.error('Error loading events:', error);
      setEventsError('Failed to load community events. Please try again later.');
    } finally {
      setEventsLoading(false);
    }
  };

  const loadHeadlines = async () => {
    setHeadlinesLoading(true);
    setHeadlinesError(null);
    try {
        const pageData = await forumService.getAllPosts(0, 3); // Fetch page 0, size 3
        setHeadlines(pageData.content || []); // Assuming API returns { content: [...] }
    } catch (error) {
        console.error('Error loading headlines:', error);
        setHeadlinesError('Failed to load community headlines.');
    } finally {
        setHeadlinesLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    setAnnouncementsLoading(true);
    setAnnouncementsError(null);
    try {
        const data = await announcementService.getAllAnnouncements();
        // Sort by createdAt descending and take the latest 2
        const sortedData = [...data]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 2);
        setAnnouncements(sortedData);
    } catch (error) {
        console.error('Error loading announcements:', error);
        setAnnouncementsError('Failed to load announcements.');
    } finally {
        setAnnouncementsLoading(false);
    }
  };

  const handleSubmitServiceRequest = async (e) => {
    e.preventDefault();
    try {
      await serviceRequestService.createServiceRequest({
        serviceType,
        details,
        userId: user.id
      });
      setServiceType('');
      setDetails('');
      setShowServiceForm(false);
      loadUserRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex w-full">
      {/* Sidebar */}
      <Sidebar isOfficial={false} />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ml-64`}>
        {/* Use TopNavigation Component */}
        <TopNavigation title="Resident Dashboard" />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-full mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user?.firstName || user?.username}!</h2>
              <p className="text-gray-600">
                This is your Barangay360 dashboard. Here you can access all community services and stay updated with the latest announcements.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Latest Announcements Card - Modified for flex layout */}
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D] flex flex-col">
                {/* Card Content Area (grows to push link down) */}
                <div className="flex-grow">
                  <h3 className="text-lg font-medium text-[#861A2D] mb-2 flex items-center">
                    Latest Announcements
                  </h3>
                  <p className="text-gray-600 mb-4">Stay updated with the latest barangay announcements.</p>
                  {announcementsLoading ? (
                      <div className="flex flex-col justify-center items-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#861A2D]"></div>
                          <p className="mt-3 text-gray-600 font-medium">Loading announcements...</p>
                      </div>
                  ) : announcementsError ? (
                      <div className="text-center py-6 bg-red-50 rounded-md border border-red-200 px-3">
                          <svg className="mx-auto h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          <p className="mt-2 text-sm font-medium text-red-800">Error Loading Announcements</p>
                          <p className="mt-1 text-xs text-red-700">{announcementsError}</p>
                      </div>
                  ) : announcements.length > 0 ? (
                      <div className="space-y-3">
                          {announcements.map((announcement) => (
                              <Link 
                                  key={announcement.id} 
                                  to={`/resident/announcements/${announcement.id}`}
                                  className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 relative overflow-hidden"
                              >
                                  <div className="absolute left-0 top-0 w-1 h-full bg-[#861A2D]"></div>
                                  <h4 className="text-md font-semibold text-gray-800 mb-2 truncate pr-6">{announcement.title}</h4>
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{announcement.content}</p>
                                  <div className="flex justify-between items-center mt-2">
                                      <div className="flex items-center text-xs text-gray-500">
                                          <svg className="w-4 h-4 mr-1 text-[#861A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                          </svg>
                                          {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                                      </div>
                                  </div>
                              </Link>
                          ))}
                      </div>
                  ) : (
                       <div className="text-center py-6 bg-gray-50 rounded-md border border-gray-200">
                          <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6 4h6"></path></svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
                          <p className="mt-1 text-xs text-gray-500">There are currently no announcements.</p>
                      </div>
                  )}
                </div>
                {/* View All Announcements Link (always at the bottom) */}
                {/* Conditionally render only if not loading/error? Or always show? Showing always for now. */}
                {!announcementsLoading && !announcementsError && (
                  <Link 
                    to="/resident/announcements" 
                    className="mt-4 inline-block text-sm font-medium text-[#861A2D] hover:underline flex items-center self-start" // Use self-start or similar if needed
                  >
                      View all announcements
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                  </Link>
                )}
              </div>

              {/* Community Events Calendar Card */}
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <h3 className="text-lg font-medium text-[#861A2D] mb-2">Community Events Calendar</h3>
                <p className="text-gray-600 mb-4">Upcoming events in our barangay.</p>
                {eventsLoading ? (
                  <div className="flex flex-col justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#861A2D]"></div>
                    <p className="mt-3 text-gray-600 font-medium">Loading events...</p>
                  </div>
                ) : eventsError ? (
                  <div className="text-center py-6 bg-red-50 rounded-md border border-red-200 px-3">
                     <svg className="mx-auto h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     <p className="mt-2 text-sm font-medium text-red-800">Error Loading Events</p>
                     <p className="mt-1 text-xs text-red-700">{eventsError}</p>
                  </div>
                ) : events.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                     {/* Map through the fetched events */} 
                    {events.map((event) => (
                      <div key={event.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200 hover:shadow-sm transition-all duration-200">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{event.title}</p>
                          <p className="text-xs text-gray-500">
                             {formatDateTime(event.start)} 
                             {event.location && ` • ${event.location}`}
                          </p>
                          {event.description && (
                              <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                          )}
                        </div>
                        {/* Example Status - You might derive this based on date or add a status field to Event model */}
                         <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full whitespace-nowrap">Upcoming</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-md border border-gray-200">
                    <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6 4h6"></path></svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
                    <p className="mt-1 text-xs text-gray-500">Check back later for community events.</p>
                  </div>
                )}
              </div>

              {/* My Requests Card */}
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D] flex flex-col">
                <div className="flex-grow">
                  <h3 className="text-lg font-medium text-[#861A2D] mb-2">My Requests</h3>
                  <p className="text-gray-600 mb-4">Track the status of your service requests.</p>

                  {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#861A2D]"></div>
                      <p className="mt-3 text-gray-600 font-medium">Loading requests...</p>
                    </div>
                  ) : myRequests.length > 0 ? (
                    <div className="space-y-3">
                      {/* Only show the first 3 requests */}
                      {myRequests.slice(0, 3).map((request) => (
                        <div key={request.id} className="p-3 bg-gray-50 rounded-md border border-gray-200 hover:shadow-sm transition-all duration-200">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-800">{request.serviceType}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs rounded-full ${
                              request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {request.status === 'PENDING' && (
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                              )}
                              {request.status === 'APPROVED' && (
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              )}
                              {request.status === 'REJECTED' && (
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              )}
                              {request.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Requested on {new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-md border border-gray-200">
                      <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h6"></path>
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No requests</h3>
                      <p className="mt-1 text-xs text-gray-500">You haven&apos;t submitted any requests yet.</p>
                      <Link 
                        to="/resident/services"
                        className="mt-3 inline-block py-2 px-4 border border-[#861A2D] rounded-md text-xs font-medium text-[#861A2D] hover:bg-[#861A2D] hover:text-white transition-colors duration-200"
                      >
                        Make a Request
                      </Link>
                    </div>
                  )}
                </div>

                {/* View All Requests Link - positioned at the bottom just like announcements */}
                {!isLoading && myRequests.length > 0 && (
                  <Link 
                    to="/resident/services"
                    className="mt-4 inline-block text-sm font-medium text-[#861A2D] hover:underline flex items-center self-start"
                  >
                    View all requests
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </Link>
                )}
              </div>
            </div>

            {/* Community Headlines Section */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                <h3 className="text-lg font-medium text-[#861A2D] mb-4">Community Headlines</h3>
                {headlinesLoading ? (
                    <div className="flex flex-col justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#861A2D]"></div>
                        <p className="mt-3 text-gray-600 font-medium">Loading headlines...</p>
                    </div>
                ) : headlinesError ? (
                    <div className="text-center py-6 bg-red-50 rounded-md border border-red-200 px-3">
                        <svg className="mx-auto h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p className="mt-2 text-sm font-medium text-red-800">Error Loading Headlines</p>
                        <p className="mt-1 text-xs text-red-700">{headlinesError}</p>
                    </div>
                ) : headlines.length > 0 ? (
                    <div className="space-y-4">
                        {headlines.map((post) => (
                            <div key={post.id} className="p-4 bg-gray-50 rounded-md border border-gray-200 hover:shadow-sm transition-all duration-200">
                                <Link to={`/forum/posts/${post.id}`} className="hover:underline">
                                    <h4 className="text-md font-semibold text-gray-800 mb-1">{post.title}</h4>
                                </Link>
                                <p className="text-xs text-gray-500">
                                    By {post.author?.username || 'Unknown User'} • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                </p>
                                {/* Optional: Show a snippet of content */}
                                <p className="text-sm text-gray-600 mt-2 truncate">{post.content}</p>
                            </div>
                        ))}
                         <Link 
                            to="/resident/community" // Link to the main forum page
                            className="mt-4 inline-block text-sm text-[#861A2D] hover:underline"
                        >
                            View all posts →
                        </Link>
                    </div>
                ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-md border border-gray-200">
                        {/* Placeholder Icon */} 
                        <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6 4h6"></path></svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No community posts yet</h3>
                        <p className="mt-1 text-xs text-gray-500">Check back later for discussions and updates.</p>
                         <Link 
                            to="/resident/community" // Link to the main forum page
                            className="mt-3 inline-block py-2 px-4 border border-[#861A2D] rounded-md text-xs font-medium text-[#861A2D] hover:bg-[#861A2D] hover:text-white transition-colors duration-200"
                        >
                            View Community Forum
                        </Link>
                    </div>
                )}
            </div>

            {/* Service Request Form Modal */}
            {showServiceForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-lg font-medium text-[#861A2D] mb-4">Submit Service Request</h3>
                  <form onSubmit={handleSubmitServiceRequest}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Type
                      </label>
                      <select
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#861A2D]"
                        required
                      >
                        <option value="">Select a service</option>
                        <option value="Barangay Certificate">Barangay Certificate</option>
                        <option value="Business Permit">Business Permit</option>
                        <option value="Barangay Clearance">Barangay Clearance</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Details
                      </label>
                      <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#861A2D]"
                        rows="4"
                        required
                      ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowServiceForm(false)}
                        className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#861A2D] text-white rounded-md hover:bg-[#9b3747] transition-colors text-sm"
                      >
                        Submit Request
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResidentDashboard;
