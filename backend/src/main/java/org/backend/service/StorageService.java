package org.backend.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface StorageService {
    
    /**
     * Upload a file to storage
     * @param file File to upload
     * @param prefix Optional prefix for the file path
     * @return Public URL to access the file
     */
    String uploadFile(MultipartFile file, String prefix) throws IOException;
    
    /**
     * Delete a file from storage
     * @param fileUrl Public URL of the file to delete
     */
    void deleteFile(String fileUrl);
    
    /**
     * Get a list of all files in a directory
     * @param prefix Directory prefix to list files from
     * @return List of file URLs
     */
    List<String> listFiles(String prefix);
} 