package org.backend.service;

import org.backend.payload.request.AnnouncementRequest;
import org.backend.payload.response.AnnouncementResponse;

import java.util.List;

public interface AnnouncementService {
    
    /**
     * Get all announcements
     * @return List of all announcements
     */
    List<AnnouncementResponse> getAllAnnouncements();
    
    /**
     * Get an announcement by ID
     * @param id The announcement ID
     * @return The announcement
     */
    AnnouncementResponse getAnnouncementById(Long id);
    
    /**
     * Create a new announcement
     * @param request The announcement request data
     * @return The created announcement
     */
    AnnouncementResponse createAnnouncement(AnnouncementRequest request);
    
    /**
     * Update an existing announcement
     * @param id The announcement ID
     * @param request The updated announcement data
     * @return The updated announcement
     */
    AnnouncementResponse updateAnnouncement(Long id, AnnouncementRequest request);
    
    /**
     * Delete an announcement
     * @param id The announcement ID
     */
    void deleteAnnouncement(Long id);
} 