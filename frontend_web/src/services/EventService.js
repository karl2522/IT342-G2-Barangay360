const API_URL = 'http://localhost:8080/api';

class EventService {
    constructor() {
        this.authContext = null;
    }

    setAuthContext(context) {
        this.authContext = context;
    }

    getToken() {
        const tokenData = localStorage.getItem('token');
        if (!tokenData) return null;
        try {
            const tokenObj = JSON.parse(tokenData);
            return tokenObj.token;
        } catch (error) {
            console.error('Error parsing token:', error);
            return null;
        }
    }

    isTokenExpired() {
        try {
            const tokenData = localStorage.getItem('token');
            if (!tokenData) return true;

            const tokenObj = JSON.parse(tokenData);
            if (!tokenObj.expiresAt) return true;

            const expirationTime = new Date(tokenObj.expiresAt).getTime();
            const currentTime = new Date().getTime();
            return currentTime >= expirationTime;
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true;
        }
    }

    async refreshToken() {
        try {
            const refreshTokenData = localStorage.getItem('refreshToken');
            if (!refreshTokenData) return false;

            const refreshTokenObj = JSON.parse(refreshTokenData);

            const response = await fetch(`${API_URL}/auth/refreshtoken`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken: refreshTokenObj.token })
            });

            if (response.ok) {
                const data = await response.json();

                localStorage.setItem('token', JSON.stringify(data.accessToken));
                localStorage.setItem('refreshToken', JSON.stringify(data.refreshToken));

                return true;
            }
            return false;
        } catch (error) {
            console.error('Error refreshing token:', error);
            return false;
        }
    }

    async ensureValidToken() {
        if (this.isTokenExpired()) {
            const refreshed = await this.refreshToken();
            if (!refreshed) {
                // Token couldn't be refreshed, user needs to login again
                console.error('Authentication expired, please log in again');
                // Clear local storage
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');

                // Redirect to login page
                window.location.href = '/login';
                return false;
            }
        }
        return true;
    }

    async getAllEvents() {
        // If AuthContext is available, use it for token refresh capability
        if (this.authContext) {
            try {
                const response = await this.authContext.handleApiRequest(`${API_URL}/events`);
                if (!response.ok) throw new Error('Failed to fetch events');
                return await response.json();
            } catch (error) {
                console.error('Error in getAllEvents with AuthContext:', error);
                throw error;
            }
        } else {
            try {
                // Add token to the request
                const token = this.getToken();
                if (!token) {
                    await this.ensureValidToken();
                    const newToken = this.getToken();
                    if (!newToken) {
                        throw new Error('No authentication token found');
                    }
                }

                const response = await fetch(`${API_URL}/events`, {
                    headers: {
                        'Authorization': `Bearer ${this.getToken()}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return response.json();
            } catch (error) {
                console.error('Error in getAllEvents:', error);
                throw error;
            }
        }
    }

    async createEvent(eventData) {
        // If AuthContext is available, use it for token refresh capability
        if (this.authContext) {
            try {
                const response = await this.authContext.handleApiRequest(`${API_URL}/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
                });
                if (!response.ok) throw new Error('Failed to create event');
                return await response.json();
            } catch (error) {
                console.error('Error in createEvent with AuthContext:', error);
                throw error;
            }
        } else {
            const token = this.getToken();
            if (!token) throw new Error('No authentication token found');

            try {
                const response = await fetch(`${API_URL}/events`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(eventData)
                });

                if (!response.ok) {
                    throw new Error(`Failed to create event: ${response.status}`);
                }

                return response.json();
            } catch (error) {
                console.error('Error in createEvent:', error);
                throw error;
            }
        }
    }

    async updateEvent(id, eventData) {
        // If AuthContext is available, use it for token refresh capability
        if (this.authContext) {
            try {
                const response = await this.authContext.handleApiRequest(`${API_URL}/events/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
                });
                if (!response.ok) throw new Error('Failed to update event');
                return await response.json();
            } catch (error) {
                console.error('Error in updateEvent with AuthContext:', error);
                throw error;
            }
        } else {
            const token = this.getToken();
            if (!token) throw new Error('No authentication token found');

            try {
                const response = await fetch(`${API_URL}/events/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(eventData)
                });

                if (!response.ok) {
                    throw new Error(`Failed to update event: ${response.status}`);
                }

                return response.json();
            } catch (error) {
                console.error('Error in updateEvent:', error);
                throw error;
            }
        }
    }

    async deleteEvent(id) {
        // If AuthContext is available, use it for token refresh capability
        if (this.authContext) {
            try {
                const response = await this.authContext.handleApiRequest(`${API_URL}/events/${id}`, {
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
            } catch (error) {
                console.error('Error in deleteEvent with AuthContext:', error);
                throw error;
            }
        } else {
            const token = this.getToken();
            if (!token) throw new Error('No authentication token found');

            try {
                const response = await fetch(`${API_URL}/events/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to delete event: ${response.status}`);
                }

                // DELETE might not return a body, handle appropriately
                try {
                    return await response.json();
                } catch {
                    // If no JSON body, return success indicator or empty object
                    return { success: true }; 
                }
            } catch (error) {
                console.error('Error in deleteEvent:', error);
                throw error;
            }
        }
    }
}

export const eventService = new EventService();
