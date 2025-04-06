package org.backend.service;

import org.backend.model.Event;
import java.util.List;

public interface EventService {
    Event createEvent(Event event);
    List<Event> getAllEvents();
    Event updateEvent(Long id, Event eventDetails);
    // Add other method signatures like deleteEvent, getEventById if needed
} 