package org.backend.controller;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.backend.model.ForumPost;
import org.backend.model.PostReport;
import org.backend.model.User;
import org.backend.repository.ForumPostRepository;
import org.backend.repository.PostReportRepository;
import org.backend.security.services.UserDetailsImpl;
import org.backend.service.ForumService;
import org.backend.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, maxAge = 3600)
public class ReportController {
    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);

    private final ForumService forumService;
    private final UserService userService;
    private final PostReportRepository postReportRepository;
    private final ForumPostRepository forumPostRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @PostMapping("/post/{postId}")
    public ResponseEntity<PostReport> reportPost(
            @PathVariable Long postId,
            @RequestParam("reason") String reason,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        logger.info("Report post request received for post ID: {}, reason: {}", postId, reason);
        
        try {
            // First validate that we have a valid user
            if (userDetails == null) {
                logger.error("Authentication failed - user details are null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            User reporter = userService.getUserById(userDetails.getId());
            logger.info("User found: {} (ID: {})", reporter.getUsername(), reporter.getId());
            
            PostReport report = forumService.reportPost(postId, reason, reporter);
            logger.info("Post report created successfully with ID: {}", report.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(report);
        } catch (Exception e) {
            logger.error("Error creating post report: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @GetMapping
    public ResponseEntity<Page<PostReport>> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        // TODO: Add admin role check
        User currentUser = userService.getUserById(userDetails.getId());
        
        Pageable pageable = PageRequest.of(page, size);
        Page<PostReport> reports = forumService.getAllReports(pageable);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/{reportId}")
    public ResponseEntity<PostReport> getReportById(
            @PathVariable Long reportId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        // TODO: Add admin role check or reporter check
        User currentUser = userService.getUserById(userDetails.getId());
        
        PostReport report = forumService.getReportById(reportId);
        return ResponseEntity.ok(report);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<PostReport>> getReportsByStatus(
            @PathVariable PostReport.ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        // TODO: Add admin role check
        User currentUser = userService.getUserById(userDetails.getId());
        
        Pageable pageable = PageRequest.of(page, size);
        Page<PostReport> reports = forumService.getReportsByStatus(status, pageable);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/my-reports")
    public ResponseEntity<Page<PostReport>> getMyReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        User currentUser = userService.getUserById(userDetails.getId());
        
        Pageable pageable = PageRequest.of(page, size);
        Page<PostReport> reports = forumService.getReportsByUser(currentUser, pageable);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/post/{postId}")
    public ResponseEntity<Page<PostReport>> getReportsByPost(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        // TODO: Add admin role check
        User currentUser = userService.getUserById(userDetails.getId());
        
        Pageable pageable = PageRequest.of(page, size);
        Page<PostReport> reports = forumService.getReportsByPost(postId, pageable);
        return ResponseEntity.ok(reports);
    }
    
    @PutMapping("/{reportId}/status")
    public ResponseEntity<PostReport> updateReportStatus(
            @PathVariable Long reportId,
            @RequestParam PostReport.ReportStatus status,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        // TODO: Add admin role check
        User admin = userService.getUserById(userDetails.getId());
        
        PostReport report = forumService.updateReportStatus(reportId, status, admin);
        return ResponseEntity.ok(report);
    }
} 