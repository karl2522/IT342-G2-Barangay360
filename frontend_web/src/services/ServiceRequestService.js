const API_URL = 'http://localhost:8080/api';

class ServiceRequestService {
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

    // Method to handle API requests with token refresh capability if AuthContext is available
    async handleApiRequest(url, options = {}) {
        if (this.authContext) {
            return this.authContext.handleApiRequest(url, options);
        } else {
            const token = this.getToken();
            if (!token) throw new Error('No authentication token found');

            const headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };

            return fetch(url, {
                ...options,
                headers
            });
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

    async cancelServiceRequest(requestId) {
        try {
            const response = await this.handleApiRequest(
                `${API_URL}/service-requests/${requestId}/cancel`,
                {
                    method: 'POST'
                }
            );

            if (!response.ok) {
                throw new Error('Failed to cancel service request');
            }

            return response.json();
        } catch (error) {
            console.error('Error in cancelServiceRequest:', error);
            throw error;
        }
    }

    /**
     * Attach a document to a service request
     * @param {number} requestId - The ID of the service request
     * @param {FormData} formData - The form data containing the document file
     * @returns {Promise<Object>} - The updated service request
     */
    async attachDocumentToRequest(requestId, formData) {
        try {
            // Get the token
            const token = this.getToken();
            if (!token) throw new Error('No authentication token found');

            // Create headers without Content-Type to let the browser set it with the boundary
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            // Make the request with the FormData
            const response = await fetch(`${API_URL}/service-requests/${requestId}/attach-document`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to attach document to service request');
            }

            return response.json();
        } catch (error) {
            console.error('Error in attachDocumentToRequest:', error);
            throw error;
        }
    }

    /**
     * Generate a document for a service request
     * @param {number} requestId - The ID of the service request
     * @returns {Promise<Object>} - The updated service request
     */
    async generateDocument(requestId) {
        try {
            const response = await this.handleApiRequest(
                `${API_URL}/service-requests/${requestId}/generate-document`,
                {
                    method: 'POST'
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to generate document');
            }

            return response.json();
        } catch (error) {
            console.error('Error in generateDocument:', error);
            throw error;
        }
    }

    /**
     * Generate a barangay certificate for a service request
     * @param {number} requestId - The ID of the service request
     * @returns {Promise<Object>} - The response with document path
     */
    async generateBarangayCertificate(requestId) {
        try {
            const response = await this.handleApiRequest(
                `${API_URL}/service-requests/${requestId}/generate-barangay-certificate`,
                {
                    method: 'POST'
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to generate barangay certificate');
            }

            return response.json();
        } catch (error) {
            console.error('Error in generateBarangayCertificate:', error);
            throw error;
        }
    }

    /**
     * Download a generated document for a service request
     * @param {number} requestId - The ID of the service request
     * @returns {Promise<Blob>} - The document as a blob
     */
    async downloadDocument(requestId) {
        try {
            const response = await this.handleApiRequest(
                `${API_URL}/service-requests/${requestId}/download-document`,
                {
                    method: 'GET'
                }
            );

            if (!response.ok) {
                throw new Error('Failed to download document');
            }

            return response.blob();
        } catch (error) {
            console.error('Error in downloadDocument:', error);
            throw error;
        }
    }

    /**
     * Mark a document as delivered
     * @param {number} requestId - The ID of the service request
     * @returns {Promise<Object>} - The updated service request
     */
    async markDocumentAsDelivered(requestId) {
        try {
            const response = await this.handleApiRequest(
                `${API_URL}/service-requests/${requestId}/mark-delivered`,
                {
                    method: 'POST'
                }
            );

            if (!response.ok) {
                throw new Error('Failed to mark document as delivered');
            }

            return response.json();
        } catch (error) {
            console.error('Error in markDocumentAsDelivered:', error);
            throw error;
        }
    }
}

export const serviceRequestService = new ServiceRequestService();
