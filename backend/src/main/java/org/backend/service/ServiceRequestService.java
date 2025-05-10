package org.backend.service;

import org.backend.model.ServiceRequest;
import org.backend.model.User;
import org.backend.payload.request.ServiceRequestRequest;
import org.backend.payload.response.ServiceRequestResponse;
import org.backend.repository.ServiceRequestRepository;
import org.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServiceRequestService {

    private static final Logger logger = LoggerFactory.getLogger(ServiceRequestService.class);

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ServiceRequestResponse createServiceRequest(ServiceRequestRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        ServiceRequest serviceRequest = new ServiceRequest();
        serviceRequest.setUser(user);
        serviceRequest.setServiceType(request.getServiceType());
        serviceRequest.setDetails(request.getDetails());
        serviceRequest.setPurpose(request.getPurpose());
        serviceRequest.setContactNumber(request.getContactNumber());
        serviceRequest.setAddress(request.getAddress());
        serviceRequest.setStatus("PENDING");

        ServiceRequest savedRequest = serviceRequestRepository.save(serviceRequest);

        ServiceRequestResponse response = new ServiceRequestResponse(
                savedRequest.getId(),
                savedRequest.getServiceType(),
                savedRequest.getStatus(),
                savedRequest.getDetails(),
                savedRequest.getPurpose(),
                savedRequest.getContactNumber(),
                savedRequest.getAddress(),
                savedRequest.getCreatedAt(),
                savedRequest.getUpdatedAt(),
                user.getFirstName() + " " + user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                savedRequest.getDocumentStatus(),
                savedRequest.getGeneratedDocumentPath(),
                savedRequest.getAttachedDocumentPath()
        );

        // Send real-time update to officials
        messagingTemplate.convertAndSend("/topic/service-requests", response);

        return response;
    }

    @Transactional
    public ServiceRequestResponse updateServiceRequestStatus(Long requestId, String status) {
        ServiceRequest request = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found"));

        request.setStatus(status);
        ServiceRequest updatedRequest = serviceRequestRepository.save(request);

        ServiceRequestResponse response = new ServiceRequestResponse(
                updatedRequest.getId(),
                updatedRequest.getServiceType(),
                updatedRequest.getStatus(),
                updatedRequest.getDetails(),
                updatedRequest.getPurpose(),
                updatedRequest.getContactNumber(),
                updatedRequest.getAddress(),
                updatedRequest.getCreatedAt(),
                updatedRequest.getUpdatedAt(),
                updatedRequest.getUser().getFirstName() + " " + updatedRequest.getUser().getLastName(),
                updatedRequest.getUser().getEmail(),
                updatedRequest.getUser().getPhone(),
                updatedRequest.getDocumentStatus(),
                updatedRequest.getGeneratedDocumentPath(),
                updatedRequest.getAttachedDocumentPath()
        );

        // Send real-time update
        messagingTemplate.convertAndSend("/topic/service-requests", response);

        return response;
    }

    public List<ServiceRequestResponse> getAllServiceRequests() {
        return serviceRequestRepository.findAll().stream()
                .map(request -> new ServiceRequestResponse(
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
                ))
                .collect(Collectors.toList());
    }

    public List<ServiceRequestResponse> getServiceRequestsByUserId(Long userId) {
        return serviceRequestRepository.findByUserId(userId).stream()
                .map(request -> new ServiceRequestResponse(
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
                ))
                .collect(Collectors.toList());
    }

    /**
     * Get the generated document for a service request
     */
    public Resource getGeneratedDocument(Long requestId) throws Exception {
        ServiceRequest request = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found"));

        if (request.getGeneratedDocumentPath() == null) {
            throw new RuntimeException("No document has been generated for this request");
        }

        Path path = Paths.get(request.getGeneratedDocumentPath());
        Resource resource = new UrlResource(path.toUri());

        if (resource.exists() && resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("Could not read document file");
        }
    }

    /**
     * Mark a document as delivered to the resident
     */
    @Transactional
    public ServiceRequestResponse markDocumentAsDelivered(Long requestId) {
        ServiceRequest request = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found"));

        request.markDocumentAsDelivered();
        ServiceRequest updatedRequest = serviceRequestRepository.save(request);

        ServiceRequestResponse response = new ServiceRequestResponse(
                updatedRequest.getId(),
                updatedRequest.getServiceType(),
                updatedRequest.getStatus(),
                updatedRequest.getDetails(),
                updatedRequest.getPurpose(),
                updatedRequest.getContactNumber(),
                updatedRequest.getAddress(),
                updatedRequest.getCreatedAt(),
                updatedRequest.getUpdatedAt(),
                updatedRequest.getUser().getFirstName() + " " + updatedRequest.getUser().getLastName(),
                updatedRequest.getUser().getEmail(),
                updatedRequest.getUser().getPhone(),
                updatedRequest.getDocumentStatus(),
                updatedRequest.getGeneratedDocumentPath(),
                updatedRequest.getAttachedDocumentPath()
        );

        // Send real-time update
        messagingTemplate.convertAndSend("/topic/service-requests", response);

        return response;
    }

    /**
     * Attach a document to a service request
     */
    @Transactional
    public ServiceRequestResponse attachDocumentToRequest(Long requestId, User official, org.springframework.web.multipart.MultipartFile file) {
        ServiceRequest request = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found"));

        // Only allow attachment if the request is in PENDING status
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Only pending requests can have documents attached");
        }

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("No document file provided");
        }

        // Validate file type (Allow common document types)
        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();
        
        if (originalFilename == null) {
            throw new RuntimeException("Invalid file name");
        }
        
        // Check for allowed file extensions
        String lowerCaseFilename = originalFilename.toLowerCase();
        boolean isAllowedFileType = lowerCaseFilename.endsWith(".pdf") || 
                                   lowerCaseFilename.endsWith(".png") || 
                                   lowerCaseFilename.endsWith(".jpg") || 
                                   lowerCaseFilename.endsWith(".jpeg") || 
                                   lowerCaseFilename.endsWith(".docx") || 
                                   lowerCaseFilename.endsWith(".xlsx");
        
        if (!isAllowedFileType) {
            throw new RuntimeException("Only PDF, PNG, JPG, JPEG, DOCX, and XLSX files are allowed");
        }

        // Validate file size (maximum 10MB)
        long maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.getSize() > maxFileSize) {
            throw new RuntimeException("File size exceeds the maximum limit of 10MB");
        }

        try {
            // Create a directory for attached documents if it doesn't exist
            java.nio.file.Path attachedDocsDir = java.nio.file.Paths.get(System.getProperty("user.dir"), "documents", "attached");
            if (!java.nio.file.Files.exists(attachedDocsDir)) {
                java.nio.file.Files.createDirectories(attachedDocsDir);
            }

            // Generate a unique filename
            String fileExtension = originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : "";
            String filename = "attached_" + requestId + "_" + System.currentTimeMillis() + fileExtension;

            // Save the file
            java.nio.file.Path filePath = attachedDocsDir.resolve(filename);
            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            // Update the service request with the document path (store absolute path for better reliability)
            String documentPath = filePath.toAbsolutePath().toString();
            logger.info("Storing document with absolute path: {}", documentPath);
            request.markDocumentAsAttached(official, documentPath);
            ServiceRequest updatedRequest = serviceRequestRepository.save(request);

            ServiceRequestResponse response = new ServiceRequestResponse(
                    updatedRequest.getId(),
                    updatedRequest.getServiceType(),
                    updatedRequest.getStatus(),
                    updatedRequest.getDetails(),
                    updatedRequest.getPurpose(),
                    updatedRequest.getContactNumber(),
                    updatedRequest.getAddress(),
                    updatedRequest.getCreatedAt(),
                    updatedRequest.getUpdatedAt(),
                    updatedRequest.getUser().getFirstName() + " " + updatedRequest.getUser().getLastName(),
                    updatedRequest.getUser().getEmail(),
                    updatedRequest.getUser().getPhone(),
                    updatedRequest.getDocumentStatus(),
                    updatedRequest.getGeneratedDocumentPath(),
                    updatedRequest.getAttachedDocumentPath()
            );

            // Send real-time update
            messagingTemplate.convertAndSend("/topic/service-requests", response);

            return response;
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to store document file: " + e.getMessage(), e);
        }
    }

    /**
     * Cancel a service request
     */
    @Transactional
    public ServiceRequestResponse cancelServiceRequest(Long requestId) {
        ServiceRequest request = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found"));

        // Only allow cancellation if the request is in PENDING status
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Only pending requests can be cancelled");
        }

        request.setStatus("CANCELLED");
        ServiceRequest updatedRequest = serviceRequestRepository.save(request);

        ServiceRequestResponse response = new ServiceRequestResponse(
                updatedRequest.getId(),
                updatedRequest.getServiceType(),
                updatedRequest.getStatus(),
                updatedRequest.getDetails(),
                updatedRequest.getPurpose(),
                updatedRequest.getContactNumber(),
                updatedRequest.getAddress(),
                updatedRequest.getCreatedAt(),
                updatedRequest.getUpdatedAt(),
                updatedRequest.getUser().getFirstName() + " " + updatedRequest.getUser().getLastName(),
                updatedRequest.getUser().getEmail(),
                updatedRequest.getUser().getPhone(),
                updatedRequest.getDocumentStatus(),
                updatedRequest.getGeneratedDocumentPath(),
                updatedRequest.getAttachedDocumentPath()
        );

        // Send real-time update
        messagingTemplate.convertAndSend("/topic/service-requests", response);

        return response;
    }

    /**
     * Generate a document for a service request
     */
    @Transactional
    public ServiceRequestResponse generateDocument(Long requestId, User official) {
        ServiceRequest request = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found"));

        // Check if document is attached
        if (request.getAttachedDocumentPath() == null) {
            throw new RuntimeException("No document has been attached to this request");
        }

        // Mark the document as generated
        request.markDocumentAsGenerated(request.getAttachedDocumentPath(), official);
        ServiceRequest updatedRequest = serviceRequestRepository.save(request);

        ServiceRequestResponse response = new ServiceRequestResponse(
                updatedRequest.getId(),
                updatedRequest.getServiceType(),
                updatedRequest.getStatus(),
                updatedRequest.getDetails(),
                updatedRequest.getPurpose(),
                updatedRequest.getContactNumber(),
                updatedRequest.getAddress(),
                updatedRequest.getCreatedAt(),
                updatedRequest.getUpdatedAt(),
                updatedRequest.getUser().getFirstName() + " " + updatedRequest.getUser().getLastName(),
                updatedRequest.getUser().getEmail(),
                updatedRequest.getUser().getPhone(),
                updatedRequest.getDocumentStatus(),
                updatedRequest.getGeneratedDocumentPath(),
                updatedRequest.getAttachedDocumentPath()
        );

        // Send real-time update
        messagingTemplate.convertAndSend("/topic/service-requests", response);

        return response;
    }

    /**
     * Get the attached document for a service request
     */
    public Resource getAttachedDocument(Long requestId) throws Exception {
        ServiceRequest request = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found"));

        if (request.getAttachedDocumentPath() == null) {
            throw new RuntimeException("No document has been attached to this request");
        }
        
        try {
            // Get the document path from the database
            String attachedDocumentPath = request.getAttachedDocumentPath();
            Path path;
            
            // Try to handle both absolute and relative paths
            if (attachedDocumentPath.startsWith("/") || attachedDocumentPath.contains(":")) {
                // This is already an absolute path
                path = Paths.get(attachedDocumentPath);
            } else {
                // This is a relative path, resolve it against the application's base directory
                path = Paths.get(System.getProperty("user.dir"), attachedDocumentPath);
            }
            
            // Log what path we're trying to access
            logger.info("Trying to access document at: {}", path.toAbsolutePath().toString());
            
            // Check if the file exists
            if (!java.nio.file.Files.exists(path)) {
                logger.error("Document file not found at path: {}", path.toAbsolutePath().toString());
                throw new RuntimeException("Document file not found");
            }
            
            Resource resource = new UrlResource(path.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                logger.error("Document exists but is not readable: {}", path.toAbsolutePath().toString());
                throw new RuntimeException("Could not read attached document file");
            }
        } catch (Exception e) {
            logger.error("Error accessing attached document: {}", e.getMessage());
            throw e;
        }
    }
}
