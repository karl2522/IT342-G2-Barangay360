package org.backend.service;

import org.backend.model.*;
import org.backend.model.CommentReport;
import org.backend.model.PostReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ForumService {
    // Post Operations
    ForumPost createPost(String title, String content, User author, MultipartFile image);
    ForumPost updatePost(Long postId, String title, String content, MultipartFile image, User currentUser);
    void deletePost(Long postId, User currentUser);
    ForumPost getPostById(Long postId);
    Page<ForumPost> getAllPosts(Pageable pageable);
    Page<ForumPost> getPostsByUser(User user, Pageable pageable);
    ForumPost toggleLikePost(Long postId, User user);

    // Comment Operations
    ForumComment createComment(Long postId, String content, User author);
    ForumComment updateComment(Long commentId, String content, User currentUser);
    void deleteComment(Long commentId, User currentUser);
    List<ForumComment> getCommentsByPost(Long postId);
    Page<ForumComment> getCommentsByPost(Long postId, Pageable pageable);
    ForumComment toggleLikeComment(Long commentId, User user);

    // Report Operations
    PostReport reportPost(Long postId, String reason, User reporter);
    PostReport updateReportStatus(Long reportId, PostReport.ReportStatus status, String rejectionReason, User admin);
    PostReport getReportById(Long reportId);
    Page<PostReport> getAllReports(Pageable pageable);
    Page<PostReport> getReportsByStatus(PostReport.ReportStatus status, Pageable pageable);
    Page<PostReport> getReportsByUser(User reporter, Pageable pageable);
    Page<PostReport> getReportsByPost(Long postId, Pageable pageable);

    // Comment Report Operations
    CommentReport reportComment(Long commentId, String reason, User reporter);
    CommentReport updateCommentReportStatus(Long reportId, CommentReport.ReportStatus status, String rejectionReason, User admin);
    CommentReport getCommentReportById(Long reportId);
    Page<CommentReport> getAllCommentReports(Pageable pageable);
    Page<CommentReport> getCommentReportsByStatus(CommentReport.ReportStatus status, Pageable pageable);
    Page<CommentReport> getCommentReportsByUser(User reporter, Pageable pageable);
    Page<CommentReport> getCommentReportsByComment(Long commentId, Pageable pageable);
} 
