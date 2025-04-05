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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true", allowedHeaders = "*")
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

    @PostMapping("/{userId}/appeal")
    public ResponseEntity<?> submitAppeal(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        try {
            String message = request.get("message");
            userService.submitAppeal(userId, message);
            return ResponseEntity.ok(new MessageResponse("Appeal submitted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error submitting appeal: " + e.getMessage()));
        }
    }

    @GetMapping("/appeals")
    public ResponseEntity<?> getAppeals() {
        try {
            List<User> appeals = userService.getAppeals();
            return ResponseEntity.ok(appeals);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error fetching appeals: " + e.getMessage()));
        }
    }

    @PostMapping("/{userId}/appeal/approve")
    public ResponseEntity<?> approveAppeal(@PathVariable Long userId) {
        try {
            userService.approveAppeal(userId);
            return ResponseEntity.ok(new MessageResponse("Appeal approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error approving appeal: " + e.getMessage()));
        }
    }

    @PostMapping("/{userId}/appeal/reject")
    public ResponseEntity<?> rejectAppeal(@PathVariable Long userId) {
        try {
            userService.rejectAppeal(userId);
            return ResponseEntity.ok(new MessageResponse("Appeal rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error rejecting appeal: " + e.getMessage()));
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
} 