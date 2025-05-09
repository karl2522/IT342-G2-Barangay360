package org.backend.service;

import java.util.List;

import org.backend.model.User;

public interface UserService {
    List<User> getAllUsers();
    User getUserById(Long id);
    User createUser(User user);
    User updateUser(User user);
    void deleteUser(Long id);
    List<User> getUsersByRoleId(int roleId);
    void activateUser(Long userId);
    boolean changePassword(Long userId, String currentPassword, String newPassword);
    void resetPassword(Long userId, String newPassword);
} 