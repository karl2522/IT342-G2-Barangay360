package org.backend.service;

public interface EmailService {
    void sendPasswordResetEmail(String to, String code);
} 