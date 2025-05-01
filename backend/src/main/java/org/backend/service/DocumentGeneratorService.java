package org.backend.service;

import org.backend.model.DocumentTemplate;
import org.backend.model.ServiceRequest;
import org.backend.model.User;
import org.backend.repository.DocumentTemplateRepository;
import org.backend.repository.ServiceRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource; // Import Resource
import org.springframework.core.io.ResourceLoader; // Import ResourceLoader
import org.springframework.stereotype.Service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDField;

import java.io.File;
import java.io.IOException;
import java.io.InputStream; // Import InputStream
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
    private final String templatesPath; // Keep this to locate resources
    private final String generatedDocsPath;
    private final ResourceLoader resourceLoader; // Inject ResourceLoader

    @Autowired
    public DocumentGeneratorService(
            DocumentTemplateRepository templateRepository,
            ServiceRequestRepository serviceRequestRepository,
            @Value("${document.templates.path}") String templatesPath,
            @Value("${document.generated.path}") String generatedDocsPath,
            ResourceLoader resourceLoader) { // Add ResourceLoader here
        this.templateRepository = templateRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.templatesPath = templatesPath;
        this.generatedDocsPath = generatedDocsPath;
        this.resourceLoader = resourceLoader; // Assign injected ResourceLoader

        // Create ONLY the output directory if it doesn't exist
        try {
            // Files.createDirectories(Paths.get(templatesPath)); // REMOVE THIS LINE - Incorrect for classpath
            Files.createDirectories(Paths.get(generatedDocsPath)); // KEEP THIS LINE - Correct for output path
        } catch (IOException e) {
            // Consider more specific error handling or logging
            throw new RuntimeException("Failed to create generated document directory: " + generatedDocsPath, e);
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

        // Get the appropriate template details from the database
        DocumentTemplate templateInfo = getTemplateForServiceType(request.getServiceType());

        // Construct the resource path using the base path and the specific template file name
        // Assumes templateInfo.getTemplateFilePath() contains just the filename (e.g., "certificate.pdf")
        // If templateInfo.getTemplateFilePath() contains the full classpath: prefix, adjust accordingly.
        // Let's assume templateFilePath stores only the filename for now.
        String templateResourcePath = templatesPath + templateInfo.getTemplateFilePath();


        // Fill the template with user data using the resource path
        String outputFilePath = fillPdfTemplate(templateResourcePath, request);

        // Update service request with document info
        request.markDocumentAsGenerated(outputFilePath, official);
        serviceRequestRepository.save(request);

        return outputFilePath;
    }

    /**
     * Retrieves the appropriate document template for the given service type
     */
    private DocumentTemplate getTemplateForServiceType(String serviceType) throws Exception {
        // This assumes you have DocumentTemplate entities saved in your DB
        // mapping service types (e.g., "Barangay Certificate")
        // to template file names (e.g., "barangay_certificate_template.pdf")
        // stored in the 'templateFilePath' field of DocumentTemplate.
        Optional<DocumentTemplate> templateOpt = templateRepository.findByServiceTypeAndIsActiveTrue(serviceType);

        if (!templateOpt.isPresent()) {
            throw new Exception("No active template found for service type: " + serviceType);
        }
        // Make sure the templateFilePath field in your DB contains the actual filename
        // e.g., "barangay_certificate_template.pdf" and NOT the full classpath.
        DocumentTemplate template = templateOpt.get();
        if (template.getTemplateFilePath() == null || template.getTemplateFilePath().isBlank()) {
            throw new Exception("Template found for service type '" + serviceType + "' but its templateFilePath is missing.");
        }

        return template;
    }

    /**
     * Fills a PDF template loaded from the classpath with user data from the service request
     */
    private String fillPdfTemplate(String templateResourcePath, ServiceRequest request) throws IOException {
        // Define the output file path
        String fileName = String.format("%s_%s_%s.pdf",
                request.getUser().getLastName(),
                request.getServiceType().replaceAll("\\s+", "_"), // Replace spaces for filename
                request.getTrackingNumber());
        String outputPath = Paths.get(generatedDocsPath, fileName).toString();

        // Load the template PDF from the classpath
        PDDocument document = null;
        try {
            // Use ResourceLoader to get the resource
            Resource templateResource = resourceLoader.getResource(templateResourcePath);
            if (!templateResource.exists()) {
                throw new IOException("Template resource not found at: " + templateResourcePath);
            }
            // Load the document from the resource's InputStream
            try (InputStream templateStream = templateResource.getInputStream()) {
                document = PDDocument.load(templateStream);
            }

            PDAcroForm acroForm = document.getDocumentCatalog().getAcroForm();

            if (acroForm != null) {
                // Fill in the form fields with user data
                fillFormField(acroForm, "fullName", request.getUser().getFirstName() + " " + request.getUser().getLastName());
                fillFormField(acroForm, "address", request.getAddress()); // Assuming request.getAddress() is correct
                fillFormField(acroForm, "purpose", request.getPurpose());
                fillFormField(acroForm, "contactNumber", request.getContactNumber()); // Assuming request.getContactNumber() exists
                fillFormField(acroForm, "requestDate", formatDate(request.getCreatedAt().toLocalDate()));
                fillFormField(acroForm, "issueDate", formatDate(LocalDate.now()));
                fillFormField(acroForm, "trackingNumber", request.getTrackingNumber());

                // Fill in official's information if available
                if (request.getApprovedBy() != null) {
                    User official = request.getApprovedBy();
                    fillFormField(acroForm, "officialName", official.getFirstName() + " " + official.getLastName());
                    fillFormField(acroForm, "officialPosition", official.getPosition()); // Assuming official has a position field
                } else {
                    // Handle case where official info might not be set yet if needed
                    fillFormField(acroForm, "officialName", "_________________________"); // Example placeholder
                    fillFormField(acroForm, "officialPosition", "_________________________"); // Example placeholder
                }


                // Flatten the form to prevent further editing (optional, but recommended)
                acroForm.flatten();

                // Save the filled document
                document.save(outputPath);
            } else {
                throw new IOException("PDF template has no AcroForm (form fields): " + templateResourcePath);
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
        if (field != null) {
            field.setValue(value != null ? value : ""); // Set empty string if value is null
        } else {
            // Optional: Log a warning if a field expected in the code is not found in the PDF
            // logger.warn("PDF form field '{}' not found in template.", fieldName);
        }
    }

    /**
     * Format a date for document display
     */
    private String formatDate(LocalDate date) {
        // Example format: January 1, 2024
        return date.format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
    }
}