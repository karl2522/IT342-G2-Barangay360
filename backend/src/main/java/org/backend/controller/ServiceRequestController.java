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
import org.springframework.http.HttpStatus;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.backend.model.ServiceRequest;
import org.backend.repository.ServiceRequestRepository;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/service-requests")
@CrossOrigin(origins = {"https://barangay360.vercel.app","http://localhost:5173", "http://localhost:5174"})
@Tag(name = "Service Requests", description = "API for managing barangay service requests")
public class ServiceRequestController {

    private static final Logger logger = LoggerFactory.getLogger(ServiceRequestController.class);

    @Autowired
    private ServiceRequestService serviceRequestService;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

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

    @Operation(summary = "View the attached document for a service request", description = "View the document attached to a service request")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Document retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Not authorized to view this document"),
        @ApiResponse(responseCode = "404", description = "Service request or document not found"),
        @ApiResponse(responseCode = "400", description = "No document attached to request")
    })
    @GetMapping("/{id}/view-attached-document")
    // We now allow this endpoint to be accessed without explicit authentication
    // Authorization is handled in the filter based on the token parameter
    public ResponseEntity<Resource> viewAttachedDocument(
            @Parameter(description = "Service request ID", required = true)
            @PathVariable Long id) {
        try {
            // Log the request
            logger.info("Document view request for service request ID: {}", id);
            
            Resource resource = serviceRequestService.getAttachedDocument(id);
            String filename = resource.getFilename();
            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            
            // Determine content type based on file extension
            if (filename != null) {
                String lowercaseFilename = filename.toLowerCase();
                if (lowercaseFilename.endsWith(".pdf")) {
                    mediaType = MediaType.APPLICATION_PDF;
                } else if (lowercaseFilename.endsWith(".png")) {
                    mediaType = MediaType.IMAGE_PNG;
                } else if (lowercaseFilename.endsWith(".jpg") || lowercaseFilename.endsWith(".jpeg")) {
                    mediaType = MediaType.IMAGE_JPEG;
                } else if (lowercaseFilename.endsWith(".docx")) {
                    mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
                } else if (lowercaseFilename.endsWith(".xlsx")) {
                    mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                }
            }
            
            logger.info("Successfully retrieved document for ID: {}, filename: {}, mediaType: {}", 
                    id, filename, mediaType);
            
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + (filename != null ? filename : "document") + "\"")
                    .body(resource);
        } catch (Exception e) {
            logger.error("Error retrieving attached document for ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @Operation(summary = "Get service request by ID", description = "Retrieve a specific service request by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Service request found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ServiceRequestResponse.class))),
        @ApiResponse(responseCode = "404", description = "Service request not found"),
        @ApiResponse(responseCode = "401", description = "Not authorized to view this service request")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OFFICIAL', 'USER')")
    public ResponseEntity<ServiceRequestResponse> getServiceRequestById(
            @Parameter(description = "Service request ID", required = true)
            @PathVariable Long id) {
        try {
            ServiceRequest request = serviceRequestRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Service request not found"));
            
            ServiceRequestResponse response = new ServiceRequestResponse(
                    request.getId(),
                    request.getServiceType(),
                    request.getStatus(),
                    request.getDetails(),
                    request.getPurpose(),
                    request.getContactNumber(),
                    request.getAddress(),
                    request.getCreatedAt(),
                    request.getUpdatedAt(),
                    request.getUser().getFirstName() + " " + request.getUser().getLastName(),
                    request.getUser().getEmail(),
                    request.getUser().getPhone(),
                    request.getDocumentStatus(),
                    request.getGeneratedDocumentPath(),
                    request.getAttachedDocumentPath()
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting service request by ID {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Get document path information", description = "Get diagnostic information about document paths for a service request")
    @GetMapping("/{id}/document-info")
    @PreAuthorize("hasAnyRole('OFFICIAL', 'USER')")
    public ResponseEntity<?> getDocumentPathInfo(@PathVariable Long id) {
        try {
            ServiceRequest request = serviceRequestRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Service request not found"));
            
            java.util.Map<String, Object> info = new java.util.HashMap<>();
            info.put("requestId", id);
            info.put("attachedDocumentPath", request.getAttachedDocumentPath());
            info.put("generatedDocumentPath", request.getGeneratedDocumentPath());
            info.put("documentStatus", request.getDocumentStatus());
            
            // Check if the attached document file exists
            if (request.getAttachedDocumentPath() != null) {
                java.nio.file.Path attachedPath = java.nio.file.Paths.get(request.getAttachedDocumentPath());
                info.put("attachedDocumentExists", java.nio.file.Files.exists(attachedPath));
                info.put("attachedDocumentAbsolutePath", attachedPath.toAbsolutePath().toString());
                
                // Extract the filename to create alternative paths
                String filename = attachedPath.getFileName().toString();
                info.put("filename", filename);
                
                // Check alternative paths
                java.nio.file.Path altPath1 = java.nio.file.Paths.get(System.getProperty("user.dir"), "documents", "attached", filename);
                info.put("alternativePath1", altPath1.toString());
                info.put("alternativePath1Exists", java.nio.file.Files.exists(altPath1));
                
                java.nio.file.Path altPath2 = java.nio.file.Paths.get("documents", "attached", filename);
                info.put("alternativePath2", altPath2.toString());
                info.put("alternativePath2Exists", java.nio.file.Files.exists(altPath2));
            }
            
            // List all files in the attached documents directory
            java.nio.file.Path attachedDir = java.nio.file.Paths.get(System.getProperty("user.dir"), "documents", "attached");
            if (java.nio.file.Files.exists(attachedDir)) {
                java.util.List<String> files = java.nio.file.Files.list(attachedDir)
                        .map(p -> p.getFileName().toString())
                        .collect(java.util.stream.Collectors.toList());
                info.put("availableFiles", files);
            }
            
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            logger.error("Error getting document path info: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Collections.singletonMap("error", e.getMessage()));
        }
    }
}
