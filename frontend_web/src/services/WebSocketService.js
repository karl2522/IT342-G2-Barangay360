import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.subscribers = new Map();
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

    connect() {
        const token = this.getToken();
        if (!token) {
            console.error('No authentication token found');
            return;
        }

        // Define a factory function that creates a SockJS instance with token
        const socketFactory = () => new SockJS(`http://localhost:8080/ws?token=${token}`);
        
        // Create STOMP client with the factory function
        this.stompClient = Stomp.over(socketFactory);
        
        // Set debug to a function instead of null
        this.stompClient.debug = function() {};

        // Connect with authorization header
        const headers = {
            'Authorization': `Bearer ${token}`
        };
        
        this.stompClient.connect(
            headers,
            () => {
                console.log('Connected to WebSocket');
                this.subscribeToServiceRequests();
            },
            (error) => {
                console.error('WebSocket connection error:', error);
                // Reconnect handled by the factory function
            }
        );
    }

    disconnect() {
        if (this.stompClient) {
            this.stompClient.disconnect();
            this.stompClient = null;
        }
    }

    subscribeToServiceRequests() {
        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.subscribe('/topic/service-requests', (message) => {
                const serviceRequest = JSON.parse(message.body);
                this.notifySubscribers('service-requests', serviceRequest);
            });
        }
    }

    subscribe(topic, callback) {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, new Set());
        }
        this.subscribers.get(topic).add(callback);
    }

    unsubscribe(topic, callback) {
        if (this.subscribers.has(topic)) {
            this.subscribers.get(topic).delete(callback);
        }
    }

    notifySubscribers(topic, data) {
        if (this.subscribers.has(topic)) {
            this.subscribers.get(topic).forEach(callback => callback(data));
        }
    }
}

export const webSocketService = new WebSocketService();