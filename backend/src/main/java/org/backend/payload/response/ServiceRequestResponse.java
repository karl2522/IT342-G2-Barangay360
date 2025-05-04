package org.backend.payload.response;

import java.time.LocalDateTime;

public class ServiceRequestResponse {
    private Long id;
    private String serviceType;
    private String status;
    private String details;
    private String purpose;
    private String contactNumber;
    private String address;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String residentName;
    private String residentEmail;
    private String residentPhone;
    private String documentStatus;
    private String generatedDocumentPath;
    private String attachedDocumentPath;

    public ServiceRequestResponse(Long id, String serviceType, String status, String details,
                                String purpose, String contactNumber, String address,
                                LocalDateTime createdAt, LocalDateTime updatedAt,
                                String residentName, String residentEmail, String residentPhone) {
        this.id = id;
        this.serviceType = serviceType;
        this.status = status;
        this.details = details;
        this.purpose = purpose;
        this.contactNumber = contactNumber;
        this.address = address;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.residentName = residentName;
        this.residentEmail = residentEmail;
        this.residentPhone = residentPhone;
        this.documentStatus = null;
        this.generatedDocumentPath = null;
        this.attachedDocumentPath = null;
    }

    public ServiceRequestResponse(Long id, String serviceType, String status, String details,
                                String purpose, String contactNumber, String address,
                                LocalDateTime createdAt, LocalDateTime updatedAt,
                                String residentName, String residentEmail, String residentPhone,
                                String documentStatus, String generatedDocumentPath, String attachedDocumentPath) {
        this.id = id;
        this.serviceType = serviceType;
        this.status = status;
        this.details = details;
        this.purpose = purpose;
        this.contactNumber = contactNumber;
        this.address = address;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.residentName = residentName;
        this.residentEmail = residentEmail;
        this.residentPhone = residentPhone;
        this.documentStatus = documentStatus;
        this.generatedDocumentPath = generatedDocumentPath;
        this.attachedDocumentPath = attachedDocumentPath;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getServiceType() {
        return serviceType;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getResidentName() {
        return residentName;
    }

    public void setResidentName(String residentName) {
        this.residentName = residentName;
    }

    public String getResidentEmail() {
        return residentEmail;
    }

    public void setResidentEmail(String residentEmail) {
        this.residentEmail = residentEmail;
    }

    public String getResidentPhone() {
        return residentPhone;
    }

    public void setResidentPhone(String residentPhone) {
        this.residentPhone = residentPhone;
    }

    public String getDocumentStatus() {
        return documentStatus;
    }

    public void setDocumentStatus(String documentStatus) {
        this.documentStatus = documentStatus;
    }

    public String getGeneratedDocumentPath() {
        return generatedDocumentPath;
    }

    public void setGeneratedDocumentPath(String generatedDocumentPath) {
        this.generatedDocumentPath = generatedDocumentPath;
    }

    public String getAttachedDocumentPath() {
        return attachedDocumentPath;
    }

    public void setAttachedDocumentPath(String attachedDocumentPath) {
        this.attachedDocumentPath = attachedDocumentPath;
    }
}
