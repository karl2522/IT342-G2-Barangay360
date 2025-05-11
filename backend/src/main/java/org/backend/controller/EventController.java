package org.backend.controller;

import org.backend.model.Event;
import org.backend.service.EventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
// CORS is handled globally in WebSecurityConfig
@CrossOrigin(origins = {"https://barangay360.vercel.app","http://localhost:5173"})
public class EventController {

    // Add Logger instance
    private static final Logger logger = LoggerFactory.getLogger(EventController.class);

    @Autowired
    private EventService eventService;

    // Endpoint for officials to create an event
    @PostMapping
    @PreAuthorize("hasRole('OFFICIAL') or hasRole('ADMIN')")
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        // Log entry into the controller method and the received event data
        logger.info("POST /api/events called. Received event data: {}", event);
        // You could add more specific logging here if needed:
        // logger.debug("Received Title: {}", event.getTitle());
        // logger.debug("Received Date: {}", event.getDate());

        try {
            Event createdEvent = eventService.createEvent(event);
            logger.info("Event successfully created by service with ID: {}", createdEvent.getId());
            return ResponseEntity.ok(createdEvent);
        } catch (Exception e) {
            // Log exceptions specifically from the service call or potential controller issues
            logger.error("Error occurred during event creation processing for title '{}': {}", event != null ? event.getTitle() : "[null event object]", e.getMessage(), e);
            // Consider returning a more appropriate error response
            return ResponseEntity.internalServerError().body(null); // Or a custom error response object
        }
    }

    // Endpoint for residents (and others) to get all events
    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        List<Event> events = eventService.getAllEvents();
        return ResponseEntity.ok(events);
    }

    // Endpoint for officials to update an event
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OFFICIAL') or hasRole('ADMIN')")
    public ResponseEntity<Event> updateEvent(@PathVariable Long id, @RequestBody Event eventDetails) {
        logger.info("PUT /api/events/{} called. Received update data: {}", id, eventDetails);
        try {
            Event updatedEvent = eventService.updateEvent(id, eventDetails);
            if (updatedEvent != null) {
                logger.info("Event with ID {} successfully updated.", id);
                return ResponseEntity.ok(updatedEvent);
            } else {
                logger.warn("Attempted to update non-existent event with ID: {}", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error occurred during event update processing for ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(null);
        }
    }

    // Endpoint for officials to delete an event
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OFFICIAL') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        logger.info("DELETE /api/events/{} called", id);
        try {
            boolean deleted = eventService.deleteEvent(id);
            if (deleted) {
                logger.info("Event with ID {} successfully deleted.", id);
                return ResponseEntity.ok().build();
            } else {
                logger.warn("Attempted to delete non-existent event with ID: {}", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error occurred during event deletion for ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
