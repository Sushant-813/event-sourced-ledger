package com.ledger.audit.dto;

import com.ledger.event.entity.EventType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record AuditTrailItemResponse(
        Long eventId,
        EventType eventType,
        Long transactionId,
        String referenceNumber,
        BigDecimal balanceChange,
        BigDecimal runningBalance,
        OffsetDateTime occurredAt) {
}