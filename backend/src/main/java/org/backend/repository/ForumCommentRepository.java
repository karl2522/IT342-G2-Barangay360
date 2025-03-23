package org.backend.repository;

import org.backend.model.ForumComment;
import org.backend.model.ForumPost;
import org.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForumCommentRepository extends JpaRepository<ForumComment, Long> {
    List<ForumComment> findByPostOrderByCreatedAtAsc(ForumPost post);
    Page<ForumComment> findByPostOrderByCreatedAtAsc(ForumPost post, Pageable pageable);
    Page<ForumComment> findByAuthor(User author, Pageable pageable);
} 