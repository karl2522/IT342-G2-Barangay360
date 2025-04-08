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
} 