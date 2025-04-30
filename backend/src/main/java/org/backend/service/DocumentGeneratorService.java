package org.backend.service;

import org.backend.model.DocumentTemplate;
import org.backend.model.ServiceRequest;
import org.backend.model.User;
import org.backend.repository.DocumentTemplateRepository;
import org.backend.repository.ServiceRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDField;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class DocumentGeneratorService {

    private final DocumentTemplateRepository templateRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final String templatesPath;
    private final String generatedDocsPath;

    @Autowired
    public DocumentGeneratorService(
            DocumentTemplateRepository templateRepository,
            ServiceRequestRepository serviceRequestRepository,
            @Value("${document.templates.path}") String templatesPath,
            @Value("${document.generated.path}") String generatedDocsPath) {
        this.templateRepository = templateRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.templatesPath = templatesPath;
        this.generatedDocsPath = generatedDocsPath;

        // Create directories if they don't exist
        try {
            Files.createDirectories(Paths.get(templatesPath));
            Files.createDirectories(Paths.get(generatedDocsPath));
        } catch (IOException e) {
            throw new RuntimeException("Failed to create document directories", e);
        }
    }

    /**
     * Generates a PDF document based on the service request information
     *
     * @param requestId The ID of the service request
     * @param official The barangay official approving and generating the document
     * @return Path to the generated document
     */
    public String generateDocument(Long requestId, User official) throws Exception {
        // Get the service request
        Optional<ServiceRequest> requestOpt = serviceRequestRepository.findById(requestId);
        if (!requestOpt.isPresent()) {
            throw new Exception("Service request not found with ID: " + requestId);
        }

        ServiceRequest request = requestOpt.get();

        // Get the appropriate template
        DocumentTemplate template = getTemplateForServiceType(request.getServiceType());

        // Fill the template with user data
        String outputFilePath = fillPdfTemplate(template, request);

        // Update service request with document info
        request.markDocumentAsGenerated(outputFilePath, official);
        serviceRequestRepository.save(request);

        return outputFilePath;
    }

    /**
     * Retrieves the appropriate document template for the given service type
     */
    private DocumentTemplate getTemplateForServiceType(String serviceType) throws Exception {
        Optional<DocumentTemplate> templateOpt = templateRepository.findByServiceTypeAndIsActiveTrue(serviceType);

        if (!templateOpt.isPresent()) {
            throw new Exception("No active template found for service type: " + serviceType);
        }

        return templateOpt.get();
    }

    /**
     * Fills a PDF template with user data from the service request
     */
    private String fillPdfTemplate(DocumentTemplate template, ServiceRequest request) throws IOException {
        // Create output directory if it doesn't exist
        Files.createDirectories(Paths.get(generatedDocsPath));

        // Format the output file name
        String fileName = String.format("%s_%s_%s.pdf",
                request.getUser().getLastName(),
                request.getServiceType().replaceAll("\\s+", ""),
                request.getTrackingNumber());

        String outputPath = Paths.get(generatedDocsPath, fileName).toString();

        // Load the template PDF
        PDDocument document = null;
        try {
            document = PDDocument.load(new File(template.getTemplateFilePath()));
            PDAcroForm acroForm = document.getDocumentCatalog().getAcroForm();

            if (acroForm != null) {
                // Fill in the form fields with user data
                fillFormField(acroForm, "fullName", request.getUser().getFirstName() + " " + request.getUser().getLastName());
                fillFormField(acroForm, "address", request.getAddress());
                fillFormField(acroForm, "purpose", request.getPurpose());
                fillFormField(acroForm, "contactNumber", request.getContactNumber());
                fillFormField(acroForm, "requestDate", formatDate(request.getCreatedAt().toLocalDate()));
                fillFormField(acroForm, "issueDate", formatDate(LocalDate.now()));
                fillFormField(acroForm, "trackingNumber", request.getTrackingNumber());

                // Fill in official's information
                if (request.getApprovedBy() != null) {
                    User official = request.getApprovedBy();
                    fillFormField(acroForm, "officialName", official.getFirstName() + " " + official.getLastName());
                    fillFormField(acroForm, "officialPosition", official.getPosition());
                }

                // Flatten the form to prevent further editing
                acroForm.flatten();

                // Save the filled document
                document.save(outputPath);
            }
        } finally {
            if (document != null) {
                document.close();
            }
        }

        return outputPath;
    }

    /**
     * Helper method to fill a form field if it exists
     */
    private void fillFormField(PDAcroForm form, String fieldName, String value) throws IOException {
        PDField field = form.getField(fieldName);
        if (field != null && value != null) {
            field.setValue(value);
        }
    }

    /**
     * Format a date for document display
     */
    private String formatDate(LocalDate date) {
        return date.format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
    }
}