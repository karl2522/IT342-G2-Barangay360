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
import org.backend.model.Report;
import org.backend.repository.ForumPostRepository;
import org.backend.repository.PostReportRepository;
import org.backend.repository.CommentReportRepository;
import org.backend.repository.ForumCommentRepository;
import org.backend.repository.ReportRepository;
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
public class ReportController {
    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);

    private final ForumService forumService;
    private final UserService userService;
    private final PostReportRepository postReportRepository;
    private final ForumPostRepository forumPostRepository;
    private final CommentReportRepository commentReportRepository;
    private final ForumCommentRepository forumCommentRepository;
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @PostMapping("/unified/{contentType}/{contentId}")
    public ResponseEntity<Report> createUnifiedReport(
            @PathVariable String contentType,
            @PathVariable Long contentId,
            @RequestParam("reason") String reason,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        logger.info("Unified report request received for {} ID: {}, reason: {}", contentType, contentId, reason);

        try {
            // First validate that we have a valid user
            if (userDetails == null) {
                logger.error("Authentication failed - user details are null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            User reporter = userService.getUserById(userDetails.getId());
            logger.info("User found: {} (ID: {})", reporter.getUsername(), reporter.getId());

            Report report = new Report();
            report.setReason(reason);
            report.setReporter(reporter);
            report.setStatus(Report.ReportStatus.PENDING);

            // Set the appropriate content based on type
            if ("post".equalsIgnoreCase(contentType)) {
                ForumPost post = forumPostRepository.findById(contentId)
                    .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + contentId));
                report.setPost(post);
                report.setType(Report.ReportType.POST);
            } else if ("comment".equalsIgnoreCase(contentType)) {
                ForumComment comment = forumCommentRepository.findById(contentId)
                    .orElseThrow(() -> new EntityNotFoundException("Comment not found with id: " + contentId));
                report.setComment(comment);
                report.setType(Report.ReportType.COMMENT);
            } else {
                return ResponseEntity.badRequest().build();
            }

            // Save the report
            Report savedReport = reportRepository.save(report);
            logger.info("{} report created successfully with ID: {}", contentType, savedReport.getId());

            return ResponseEntity.status(HttpStatus.CREATED).body(savedReport);
        } catch (Exception e) {
            logger.error("Error creating {} report: {}", contentType, e.getMessage(), e);
            throw e;
        }
    }

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
            @RequestParam(required = false) String rejectionReason,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        // TODO: Add admin role check
        User admin = userService.getUserById(userDetails.getId());

        PostReport report = forumService.updateReportStatus(reportId, status, rejectionReason, admin);
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

    // Endpoints for deleting reported content
    @DeleteMapping("/post/delete/{postId}")
    public ResponseEntity<Map<String, String>> deleteReportedPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        logger.info("Deleting reported post with ID: {}", postId);

        try {
            // Require authentication for report management
            if (userDetails == null) {
                logger.error("Authentication required for deleting reported post");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Authentication required");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }

            User admin = userService.getUserById(userDetails.getId());
            logger.info("Admin user found: {} (ID: {})", admin.getUsername(), admin.getId());
            
            // First check if the post exists
            if (!forumPostRepository.existsById(postId)) {
                logger.warn("Post with ID {} not found, it may have been already deleted", postId);
                Map<String, String> response = new HashMap<>();
                response.put("message", "Post already deleted or does not exist");
                return ResponseEntity.ok(response);
            }

            // Pass the authenticated user
            try {
                forumService.deletePost(postId, admin);
                Map<String, String> response = new HashMap<>();
                response.put("message", "Reported post deleted successfully");
                return ResponseEntity.ok(response);
            } catch (EntityNotFoundException e) {
                logger.warn("Post with ID {} not found during deletion, it was likely deleted by another process", postId);
                Map<String, String> response = new HashMap<>();
                response.put("message", "Post already deleted or does not exist");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            logger.error("Error deleting reported post: {}", e.getMessage(), e);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to delete reported post: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/comment/delete/{commentId}")
    public ResponseEntity<Map<String, String>> deleteReportedComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        logger.info("Deleting reported comment with ID: {}", commentId);

        try {
            // Require authentication for report management
            if (userDetails == null) {
                logger.error("Authentication required for deleting reported comment");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Authentication required");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }

            User admin = userService.getUserById(userDetails.getId());
            logger.info("Admin user found: {} (ID: {})", admin.getUsername(), admin.getId());

            // First check if the comment exists
            if (!forumCommentRepository.existsById(commentId)) {
                logger.warn("Comment with ID {} not found, it may have been already deleted", commentId);
                Map<String, String> response = new HashMap<>();
                response.put("message", "Comment already deleted or does not exist");
                return ResponseEntity.ok(response);
            }

            // Pass the authenticated user
            try {
                forumService.deleteComment(commentId, admin);
                Map<String, String> response = new HashMap<>();
                response.put("message", "Reported comment deleted successfully");
                return ResponseEntity.ok(response);
            } catch (EntityNotFoundException e) {
                logger.warn("Comment with ID {} not found during deletion, it was likely deleted by another process", commentId);
                Map<String, String> response = new HashMap<>();
                response.put("message", "Comment already deleted or does not exist");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            logger.error("Error deleting reported comment: {}", e.getMessage(), e);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to delete reported comment: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/unified/{reportId}/status")
    public ResponseEntity<Report> updateUnifiedReportStatus(
            @PathVariable Long reportId,
            @RequestParam Report.ReportStatus status,
            @RequestParam(required = false) String rejectionReason,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        logger.info("Updating unified report status for report ID: {} to: {}", reportId, status);

        try {
            // Require authentication for report management
            if (userDetails == null) {
                logger.error("Authentication required for report management");
                throw new IllegalStateException("Authentication required");
            }

            User admin = userService.getUserById(userDetails.getId());
            logger.info("Admin user found: {} (ID: {})", admin.getUsername(), admin.getId());

            // Find the report
            Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Report not found with ID: " + reportId));
            logger.info("Report found with type: {}", report.getType());

            // Update the report status
            report.setStatus(status);

            if (rejectionReason != null && !rejectionReason.isEmpty()) {
                report.setRejectionReason(rejectionReason);
            }

            report.setResolvedAt(LocalDateTime.now());

            // Save the updated report
            Report updatedReport = reportRepository.save(report);
            logger.info("Report status updated successfully to: {}", status);

            // If the report is approved, delete the reported content
            if (status == Report.ReportStatus.APPROVED) {
                logger.info("Report approved, attempting to delete reported content");

                try {
                    if (report.isPostReport() && report.getPost() != null) {
                        Long postId = report.getPost().getId();
                        if (forumPostRepository.existsById(postId)) {
                            // Delete the post with the authenticated user
                            forumService.deletePost(postId, admin);
                            logger.info("Deleted reported post with ID: {} by admin: {}", postId, admin.getUsername());
                        } else {
                            logger.warn("Post with ID: {} already deleted", postId);
                        }
                    } else if (report.isCommentReport() && report.getComment() != null) {
                        Long commentId = report.getComment().getId();
                        if (forumCommentRepository.existsById(commentId)) {
                            // Delete the comment with the authenticated user
                            forumService.deleteComment(commentId, admin);
                            logger.info("Deleted reported comment with ID: {} by admin: {}", commentId, admin.getUsername());
                        } else {
                            logger.warn("Comment with ID: {} already deleted", commentId);
                        }
                    }
                } catch (EntityNotFoundException e) {
                    logger.warn("Content to be deleted was not found: {}", e.getMessage());
                    // Continue with report update even if content is not found
                } catch (Exception e) {
                    logger.error("Error deleting reported content: {}", e.getMessage(), e);
                    // Continue with report update even if deletion fails
                }
            }

            return ResponseEntity.ok(updatedReport);
        } catch (Exception e) {
            logger.error("Error updating report status: {}", e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllReportsOfBothTypes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ALL") String type,
            @RequestParam(defaultValue = "ALL") String status,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        logger.info("Fetching reports with type: {}, status: {}, page: {}, size: {}", type, status, page, size);

        try {
            // TODO: Add admin role check
            User currentUser = userService.getUserById(userDetails.getId());
            logger.info("User found: {} (ID: {})", currentUser.getUsername(), currentUser.getId());

            Pageable pageable = PageRequest.of(page, size);
            Page<Report> reports;

            // Apply filters based on type and status
            if ("ALL".equals(type)) {
                if ("ALL".equals(status)) {
                    // No filters
                    reports = reportRepository.findAll(pageable);
                    logger.info("Fetching all reports without filters");
                } else {
                    // Filter by status only
                    Report.ReportStatus reportStatus = Report.ReportStatus.valueOf(status);
                    reports = reportRepository.findByStatus(reportStatus, pageable);
                    logger.info("Fetching reports with status: {}", reportStatus);
                }
            } else {
                // Convert type string to enum
                Report.ReportType reportType = "POST".equals(type) ? Report.ReportType.POST : Report.ReportType.COMMENT;

                if ("ALL".equals(status)) {
                    // Filter by type only
                    reports = reportRepository.findByType(reportType, pageable);
                    logger.info("Fetching reports with type: {}", reportType);
                } else {
                    // Filter by both type and status
                    Report.ReportStatus reportStatus = Report.ReportStatus.valueOf(status);
                    reports = reportRepository.findByStatusAndType(reportStatus, reportType, pageable);
                    logger.info("Fetching reports with type: {} and status: {}", reportType, reportStatus);
                }
            }

            // Build the response
            Map<String, Object> response = new HashMap<>();
            response.put("content", reports.getContent());
            response.put("currentPage", page);
            response.put("totalItems", reports.getTotalElements());
            response.put("totalPages", reports.getTotalPages());

            logger.info("Found {} reports, total of {} reports", reports.getContent().size(), reports.getTotalElements());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching reports: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch reports: " + e.getMessage()));
        }
    }
} 
