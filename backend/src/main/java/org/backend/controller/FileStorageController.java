package org.backend.controller;

import lombok.RequiredArgsConstructor;
import org.backend.payload.response.MessageResponse;
import org.backend.service.StorageService;
import org.springframework.http.HttpStatus;
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
public class FileStorageController {

    private final StorageService storageService;

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
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

    @DeleteMapping("/delete")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteFile(@RequestParam("fileUrl") String fileUrl) {
        try {
            storageService.deleteFile(fileUrl);
            return ResponseEntity.ok(new MessageResponse("File deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Could not delete the file: " + e.getMessage()));
        }
    }

    @GetMapping("/list")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listFiles(
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