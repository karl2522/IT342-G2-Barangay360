package org.backend.repository;

import org.backend.model.ForumPost;
import org.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {
    Page<ForumPost> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<ForumPost> findByAuthor(User author, Pageable pageable);
} 