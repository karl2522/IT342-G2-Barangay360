const API_URL = 'https://barangay360-nja7q.ondigitalocean.app/api';

class EventService {
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
        try {
            const response = await fetch(`${API_URL}/events`);
            
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

export const eventService = new EventService();