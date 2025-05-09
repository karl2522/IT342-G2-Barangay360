package org.backend.service.impl;

import org.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Override
    public void sendPasswordResetEmail(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Barangay360 - Password Reset Code");
        message.setText("Hello,\n\n" +
                "You have requested to reset your password for Barangay360. " +
                "Use the following code to verify your request:\n\n" +
                code + "\n\n" +
                "This code will expire in 15 minutes.\n\n" +
                "If you did not request a password reset, please ignore this email or contact support.\n\n" +
                "Best regards,\n" +
                "Barangay360 Team");
        
        mailSender.send(message);
    }
} 