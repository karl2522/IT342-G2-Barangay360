package org.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.backend.model.ForumComment;
import org.backend.model.ForumPost;
import org.backend.model.User;
import org.backend.security.services.UserDetailsImpl;
import org.backend.service.ForumService;
import org.backend.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, maxAge = 3600)
public class ForumController {
    private static final Logger logger = LoggerFactory.getLogger(ForumController.class);

    private final ForumService forumService;
    private final UserService userService;

    // Post endpoints
    @PostMapping("/posts")
    public ResponseEntity<ForumPost> createPost(
            @RequestParam("title") @NotBlank @Size(max = 255) String title,
            @RequestParam("content") @NotBlank String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        try {
            User author = userService.getUserById(userDetails.getId());
            ForumPost post = forumService.createPost(title, content, author, image);
            return ResponseEntity.status(HttpStatus.CREATED).body(post);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null); // TODO: Create a proper error response
        }
    }

    @GetMapping("/posts")
    public ResponseEntity<Page<ForumPost>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<ForumPost> posts = forumService.getAllPosts(pageable);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<ForumPost> getPostById(@PathVariable Long postId) {
        ForumPost post = forumService.getPostById(postId);
        return ResponseEntity.ok(post);
    }

    @GetMapping("/users/{userId}/posts")
    public ResponseEntity<Page<ForumPost>> getPostsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        User user = userService.getUserById(userId);
        Pageable pageable = PageRequest.of(page, size);
        Page<ForumPost> posts = forumService.getPostsByUser(user, pageable);
        return ResponseEntity.ok(posts);
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<ForumPost> updatePost(
            @PathVariable Long postId,
            @RequestParam("title") @NotBlank @Size(max = 255) String title,
            @RequestParam("content") @NotBlank String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        try {
            User currentUser = userService.getUserById(userDetails.getId());
            ForumPost post = forumService.updatePost(postId, title, content, image, currentUser);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null); // TODO: Create a proper error response
        }
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Map<String, String>> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        Map<String, String> response = new HashMap<>();
        try {
            User currentUser = userService.getUserById(userDetails.getId());
            forumService.deletePost(postId, currentUser);
            
            response.put("message", "Post deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Post deletion failed");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(response);
        }
    }

    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<ForumPost> toggleLikePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        User user = userService.getUserById(userDetails.getId());
        ForumPost post = forumService.toggleLikePost(postId, user);
        return ResponseEntity.ok(post);
    }

    // Comment endpoints
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<ForumComment> createComment(
            @PathVariable Long postId,
            @RequestParam("content") @NotBlank String content,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        try {
            User author = userService.getUserById(userDetails.getId());
            ForumComment comment = forumService.createComment(postId, content, author);
            return ResponseEntity.status(HttpStatus.CREATED).body(comment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null); // TODO: Create a proper error response
        }
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<ForumComment>> getCommentsByPost(@PathVariable Long postId) {
        List<ForumComment> comments = forumService.getCommentsByPost(postId);
        return ResponseEntity.ok(comments);
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<ForumComment> updateComment(
            @PathVariable Long commentId,
            @RequestParam("content") @NotBlank String content,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        try {
            User currentUser = userService.getUserById(userDetails.getId());
            ForumComment comment = forumService.updateComment(commentId, content, currentUser);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null); // TODO: Create a proper error response
        }
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Map<String, String>> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        Map<String, String> response = new HashMap<>();
        try {
            User currentUser = userService.getUserById(userDetails.getId());
            forumService.deleteComment(commentId, currentUser);
            
            response.put("message", "Comment deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Comment deletion failed");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(response);
        }
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<ForumComment> toggleLikeComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        User user = userService.getUserById(userDetails.getId());
        ForumComment comment = forumService.toggleLikeComment(commentId, user);
        return ResponseEntity.ok(comment);
    }
    
    // Add a simple redirection for backward compatibility
    @PostMapping("/posts/{postId}/report")
    public ResponseEntity<Map<String, String>> reportPostRedirect(
            @PathVariable Long postId,
            @RequestParam("reason") String reason,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        logger.info("Redirecting report request to the new endpoint");
        Map<String, String> response = new HashMap<>();
        response.put("message", "Please use the new endpoint: /api/reports/post/" + postId);
        return ResponseEntity.status(HttpStatus.MOVED_PERMANENTLY).body(response);
    }
}
