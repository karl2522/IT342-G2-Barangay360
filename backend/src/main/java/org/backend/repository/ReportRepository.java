package org.backend.repository;

import org.backend.model.ForumComment;
import org.backend.model.ForumPost;
import org.backend.model.Report;
import org.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    // Find reports by status
    Page<Report> findByStatus(Report.ReportStatus status, Pageable pageable);
    
    // Find reports by type
    Page<Report> findByType(Report.ReportType type, Pageable pageable);
    
    // Find reports by status and type
    Page<Report> findByStatusAndType(Report.ReportStatus status, Report.ReportType type, Pageable pageable);
    
    // Find reports by reporter
    Page<Report> findByReporter(User reporter, Pageable pageable);
    
    // Find reports by reporter and type
    Page<Report> findByReporterAndType(User reporter, Report.ReportType type, Pageable pageable);
    
    // Find reports by post
    Page<Report> findByPost(ForumPost post, Pageable pageable);
    
    // Find reports by comment
    Page<Report> findByComment(ForumComment comment, Pageable pageable);
}