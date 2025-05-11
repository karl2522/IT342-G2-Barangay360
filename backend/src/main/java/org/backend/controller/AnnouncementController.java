package org.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.backend.model.Announcement;
import org.backend.payload.request.AnnouncementRequest;
import org.backend.payload.response.AnnouncementResponse;
import org.backend.payload.response.MessageResponse;
import org.backend.service.AnnouncementService;
import org.backend.service.StorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
@Tag(name = "Announcements", description = "Barangay announcements management API")
@CrossOrigin(origins = {"https://barangay360.vercel.app","http://localhost:5173", "http://localhost:5174"}, maxAge = 3600) // Adjust CORS as needed
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final StorageService storageService;

    @Operation(summary = "Get all announcements", description = "Retrieve all barangay announcements")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "List of all announcements retrieved successfully", 
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AnnouncementResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<AnnouncementResponse>> getAllAnnouncements() {
        List<AnnouncementResponse> announcements = announcementService.getAllAnnouncements();
        return ResponseEntity.ok(announcements);
    }

    @Operation(summary = "Get announcement by ID", description = "Retrieve a specific announcement by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Announcement found and returned", 
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AnnouncementResponse.class))),
        @ApiResponse(responseCode = "404", description = "Announcement not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<AnnouncementResponse> getAnnouncementById(
            @Parameter(description = "Announcement ID", required = true)
            @PathVariable Long id) {
        AnnouncementResponse announcement = announcementService.getAnnouncementById(id);
        return ResponseEntity.ok(announcement);
    }

    @Operation(summary = "Create announcement", description = "Create a new barangay announcement (Officials only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Announcement created successfully", 
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AnnouncementResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
        @ApiResponse(responseCode = "403", description = "Forbidden - officials only"),
        @ApiResponse(responseCode = "500", description = "Internal server error during creation")
    })
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<?> createAnnouncement(
            @Parameter(description = "Announcement title", required = true)
            @RequestParam("title") String title,
            @Parameter(description = "Announcement content", required = true)
            @RequestParam("content") String content,
            @Parameter(description = "ID of the official creating the announcement", required = true)
            @RequestParam("officialId") Long officialId,
            @Parameter(description = "Optional thumbnail image for the announcement")
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

    @Operation(summary = "Update announcement", description = "Update an existing announcement (Officials only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Announcement updated successfully", 
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AnnouncementResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
        @ApiResponse(responseCode = "403", description = "Forbidden - officials only"),
        @ApiResponse(responseCode = "404", description = "Announcement not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error during update")
    })
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<?> updateAnnouncement(
            @Parameter(description = "Announcement ID to update", required = true)
            @PathVariable Long id,
            @Parameter(description = "Updated announcement title", required = true)
            @RequestParam("title") String title,
            @Parameter(description = "Updated announcement content", required = true)
            @RequestParam("content") String content,
            @Parameter(description = "New thumbnail image (optional)")
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

    @Operation(summary = "Delete announcement", description = "Delete an announcement and its associated thumbnail (Officials only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Announcement deleted successfully", 
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = MessageResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
        @ApiResponse(responseCode = "403", description = "Forbidden - officials only"),
        @ApiResponse(responseCode = "404", description = "Announcement not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error during deletion")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<?> deleteAnnouncement(
            @Parameter(description = "Announcement ID to delete", required = true)
            @PathVariable Long id) {
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