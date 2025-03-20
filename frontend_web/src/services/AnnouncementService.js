const API_URL = 'http://localhost:8080/api';

class AnnouncementService {
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

    async getAllAnnouncements() {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_URL}/announcements`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch announcements');
        }

        return response.json();
    }

    async getAnnouncementById(id) {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_URL}/announcements/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch announcement');
        }

        return response.json();
    }

    async createAnnouncement(announcementData) {
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

        const response = await fetch(`${API_URL}/announcements`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to create announcement');
        }

        return response.json();
    }

    async updateAnnouncement(id, announcementData) {
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

        const response = await fetch(`${API_URL}/announcements/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to update announcement');
        }

        return response.json();
    }

    async deleteAnnouncement(id) {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_URL}/announcements/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete announcement');
        }

        return true;
    }
}

export const announcementService = new AnnouncementService(); 