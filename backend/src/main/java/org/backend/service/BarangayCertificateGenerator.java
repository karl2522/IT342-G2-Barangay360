package org.backend.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.backend.model.ServiceRequest;
import org.backend.model.User;
import org.backend.repository.ServiceRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.awt.Color;

import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class BarangayCertificateGenerator {

    private final ServiceRequestRepository serviceRequestRepository;
    private final String generatedDocsPath;

    @Autowired
    public BarangayCertificateGenerator(
            ServiceRequestRepository serviceRequestRepository,
            @Value("${document.generated.path}") String generatedDocsPath) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.generatedDocsPath = generatedDocsPath;

        // Create output directory if it doesn't exist
        try {
            Files.createDirectories(Paths.get(generatedDocsPath));
        } catch (IOException e) {
            throw new RuntimeException("Failed to create generated document directory: " + generatedDocsPath, e);
        }
    }

    /**
     * Checks if the request has the necessary documents attached before generating the certificate
     * @param requestId The ID of the service request
     * @return true if the request has documents attached, false otherwise
     */
    public boolean hasAttachedDocument(Long requestId) {
        Optional<ServiceRequest> requestOpt = serviceRequestRepository.findById(requestId);
        if (!requestOpt.isPresent()) {
            return false;
        }

        ServiceRequest request = requestOpt.get();

        // In a real system, you would check if the official has uploaded or attached 
        // the necessary document to the request. This could be a separate field in the 
        // ServiceRequest model or a separate table tracking document attachments.

        // For this implementation, we'll check if the documentStatus is "ATTACHED"
        // which would indicate that an official has uploaded or attached a document
        return request.getDocumentStatus() != null && request.getDocumentStatus().equals("ATTACHED");
    }

    /**
     * Generates a PDF certificate for a barangay document request
     * @param requestId The ID of the service request
     * @param official The barangay official approving and generating the document
     * @return Path to the generated document
     */
    public String generateCertificate(Long requestId, User official) throws Exception {
        // Get the service request
        Optional<ServiceRequest> requestOpt = serviceRequestRepository.findById(requestId);
        if (!requestOpt.isPresent()) {
            throw new Exception("Service request not found with ID: " + requestId);
        }

        ServiceRequest request = requestOpt.get();

        // Validate that the request has attached documents
        if (!hasAttachedDocument(requestId)) {
            throw new Exception("Cannot generate certificate: No documents attached to this request");
        }

        // Define the output file path
        String fileName = String.format("barangay_certificate_%s_%s.pdf",
                request.getUser().getFirstName().replace(" ", "_"),
                request.getUser().getLastName().replace(" ", "_"));
        String outputPath = Paths.get(generatedDocsPath, fileName).toString();

        // Create the PDF document
        Document document = new Document(PageSize.A4);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, new FileOutputStream(outputPath));
            document.open();

            // Add header
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLACK);
            Paragraph header = new Paragraph("BARANGAY CERTIFICATE", headerFont);
            header.setAlignment(Element.ALIGN_CENTER);
            document.add(header);

            // Add barangay name
            Font barangayFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Color.BLACK);
            Paragraph barangayName = new Paragraph("Barangay 360", barangayFont);
            barangayName.setAlignment(Element.ALIGN_CENTER);
            document.add(barangayName);

            // Add address
            Font addressFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Color.BLACK);
            Paragraph address = new Paragraph("Municipality of Example, Province of Sample", addressFont);
            address.setAlignment(Element.ALIGN_CENTER);
            document.add(address);

            // Add spacing
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));

            // Add date
            Font dateFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Color.BLACK);
            Paragraph date = new Paragraph("Date: " + formatDate(LocalDate.now()), dateFont);
            date.setAlignment(Element.ALIGN_RIGHT);
            document.add(date);

            document.add(new Paragraph(" "));

            // Add salutation
            Font contentFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Color.BLACK);
            Paragraph salutation = new Paragraph("TO WHOM IT MAY CONCERN:", contentFont);
            document.add(salutation);

            document.add(new Paragraph(" "));

            // Add content
            Paragraph content = new Paragraph();
            content.setFont(contentFont);
            content.setAlignment(Element.ALIGN_JUSTIFIED);
            content.add("This is to certify that ");

            // Add resident name in bold
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK);
            Chunk residentName = new Chunk(request.getUser().getFirstName() + " " + request.getUser().getLastName(), boldFont);
            content.add(residentName);

            content.add(", of legal age, Filipino, and a resident of " + request.getAddress() + 
                    ", is a bonafide resident of this Barangay.");
            document.add(content);

            document.add(new Paragraph(" "));

            // Add purpose
            Paragraph purposePara = new Paragraph();
            purposePara.setFont(contentFont);
            purposePara.setAlignment(Element.ALIGN_JUSTIFIED);
            purposePara.add("This certification is being issued upon the request of the above-named person for the purpose of ");
            Chunk purpose = new Chunk(request.getPurpose(), boldFont);
            purposePara.add(purpose);
            purposePara.add(".");
            document.add(purposePara);

            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));

            // Add signature area
            Paragraph signatureLine = new Paragraph("_______________________________", contentFont);
            signatureLine.setAlignment(Element.ALIGN_RIGHT);
            document.add(signatureLine);

            Paragraph officialName = new Paragraph(official.getFirstName() + " " + official.getLastName(), boldFont);
            officialName.setAlignment(Element.ALIGN_RIGHT);
            document.add(officialName);

            Paragraph position = new Paragraph(official.getPosition() != null ? official.getPosition() : "Barangay Official", contentFont);
            position.setAlignment(Element.ALIGN_RIGHT);
            document.add(position);

            // Add footer with tracking number
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);
            Paragraph footer = new Paragraph("Tracking Number: " + request.getTrackingNumber(), footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }

        // Update service request with document info
        request.markDocumentAsGenerated(outputPath, official);
        serviceRequestRepository.save(request);

        return outputPath;
    }

    /**
     * Format a date for document display
     */
    private String formatDate(LocalDate date) {
        // Example format: January 1, 2024
        return date.format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
    }
}
