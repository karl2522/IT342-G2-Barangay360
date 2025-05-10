import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.subscribers = new Map();
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        this.reconnectDelay = 3000; // 3 seconds
        this.connected = false;
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
        
        // Close existing connections if any
        this.disconnect();

        try {
            // Define a factory function that creates a SockJS instance with token
            const socketFactory = () => {
                const url = `https://barangay360-nja7q.ondigitalocean.app/ws${token ? `?token=${token}` : ''}`;
                console.log('Connecting to WebSocket at:', url);
                return new SockJS(url);
            };
            
            // Create STOMP client with the factory function
            this.stompClient = Stomp.over(socketFactory);
            
            // Disable debug logs in production
            this.stompClient.debug = function() {};
            
            // Set heartbeat to keep connection alive
            this.stompClient.heartbeat = {
                outgoing: 10000, // Send heartbeat every 10 seconds
                incoming: 10000  // Expect heartbeat every 10 seconds
            };

            // Connect with authorization header if token exists
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            this.stompClient.connect(
                headers,
                () => {
                    console.log('Connected to WebSocket');
                    this.connected = true;
                    this.connectionAttempts = 0;
                    this.subscribeToServiceRequests();
                    this.subscribeToForumUpdates();
                },
                (error) => {
                    console.error('WebSocket connection error:', error);
                    this.connected = false;
                    
                    // Attempt to reconnect if not max attempts
                    if (this.connectionAttempts < this.maxConnectionAttempts) {
                        this.connectionAttempts++;
                        console.log(`Reconnecting in ${this.reconnectDelay/1000} seconds... (Attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
                        setTimeout(() => this.connect(), this.reconnectDelay);
                    } else {
                        console.error('Max reconnection attempts reached. Please refresh the page.');
                    }
                }
            );
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            this.connected = false;
        }
    }

    disconnect() {
        if (this.stompClient) {
            try {
                this.stompClient.disconnect();
                console.log('Disconnected from WebSocket');
            } catch (error) {
                console.error('Error disconnecting from WebSocket:', error);
            }
            this.stompClient = null;
            this.connected = false;
        }
    }

    subscribeToServiceRequests() {
        if (this.stompClient && this.stompClient.connected) {
            try {
                this.stompClient.subscribe('/topic/service-requests', (message) => {
                    try {
                        const serviceRequest = JSON.parse(message.body);
                        this.notifySubscribers('service-requests', serviceRequest);
                    } catch (error) {
                        console.error('Error parsing service request message:', error);
                    }
                });
                console.log('Subscribed to service requests');
            } catch (error) {
                console.error('Error subscribing to service requests:', error);
            }
        }
    }

    subscribeToForumUpdates() {
        if (this.stompClient && this.stompClient.connected) {
            try {
                this.stompClient.subscribe('/topic/forum', (message) => {
                    try {
                        const forumUpdate = JSON.parse(message.body);
                        this.notifySubscribers('forum', forumUpdate);
                    } catch (error) {
                        console.error('Error parsing forum update message:', error);
                    }
                });
                console.log('Subscribed to forum updates');
            } catch (error) {
                console.error('Error subscribing to forum updates:', error);
            }
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
            this.subscribers.get(topic).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in subscriber callback for topic ${topic}:`, error);
                }
            });
        }
    }

    sendForumUpdate(destination, data) {
        if (this.stompClient && this.stompClient.connected) {
            try {
                const token = this.getToken();
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                
                this.stompClient.send(
                    destination,
                    headers,
                    JSON.stringify(data)
                );
                console.log(`Sent forum update to ${destination}`);
            } catch (error) {
                console.error('Error sending forum update:', error);
            }
        } else {
            console.warn('Cannot send forum update: WebSocket not connected');
        }
    }
    
    isConnected() {
        return this.connected && this.stompClient && this.stompClient.connected;
    }
}

export const webSocketService = new WebSocketService();