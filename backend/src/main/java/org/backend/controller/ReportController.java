package org.backend.controller;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.backend.model.ForumPost;
import org.backend.model.ForumComment;
import org.backend.model.PostReport;
import org.backend.model.User;
import org.backend.model.CommentReport;
import org.backend.repository.ForumPostRepository;
import org.backend.repository.PostReportRepository;
import org.backend.repository.CommentReportRepository;
import org.backend.repository.ForumCommentRepository;
import org.backend.repository.UserRepository;
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

import java.time.LocalDateTime;
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
    private final CommentReportRepository commentReportRepository;
    private final ForumCommentRepository forumCommentRepository;
    private final UserRepository userRepository;
    
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
    
    @PostMapping("/comment/{commentId}")
    @Transactional
    public ResponseEntity<CommentReport> reportComment(
            @PathVariable Long commentId,
            @RequestParam("reason") String reason,
            @RequestParam(value = "details", required = false) String details,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        logger.info("Report comment request received for comment ID: {}, reason: {}", commentId, reason);
        
        try {
            // Always use a valid user (either authenticated or system user)
            User reporter;
            if (userDetails != null) {
                reporter = userService.getUserById(userDetails.getId());
                logger.info("Using authenticated user: {} (ID: {})", reporter.getUsername(), reporter.getId());
            } else {
                // Use the first admin user as system reporter (ID 1 is usually admin)
                try {
                    reporter = userService.getUserById(1L);
                    logger.warn("Authentication missing - using system user: {}", reporter.getUsername());
                } catch (Exception ex) {
                    // Get first available user if admin not found
                    List<User> users = userService.getAllUsers();
                    if (users.isEmpty()) {
                        logger.error("No users found in the system");
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
                    }
                    reporter = users.get(0);
                    logger.warn("Using fallback user: {}", reporter.getUsername());
                }
            }
            
            // Save the comment report
            CommentReport report = forumService.reportComment(commentId, reason, reporter);
            logger.info("Comment report saved successfully with ID: {}", report.getId());
            
            // If user wasn't authenticated, return success but with 401 status
            if (userDetails == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(report);
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(report);
        } catch (Exception e) {
            logger.error("Error creating comment report: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @GetMapping("/comments")
    public ResponseEntity<Page<CommentReport>> getAllCommentReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        // TODO: Add admin role check
        User currentUser = userService.getUserById(userDetails.getId());
        
        Pageable pageable = PageRequest.of(page, size);
        Page<CommentReport> reports = forumService.getAllCommentReports(pageable);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/comment/{reportId}")
    public ResponseEntity<CommentReport> getCommentReportById(
            @PathVariable Long reportId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        // TODO: Add admin role check or reporter check
        User currentUser = userService.getUserById(userDetails.getId());
        
        CommentReport report = forumService.getCommentReportById(reportId);
        return ResponseEntity.ok(report);
    }
    
    @GetMapping("/comment/status/{status}")
    public ResponseEntity<Page<CommentReport>> getCommentReportsByStatus(
            @PathVariable CommentReport.ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        // TODO: Add admin role check
        User currentUser = userService.getUserById(userDetails.getId());
        
        Pageable pageable = PageRequest.of(page, size);
        Page<CommentReport> reports = forumService.getCommentReportsByStatus(status, pageable);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/my-comment-reports")
    public ResponseEntity<Page<CommentReport>> getMyCommentReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        User currentUser = userService.getUserById(userDetails.getId());
        
        Pageable pageable = PageRequest.of(page, size);
        Page<CommentReport> reports = forumService.getCommentReportsByUser(currentUser, pageable);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/for-comment/{commentId}")
    public ResponseEntity<Page<CommentReport>> getReportsByComment(
            @PathVariable Long commentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        // TODO: Add admin role check
        User currentUser = userService.getUserById(userDetails.getId());
        
        Pageable pageable = PageRequest.of(page, size);
        Page<CommentReport> reports = forumService.getCommentReportsByComment(commentId, pageable);
        return ResponseEntity.ok(reports);
    }
    
    @PutMapping("/comment/{reportId}/status")
    public ResponseEntity<CommentReport> updateCommentReportStatus(
            @PathVariable Long reportId,
            @RequestParam CommentReport.ReportStatus status,
            @RequestParam(required = false) String rejectionReason,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        // TODO: Add admin role check
        User admin = userService.getUserById(userDetails.getId());
        
        CommentReport report = forumService.updateCommentReportStatus(reportId, status, rejectionReason, admin);
        return ResponseEntity.ok(report);
    }
    
    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllReportsOfBothTypes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ALL") String type,
            @RequestParam(defaultValue = "ALL") String status,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        // TODO: Add admin role check
        User currentUser = userService.getUserById(userDetails.getId());
        
        Pageable pageable = PageRequest.of(page, size);
        
        Map<String, Object> response = new HashMap<>();
        List<Object> combinedReports = new ArrayList<>();
        int totalElements = 0;
        int totalPages = 0;
        
        // Get post reports if requested
        if ("ALL".equals(type) || "POST".equals(type)) {
            Page<PostReport> postReports;
            if ("ALL".equals(status)) {
                postReports = forumService.getAllReports(pageable);
            } else {
                PostReport.ReportStatus reportStatus = PostReport.ReportStatus.valueOf(status);
                postReports = forumService.getReportsByStatus(reportStatus, pageable);
            }
            
            combinedReports.addAll(postReports.getContent());
            totalElements += postReports.getTotalElements();
            totalPages = Math.max(totalPages, postReports.getTotalPages());
        }
        
        // Get comment reports if requested
        if ("ALL".equals(type) || "COMMENT".equals(type)) {
            Page<CommentReport> commentReports;
            if ("ALL".equals(status)) {
                commentReports = forumService.getAllCommentReports(pageable);
            } else {
                CommentReport.ReportStatus reportStatus = CommentReport.ReportStatus.valueOf(status);
                commentReports = forumService.getCommentReportsByStatus(reportStatus, pageable);
            }
            
            combinedReports.addAll(commentReports.getContent());
            totalElements += commentReports.getTotalElements();
            totalPages = Math.max(totalPages, commentReports.getTotalPages());
        }
        
        // Sort combined reports by creation date (newest first)
        combinedReports.sort((r1, r2) -> {
            LocalDateTime date1 = null;
            LocalDateTime date2 = null;
            
            if (r1 instanceof PostReport) {
                date1 = ((PostReport) r1).getCreatedAt();
            } else if (r1 instanceof CommentReport) {
                date1 = ((CommentReport) r1).getCreatedAt();
            }
            
            if (r2 instanceof PostReport) {
                date2 = ((PostReport) r2).getCreatedAt();
            } else if (r2 instanceof CommentReport) {
                date2 = ((CommentReport) r2).getCreatedAt();
            }
            
            if (date1 == null || date2 == null) {
                return 0;
            }
            
            return date2.compareTo(date1); // Newest first
        });
        
        // Paginate the combined list
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), combinedReports.size());
        
        if (start < end) {
            combinedReports = combinedReports.subList(start, end);
        } else {
            combinedReports = new ArrayList<>();
        }
        
        response.put("content", combinedReports);
        response.put("currentPage", page);
        response.put("totalItems", totalElements);
        response.put("totalPages", totalPages);
        
        return ResponseEntity.ok(response);
    }
} 