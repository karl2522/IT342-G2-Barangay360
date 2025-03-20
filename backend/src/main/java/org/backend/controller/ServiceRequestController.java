package org.backend.controller;

import org.backend.payload.request.ServiceRequestRequest;
import org.backend.payload.response.ServiceRequestResponse;
import org.backend.service.ServiceRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-requests")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class ServiceRequestController {

    @Autowired
    private ServiceRequestService serviceRequestService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ServiceRequestResponse> createServiceRequest(@RequestBody ServiceRequestRequest request) {
        return ResponseEntity.ok(serviceRequestService.createServiceRequest(request));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<ServiceRequestResponse> updateServiceRequestStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(serviceRequestService.updateServiceRequestStatus(id, status));
    }

    @GetMapping
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<List<ServiceRequestResponse>> getAllServiceRequests() {
        return ResponseEntity.ok(serviceRequestService.getAllServiceRequests());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ServiceRequestResponse>> getServiceRequestsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(serviceRequestService.getServiceRequestsByUserId(userId));
    }
} 