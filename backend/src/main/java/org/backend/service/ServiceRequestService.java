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

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServiceRequestService {

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
                user.getPhone()
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
                updatedRequest.getUser().getPhone()
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
                        request.getUser().getPhone()
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
                        request.getUser().getPhone()
                ))
                .collect(Collectors.toList());
    }
} 