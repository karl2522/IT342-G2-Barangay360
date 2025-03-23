package org.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.backend.exception.ResourceNotFoundException;
import org.backend.model.Announcement;
import org.backend.model.User;
import org.backend.payload.request.AnnouncementRequest;
import org.backend.payload.response.AnnouncementResponse;
import org.backend.repository.AnnouncementRepository;
import org.backend.repository.UserRepository;
import org.backend.service.AnnouncementService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    @Override
    public List<AnnouncementResponse> getAllAnnouncements() {
        List<Announcement> announcements = announcementRepository.findAllByOrderByCreatedAtDesc();
        return announcements.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AnnouncementResponse getAnnouncementById(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found with id: " + id));
        return mapToResponse(announcement);
    }

    @Override
    public AnnouncementResponse createAnnouncement(AnnouncementRequest request) {
        User official = userRepository.findById(request.getOfficialId())
                .orElseThrow(() -> new ResourceNotFoundException("Official not found with id: " + request.getOfficialId()));

        Announcement announcement = new Announcement();
        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        announcement.setThumbnailUrl(request.getThumbnailUrl());
        announcement.setOfficial(official);

        Announcement savedAnnouncement = announcementRepository.save(announcement);
        return mapToResponse(savedAnnouncement);
    }

    @Override
    public AnnouncementResponse updateAnnouncement(Long id, AnnouncementRequest request) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found with id: " + id));

        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        
        // Update thumbnail URL only if it's provided in the request
        if (request.getThumbnailUrl() != null) {
            announcement.setThumbnailUrl(request.getThumbnailUrl());
        }

        Announcement updatedAnnouncement = announcementRepository.save(announcement);
        return mapToResponse(updatedAnnouncement);
    }

    @Override
    public void deleteAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found with id: " + id));
        
        announcementRepository.delete(announcement);
    }

    private AnnouncementResponse mapToResponse(Announcement announcement) {
        AnnouncementResponse response = new AnnouncementResponse();
        response.setId(announcement.getId());
        response.setTitle(announcement.getTitle());
        response.setContent(announcement.getContent());
        response.setThumbnailUrl(announcement.getThumbnailUrl());
        response.setCreatedAt(announcement.getCreatedAt());
        response.setUpdatedAt(announcement.getUpdatedAt());
        response.setOfficialId(announcement.getOfficial().getId());
        response.setOfficialName(announcement.getOfficial().getFirstName() + " " + announcement.getOfficial().getLastName());
        return response;
    }
} 