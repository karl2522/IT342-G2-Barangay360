package org.backend.repository;

import org.backend.model.ForumPost;
import org.backend.model.PostReport;
import org.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostReportRepository extends JpaRepository<PostReport, Long> {
    boolean existsByPostAndReporter(ForumPost post, User reporter);
    Page<PostReport> findByPostOrderByCreatedAtDesc(ForumPost post, Pageable pageable);
    Page<PostReport> findByReporterOrderByCreatedAtDesc(User reporter, Pageable pageable);
    Page<PostReport> findByStatusOrderByCreatedAtDesc(PostReport.ReportStatus status, Pageable pageable);
    Page<PostReport> findAllByOrderByCreatedAtDesc(Pageable pageable);
} 