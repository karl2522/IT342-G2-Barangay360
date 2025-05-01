package org.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_requests")
public class ServiceRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String serviceType;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED, COMPLETED

    @Column(length = 1000)
    private String details;

    @Column
    private String purpose;

    @Column
    private String contactNumber;

    @Column
    private String address;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // New fields for document management

    @Column
    private String documentTemplateId; // Reference to the template to use

    @Column
    private String generatedDocumentPath; // Path to the generated PDF file

    @Column
    private LocalDateTime documentGeneratedAt; // When the document was generated

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy; // Which official approved the request

    @Column
    private String documentStatus; // NOT_GENERATED, GENERATED, DELIVERED

    @Column
    private String trackingNumber; // For residents to track their request

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        status = "PENDING";
        documentStatus = "NOT_GENERATED";
        trackingNumber = generateTrackingNumber();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Method to generate a unique tracking number
    private String generateTrackingNumber() {
        // Format: BR-YYYYMMDD-XXXX (where XXXX is a random number)
        String dateFormat = java.time.format.DateTimeFormatter
                .ofPattern("yyyyMMdd")
                .format(LocalDateTime.now());

        int randomNum = (int) (Math.random() * 10000);
        return String.format("BR-%s-%04d", dateFormat, randomNum);
    }

    // Method to mark document as generated
    public void markDocumentAsGenerated(String filePath, User official) {
        this.generatedDocumentPath = filePath;
        this.documentGeneratedAt = LocalDateTime.now();
        this.documentStatus = "GENERATED";
        this.approvedBy = official;
        this.status = "APPROVED";
    }

    // Method to mark document as delivered
    public void markDocumentAsDelivered() {
        this.documentStatus = "DELIVERED";
        this.status = "COMPLETED";
    }

    // Method to set the appropriate template based on service type
    public void assignDocumentTemplate(String templateId) {
        this.documentTemplateId = templateId;
    }

    // Standard getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    // New getters and setters for document fields

    public String getDocumentTemplateId() {
        return documentTemplateId;
    }

    public void setDocumentTemplateId(String documentTemplateId) {
        this.documentTemplateId = documentTemplateId;
    }

    public String getGeneratedDocumentPath() {
        return generatedDocumentPath;
    }

    public void setGeneratedDocumentPath(String generatedDocumentPath) {
        this.generatedDocumentPath = generatedDocumentPath;
    }

    public LocalDateTime getDocumentGeneratedAt() {
        return documentGeneratedAt;
    }

    public void setDocumentGeneratedAt(LocalDateTime documentGeneratedAt) {
        this.documentGeneratedAt = documentGeneratedAt;
    }

    public User getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(User approvedBy) {
        this.approvedBy = approvedBy;
    }

    public String getDocumentStatus() {
        return documentStatus;
    }

    public void setDocumentStatus(String documentStatus) {
        this.documentStatus = documentStatus;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }
}