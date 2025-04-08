package org.backend.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.backend.exception.UnauthorizedException;
import org.backend.model.ForumComment;
import org.backend.model.ForumPost;
import org.backend.model.PostReport;
import org.backend.model.User;
import org.backend.model.CommentReport;
import org.backend.repository.ForumCommentRepository;
import org.backend.repository.ForumPostRepository;
import org.backend.repository.PostReportRepository;
import org.backend.repository.CommentReportRepository;
import org.backend.service.ForumService;
import org.backend.service.StorageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ForumServiceImpl implements ForumService {
    private static final Logger logger = LoggerFactory.getLogger(ForumServiceImpl.class);

    private final ForumPostRepository postRepository;
    private final ForumCommentRepository commentRepository;
    private final PostReportRepository reportRepository;
    private final CommentReportRepository commentReportRepository;
    private final StorageService storageService;
    private static final String FORUM_IMAGES_PATH = "forum-images/";
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @PostConstruct
    public void init() {
        logger.info("ForumServiceImpl initialized");
        logger.info("PostReportRepository injected: {}", (reportRepository != null ? "YES" : "NO"));
        try {
            logger.info("PostReportRepository count: {}", reportRepository.count());
            // Check if the post_reports table exists
            try {
                logger.info("Checking database table existence for post_reports");
                entityManager.createNativeQuery("SELECT 1 FROM post_reports FETCH FIRST 1 ROWS ONLY").getResultList();
                logger.info("post_reports table exists in the database");
            } catch (Exception e) {
                logger.error("post_reports table might not exist in the database: {}", e.getMessage());
            }
        } catch (Exception e) {
            logger.error("Error accessing PostReportRepository", e);
        }
    }

    @Override
    @Transactional
    public ForumPost createPost(String title, String content, User author, MultipartFile image) {
        ForumPost post = new ForumPost();
        post.setTitle(title);
        post.setContent(content);
        post.setAuthor(author);
        
        if (image != null && !image.isEmpty()) {
            try {
                String imageUrl = storageService.uploadFile(image, FORUM_IMAGES_PATH + author.getId() + "/");
                post.setImageUrl(imageUrl);
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload image", e);
            }
        }
        
        return postRepository.save(post);
    }

    @Override
    @Transactional
    public ForumPost updatePost(Long postId, String title, String content, MultipartFile image, User currentUser) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));
        
        if (!Objects.equals(post.getAuthor().getId(), currentUser.getId())) {
            throw new UnauthorizedException("You are not authorized to update this post");
        }
        
        post.setTitle(title);
        post.setContent(content);
        
        if (image != null && !image.isEmpty()) {
            try {
                // Delete old image if exists
                if (post.getImageUrl() != null) {
                    storageService.deleteFile(post.getImageUrl());
                }
                String imageUrl = storageService.uploadFile(image, FORUM_IMAGES_PATH + currentUser.getId() + "/");
                post.setImageUrl(imageUrl);
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload image", e);
            }
        }
        
        return postRepository.save(post);
    }

    @Override
    @Transactional
    public void deletePost(Long postId, User currentUser) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));
        
        if (!Objects.equals(post.getAuthor().getId(), currentUser.getId())) {
            throw new UnauthorizedException("You are not authorized to delete this post");
        }
        
        // Delete image if exists
        if (post.getImageUrl() != null) {
            storageService.deleteFile(post.getImageUrl());
        }
        
        postRepository.delete(post);
    }

    @Override
    public ForumPost getPostById(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));
    }

    @Override
    public Page<ForumPost> getAllPosts(Pageable pageable) {
        return postRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Override
    public Page<ForumPost> getPostsByUser(User user, Pageable pageable) {
        return postRepository.findByAuthor(user, pageable);
    }

    @Override
    @Transactional
    public ForumPost toggleLikePost(Long postId, User user) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));
        
        if (post.getLikes().contains(user)) {
            post.removeLike(user);
        } else {
            post.addLike(user);
        }
        
        return postRepository.save(post);
    }

    @Override
    @Transactional
    public ForumComment createComment(Long postId, String content, User author) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));
        
        ForumComment comment = new ForumComment();
        comment.setContent(content);
        comment.setAuthor(author);
        comment.setPost(post);
        
        return commentRepository.save(comment);
    }

    @Override
    @Transactional
    public ForumComment updateComment(Long commentId, String content, User currentUser) {
        ForumComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found with id: " + commentId));
        
        if (!Objects.equals(comment.getAuthor().getId(), currentUser.getId())) {
            throw new UnauthorizedException("You are not authorized to update this comment");
        }
        
        comment.setContent(content);
        return commentRepository.save(comment);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, User currentUser) {
        ForumComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found with id: " + commentId));
        
        if (!Objects.equals(comment.getAuthor().getId(), currentUser.getId())) {
            throw new UnauthorizedException("You are not authorized to delete this comment");
        }
        
        commentRepository.delete(comment);
    }

    @Override
    public List<ForumComment> getCommentsByPost(Long postId) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));
        
        return commentRepository.findByPostOrderByCreatedAtAsc(post);
    }

    @Override
    public Page<ForumComment> getCommentsByPost(Long postId, Pageable pageable) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));
        
        return commentRepository.findByPostOrderByCreatedAtAsc(post, pageable);
    }

    @Override
    @Transactional
    public ForumComment toggleLikeComment(Long commentId, User user) {
        ForumComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found with id: " + commentId));
        
        if (comment.getLikes().contains(user)) {
            comment.removeLike(user);
        } else {
            comment.addLike(user);
        }
        
        return commentRepository.save(comment);
    }
    
    // Report operations implementation
    
    @Override
    @Transactional
    public PostReport reportPost(Long postId, String reason, User reporter) {
        logger.info("Starting reportPost method for postId: {} by reporter: {}", postId, reporter.getUsername());
        
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));
        logger.info("Found post with title: {}", post.getTitle());
        
        // Cannot report your own post
        if (Objects.equals(post.getAuthor().getId(), reporter.getId())) {
            logger.info("User attempting to report their own post");
            throw new IllegalStateException("You cannot report your own post");
        }
        
        logger.info("Creating new PostReport object");
        PostReport report = new PostReport();
        report.setPost(post);
        report.setReporter(reporter);
        report.setReason(reason);
        report.setStatus(PostReport.ReportStatus.PENDING);
        
        logger.info("Saving report to database using saveAndFlush");
        PostReport savedReport = reportRepository.saveAndFlush(report);
        logger.info("Report saved successfully with ID: {}", savedReport.getId());
        return savedReport;
    }
    
    @Override
    @Transactional
    public PostReport updateReportStatus(Long reportId, PostReport.ReportStatus status, User admin) {
        PostReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Report not found with id: " + reportId));
        
        // TODO: Add admin role check when implementing authorization
        
        report.setStatus(status);
        if (status != PostReport.ReportStatus.PENDING) {
            report.setResolvedAt(LocalDateTime.now());
        }
        
        return reportRepository.save(report);
    }
    
    @Override
    public PostReport getReportById(Long reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Report not found with id: " + reportId));
    }
    
    @Override
    public Page<PostReport> getAllReports(Pageable pageable) {
        return reportRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
    
    @Override
    public Page<PostReport> getReportsByStatus(PostReport.ReportStatus status, Pageable pageable) {
        return reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }
    
    @Override
    public Page<PostReport> getReportsByUser(User reporter, Pageable pageable) {
        return reportRepository.findByReporterOrderByCreatedAtDesc(reporter, pageable);
    }
    
    @Override
    public Page<PostReport> getReportsByPost(Long postId, Pageable pageable) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));
        return reportRepository.findByPostOrderByCreatedAtDesc(post, pageable);
    }

    @Override
    public CommentReport reportComment(Long commentId, String reason, User reporter) {
        logger.info("Starting reportComment method for commentId: {} by reporter: {}", commentId, reporter.getUsername());
        
        // Find comment or throw 404
        ForumComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found with ID: " + commentId));
        
        // Cannot report your own comment
        if (Objects.equals(comment.getAuthor().getId(), reporter.getId())) {
            logger.info("User attempting to report their own comment");
            throw new IllegalStateException("You cannot report your own comment");
        }
        
        logger.info("Creating new CommentReport object");
        CommentReport report = new CommentReport();
        report.setComment(comment);
        report.setReporter(reporter);
        report.setReason(reason);
        report.setStatus(CommentReport.ReportStatus.PENDING);
        
        logger.info("Saving comment report to database");
        CommentReport savedReport = commentReportRepository.saveAndFlush(report);
        logger.info("Comment report saved successfully with ID: {}", savedReport.getId());
        return savedReport;
    }

    @Override
    public CommentReport updateCommentReportStatus(Long reportId, CommentReport.ReportStatus status, String rejectionReason, User admin) {
        CommentReport report = commentReportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Comment report not found with ID: " + reportId));
        
        // Store the old status to check if we're transitioning from PENDING to APPROVED/REJECTED
        CommentReport.ReportStatus oldStatus = report.getStatus();
        
        // Update the status
        report.setStatus(status);
        
        // If the report is being rejected and a rejection reason is provided, save it
        if (status == CommentReport.ReportStatus.REJECTED && rejectionReason != null && !rejectionReason.trim().isEmpty()) {
            report.setRejectionReason(rejectionReason);
        }
        
        // If we're transitioning from PENDING to APPROVED/REJECTED, set resolvedAt
        if (oldStatus == CommentReport.ReportStatus.PENDING && 
            (status == CommentReport.ReportStatus.APPROVED || status == CommentReport.ReportStatus.REJECTED)) {
            report.setResolvedAt(LocalDateTime.now());
        }
        
        return commentReportRepository.save(report);
    }

    @Override
    public CommentReport getCommentReportById(Long reportId) {
        return commentReportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Comment report not found with ID: " + reportId));
    }

    @Override
    public Page<CommentReport> getAllCommentReports(Pageable pageable) {
        return commentReportRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Override
    public Page<CommentReport> getCommentReportsByStatus(CommentReport.ReportStatus status, Pageable pageable) {
        return commentReportRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    @Override
    public Page<CommentReport> getCommentReportsByUser(User reporter, Pageable pageable) {
        return commentReportRepository.findByReporterOrderByCreatedAtDesc(reporter, pageable);
    }

    @Override
    public Page<CommentReport> getCommentReportsByComment(Long commentId, Pageable pageable) {
        ForumComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found with ID: " + commentId));
        return commentReportRepository.findByCommentOrderByCreatedAtDesc(comment, pageable);
    }
} 