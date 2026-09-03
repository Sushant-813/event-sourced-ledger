package com.ledger.event.service;

import com.ledger.account.entity.Account;
import com.ledger.event.entity.Event;
import com.ledger.event.entity.EventType;
import com.ledger.event.exception.EventNotFoundException;
import com.ledger.event.repository.EventRepository;
import com.ledger.transaction.entity.Transaction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;

    private EventServiceImpl eventService;

    private Account account;
    private Transaction transaction;
    private OffsetDateTime occurredAt;

    @BeforeEach
    void setUp() {
        eventService = new EventServiceImpl(eventRepository);
        account = mock(Account.class);
        transaction = mock(Transaction.class);
        occurredAt = OffsetDateTime.parse("2026-09-03T12:00:00Z");
    }

    @Test
    void shouldRecordEventWithTransaction() {
        Event savedEvent = new Event(
                account,
                transaction,
                EventType.DEPOSIT,
                null,
                occurredAt);

        when(eventRepository.save(any(Event.class))).thenReturn(savedEvent);

        Event result = eventService.recordEvent(
                account,
                transaction,
                EventType.DEPOSIT,
                null,
                occurredAt);

        assertSame(savedEvent, result);

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());

        Event capturedEvent = captor.getValue();

        assertSame(account, capturedEvent.getAccount());
        assertSame(transaction, capturedEvent.getTransaction());
        assertEquals(EventType.DEPOSIT, capturedEvent.getEventType());
        assertNull(capturedEvent.getPayload());
        assertEquals(occurredAt, capturedEvent.getOccurredAt());
    }

    @Test
    void shouldRecordEventWithoutTransaction() {
        Event savedEvent = new Event(
                account,
                null,
                EventType.ACCOUNT_CREATED,
                null,
                occurredAt);

        when(eventRepository.save(any(Event.class))).thenReturn(savedEvent);

        Event result = eventService.recordEvent(
                account,
                null,
                EventType.ACCOUNT_CREATED,
                null,
                occurredAt);

        assertSame(savedEvent, result);
        verify(eventRepository).save(any(Event.class));
    }

    @Test
    void shouldRecordEventWithPayload() {
        String payload = "{\"description\":\"test deposit\"}";

        Event savedEvent = new Event(
                account,
                transaction,
                EventType.DEPOSIT,
                payload,
                occurredAt);

        when(eventRepository.save(any(Event.class))).thenReturn(savedEvent);

        eventService.recordEvent(
                account,
                transaction,
                EventType.DEPOSIT,
                payload,
                occurredAt);

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());

        assertEquals(payload, captor.getValue().getPayload());
    }

    @Test
    void shouldUseCallerSuppliedOccurredAt() {
        OffsetDateTime specificTime = OffsetDateTime.parse("2026-01-15T10:30:45Z");

        Event savedEvent = new Event(
                account,
                transaction,
                EventType.DEPOSIT,
                null,
                specificTime);

        when(eventRepository.save(any(Event.class))).thenReturn(savedEvent);

        eventService.recordEvent(
                account,
                transaction,
                EventType.DEPOSIT,
                null,
                specificTime);

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());

        assertEquals(
                specificTime,
                captor.getValue().getOccurredAt());
    }

    @Test
    void shouldReturnObjectReturnedBySave() {
        Event savedEvent = new Event(
                account,
                transaction,
                EventType.WITHDRAWAL,
                null,
                occurredAt);

        when(eventRepository.save(any(Event.class))).thenReturn(savedEvent);

        Event result = eventService.recordEvent(
                account,
                transaction,
                EventType.WITHDRAWAL,
                null,
                occurredAt);

        assertSame(savedEvent, result);
    }

    @Test
    void shouldThrowIllegalArgumentExceptionWhenAccountIsNull() {
        assertThrows(
                IllegalArgumentException.class,
                () -> eventService.recordEvent(
                        null,
                        transaction,
                        EventType.DEPOSIT,
                        null,
                        occurredAt));

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void shouldThrowIllegalArgumentExceptionWhenEventTypeIsNull() {
        assertThrows(
                IllegalArgumentException.class,
                () -> eventService.recordEvent(
                        account,
                        transaction,
                        null,
                        null,
                        occurredAt));

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void shouldThrowIllegalArgumentExceptionWhenOccurredAtIsNull() {
        assertThrows(
                IllegalArgumentException.class,
                () -> eventService.recordEvent(
                        account,
                        transaction,
                        EventType.DEPOSIT,
                        null,
                        null));

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void shouldDelegateToOrderedRepositoryMethodForAccountQuery() {
        Long accountId = 1L;
        List<Event> events = List.of();

        when(eventRepository.findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                .thenReturn(events);

        eventService.getEventsByAccount(accountId);

        verify(eventRepository)
                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId);
    }

    @Test
    void shouldReturnEventsForAccountUnchanged() {
        Long accountId = 1L;
        Event event = mock(Event.class);
        List<Event> events = List.of(event);

        when(eventRepository.findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                .thenReturn(events);

        List<Event> result = eventService.getEventsByAccount(accountId);

        assertSame(events, result);
    }

    @Test
    void shouldReturnEmptyListWhenAccountHasNoEvents() {
        Long accountId = 1L;

        when(eventRepository.findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                .thenReturn(List.of());

        List<Event> result = eventService.getEventsByAccount(accountId);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void shouldDelegateToOrderedRepositoryMethodForTransactionQuery() {
        Long transactionId = 1L;
        List<Event> events = List.of();

        when(eventRepository.findByTransactionIdOrderByOccurredAtAscIdAsc(transactionId))
                .thenReturn(events);

        eventService.getEventsByTransaction(transactionId);

        verify(eventRepository)
                .findByTransactionIdOrderByOccurredAtAscIdAsc(transactionId);
    }

    @Test
    void shouldReturnEventsForTransactionUnchanged() {
        Long transactionId = 1L;
        Event event = mock(Event.class);
        List<Event> events = List.of(event);

        when(eventRepository.findByTransactionIdOrderByOccurredAtAscIdAsc(transactionId))
                .thenReturn(events);

        List<Event> result = eventService.getEventsByTransaction(transactionId);

        assertSame(events, result);
    }

    @Test
    void shouldReturnEmptyListWhenTransactionHasNoEvents() {
        Long transactionId = 1L;

        when(eventRepository.findByTransactionIdOrderByOccurredAtAscIdAsc(transactionId))
                .thenReturn(List.of());

        List<Event> result = eventService.getEventsByTransaction(transactionId);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void shouldReturnEventWhenFoundById() {
        Long eventId = 1L;
        Event event = mock(Event.class);

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.of(event));

        Event result = eventService.getEventById(eventId);

        assertSame(event, result);

        verify(eventRepository).findById(eventId);
    }

    @Test
    void shouldThrowEventNotFoundExceptionWhenIdDoesNotExist() {
        Long eventId = 99L;

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.empty());

        assertThrows(
                EventNotFoundException.class,
                () -> eventService.getEventById(eventId));

        verify(eventRepository).findById(eventId);
    }
}