package org.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.backend.payload.request.ServiceRequestRequest;
import org.backend.payload.response.ServiceRequestResponse;
import org.backend.service.ServiceRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.backend.model.User;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

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
        return ResponseEntity.ok(serviceRequestService.createServiceRequest(request));
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
        return ResponseEntity.ok(serviceRequestService.updateServiceRequestStatus(id, status));
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

    @Operation(summary = "Generate document for service request", description = "Generate a document for an approved service request")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Document generated successfully"),
        @ApiResponse(responseCode = "401", description = "Not authorized to generate documents"),
        @ApiResponse(responseCode = "404", description = "Service request not found"),
        @ApiResponse(responseCode = "400", description = "No documents attached to request")
    })
    @GetMapping("/{id}/download-document")
    @PreAuthorize("hasAnyRole('OFFICIAL', 'USER')")
    public ResponseEntity<Resource> downloadDocument(
            @Parameter(description = "Service request ID", required = true)
            @PathVariable Long id) {
        try {
            Resource resource = serviceRequestService.getGeneratedDocument(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Mark document as delivered", description = "Mark a generated document as delivered to the resident")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Document marked as delivered"),
        @ApiResponse(responseCode = "401", description = "Not authorized to mark as delivered"),
        @ApiResponse(responseCode = "404", description = "Service request not found")
    })
    @PostMapping("/{id}/mark-delivered")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<ServiceRequestResponse> markDocumentAsDelivered(
            @Parameter(description = "Service request ID", required = true)
            @PathVariable Long id) {
        return ResponseEntity.ok(serviceRequestService.markDocumentAsDelivered(id));
    }

    @Operation(summary = "Create service request from QR code", description = "Create a service request from QR code scan")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Service request created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ServiceRequestResponse.class))),
        @ApiResponse(responseCode = "401", description = "Not authorized to create service requests"),
        @ApiResponse(responseCode = "400", description = "Invalid service request data")
    })
    @PostMapping("/qr-scan")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createServiceRequestFromQR(
            @RequestBody Map<String, Object> qrData) {
        try {
            String serviceType = (String) qrData.get("type");
            String mode = (String) qrData.get("mode");
            Long userId = Long.parseLong(qrData.get("userId").toString());

            if ("auto".equals(mode)) {
                // For auto mode, create request with default values
                ServiceRequestRequest request = new ServiceRequestRequest();
                request.setUserId(userId);
                request.setServiceType(serviceType);
                request.setMode("auto");

                // Set default values based on service type
                switch (serviceType.toLowerCase()) {
                    case "barangay_certificate":
                        request.setDetails("Barangay Certificate Request");
                        request.setPurpose("General Purpose");
                        break;
                    case "certificate_of_residency":
                        request.setDetails("Certificate of Residency Request");
                        request.setPurpose("Proof of Residency");
                        break;
                    // Add more auto service types as needed
                    default:
                        return ResponseEntity.badRequest().body("Unsupported service type for auto mode");
                }

                return ResponseEntity.ok(serviceRequestService.createServiceRequest(request));
            } else {
                // For form mode, return the necessary form fields
                Map<String, Object> formData = new HashMap<>();
                formData.put("serviceType", serviceType);
                formData.put("userId", userId);
                formData.put("requiresForm", true);
                return ResponseEntity.ok(formData);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid QR code data");
        }
    }

    @Operation(summary = "Attach a document to a service request", description = "Attach a document to a pending service request")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Document attached successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ServiceRequestResponse.class))),
        @ApiResponse(responseCode = "400", description = "Request cannot have documents attached"),
        @ApiResponse(responseCode = "401", description = "Not authorized to attach documents"),
        @ApiResponse(responseCode = "404", description = "Service request not found")
    })
    @PostMapping("/{id}/attach-document")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<ServiceRequestResponse> attachDocumentToRequest(
            @Parameter(description = "Service request ID", required = true)
            @PathVariable Long id,
            @Parameter(description = "Document file to attach", required = true)
            @RequestParam("document") org.springframework.web.multipart.MultipartFile file,
            @AuthenticationPrincipal User official) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(null);
            }
            return ResponseEntity.ok(serviceRequestService.attachDocumentToRequest(id, official, file));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @Operation(summary = "Cancel a service request", description = "Cancel a pending service request")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Service request cancelled successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ServiceRequestResponse.class))),
        @ApiResponse(responseCode = "400", description = "Request cannot be cancelled"),
        @ApiResponse(responseCode = "401", description = "Not authorized to cancel this request"),
        @ApiResponse(responseCode = "404", description = "Service request not found")
    })
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ServiceRequestResponse> cancelServiceRequest(
            @Parameter(description = "Service request ID", required = true)
            @PathVariable Long id) {
        try {
            return ResponseEntity.ok(serviceRequestService.cancelServiceRequest(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @Operation(summary = "Generate document for service request", description = "Generate a document for an approved service request")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Document generated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ServiceRequestResponse.class))),
        @ApiResponse(responseCode = "400", description = "Request cannot have document generated"),
        @ApiResponse(responseCode = "401", description = "Not authorized to generate documents"),
        @ApiResponse(responseCode = "404", description = "Service request not found")
    })
    @PostMapping("/{id}/generate-document")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<ServiceRequestResponse> generateDocument(
            @Parameter(description = "Service request ID", required = true)
            @PathVariable Long id,
            @AuthenticationPrincipal User official) {
        try {
            return ResponseEntity.ok(serviceRequestService.generateDocument(id, official));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
