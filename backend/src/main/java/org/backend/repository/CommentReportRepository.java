package org.backend.repository;

import org.backend.model.CommentReport;
import org.backend.model.ForumComment;
import org.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface CommentReportRepository extends JpaRepository<CommentReport, Long> {
    boolean existsByCommentAndReporter(ForumComment comment, User reporter);
    Page<CommentReport> findByCommentOrderByCreatedAtDesc(ForumComment comment, Pageable pageable);
    Page<CommentReport> findByReporterOrderByCreatedAtDesc(User reporter, Pageable pageable);
    Page<CommentReport> findByStatusOrderByCreatedAtDesc(CommentReport.ReportStatus status, Pageable pageable);
    Page<CommentReport> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Modifying
    @Transactional
    void deleteByComment(ForumComment comment);
}
