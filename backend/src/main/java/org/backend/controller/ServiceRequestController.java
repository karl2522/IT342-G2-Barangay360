package org.backend.controller;

import java.util.List;

import org.backend.payload.request.ServiceRequestRequest;
import org.backend.payload.response.ServiceRequestResponse;
import org.backend.service.ServiceRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/service-requests")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@Tag(name = "Service Requests", description = "API for managing barangay service requests")
public class ServiceRequestController {

    @Autowired
    private ServiceRequestService serviceRequestService;

    @Operation(summary = "Create a service request", description = "Create a new service request for a barangay service")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Service request created successfully", 
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ServiceRequestResponse.class))),
        @ApiResponse(responseCode = "401", description = "Not authorized to create service requests"),
        @ApiResponse(responseCode = "400", description = "Invalid service request data")
    })
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ServiceRequestResponse> createServiceRequest(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Service request details", required = true)
        @RequestBody ServiceRequestRequest request) {
        try {
            return ResponseEntity.ok(serviceRequestService.createServiceRequest(request));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null); // TODO: Create a proper error response
        }
    }

    @Operation(summary = "Update service request status", description = "Update the status of an existing service request")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status updated successfully", 
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ServiceRequestResponse.class))),
        @ApiResponse(responseCode = "401", description = "Not authorized to update status"),
        @ApiResponse(responseCode = "404", description = "Service request not found")
    })
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<ServiceRequestResponse> updateServiceRequestStatus(
            @Parameter(description = "Service request ID", required = true)
            @PathVariable Long id,
            @Parameter(description = "New status value", required = true)
            @RequestParam String status) {
        try {
            return ResponseEntity.ok(serviceRequestService.updateServiceRequestStatus(id, status));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null); // TODO: Create a proper error response
        }
    }

    @Operation(summary = "Get all service requests", description = "Retrieve all service requests (for officials)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "List of all service requests", 
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ServiceRequestResponse.class))),
        @ApiResponse(responseCode = "401", description = "Not authorized to view all service requests")
    })
    @GetMapping
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<List<ServiceRequestResponse>> getAllServiceRequests() {
        return ResponseEntity.ok(serviceRequestService.getAllServiceRequests());
    }

    @Operation(summary = "Get user's service requests", description = "Retrieve all service requests for a specific user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "List of user's service requests", 
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ServiceRequestResponse.class))),
        @ApiResponse(responseCode = "401", description = "Not authorized to view these service requests"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ServiceRequestResponse>> getServiceRequestsByUserId(
            @Parameter(description = "User ID", required = true)
            @PathVariable Long userId) {
        return ResponseEntity.ok(serviceRequestService.getServiceRequestsByUserId(userId));
    }
}
