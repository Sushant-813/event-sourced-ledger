package com.ledger.event.service;

import com.ledger.account.entity.Account;
import com.ledger.event.entity.Event;
import com.ledger.event.entity.EventType;
import com.ledger.event.exception.EventNotFoundException;
import com.ledger.event.repository.EventRepository;
import com.ledger.transaction.entity.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class EventServiceImpl implements EventService {

    private static final Logger logger = LoggerFactory.getLogger(EventServiceImpl.class);

    private final EventRepository eventRepository;

    public EventServiceImpl(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @Override
    @Transactional
    public Event recordEvent(
            Account account,
            Transaction transaction,
            EventType eventType,
            String payload,
            OffsetDateTime occurredAt) {

        if (account == null) {
            throw new IllegalArgumentException("Account cannot be null");
        }

        if (eventType == null) {
            throw new IllegalArgumentException("Event type cannot be null");
        }

        if (occurredAt == null) {
            throw new IllegalArgumentException("Occurred at cannot be null");
        }

        Event event = new Event(
                account,
                transaction,
                eventType,
                payload,
                occurredAt);

        Event savedEvent = eventRepository.save(event);

        logger.debug(
                "Recorded event [{}] for account [{}]",
                eventType,
                account.getId());

        return savedEvent;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> getEventsByAccount(Long accountId) {
        return eventRepository
                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> getEventsByTransaction(Long transactionId) {
        return eventRepository
                .findByTransactionIdOrderByOccurredAtAscIdAsc(transactionId);
    }

    @Override
    @Transactional(readOnly = true)
    public Event getEventById(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException(
                        "Event not found: " + eventId));
    }
}