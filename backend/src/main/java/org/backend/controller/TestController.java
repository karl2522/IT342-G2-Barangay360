package org.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, maxAge = 3600)
@RestController
@RequestMapping("/api/test")
@Tag(name = "Test", description = "Test endpoints for different access levels")
public class TestController {

    @Operation(summary = "Get public content", description = "Endpoint accessible by all users without authentication")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successful operation",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = String.class)))
    })
    @GetMapping("/all")
    public ResponseEntity<Map<String, String>> allAccess() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Public Content.");
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get user content", description = "Endpoint accessible by authenticated users with USER, OFFICIAL or ADMIN role")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successful operation",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = String.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden, insufficient privileges")
    })
    @GetMapping("/user")
    @PreAuthorize("hasRole('USER') or hasRole('OFFICIAL') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> userAccess() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "User Content.");
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get official content", description = "Endpoint accessible by authenticated users with OFFICIAL role")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successful operation",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = String.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden, insufficient privileges")
    })
    @GetMapping("/official")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<Map<String, String>> moderatorAccess() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Barangay Official Board.");
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get admin content", description = "Endpoint accessible by authenticated users with ADMIN role")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successful operation",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = String.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden, insufficient privileges")
    })
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> adminAccess() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Admin Board.");
        return ResponseEntity.ok(response);
    }
}
