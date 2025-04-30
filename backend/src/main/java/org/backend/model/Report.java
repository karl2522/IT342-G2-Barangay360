package org.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"post", "comment", "reporter"})
@Table(name = "reports")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT") // ADD THIS LINE
    private String reason;

    @Column(columnDefinition = "TEXT") // ADD THIS LINE
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "post_id")
    @JsonIgnoreProperties({"comments", "likes", "reports"})
    private ForumPost post;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "comment_id")
    @JsonIgnoreProperties({"likes", "post", "reports", "hibernateLazyInitializer", "handler"})
    private ForumComment comment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"password", "roles", "email", "hibernateLazyInitializer", "handler"})
    private User reporter;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ReportStatus status = ReportStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ReportType type;

    public enum ReportStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    public enum ReportType {
        POST,
        COMMENT
    }

    // Helper method to check if this is a post report
    public boolean isPostReport() {
        return type == ReportType.POST && post != null;
    }

    // Helper method to check if this is a comment report
    public boolean isCommentReport() {
        return type == ReportType.COMMENT && comment != null;
    }
}
