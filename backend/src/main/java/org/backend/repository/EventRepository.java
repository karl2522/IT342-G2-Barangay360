package org.backend.repository;

import org.backend.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    // You can add custom query methods here if needed
    // For example: List<Event> findByLocation(String location);
} 