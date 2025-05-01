package org.backend.controller;

import lombok.RequiredArgsConstructor;
import org.backend.model.ForumComment;
import org.backend.repository.ForumCommentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
//@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, maxAge = 3600)
public class CommentController {
    private static final Logger logger = LoggerFactory.getLogger(CommentController.class);

    private final ForumCommentRepository commentRepository;

    @GetMapping("/{commentId}")
    public ResponseEntity<ForumComment> getCommentById(@PathVariable Long commentId) {
        logger.info("Fetching comment with ID: {}", commentId);
        
        Optional<ForumComment> comment = commentRepository.findById(commentId);
        
        if (comment.isPresent()) {
            logger.info("Comment found: {}", comment.get().getId());
            return ResponseEntity.ok(comment.get());
        } else {
            logger.warn("Comment not found with ID: {}", commentId);
            return ResponseEntity.notFound().build();
        }
    }
}