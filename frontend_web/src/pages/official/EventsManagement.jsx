import moment from 'moment';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Sidebar from '../../components/layout/Sidebar.jsx';
import TopNavigation from '../../components/layout/TopNavigation';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext';

// Set up the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Event service for handling API requests
// Commented out until backend implementation is ready
/* 
const eventService = {
  getAllEvents: async () =>
    const response = await axios.get('/api/events');
    return response.data;
  },
  
  createEvent: async (eventData) => {
    const response = await axios.post('/api/events', eventData);
    return response.data;
  },
  
  updateEvent: async (id, eventData) => {
    const response = await axios.put(`/api/events/${id}`, eventData);
    return response.data;
  },
  
  deleteEvent: async (id) => {
    const response = await axios.delete(`/api/events/${id}`);
    return response.data;
  }
};
*/

const EventsManagement = () => {
  // Access toast context
  const { showToast } = useToast();
  const { handleApiRequest } = useContext(AuthContext); // Get handleApiRequest from context
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date()); // Add state for calendar date

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: new Date(),
    end: new Date(),
    location: '',
    allDay: false,
    color: '#861A2D'
  });

  // Fetch events on component mount
  useEffect(() => {
    loadEvents();
  }, []); // Keep dependency array empty

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Note: This is a placeholder. In a real implementation, you would 
      // fetch data from the backend API. Currently using mock data.
      
      // Use this when backend is ready:
      // const data = await eventService.getAllEvents();
      
      // Mock data for demonstration
      const data = await eventService.getAllEvents();
      
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      showToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add handler for calendar navigation
  const handleNavigate = useCallback((newDate) => setCalendarDate(newDate), []);

  const openCreateModal = () => {
    setFormData({
      title: '',
      description: '',
      start: new Date(),
      end: moment().add(1, 'hours').toDate(),
      location: '',
      allDay: false,
      color: '#861A2D'
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setFormData({
      title: event.title,
      description: event.description || '',
      start: new Date(event.start),
      end: new Date(event.end),
      location: event.location || '',
      allDay: event.allDay || false,
      color: event.color || '#861A2D'
    });
    setSelectedEvent(event);
    setIsEditing(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setFormData({
      title: '',
      description: '',
      start: new Date(),
      end: new Date(),
      location: '',
      allDay: false,
      color: '#861A2D'
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (name, date) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: date
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showToast('Please enter an event title', 'error');
      return;
    }
    
    try {
      let updatedEvents;
      
      if (isEditing && selectedEvent) {
        // Update existing event
        const updatedEvent = {
          ...selectedEvent,
          title: formData.title,
          description: formData.description,
          start: formData.start,
          end: formData.end,
          location: formData.location,
          allDay: formData.allDay,
          color: formData.color
        };
        
        // In a real implementation, you would update the event in the backend
        // await eventService.updateEvent(selectedEvent.id, updatedEvent);
        
        await eventService.updateEvent(selectedEvent.id, updatedEvent);
        
        // Update local state
        updatedEvents = events.map(event => 
          event.id === selectedEvent.id ? updatedEvent : event
        );
        
        showToast('Event updated successfully', 'success');
      } else {
        // Create new event
        const newEvent = {
          // id: Date.now(), // In a real app, this ID would come from the backend
          title: formData.title,
          description: formData.description,
          start: formData.start,
          end: formData.end,
          location: formData.location,
          allDay: formData.allDay,
          color: formData.color
        };
        
        // In a real implementation, you would create the event in the backend
        // const createdEvent = await eventService.createEvent(newEvent);
        
        const createdEvent = await eventService.createEvent(newEvent);
        
        // Update local state
        updatedEvents = [...events, createdEvent];
        
        showToast('Event created successfully', 'success');
      }
      
      setEvents(updatedEvents);
      closeModal();
    } catch (error) {
      console.error('Error saving event:', error);
      showToast(isEditing ? 'Failed to update event' : 'Failed to create event', 'error');
    }
  };

  const openDeleteModal = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setEventToDelete(null);
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      // In a real implementation, you would delete the event from the backend
      // await eventService.deleteEvent(eventToDelete.id);
      
      await eventService.deleteEvent(eventToDelete.id);
      
      // Update local state
      const updatedEvents = events.filter(event => event.id !== eventToDelete.id);
      setEvents(updatedEvents);
      
      showToast('Event deleted successfully', 'success');
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event', 'error');
    }
  };

  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: event.color || '#861A2D',
      borderRadius: '5px',
      opacity: 0.8,
      color: '#fff',
      border: 'none',
      display: 'block'
    };
    return {
      style
    };
  };

  // Handle calendar event selection
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    openEditModal(event);
  };

  // Handle slot selection for creating new events
  const handleSelectSlot = ({ start, end }) => {
    // Only open create modal if the user is not just clicking on a day header
    // This basic check might need refinement depending on exact behavior desired
    if (moment(start).isSame(end, 'day') && moment(start).hour() === 0 && moment(end).hour() === 0) {
      // Potentially a click on the day number, do nothing or handle differently
      console.log("Day header clicked, not opening modal.");
      return;
    }
    
    setFormData(prevData => ({
      ...prevData,
      title: '', // Reset title for new event
      description: '', // Reset description
      start,
      end,
      location: '', // Reset location
      allDay: moment(start).isSame(end, 'day') && moment(start).hour() === 0 && moment(end).hour() === 0, // Basic allDay check
      color: '#861A2D' // Reset color
    }));
    setIsEditing(false);
    setShowModal(true);
  };

  const eventService = {
    getAllEvents: async () => {
      const response = await handleApiRequest('http://localhost:8080/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return await response.json();
    },
    
    createEvent: async (eventData) => {
      const response = await handleApiRequest('http://localhost:8080/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      if (!response.ok) throw new Error('Failed to create event');
      return await response.json();
    },
    
    updateEvent: async (id, eventData) => {
      const response = await handleApiRequest(`http://localhost:8080/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      if (!response.ok) throw new Error('Failed to update event');
      return await response.json();
    },
    
    deleteEvent: async (id) => {
      const response = await handleApiRequest(`http://localhost:8080/api/events/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete event');
      // DELETE might not return a body, handle appropriately
      try {
        return await response.json();
      } catch {
        // If no JSON body, return success indicator or empty object
        return { success: true }; 
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar isOfficial={true} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Navigation */}
        <TopNavigation title="Events Management" />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-full mx-auto">
            <div className="mb-6 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Barangay Events Calendar</h2>
                <button 
                  onClick={openCreateModal}
                  className="flex items-center px-4 py-2 bg-[#861A2D] text-white rounded-md hover:bg-[#9b3747] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D]"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Create Event
                </button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#861A2D]"></div>
                </div>
              ) : (
                <div className="calendar-container bg-white p-2 rounded-lg shadow-sm" style={{ height: 'calc(100vh - 250px)' }}>
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable
                    eventPropGetter={eventStyleGetter}
                    views={['month', 'week', 'day', 'agenda']}
                    defaultView="month"
                    date={calendarDate} // Control the displayed date
                    onNavigate={handleNavigate} // Update state on navigation
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create/Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={closeModal}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div
              className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit}>
                <div className="bg-[#861A2D] px-6 py-5 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    {isEditing ? 'Edit Event' : 'Create New Event'}
                  </h3>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-white hover:text-gray-200 transition-colors p-1"
                    aria-label="Close modal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="bg-white px-6 pt-6 pb-5">
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter event title"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-transparent focus:bg-gray-50 transition-colors hover:border-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Event details and additional information"
                        rows="3"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-transparent focus:bg-gray-50 transition-colors hover:border-gray-400"
                      ></textarea>
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Event location"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-transparent focus:bg-gray-50 transition-colors hover:border-gray-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="start" className="block text-sm font-medium text-gray-700 mb-2">Start Date & Time</label>
                        <input
                          type="datetime-local"
                          id="start"
                          name="start"
                          value={moment(formData.start).format('YYYY-MM-DDTHH:mm')}
                          onChange={(e) => handleDateChange('start', new Date(e.target.value))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-transparent focus:bg-gray-50 transition-colors hover:border-gray-400"
                        />
                      </div>

                      <div>
                        <label htmlFor="end" className="block text-sm font-medium text-gray-700 mb-2">End Date & Time</label>
                        <input
                          type="datetime-local"
                          id="end"
                          name="end"
                          value={moment(formData.end).format('YYYY-MM-DDTHH:mm')}
                          onChange={(e) => handleDateChange('end', new Date(e.target.value))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-transparent focus:bg-gray-50 transition-colors hover:border-gray-400"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="allDay"
                          name="allDay"
                          checked={formData.allDay}
                          onChange={handleChange}
                          className="h-4 w-4 text-[#861A2D] focus:ring-[#861A2D] border-gray-300 rounded"
                        />
                        <label htmlFor="allDay" className="ml-2 block text-sm text-gray-700">All day event</label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Event Color</label>
                      <div className="flex flex-wrap justify-center items-center gap-5">
                        {[
                          '#861A2D', // Maroon (Barangay color)
                          '#1A7D2D', // Green
                          '#1A288D', // Navy
                          '#FFA500', // Orange
                          '#9C27B0', // Purple
                          '#2196F3'  // Blue
                        ].map((color) => (
                          <div
                            key={color}
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                            className={`h-10 w-10 rounded-full cursor-pointer hover:scale-110 transition-transform duration-150 ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                  {isEditing ? (
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-4 py-2 bg-[#861A2D] text-white rounded-md shadow-sm hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors font-medium text-sm"
                      >
                        Update Event
                      </button>

                      <button
                        type="button"
                        onClick={() => openDeleteModal(selectedEvent)}
                        className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 bg-[#861A2D] text-white rounded-md shadow-sm hover:bg-[#9b3747] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors font-medium text-sm"
                    >
                      Create Event
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861A2D] transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={closeDeleteModal}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div 
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-red-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Delete Event</h3>
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="text-white hover:text-gray-200 transition-colors p-1"
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-white px-6 py-5">
                <p className="text-base text-gray-600">
                  Are you sure you want to delete this event? This action cannot be undone.
                </p>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors font-medium text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsManagement;