package org.backend.repository;

import java.util.Optional;

import org.backend.model.QRLoginSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QRLoginSessionRepository extends JpaRepository<QRLoginSession, Long> {
    Optional<QRLoginSession> findBySessionId(String sessionId);
    void deleteBySessionId(String sessionId);
}