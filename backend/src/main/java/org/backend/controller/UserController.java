package org.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.backend.model.User;
import org.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.backend.payload.response.MessageResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.backend.security.services.UserDetailsImpl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

//@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:8080"}, maxAge = 3600)
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "User management APIs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    @Autowired
    private UserService userService;

    @Operation(summary = "Get all users", description = "Retrieve a list of all users (Officials only)")
    @GetMapping
    @PreAuthorize("hasRole('ROLE_OFFICIAL')")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
    
    @Operation(summary = "Get all residents", description = "Retrieve a list of all residents (Officials only)")
    @GetMapping("/residents")
    @PreAuthorize("hasRole('ROLE_OFFICIAL')")
    public ResponseEntity<List<User>> getAllResidents() {
        List<User> residents = userService.getUsersByRoleId(1); // role_id 1 for ROLE_USER
        return ResponseEntity.ok(residents);
    }
    
    @Operation(summary = "Get all officials", description = "Retrieve a list of all officials (Officials only)")
    @GetMapping("/officials")
    @PreAuthorize("hasRole('ROLE_OFFICIAL')")
    public ResponseEntity<List<User>> getAllOfficials() {
        List<User> officials = userService.getUsersByRoleId(2); // role_id 2 for ROLE_OFFICIAL
        return ResponseEntity.ok(officials);
    }

    @PostMapping("/{userId}/warn")
    @PreAuthorize("hasRole('OFFICIAL') or hasRole('ADMIN')")
    public ResponseEntity<?> warnUser(@PathVariable Long userId, @RequestBody String reason) {
        try {
            User user = userService.getUserById(userId);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            user.setWarnings(user.getWarnings() + 1);
            user.setLastWarningDate(LocalDateTime.now());
            
            // If user has 3 or more warnings, deactivate their account
            if (user.getWarnings() >= 3) {
                user.setActive(false);
            }
            
            userService.updateUser(user);
            
            return ResponseEntity.ok(new MessageResponse("User warned successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{userId}/deactivate")
    @PreAuthorize("hasRole('OFFICIAL') or hasRole('ADMIN')")
    public ResponseEntity<?> deactivateUser(@PathVariable Long userId) {
        try {
            User user = userService.getUserById(userId);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            user.setActive(false);
            userService.updateUser(user);
            
            return ResponseEntity.ok(new MessageResponse("User account deactivated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{userId}/activate")
    @PreAuthorize("hasRole('OFFICIAL') or hasRole('ADMIN')")
    public ResponseEntity<?> activateUser(@PathVariable Long userId) {
        try {
            userService.activateUser(userId);
            return ResponseEntity.ok(new MessageResponse("User activated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error activating user: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            userService.deleteUser(userId);
            return ResponseEntity.ok(new MessageResponse("User account deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('USER') or hasRole('OFFICIAL') or hasRole('ADMIN')")
    @Operation(summary = "Update user profile", description = "Update user profile information")
    public ResponseEntity<?> updateUserProfile(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> updateData,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        try {
            // Check if user is updating their own profile or is an admin
            if (!userDetails.getId().equals(userId) && !userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                return ResponseEntity.status(403).body(new MessageResponse("You can only update your own profile"));
            }
            
            User user = userService.getUserById(userId);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Update fields if provided
            if (updateData.containsKey("firstName")) {
                user.setFirstName((String) updateData.get("firstName"));
            }
            
            if (updateData.containsKey("lastName")) {
                user.setLastName((String) updateData.get("lastName"));
            }
            
            if (updateData.containsKey("phone")) {
                user.setPhone((String) updateData.get("phone"));
            }
            
            if (updateData.containsKey("address")) {
                user.setAddress((String) updateData.get("address"));
            }
            
            // Bio can be set for all users
            if (updateData.containsKey("bio")) {
                user.setBio((String) updateData.get("bio"));
            }
            
            // Position and department are for officials only
            boolean isOfficial = user.getRoles().stream()
                    .anyMatch(role -> role.getName().name().equals("ROLE_OFFICIAL"));
                    
            if (isOfficial) {
                // Additional profile fields for officials only
                if (updateData.containsKey("position")) {
                    user.setPosition((String) updateData.get("position"));
                }
                
                if (updateData.containsKey("department")) {
                    user.setDepartment((String) updateData.get("department"));
                }
            }
            
            User updatedUser = userService.updateUser(user);
            
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error updating profile: " + e.getMessage()));
        }
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('USER') or hasRole('OFFICIAL') or hasRole('ADMIN')")
    @Operation(summary = "Get user profile", description = "Get user profile information")
    public ResponseEntity<?> getUserProfile(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        try {
            // Check if user is requesting their own profile or is an admin/official
            if (!userDetails.getId().equals(userId) && !userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_OFFICIAL"))) {
                return ResponseEntity.status(403).body(new MessageResponse("You can only view your own profile"));
            }

            User user = userService.getUserById(userId);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error retrieving profile: " + e.getMessage()));
        }
    }
} 