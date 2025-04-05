package org.backend.service;

import org.backend.model.User;
import java.util.List;

public interface UserService {
    List<User> getAllUsers();
    User getUserById(Long id);
    User createUser(User user);
    User updateUser(User user);
    void deleteUser(Long id);
    List<User> getUsersByRoleId(int roleId);
    void activateUser(Long userId);
    void submitAppeal(Long userId, String message);
    List<User> getAppeals();
    void approveAppeal(Long userId);
    void rejectAppeal(Long userId);
} 