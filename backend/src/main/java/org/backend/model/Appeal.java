package org.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "appeals")
public class Appeal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Store username directly for easier lookup without joins in some cases
    @Column(nullable = false)
    private String username;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false) // Changed nullable to false
    private User user; // Link to the User entity

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private AppealStatus status = AppealStatus.PENDING;

    @CreationTimestamp
    @Column(name = "appeal_date", nullable = false, updatable = false)
    private LocalDateTime appealDate;

    public enum AppealStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    // Constructor for creating a new appeal
    public Appeal(User user, String message) {
        this.user = user;
        this.username = user.getUsername(); // Store username
        this.message = message;
        this.status = AppealStatus.PENDING;
    }
}