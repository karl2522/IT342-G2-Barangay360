package org.backend.service;

import org.backend.model.Event;
import org.backend.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class EventServiceImpl implements EventService {

    @Autowired
    private EventRepository eventRepository;

    @Override
    @Transactional
    public Event createEvent(Event event) {
        // Add any validation or business logic before saving
        return eventRepository.save(event);
    }

    @Override
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    @Override
    @Transactional
    public Event updateEvent(Long id, Event eventDetails) {
        Optional<Event> optionalEvent = eventRepository.findById(id);
        if (optionalEvent.isPresent()) {
            Event existingEvent = optionalEvent.get();
            // Update fields from eventDetails
            existingEvent.setTitle(eventDetails.getTitle());
            existingEvent.setDescription(eventDetails.getDescription());
            existingEvent.setLocation(eventDetails.getLocation());
            existingEvent.setStart(eventDetails.getStart());
            existingEvent.setEnd(eventDetails.getEnd());
            existingEvent.setAllDay(eventDetails.isAllDay());
            existingEvent.setColor(eventDetails.getColor());
            // Add any other fields that need updating

            return eventRepository.save(existingEvent);
        } else {
            // Handle the case where the event is not found, e.g., throw an exception or return null
            // For now, let's return null, but a custom exception might be better
            // Or throw new ResourceNotFoundException("Event not found with id " + id);
            return null;
        }
    }

    @Override
    @Transactional
    public boolean deleteEvent(Long id) {
        if (eventRepository.existsById(id)) {
            eventRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
