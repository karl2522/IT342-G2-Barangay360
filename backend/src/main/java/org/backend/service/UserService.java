package org.backend.service;

import org.backend.model.User;
import java.util.List;

public interface UserService {
    User getUserById(Long id);
    User getUserByUsername(String username);
    List<User> getAllUsers();
    User updateUser(User user);
} 