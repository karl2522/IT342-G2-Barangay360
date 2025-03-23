package org.backend.controller;

import lombok.RequiredArgsConstructor;
import org.backend.model.Announcement;
import org.backend.payload.request.AnnouncementRequest;
import org.backend.payload.response.AnnouncementResponse;
import org.backend.payload.response.MessageResponse;
import org.backend.service.AnnouncementService;
import org.backend.service.StorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final StorageService storageService;

    @GetMapping
    public ResponseEntity<List<AnnouncementResponse>> getAllAnnouncements() {
        List<AnnouncementResponse> announcements = announcementService.getAllAnnouncements();
        return ResponseEntity.ok(announcements);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnnouncementResponse> getAnnouncementById(@PathVariable Long id) {
        AnnouncementResponse announcement = announcementService.getAnnouncementById(id);
        return ResponseEntity.ok(announcement);
    }

    @PostMapping
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<?> createAnnouncement(
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam("officialId") Long officialId,
            @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail
    ) {
        try {
            // Create announcement request object
            AnnouncementRequest request = new AnnouncementRequest();
            request.setTitle(title);
            request.setContent(content);
            request.setOfficialId(officialId);
            
            // Upload thumbnail if provided
            String thumbnailUrl = null;
            if (thumbnail != null && !thumbnail.isEmpty()) {
                thumbnailUrl = storageService.uploadFile(thumbnail, "announcements");
                request.setThumbnailUrl(thumbnailUrl);
            }
            
            // Create the announcement
            AnnouncementResponse createdAnnouncement = announcementService.createAnnouncement(request);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdAnnouncement);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to create announcement: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<?> updateAnnouncement(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail
    ) {
        try {
            // First get the existing announcement to check if we need to delete the old thumbnail
            AnnouncementResponse existingAnnouncement = announcementService.getAnnouncementById(id);
            
            // Create announcement request object
            AnnouncementRequest request = new AnnouncementRequest();
            request.setTitle(title);
            request.setContent(content);
            
            // Upload new thumbnail if provided
            if (thumbnail != null && !thumbnail.isEmpty()) {
                // Delete old thumbnail if exists
                if (existingAnnouncement.getThumbnailUrl() != null) {
                    storageService.deleteFile(existingAnnouncement.getThumbnailUrl());
                }
                
                // Upload new thumbnail
                String thumbnailUrl = storageService.uploadFile(thumbnail, "announcements");
                request.setThumbnailUrl(thumbnailUrl);
            } else {
                // Keep existing thumbnail if no new one is provided
                request.setThumbnailUrl(existingAnnouncement.getThumbnailUrl());
            }
            
            // Update the announcement
            AnnouncementResponse updatedAnnouncement = announcementService.updateAnnouncement(id, request);
            
            return ResponseEntity.ok(updatedAnnouncement);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to update announcement: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id) {
        try {
            // Get the announcement to delete its thumbnail if it exists
            AnnouncementResponse announcement = announcementService.getAnnouncementById(id);
            
            // Delete thumbnail if exists
            if (announcement.getThumbnailUrl() != null) {
                storageService.deleteFile(announcement.getThumbnailUrl());
            }
            
            // Delete the announcement
            announcementService.deleteAnnouncement(id);
            
            return ResponseEntity.ok(new MessageResponse("Announcement deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to delete announcement: " + e.getMessage()));
        }
    }
} 