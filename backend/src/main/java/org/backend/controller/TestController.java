package org.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:8080"}, maxAge = 3600)
@RestController
@RequestMapping("/api/test")
@Tag(name = "Test", description = "Test endpoints for different access levels")
public class TestController {
    
    @Operation(summary = "Get public content", description = "Endpoint accessible by all users without authentication")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successful operation", 
                    content = @Content(mediaType = "text/plain", schema = @Schema(implementation = String.class)))
    })
    @GetMapping("/all")
    public String allAccess() {
        return "Public Content.";
    }

    @Operation(summary = "Get user content", description = "Endpoint accessible by authenticated users with USER, OFFICIAL or ADMIN role")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successful operation", 
                    content = @Content(mediaType = "text/plain", schema = @Schema(implementation = String.class))),
        @ApiResponse(responseCode = "403", description = "Forbidden, insufficient privileges")
    })
    @GetMapping("/user")
    @PreAuthorize("hasRole('USER') or hasRole('OFFICIAL') or hasRole('ADMIN')")
    public String userAccess() {
        return "User Content.";
    }

    @Operation(summary = "Get official content", description = "Endpoint accessible by authenticated users with OFFICIAL role")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successful operation", 
                    content = @Content(mediaType = "text/plain", schema = @Schema(implementation = String.class))),
        @ApiResponse(responseCode = "403", description = "Forbidden, insufficient privileges")
    })
    @GetMapping("/official")
    @PreAuthorize("hasRole('OFFICIAL')")
    public String moderatorAccess() {
        return "Barangay Official Board.";
    }

    @Operation(summary = "Get admin content", description = "Endpoint accessible by authenticated users with ADMIN role")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successful operation", 
                    content = @Content(mediaType = "text/plain", schema = @Schema(implementation = String.class))),
        @ApiResponse(responseCode = "403", description = "Forbidden, insufficient privileges")
    })
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminAccess() {
        return "Admin Board.";
    }
} 