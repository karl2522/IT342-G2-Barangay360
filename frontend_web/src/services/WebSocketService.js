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

        // Close existing connections if any
        this.disconnect();

        try {
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
                    // Don't attempt to reconnect automatically on auth errors
                    // as it could cause an infinite loop
                }
            );
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
        }
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

    subscribeToForumUpdates() {
        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.subscribe('/topic/forum', (message) => {
                const forumUpdate = JSON.parse(message.body);
                this.notifySubscribers('forum', forumUpdate);
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

    sendForumUpdate(destination, data) {
        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.send(
                destination,
                { 'Authorization': `Bearer ${this.getToken()}` },
                JSON.stringify(data)
            );
        }
    }
}

export const webSocketService = new WebSocketService();