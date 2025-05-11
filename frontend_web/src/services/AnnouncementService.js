const API_URL = 'https://barangay360-nja7q.ondigitalocean.app/api';

class AnnouncementService {
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

    async getAllAnnouncements() {
        if (!await this.ensureValidToken()) return [];
        
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_URL}/announcements`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch announcements');
        }

        return response.json();
    }

    async getAnnouncementById(id) {
        if (!await this.ensureValidToken()) return null;
        
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_URL}/announcements/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch announcement');
        }

        return response.json();
    }

    async createAnnouncement(announcementData) {
        if (!await this.ensureValidToken()) return null;
        
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        // Create FormData for file upload
        const formData = new FormData();
        
        // Add text fields
        formData.append('title', announcementData.title);
        formData.append('content', announcementData.content);
        formData.append('officialId', announcementData.officialId);
        
        // Add thumbnail if available
        if (announcementData.thumbnail) {
            formData.append('thumbnail', announcementData.thumbnail);
        }

        try {
            console.log('Creating announcement with token:', token);
            
            const response = await fetch(`${API_URL}/announcements`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Do not set Content-Type for FormData
                },
                body: formData
            });

            // Handle Unauthorized error specifically
            if (response.status === 401) {
                console.error('Authentication error (401):', response);
                // Try to refresh token
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    // Retry with new token
                    const newToken = this.getToken();
                    const retryResponse = await fetch(`${API_URL}/announcements`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${newToken}`
                        },
                        body: formData
                    });
                    
                    if (!retryResponse.ok) {
                        console.error('Retry failed with status:', retryResponse.status);
                        const errorData = await retryResponse.json().catch(() => ({}));
                        throw new Error(errorData.message || `Failed to create announcement: ${retryResponse.status} ${retryResponse.statusText}`);
                    }
                    
                    return retryResponse.json();
                } else {
                    // Failed to refresh, likely need to login again
                    throw new Error('Authentication expired, please log in again');
                }
            }

            if (!response.ok) {
                console.error('Failed response status:', response.status);
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to create announcement: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error in createAnnouncement:', error);
            throw error;
        }
    }

    async updateAnnouncement(id, announcementData) {
        if (!await this.ensureValidToken()) return null;
        
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        // Create FormData for file upload
        const formData = new FormData();
        
        // Add text fields
        formData.append('title', announcementData.title);
        formData.append('content', announcementData.content);
        
        // Add thumbnail if available
        if (announcementData.thumbnail) {
            formData.append('thumbnail', announcementData.thumbnail);
        }

        try {
            const response = await fetch(`${API_URL}/announcements/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Do not set Content-Type for FormData
                },
                body: formData
            });

            // Handle Unauthorized error specifically
            if (response.status === 401) {
                // Try to refresh token
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    // Retry with new token
                    const newToken = this.getToken();
                    const retryResponse = await fetch(`${API_URL}/announcements/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${newToken}`
                        },
                        body: formData
                    });
                    
                    if (!retryResponse.ok) {
                        const errorData = await retryResponse.json().catch(() => ({}));
                        throw new Error(errorData.message || `Failed to update announcement: ${retryResponse.status} ${retryResponse.statusText}`);
                    }
                    
                    return retryResponse.json();
                } else {
                    // Failed to refresh, likely need to login again
                    throw new Error('Authentication expired, please log in again');
                }
            }

            if (!response.ok) {
                console.error('Failed response status:', response.status);
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to update announcement: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error in updateAnnouncement:', error);
            throw error;
        }
    }

    async deleteAnnouncement(id) {
        if (!await this.ensureValidToken()) return false;
        
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        try {
            const response = await fetch(`${API_URL}/announcements/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Handle Unauthorized error specifically
            if (response.status === 401) {
                // Try to refresh token
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    // Retry with new token
                    const newToken = this.getToken();
                    const retryResponse = await fetch(`${API_URL}/announcements/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${newToken}`
                        }
                    });
                    
                    if (!retryResponse.ok) {
                        const errorData = await retryResponse.json().catch(() => ({}));
                        throw new Error(errorData.message || `Failed to delete announcement: ${retryResponse.status} ${retryResponse.statusText}`);
                    }
                    
                    return true;
                } else {
                    // Failed to refresh, likely need to login again
                    throw new Error('Authentication expired, please log in again');
                }
            }

            if (!response.ok) {
                console.error('Failed response status:', response.status);
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to delete announcement: ${response.status} ${response.statusText}`);
            }

            return true;
        } catch (error) {
            console.error('Error in deleteAnnouncement:', error);
            throw error;
        }
    }
}

export const announcementService = new AnnouncementService(); 