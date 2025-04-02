package org.backend.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.backend.payload.response.MessageResponse;
import org.backend.service.StorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "File Storage", description = "File storage operations API")
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
        
        final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
        
        try {
            if (file.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Cannot upload empty file"));
            }
            
            if (file.getSize() > MAX_FILE_SIZE) {
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("File size exceeds the limit of 10MB"));
            }

            String fileUrl = storageService.uploadFile(file, prefix);
            
            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("message", "File uploaded successfully");
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("File upload failed: " + e.getMessage()));
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
                    .body(new MessageResponse("File deletion failed: " + e.getMessage()));
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
        
        String searchPrefix = prefix != null ? prefix : ""; // Ensure prefix is not null
        
        try {
            List<String> files = storageService.listFiles(searchPrefix);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("File listing failed: " + e.getMessage()));
        }
    }
}
