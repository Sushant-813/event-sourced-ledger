package com.ledger.audit.dto;

import com.ledger.ledger.entity.EntryType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record AccountLedgerEntryResponse(
        Long ledgerEntryId,
        Long transactionId,
        String referenceNumber,
        EntryType entryType,
        BigDecimal amount,
        OffsetDateTime createdAt) {
}