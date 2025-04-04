package org.backend.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(WebSocketHandshakeInterceptor.class);

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        if (request instanceof ServletServerHttpRequest) {
            HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();
            String token = servletRequest.getParameter("token");
            
            // Log the request details for debugging
            logger.info("WebSocket handshake request from: {}", servletRequest.getRemoteAddr());
            
            if (token != null && !token.isEmpty()) {
                attributes.put("token", token);
                logger.info("WebSocket handshake successful with token");
                return true;
            } else {
                // For development, allow connections without token
                logger.warn("WebSocket handshake without token - allowing for development");
                return true;
            }
        }
        return true; // Allow the handshake to proceed
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {
        if (exception != null) {
            logger.error("WebSocket handshake error: {}", exception.getMessage(), exception);
        } else {
            logger.info("WebSocket handshake completed successfully");
        }
    }
} 