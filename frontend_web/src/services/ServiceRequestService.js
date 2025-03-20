const API_URL = 'http://localhost:8080/api';

class ServiceRequestService {
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

    async createServiceRequest(request) {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_URL}/service-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            throw new Error('Failed to create service request');
        }

        return response.json();
    }

    async updateServiceRequestStatus(requestId, status) {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_URL}/service-requests/${requestId}/status?status=${status}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to update service request status');
        }

        return response.json();
    }

    async getAllServiceRequests() {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_URL}/service-requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch service requests');
        }

        return response.json();
    }

    async getServiceRequestsByUserId(userId) {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_URL}/service-requests/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user service requests');
        }

        return response.json();
    }
}

export const serviceRequestService = new ServiceRequestService();