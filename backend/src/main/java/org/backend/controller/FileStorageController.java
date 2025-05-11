package org.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.backend.payload.response.MessageResponse;
import org.backend.service.StorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "File Storage", description = "File storage operations API")
@CrossOrigin(origins = {"https://barangay360.vercel.app","http://localhost:5173", "http://localhost:5174"}, maxAge = 3600) // Adjust CORS as needed
public class FileStorageController {

    private final StorageService storageService;

    @Operation(summary = "Upload a file", description = "Upload a file to cloud storage")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "File uploaded successfully"),
        @ApiResponse(responseCode = "400", description = "Empty file or invalid request"),
        @ApiResponse(responseCode = "500", description = "Internal server error during upload"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadFile(
            @Parameter(description = "File to be uploaded", required = true) 
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "Optional prefix/folder path for the file")
            @RequestParam(value = "prefix", required = false) String prefix
    ) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Cannot upload empty file"));
            }

            String fileUrl = storageService.uploadFile(file, prefix);
            
            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("message", "File uploaded successfully");
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Could not upload the file: " + e.getMessage()));
        }
    }

    @Operation(summary = "Delete a file", description = "Delete a file from cloud storage")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "File deleted successfully"),
        @ApiResponse(responseCode = "500", description = "Internal server error during deletion"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @DeleteMapping("/delete")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteFile(
            @Parameter(description = "URL of file to delete", required = true)
            @RequestParam("fileUrl") String fileUrl) {
        try {
            storageService.deleteFile(fileUrl);
            return ResponseEntity.ok(new MessageResponse("File deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Could not delete the file: " + e.getMessage()));
        }
    }

    @Operation(summary = "List files", description = "List files in cloud storage, optionally filtered by prefix")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Files listed successfully"),
        @ApiResponse(responseCode = "500", description = "Internal server error during listing"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    })
    @GetMapping("/list")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listFiles(
            @Parameter(description = "Optional prefix/folder path to filter files")
            @RequestParam(value = "prefix", required = false) String prefix
    ) {
        try {
            List<String> files = storageService.listFiles(prefix);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Could not list files: " + e.getMessage()));
        }
    }
} 