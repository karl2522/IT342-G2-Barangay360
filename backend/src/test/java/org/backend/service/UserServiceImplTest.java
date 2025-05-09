package org.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.backend.model.User;
import org.backend.repository.UserRepository;
import org.backend.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;
    private final Long userId = 1L;
    private final String currentPassword = "currentPassword";
    private final String encodedCurrentPassword = "encodedCurrentPassword";
    private final String newPassword = "newPassword123!";
    private final String encodedNewPassword = "encodedNewPassword";

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(userId);
        testUser.setUsername("testuser");
        testUser.setPassword(encodedCurrentPassword);
    }

    @Test
    void changePassword_Success() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(currentPassword, encodedCurrentPassword)).thenReturn(true);
        when(passwordEncoder.encode(newPassword)).thenReturn(encodedNewPassword);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        boolean result = userService.changePassword(userId, currentPassword, newPassword);

        // Assert
        assertTrue(result);
        assertEquals(encodedNewPassword, testUser.getPassword());
        verify(userRepository).save(testUser);
    }

    @Test
    void changePassword_IncorrectCurrentPassword() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(currentPassword, encodedCurrentPassword)).thenReturn(false);

        // Act
        boolean result = userService.changePassword(userId, currentPassword, newPassword);

        // Assert
        assertFalse(result);
        assertEquals(encodedCurrentPassword, testUser.getPassword()); // Password should not change
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changePassword_UserNotFound() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () -> {
            userService.changePassword(userId, currentPassword, newPassword);
        });
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(userRepository, never()).save(any(User.class));
    }
} 