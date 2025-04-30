package org.backend.scheduler;

import org.backend.service.QRLoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class QRLoginCleanupTask {

    @Autowired
    private QRLoginService qrLoginService;

    @Scheduled(fixedRate = 300000) // Run every 5 minutes
    public void cleanupExpiredSessions() {
        qrLoginService.cleanupExpiredSessions();
    }
}