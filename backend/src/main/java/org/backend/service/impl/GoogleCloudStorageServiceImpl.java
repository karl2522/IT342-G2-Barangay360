package org.backend.service.impl;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import lombok.RequiredArgsConstructor;
import org.backend.service.StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleCloudStorageServiceImpl implements StorageService {

    private final Storage storage;

    @Value("${gcp.storage.bucket-name}")
    private String bucketName;

    @Value("${gcp.storage.upload-dir}")
    private String uploadDir;

    @Override
    public String uploadFile(MultipartFile file, String prefix) throws IOException {
        String filename = generateUniqueFilename(file.getOriginalFilename());
        String directory = StringUtils.hasText(prefix) ? prefix + "/" : uploadDir;
        String objectName = directory + filename;
        
        BlobId blobId = BlobId.of(bucketName, objectName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .build();
        
        storage.create(blobInfo, file.getBytes());
        
        // Return the public URL
        return String.format("https://storage.googleapis.com/%s/%s", bucketName, objectName);
    }

    @Override
    public void deleteFile(String fileUrl) {
        String objectName = extractObjectNameFromUrl(fileUrl);
        if (objectName != null) {
            BlobId blobId = BlobId.of(bucketName, objectName);
            storage.delete(blobId);
        }
    }

    @Override
    public List<String> listFiles(String prefix) {
        String directory = StringUtils.hasText(prefix) ? prefix : uploadDir;
        
        List<String> fileUrls = new ArrayList<>();
        storage.list(bucketName, Storage.BlobListOption.prefix(directory))
                .iterateAll()
                .forEach(blob -> fileUrls.add(blob.getMediaLink()));
        
        return fileUrls;
    }
    
    private String generateUniqueFilename(String originalFilename) {
        String extension = StringUtils.getFilenameExtension(originalFilename);
        return UUID.randomUUID() + "." + extension;
    }
    
    private String extractObjectNameFromUrl(String fileUrl) {
        if (fileUrl != null && fileUrl.contains(bucketName)) {
            return fileUrl.substring(fileUrl.indexOf(bucketName) + bucketName.length() + 1);
        }
        return null;
    }
} 