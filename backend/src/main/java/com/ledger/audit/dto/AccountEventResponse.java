package com.ledger.audit.dto;

import com.ledger.event.entity.EventType;

import java.time.OffsetDateTime;

public record AccountEventResponse(
        Long eventId,
        EventType eventType,
        Long transactionId,
        String payload,
        OffsetDateTime occurredAt) {
}