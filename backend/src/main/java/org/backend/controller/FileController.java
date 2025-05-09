package org.backend.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/files")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class FileController {

    private static final Logger logger = LoggerFactory.getLogger(FileController.class);
    private static final String DOCUMENTS_DIR = "documents";

    @GetMapping("/documents/{type}/{filename:.+}")
    public ResponseEntity<byte[]> serveDocument(
            @PathVariable String type,
            @PathVariable String filename) {
        try {
            logger.info("Received request for document: type={}, filename={}", type, filename);
            
            // Try multiple possible paths
            Path[] possiblePaths = {
                // Absolute path with system property
                Paths.get(System.getProperty("user.dir"), DOCUMENTS_DIR, type, filename),
                
                // Just the relative path
                Paths.get(DOCUMENTS_DIR, type, filename),
                
                // Trying to find by ID in filename (for cases where the exact timestamp is wrong)
                findFileByIdPattern(type, filename)
            };
            
            // Try each path
            for (Path path : possiblePaths) {
                if (path != null && Files.exists(path)) {
                    logger.info("Found file at: {}", path.toAbsolutePath());
                    return serveFile(path, filename);
                } else if (path != null) {
                    logger.warn("Path doesn't exist: {}", path.toAbsolutePath());
                }
            }
            
            // If we got here, no file was found in any of the possible locations
            logger.error("File not found in any of the possible locations: {}/{}", type, filename);
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            logger.error("Error serving file: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    private Path findFileByIdPattern(String type, String filename) throws IOException {
        // Extract request ID from filename pattern (e.g., "attached_21_1746498036035.pdf" -> "21")
        String requestIdStr = null;
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("attached_(\\d+)_\\d+\\..*");
        java.util.regex.Matcher matcher = pattern.matcher(filename);
        if (matcher.find()) {
            requestIdStr = matcher.group(1);
            logger.info("Extracted request ID: {} from filename: {}", requestIdStr, filename);
        } else {
            logger.warn("Could not extract request ID from filename: {}", filename);
            return null;
        }
        
        // Create the base directory path
        Path baseDir = Paths.get(System.getProperty("user.dir"), DOCUMENTS_DIR, type);
        if (!Files.exists(baseDir)) {
            logger.warn("Base directory doesn't exist: {}", baseDir.toAbsolutePath());
            return null;
        }
        
        // List all files in the directory that match the pattern "attached_{requestId}_*.pdf"
        final String reqId = requestIdStr;
        java.util.stream.Stream<Path> matches = Files.list(baseDir).filter(p -> {
            String name = p.getFileName().toString();
            return name.startsWith("attached_" + reqId + "_") && 
                   name.substring(name.lastIndexOf('.')).equalsIgnoreCase(
                       filename.substring(filename.lastIndexOf('.')));
        });
        
        // Return the first match, if any
        java.util.Optional<Path> match = matches.findFirst();
        matches.close();
        
        if (match.isPresent()) {
            logger.info("Found alternative file with matching request ID: {}", match.get().getFileName());
            return match.get();
        }
        
        logger.warn("No files matching request ID {} found in {}", requestIdStr, baseDir);
        return null;
    }

    private ResponseEntity<byte[]> serveFile(Path filePath, String filename) throws IOException {
        // Determine content type based on file extension
        String contentType = determineContentType(filename);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"");
        
        // Read file content
        byte[] fileContent = Files.readAllBytes(filePath);
        logger.info("Successfully read file: {}, size: {} bytes", filePath.toAbsolutePath(), fileContent.length);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(fileContent);
    }
    
    private String determineContentType(String filename) {
        String lowercaseFilename = filename.toLowerCase();
        if (lowercaseFilename.endsWith(".pdf")) {
            return "application/pdf";
        } else if (lowercaseFilename.endsWith(".png")) {
            return "image/png";
        } else if (lowercaseFilename.endsWith(".jpg") || lowercaseFilename.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowercaseFilename.endsWith(".docx")) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (lowercaseFilename.endsWith(".xlsx")) {
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        } else {
            return "application/octet-stream";
        }
    }
} 