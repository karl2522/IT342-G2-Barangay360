import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar.jsx';
import TopNavigation from '../../components/layout/TopNavigation';
import { webSocketService } from '../../services/WebSocketService';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { forumService } from '../../services/ForumService';
import { FaUsers, FaListAlt, FaExclamationTriangle, FaFileAlt, FaInbox, FaUserShield, FaHandPaper, FaCommentDots } from 'react-icons/fa';
import axios from 'axios';

const OfficialDashboard = () => {
  // State for all data
  const [residents, setResidents] = useState([]);
  const [totalResidents, setTotalResidents] = useState(0);
  const [posts, setPosts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('all'); // 'all', 'post', or 'comment'
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API URL
  const API_URL = 'http://localhost:8080/api';

  // Get token from localStorage
  const getToken = () => {
    const tokenData = localStorage.getItem('token');
    if (!tokenData) return null;
    try {
      const tokenObj = JSON.parse(tokenData);
      return tokenObj.token;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  };

  // Set auth header
  const getAuthHeader = () => {
    const token = getToken();
    return token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
  };

  useEffect(() => {
    // Connect to WebSocket
    webSocketService.connect();

    // Fetch all data
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch residents
        const residentsResponse = await axios.get(`${API_URL}/users/residents`, getAuthHeader());
        console.log('FULL RESIDENTS RESPONSE:', residentsResponse);
        console.log('RESIDENTS DATA ARRAY:', residentsResponse.data);

        if (residentsResponse.data && Array.isArray(residentsResponse.data)) {
          setResidents(residentsResponse.data.slice(0, 6)); // Get first 6 for display
          setTotalResidents(residentsResponse.data.length);
        } else {
          console.error('Unexpected residents data format:', residentsResponse.data);
          setResidents([]);
          setTotalResidents(0);
        }

        // Fetch forum posts
        const postsResponse = await axios.get(`${API_URL}/forum/posts?page=0&size=3`, getAuthHeader());
        setPosts(postsResponse.data.content || []);

        // Fetch service requests
        const requestsResponse = await serviceRequestService.getAllServiceRequests();
        setRequests(requestsResponse.slice(0, 3)); // Get first 3 for display

        // Fetch reports using the forumService
        console.log('Fetching reports from API using forumService...');
        try {
          const reportsResponse = await forumService.getLatestReports(3);
          console.log('REPORTS API RESPONSE:', reportsResponse);

          if (reportsResponse.success && reportsResponse.content) {
            setReports(reportsResponse.content);
          } else {
            console.error('Failed to fetch reports:', reportsResponse.message);
            setReports([]);
          }
        } catch (reportError) {
          console.error('Error fetching reports:', reportError);
          setReports([]);
        }

        // Fetch appeals
        const appealsResponse = await axios.get(`${API_URL}/appeals`, getAuthHeader());
        setAppeals(appealsResponse.data.slice(0, 3)); // Get first 3 for display

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  // Function to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';

    try {
      const date = new Date(dateString);
      // Check if the date is valid before formatting
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return 'Recently';
      }

      // Use relative time format
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffInSeconds < 2592000) { // Less than 30 days
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      } else {
        // For older dates, use the date format
        return date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  return (
      <div className="min-h-screen bg-gray-100 flex w-full">
        {/* Sidebar */}
        <Sidebar isOfficial={true} />

        {/* Main Content */}
        <div className={`flex-1 flex flex-col ml-64`}>
          {/* Top Navigation */}
          <TopNavigation title="Official Dashboard" />

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-6">
            {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#861A2D]"></div>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
                  {error}
                </div>
            ) : (
                <div className="max-w-full mx-auto space-y-6">

                  {/* Resident Management Section - Full Width */}
                  <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D]">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                          <FaUsers className="mr-3 text-[#861A2D]" /> Resident Management
                        </h2>
                        <p className="text-sm text-gray-600">Overview of the latest registered residents.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-[#861A2D]">{totalResidents}</p>
                        <p className="text-sm text-gray-600 mb-2">Total Residents</p>
                        <Link to="/official/residents" className="text-sm font-medium text-white bg-[#861A2D] hover:bg-[#9b3747] px-4 py-2 rounded-md shadow-sm transition-colors duration-200 inline-block">
                          View All Residents
                        </Link>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto pr-2"> {/* Scrollable container */}
                      {residents.length > 0 ? (
                          <div className="grid gap-3">
                            {residents.map((resident, index) => {
                              // Super detailed resident logging
                              console.log(`------ RESIDENT #${index + 1} ------`);
                              console.log('FULL OBJECT:', JSON.stringify(resident, null, 2));

                              // Get all keys and values for debugging
                              const allKeys = [];
                              const allValues = {};

                              // Recursive function to find all keys in an object
                              const findAllKeys = (obj, prefix = '') => {
                                if (!obj || typeof obj !== 'object') return;

                                Object.keys(obj).forEach(key => {
                                  const fullKey = prefix ? `${prefix}.${key}` : key;
                                  allKeys.push(fullKey);
                                  allValues[fullKey] = obj[key];

                                  if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                                    findAllKeys(obj[key], fullKey);
                                  }
                                });
                              };

                              findAllKeys(resident);
                              console.log('ALL KEYS:', allKeys);
                              console.log('ALL VALUES:', allValues);

                              // Look for any key that might contain a name
                              const nameKeys = allKeys.filter(key =>
                                  key.toLowerCase().includes('name') ||
                                  key.toLowerCase().includes('username') ||
                                  key.toLowerCase() === 'login'
                              );
                              console.log('POTENTIAL NAME KEYS:', nameKeys, nameKeys.map(k => allValues[k]));

                              // Extract name using all the information we've gathered
                              let displayName = 'Unknown';

                              // Check if we have any name keys with string values
                              const validNameKeys = nameKeys.filter(key =>
                                  typeof allValues[key] === 'string' && allValues[key].trim() !== ''
                              );

                              if (validNameKeys.length > 0) {
                                // Prioritize keys in a reasonable order
                                const priorityOrder = [
                                  'fullName', 'full_name', 'name', 'displayName', 'display_name',
                                  'firstName lastName', 'first_name last_name',
                                  'username', 'user_name', 'login'
                                ];

                                // Try to find a key based on our priority
                                let bestKey = null;
                                for (const pattern of priorityOrder) {
                                  const matchKey = validNameKeys.find(key =>
                                      key.toLowerCase().includes(pattern.toLowerCase())
                                  );
                                  if (matchKey) {
                                    bestKey = matchKey;
                                    break;
                                  }
                                }

                                // If we found a best key, use it, otherwise use the first valid key
                                if (bestKey) {
                                  displayName = allValues[bestKey];
                                } else {
                                  displayName = allValues[validNameKeys[0]];
                                }
                              }
                              // Try combining first and last name if available but we don't have a complete name
                              else if ((allValues['firstName'] || allValues['first_name']) &&
                                  (allValues['lastName'] || allValues['last_name'])) {
                                const firstName = allValues['firstName'] || allValues['first_name'];
                                const lastName = allValues['lastName'] || allValues['last_name'];
                                displayName = `${firstName} ${lastName}`;
                              }
                              // If there's a direct field that looks like a name but isn't in our key checks
                              else if (resident.firstName && resident.lastName) {
                                displayName = `${resident.firstName} ${resident.lastName}`;
                              }
                              else if (resident.first_name && resident.last_name) {
                                displayName = `${resident.first_name} ${resident.last_name}`;
                              }
                              else if (resident.name && typeof resident.name === 'string') {
                                displayName = resident.name;
                              }
                              else if (resident.username && typeof resident.username === 'string') {
                                displayName = resident.username;
                              }
                              // Last resort - look for any property that might be a name
                              else {
                                for (const key in resident) {
                                  if (resident[key] && typeof resident[key] === 'string' &&
                                      !key.includes('id') && !key.includes('mail') &&
                                      !key.includes('phone') && !key.includes('date')) {
                                    displayName = resident[key];
                                    console.log('Using property as name:', key, displayName);
                                    break;
                                  }
                                }
                              }

                              // Extract email as a fallback for display name
                              let email = '';
                              for (const key of allKeys) {
                                if (key.toLowerCase().includes('email') &&
                                    typeof allValues[key] === 'string' &&
                                    allValues[key].includes('@')) {
                                  email = allValues[key];
                                  // If we still don't have a name, use part of the email
                                  if (displayName === 'Unknown' && email) {
                                    displayName = email.split('@')[0];
                                  }
                                  break;
                                }
                              }

                              // Try to find date fields
                              const dateKeys = allKeys.filter(key =>
                                  key.toLowerCase().includes('date') ||
                                  key.toLowerCase().includes('created') ||
                                  key.toLowerCase().includes('registered') ||
                                  key.toLowerCase().includes('joined')
                              );
                              console.log('POTENTIAL DATE KEYS:', dateKeys, dateKeys.map(k => allValues[k]));

                              // Try to find a valid date from any of our potential date keys
                              let joinDate = 'N/A';
                              for (const key of dateKeys) {
                                if (allValues[key]) {
                                  try {
                                    const date = new Date(allValues[key]);
                                    if (!isNaN(date.getTime())) {
                                      joinDate = date.toLocaleDateString();
                                      break;
                                    }
                                  } catch (error) {
                                    console.log(`Error parsing date from ${key}:`, error);
                                  }
                                }
                              }

                              // Fallback ID for key
                              const idValue = resident.id || resident._id || index;

                              return (
                                  <div key={idValue} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <div className="bg-[#861A2D33] rounded-full h-10 w-10 flex items-center justify-center text-[#861A2D] font-semibold text-sm mr-3">
                                          {displayName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-800">{displayName}</p>
                                          <p className="text-xs text-gray-500">{email}</p>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end">
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mb-1">Verified</span>
                                        <span className="text-xs text-gray-500">
                                  Joined: {joinDate}
                                </span>
                                      </div>
                                    </div>
                                  </div>
                              );
                            })}
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-md">
                            <FaInbox className="text-gray-400 text-3xl mb-2" />
                            <p className="text-sm text-gray-500 text-center">No residents data available</p>
                            <p className="text-xs text-gray-400 text-center mt-1">New residents will appear here when they register</p>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* Forum Posts & Service Requests Section - Two Columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Latest Forum Posts */}
                    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D] flex flex-col h-full">
                      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <FaFileAlt className="mr-3 text-[#861A2D]" /> Latest Forum Posts
                      </h2>
                      <div className="flex-grow">
                        {posts.length > 0 ? (
                            <ul className="space-y-3 h-full min-h-[200px]">
                              {posts.map(post => (
                                  <li key={post.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{post.title || 'Untitled Post'}</p>
                                    <div className="flex justify-between items-center mt-2">
                                      <div className="flex items-center">
                                        <div className="mr-2 h-7 w-7 bg-[#861A2D33] rounded-full flex items-center justify-center text-[#861A2D]">
                                          <span className="text-xs font-medium">{(post.author?.firstName || 'U').charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div className="text-sm text-gray-700">{post.author?.firstName} {post.author?.lastName}</div>
                                      </div>
                                      <div className="text-xs text-gray-500 text-right">
                                        <div className="font-medium">{formatDate(post.createdDate || post.createdAt || post.date)}</div>
                                      </div>
                                    </div>
                                  </li>
                              ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-md min-h-[200px]">
                              <FaFileAlt className="text-gray-400 text-3xl mb-2" />
                              <p className="text-sm text-gray-500 text-center">No forum posts available</p>
                              <p className="text-xs text-gray-400 text-center mt-1">New posts will appear here when created</p>
                            </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <Link to="/official/forum-management" className="text-sm font-medium text-[#861A2D] hover:text-[#9b3747] transition-colors duration-200">
                          View All Posts &rarr;
                        </Link>
                      </div>
                    </div>

                    {/* Latest Service Requests */}
                    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D] flex flex-col h-full">
                      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <FaListAlt className="mr-3 text-[#861A2D]" /> Latest Service Requests
                      </h2>
                      <div className="flex-grow">
                        {requests.length > 0 ? (
                            <ul className="space-y-3 h-full min-h-[200px]">
                              {requests.map(request => {
                                // Log the service request structure to see fields
                                console.log('Service request structure:', request);

                                // Get request type
                                const requestType = request.type || request.serviceType || 'Service Request';

                                // Initialize date format values
                                let relativeTime = 'N/A';

                                // Try to get a valid date
                                const dateFields = ['createdAt', 'created_at', 'dateCreated', 'date_created',
                                  'createdDate', 'created_date', 'date', 'requestDate', 'timestamp'];
                                let validDate = null;

                                for (const field of dateFields) {
                                  if (request[field]) {
                                    try {
                                      const date = new Date(request[field]);
                                      if (!isNaN(date.getTime())) {
                                        validDate = date;
                                        break;
                                      }
                                    } catch (error) {
                                      console.error(`Error parsing date from ${field}:`, error);
                                    }
                                  }
                                }

                                // If we found a valid date, calculate relative time
                                if (validDate) {
                                  // Calculate relative time
                                  const now = new Date();
                                  const diffInSeconds = Math.floor((now - validDate) / 1000);

                                  if (diffInSeconds < 60) {
                                    relativeTime = 'Just now';
                                  } else if (diffInSeconds < 3600) {
                                    const minutes = Math.floor(diffInSeconds / 60);
                                    relativeTime = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
                                  } else if (diffInSeconds < 86400) {
                                    const hours = Math.floor(diffInSeconds / 3600);
                                    relativeTime = `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
                                  } else {
                                    const days = Math.floor(diffInSeconds / 86400);
                                    relativeTime = `${days} ${days === 1 ? 'day' : 'days'} ago`;
                                  }
                                }

                                // Get the requester name directly from residentName field
                                // This matches what we see in the console output
                                let requesterName = request.residentName || 'Unknown';

                                // If residentName is not available, try other fallbacks
                                if (requesterName === 'Unknown') {
                                  if (request.requesterName) {
                                    requesterName = request.requesterName;
                                  } else if (request.user && request.user.username) {
                                    requesterName = request.user.username;
                                  } else if (request.user && request.user.name) {
                                    requesterName = request.user.name;
                                  } else if (request.name) {
                                    requesterName = request.name;
                                  } else if (request.residentEmail) {
                                    // Last resort - use part of email
                                    requesterName = request.residentEmail.split('@')[0];
                                  }
                                }

                                // Get icon based on service type
                                let typeIcon;
                                const type = requestType.toLowerCase();
                                if (type.includes('clearance')) {
                                  typeIcon = 'bg-blue-100 text-blue-800';
                                } else if (type.includes('certificate')) {
                                  typeIcon = 'bg-purple-100 text-purple-800';
                                } else if (type.includes('indigency')) {
                                  typeIcon = 'bg-indigo-100 text-indigo-800';
                                } else if (type.includes('permit') || type.includes('business')) {
                                  typeIcon = 'bg-orange-100 text-orange-800';
                                } else if (type.includes('id')) {
                                  typeIcon = 'bg-teal-100 text-teal-800';
                                } else {
                                  typeIcon = 'bg-gray-100 text-gray-800';
                                }

                                return (
                                    <li key={request.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                      <div className="flex items-center justify-between mb-2">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${typeIcon}`}>
                                  {requestType}
                                </span>
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                request.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                                                    request.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                         {request.status}
                       </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                          <div className="mr-2 h-7 w-7 bg-[#861A2D33] rounded-full flex items-center justify-center text-[#861A2D]">
                                            <span className="text-xs font-medium">{requesterName.charAt(0).toUpperCase()}</span>
                                          </div>
                                          <div className="text-sm text-gray-700">{requesterName}</div>
                                        </div>
                                        <div className="text-xs text-gray-500 text-right">
                                          <div className="font-medium">{relativeTime}</div>
                                        </div>
                                      </div>
                                    </li>
                                );
                              })}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-md min-h-[200px]">
                              <FaListAlt className="text-gray-400 text-3xl mb-2" />
                              <p className="text-sm text-gray-500 text-center">No service requests available</p>
                              <p className="text-xs text-gray-400 text-center mt-1">New requests will appear here when submitted</p>
                            </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <Link to="/official/requests" className="text-sm font-medium text-[#861A2D] hover:text-[#9b3747] transition-colors duration-200">
                          Manage Service Requests &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Reports Management & Appeals Section - Two Columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Reports Management */}
                    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D] flex flex-col h-full">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                          <FaExclamationTriangle className="mr-3 text-[#861A2D]" /> Recent Reports
                        </h2>
                        <div className="flex space-x-2">
                          <button
                              onClick={() => setReportFilter('all')}
                              className={`text-xs px-2 py-1 rounded ${
                                  reportFilter === 'all'
                                      ? 'bg-[#861A2D] text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            All
                          </button>
                          <button
                              onClick={() => setReportFilter('post')}
                              className={`text-xs px-2 py-1 rounded flex items-center ${
                                  reportFilter === 'post'
                                      ? 'bg-[#861A2D] text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            <FaFileAlt className="mr-1" size={10} /> Posts
                          </button>
                          <button
                              onClick={() => setReportFilter('comment')}
                              className={`text-xs px-2 py-1 rounded flex items-center ${
                                  reportFilter === 'comment'
                                      ? 'bg-[#861A2D] text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            <FaCommentDots className="mr-1" size={10} /> Comments
                          </button>
                        </div>
                      </div>
                      <div className="flex-grow">
                        {reports.length > 0 ? (
                            <ul className="space-y-3 h-full min-h-[200px]">
                              {reports
                                  .filter(report => {
                                    if (reportFilter === 'all') return true;
                                    const isCommentReport = report.comment || report.commentId;
                                    return reportFilter === 'comment' ? isCommentReport : !isCommentReport;
                                  })
                                  .map(report => {
                                    // Log the report data structure
                                    console.log('Report data:', report);

                                    // Determine if this is a comment report
                                    const isCommentReport = report.comment || report.commentId;

                                    // Extract title depending on report type
                                    let title = 'Untitled';

                                    if (isCommentReport) {
                                      // For comment reports, show comment text or post title it belongs to
                                      if (report.comment && report.comment.content) {
                                        // Truncate long content
                                        title = report.comment.content.length > 30
                                            ? report.comment.content.substring(0, 30) + '...'
                                            : report.comment.content;
                                      } else if (report.content) {
                                        title = report.content.length > 30
                                            ? report.content.substring(0, 30) + '...'
                                            : report.content;
                                      } else if (report.post && report.post.title) {
                                        title = `Comment on "${report.post.title}"`;
                                      }
                                    } else {
                                      // For post reports, get post title
                                      title = report.post && report.post.title
                                          ? report.post.title
                                          : 'Untitled Post';
                                    }

                                    // Extract reporter name from the nested reporter object
                                    let reporterName = 'Unknown';
                                    if (report.reporter) {
                                      if (report.reporter.firstName && report.reporter.lastName) {
                                        reporterName = `${report.reporter.firstName} ${report.reporter.lastName}`;
                                      } else if (report.reporter.username) {
                                        reporterName = report.reporter.username;
                                      }
                                    }

                                    // Get report date
                                    let reportDate = 'N/A';
                                    if (report.createdAt) {
                                      try {
                                        const date = new Date(report.createdAt);
                                        if (!isNaN(date.getTime())) {
                                          reportDate = date.toLocaleDateString();
                                        }
                                      } catch (error) {
                                        console.error('Error parsing report date:', error);
                                      }
                                    }

                                    // Get the report reason
                                    const reportReason = report.reason || '';

                                    // Determine report status
                                    const reportStatus = report.status || 'PENDING';

                                    return (
                                        <li key={report.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                          <div className="flex flex-col space-y-2">
                                            <div className="flex justify-between items-start">
                                              <p className="text-sm font-medium text-gray-800 flex items-center">
                                                {isCommentReport ? (
                                                    <FaCommentDots className="mr-2 text-green-500" title="Comment Report" />
                                                ) : (
                                                    <FaFileAlt className="mr-2 text-blue-500" title="Post Report" />
                                                )}
                                                {isCommentReport ? `Comment: "${title}"` : `Post: "${title}"`}
                                              </p>
                                              <span className={`px-2 py-1 text-xs rounded-full ${
                                                  reportStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                      reportStatus === 'REVIEWED' ? 'bg-blue-100 text-blue-800' :
                                                          reportStatus === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                                                              'bg-gray-100 text-gray-800'
                                              }`}>
                                      {reportStatus}
                                    </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-gray-500">
                                              <div className="flex items-center">
                                                <div className="mr-2 h-5 w-5 bg-[#861A2D33] rounded-full flex items-center justify-center text-[#861A2D] text-xs">
                                                  {reporterName.charAt(0).toUpperCase()}
                                                </div>
                                                <span>Reported by {reporterName}</span>
                                              </div>
                                              <span>{reportDate}</span>
                                            </div>
                                            {reportReason && (
                                                <div className="text-xs bg-red-50 text-red-800 px-2 py-1 rounded">
                                                  Reason: {reportReason}
                                                </div>
                                            )}
                                          </div>
                                        </li>
                                    );
                                  })}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-md min-h-[200px]">
                              <FaExclamationTriangle className="text-gray-400 text-3xl mb-2" />
                              <p className="text-sm text-gray-500 text-center">No content reports available</p>
                              <p className="text-xs text-gray-400 text-center mt-1">Content reports will appear here when submitted</p>
                            </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <Link to="/official/reports-management" className="text-sm font-medium text-[#861A2D] hover:text-[#9b3747] transition-colors duration-200">
                          Manage Content Reports &rarr;
                        </Link>
                      </div>
                    </div>

                    {/* User Appeals */}
                    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#861A2D] flex flex-col h-full">
                      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <FaUserShield className="mr-3 text-[#861A2D]" /> Deactivation Appeals
                      </h2>
                      <div className="flex-grow">
                        {appeals.length > 0 ? (
                            <ul className="space-y-3 h-full min-h-[200px]">
                              {appeals.map(appeal => (
                                  <li key={appeal.id} className="p-3 bg-gray-50 rounded-md border border-gray-200 flex justify-between items-center">
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">{appeal.userName || 'User'}</p>
                                      <p className="text-xs text-gray-500">Appealed on {formatDate(appeal.submissionDate)}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        appeal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            appeal.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                appeal.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                           {appeal.status}
                         </span>
                                  </li>
                              ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-md min-h-[200px]">
                              <FaHandPaper className="text-gray-400 text-3xl mb-2" />
                              <p className="text-sm text-gray-500 text-center">No account appeals pending</p>
                              <p className="text-xs text-gray-400 text-center mt-1">Account reactivation requests will appear here</p>
                            </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <Link to="/official/appeals" className="text-sm font-medium text-[#861A2D] hover:text-[#9b3747] transition-colors duration-200">
                          Manage Appeals &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
            )}
          </main>
        </div>
      </div>
  );
};

export default OfficialDashboard;