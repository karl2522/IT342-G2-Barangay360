package org.backend.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.backend.model.QRLoginSession;
import org.backend.model.User;
import org.backend.payload.response.TokenDTO;
import org.backend.repository.QRLoginSessionRepository;
import org.backend.security.jwt.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QRLoginService {

    @Autowired
    private QRLoginSessionRepository qrLoginSessionRepository;

    @Autowired
    private JwtUtils jwtUtils;

    public QRLoginSession createLoginSession() {
        QRLoginSession session = new QRLoginSession();
        session.setSessionId(UUID.randomUUID().toString());
        return qrLoginSessionRepository.save(session);
    }

    @Transactional
    public TokenDTO confirmLogin(String sessionId, User user) {
        QRLoginSession session = qrLoginSessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Invalid QR code session"));

        if (session.isUsed()) {
            throw new RuntimeException("QR code has already been used");
        }

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("QR code has expired");
        }

        // Mark session as used and associate it with the user
        session.setUsed(true);
        session.setUser(user);
        qrLoginSessionRepository.save(session);

        // Generate tokens
        TokenDTO accessToken = jwtUtils.generateTokenFromUsername(user.getUsername());
        TokenDTO refreshToken = jwtUtils.generateRefreshToken(
            new UsernamePasswordAuthenticationToken(user.getUsername(), null)
        );

        return accessToken;
    }

    public QRLoginSession getSession(String sessionId) {
        return qrLoginSessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }

    @Transactional
    public void cleanupExpiredSessions() {
        qrLoginSessionRepository.findAll().stream()
                .filter(session -> session.getExpiresAt().isBefore(LocalDateTime.now()))
                .forEach(session -> qrLoginSessionRepository.deleteBySessionId(session.getSessionId()));
    }
}