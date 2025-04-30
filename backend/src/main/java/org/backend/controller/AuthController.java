package org.backend.controller;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.backend.exception.TokenRefreshException;
import org.backend.model.ERole;
import org.backend.model.QRLoginSession;
import org.backend.model.Role;
import org.backend.model.User;
import org.backend.payload.request.LoginRequest;
import org.backend.payload.request.LogoutRequest;
import org.backend.payload.request.SignupRequest;
import org.backend.payload.request.TokenRefreshRequest;
import org.backend.payload.response.JwtResponse;
import org.backend.payload.response.MessageResponse;
import org.backend.payload.response.TokenDTO;
import org.backend.payload.response.TokenRefreshResponse;
import org.backend.repository.RoleRepository;
import org.backend.repository.UserRepository;
import org.backend.security.jwt.JwtUtils;
import org.backend.security.services.UserDetailsImpl;
import org.backend.service.QRLoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:8080"}, maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication API endpoints for login, signup, and token management")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    private QRLoginService qrLoginService;

    @Operation(summary = "Authenticate user", description = "Login with username and password to get JWT tokens")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Authentication successful", 
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = JwtResponse.class))),
        @ApiResponse(responseCode = "401", description = "Invalid username or password")
    })
    @PostMapping("/signin")
    public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Proceed with generating tokens 
        TokenDTO accessToken = jwtUtils.generateJwtToken(authentication);
        TokenDTO refreshToken = jwtUtils.generateRefreshToken(authentication);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        // No need to fetch User again, details are in UserDetailsImpl
        return ResponseEntity.ok(new JwtResponse(
                accessToken,
                refreshToken,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles,
                userDetails.getFirstName(), // Get from userDetails
                userDetails.getLastName(),  // Get from userDetails
                userDetails.getPhone(),     // Get from userDetails
                userDetails.getAddress(),   // Get from userDetails
                userDetails.isActive(),      // Pass isActive status
                null // profileImage is not available
        ));
    }

    @Operation(summary = "Register new user", description = "Create a new user account")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User registered successfully", 
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = MessageResponse.class))),
        @ApiResponse(responseCode = "400", description = "Username or email already in use")
    })
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setFirstName(signUpRequest.getFirstName());
        user.setLastName(signUpRequest.getLastName());
        user.setAddress(signUpRequest.getAddress());
        user.setPhone(signUpRequest.getPhone());

        Set<String> strRoles = signUpRequest.getRoles();
        Set<Role> roles = new HashSet<>();

        if (strRoles == null) {
            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
            roles.add(userRole);
        } else {
            strRoles.forEach(role -> {
                switch (role) {
                    case "admin":
                        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(adminRole);
                        break;
                    case "official":
                        Role modRole = roleRepository.findByName(ERole.ROLE_OFFICIAL)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(modRole);
                        break;
                    default:
                        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(userRole);
                }
            });
        }

        user.setRoles(roles);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @Operation(summary = "Refresh JWT token", description = "Use refresh token to get a new access token")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Token refreshed successfully", 
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TokenRefreshResponse.class))),
        @ApiResponse(responseCode = "401", description = "Invalid refresh token")
    })
    @PostMapping("/refreshtoken")
    public ResponseEntity<TokenRefreshResponse> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        if (jwtUtils.validateRefreshToken(requestRefreshToken)) {
            String username = jwtUtils.getUserNameFromJwtToken(requestRefreshToken);
            TokenDTO newAccessToken = jwtUtils.generateTokenFromUsername(username);
            TokenDTO newRefreshToken = jwtUtils.generateRefreshToken(
                new UsernamePasswordAuthenticationToken(username, null)
            );
            return ResponseEntity.ok(new TokenRefreshResponse(
                newAccessToken,
                newRefreshToken,
                "Token refreshed successfully"
            ));
        }

        throw new TokenRefreshException(requestRefreshToken, "Invalid refresh token!");
    }
    
    @Operation(summary = "Sign out user", description = "Log out the current user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Logout successful", 
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = MessageResponse.class)))
    })
    @PostMapping("/signout")
    public ResponseEntity<?> logoutUser(@Valid @RequestBody LogoutRequest logoutRequest) {
        return ResponseEntity.ok(new MessageResponse("Log out successful!"));
    }

    @Operation(summary = "Create QR login session", description = "Generate a new QR code login session")
    @PostMapping("/qr/create")
    public ResponseEntity<?> createQRLoginSession() {
        QRLoginSession session = qrLoginService.createLoginSession();
        return ResponseEntity.ok(Map.of(
            "sessionId", session.getSessionId(),
            "expiresAt", session.getExpiresAt()
        ));
    }

    @Operation(summary = "Confirm QR login", description = "Complete QR code login from mobile app")
    @PostMapping("/qr/confirm")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> confirmQRLogin(
            @RequestParam String sessionId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            qrLoginService.confirmLogin(sessionId, user);
            
            // Generate tokens
            TokenDTO accessToken = jwtUtils.generateTokenFromUsername(user.getUsername());
            TokenDTO refreshToken = jwtUtils.generateRefreshToken(
                new UsernamePasswordAuthenticationToken(user.getUsername(), null)
            );
            
            List<String> roles = user.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(new JwtResponse(
                    accessToken,
                    refreshToken,
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    roles,
                    user.getFirstName(),
                    user.getLastName(),
                    user.getPhone(),
                    user.getAddress(),
                    user.isActive(),
                    null
            ));
        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @Operation(summary = "Check QR login status", description = "Check if QR code has been scanned and confirmed")
    @GetMapping("/qr/status/{sessionId}")
    public ResponseEntity<?> checkQRLoginStatus(@PathVariable String sessionId) {
        try {
            QRLoginSession session = qrLoginService.getSession(sessionId);
            
            if (session.isUsed() && session.getUser() != null) {
                User user = session.getUser();
                List<String> roles = user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toList());
                
                TokenDTO accessToken = jwtUtils.generateTokenFromUsername(user.getUsername());
                TokenDTO refreshToken = jwtUtils.generateRefreshToken(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), null)
                );

                return ResponseEntity.ok(new JwtResponse(
                    accessToken,
                    refreshToken,
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    roles,
                    user.getFirstName(),
                    user.getLastName(),
                    user.getPhone(),
                    user.getAddress(),
                    user.isActive(),
                    null
                ));
            }
            
            if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
                return ResponseEntity.ok(Map.of(
                    "status", "expired",
                    "message", "QR code has expired"
                ));
            }
            
            return ResponseEntity.ok(Map.of(
                "status", "pending",
                "message", "Waiting for mobile app scan"
            ));
        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
}

