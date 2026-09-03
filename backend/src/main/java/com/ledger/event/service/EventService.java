package com.ledger.event.service;

import com.ledger.account.entity.Account;
import com.ledger.event.entity.Event;
import com.ledger.event.entity.EventType;
import com.ledger.transaction.entity.Transaction;

import java.time.OffsetDateTime;
import java.util.List;

public interface EventService {

    Event recordEvent(
            Account account,
            Transaction transaction,
            EventType eventType,
            String payload,
            OffsetDateTime occurredAt);

    List<Event> getEventsByAccount(Long accountId);

    List<Event> getEventsByTransaction(Long transactionId);

    Event getEventById(Long eventId);
}