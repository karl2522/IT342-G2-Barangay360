package org.backend.controller;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

import org.backend.model.PasswordResetToken;
import org.backend.model.User;
import org.backend.payload.request.ForgotPasswordRequest;
import org.backend.payload.request.ResetPasswordRequest;
import org.backend.payload.request.VerifyCodeRequest;
import org.backend.payload.response.MessageResponse;
import org.backend.repository.PasswordResetTokenRepository;
import org.backend.repository.UserRepository;
import org.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:8080"}, maxAge = 3600)
@RestController
@RequestMapping("/api/password")
@Tag(name = "Password Reset", description = "Password reset APIs")
public class PasswordResetController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/forgot")
    @Operation(summary = "Request password reset", description = "Sends a reset code to the user's email")
    public ResponseEntity<?> requestPasswordReset(@Valid @RequestBody ForgotPasswordRequest request) {
        String email = request.getEmail();
        
        // Check if user with this email exists
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            return ResponseEntity.ok(new MessageResponse("If your email is registered, you will receive a reset code."));
        }

        // Generate a 6-digit random code
        String code = generateRandomCode();
        
        // Save token to database with 15 minutes expiry
        tokenRepository.deleteByEmail(email); // Remove any existing tokens
        
        PasswordResetToken token = new PasswordResetToken();
        token.setEmail(email);
        token.setCode(code);
        token.setExpiryDate(LocalDateTime.now().plusMinutes(15));
        tokenRepository.save(token);
        
        // Send email with the code
        emailService.sendPasswordResetEmail(email, code);
        
        return ResponseEntity.ok(new MessageResponse("If your email is registered, you will receive a reset code."));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify reset code", description = "Verifies the reset code sent to user's email")
    public ResponseEntity<?> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        String email = request.getEmail();
        String code = request.getCode();
        
        Optional<PasswordResetToken> tokenOptional = tokenRepository.findByEmailAndCode(email, code);
        if (tokenOptional.isEmpty() || tokenOptional.get().isExpired()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Invalid or expired code. Please request a new one."));
        }
        
        return ResponseEntity.ok(new MessageResponse("Code verified successfully."));
    }

    @PostMapping("/reset")
    @Operation(summary = "Reset password", description = "Resets user password after code verification")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String email = request.getEmail();
        String code = request.getCode();
        String newPassword = request.getNewPassword();
        
        // Verify the code again
        Optional<PasswordResetToken> tokenOptional = tokenRepository.findByEmailAndCode(email, code);
        if (tokenOptional.isEmpty() || tokenOptional.get().isExpired()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Invalid or expired code. Please request a new one."));
        }
        
        // Update user's password
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("User not found."));
        }
        
        User user = userOptional.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        // Delete the used token
        tokenRepository.delete(tokenOptional.get());
        
        return ResponseEntity.ok(new MessageResponse("Password updated successfully."));
    }
    
    private String generateRandomCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // Generates a 6-digit number
        return String.valueOf(code);
    }
} 