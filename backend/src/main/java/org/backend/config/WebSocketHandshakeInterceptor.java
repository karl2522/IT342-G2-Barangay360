package org.backend.config;

import java.util.Map;

import org.backend.security.jwt.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketHandshakeInterceptor.class);

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        if (request instanceof ServletServerHttpRequest) {
            HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();
            String token = servletRequest.getParameter("token");
            if (token != null && !token.isEmpty()) {
                try {
                    jwtUtils.validateJwtToken(token); // Validate the token
                    String username = jwtUtils.getUserNameFromJwtToken(token);
                    attributes.put("username", username); // Optionally add username to attributes
                    return true;
                } catch (io.jsonwebtoken.ExpiredJwtException e) {
                    logger.error("WebSocket handshake failed: JWT token expired", e.getMessage());
                } catch (io.jsonwebtoken.MalformedJwtException e) {
                    logger.error("WebSocket handshake failed: Malformed JWT token", e.getMessage());
                } catch (io.jsonwebtoken.security.SignatureException e) {
                    logger.error("WebSocket handshake failed: JWT signature verification failed", e.getMessage());
                } catch (Exception e) {
                    logger.error("WebSocket handshake failed: General JWT validation error", e.getMessage());
                }
                return false; // Reject handshake if token is invalid
            }
        }
        logger.warn("WebSocket handshake rejected: No token provided");
        return false; // Reject handshake if no token
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {
        // Nothing to do after handshake
    }
}
