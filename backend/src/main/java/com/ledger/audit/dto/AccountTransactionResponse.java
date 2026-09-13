package com.ledger.audit.dto;

import com.ledger.transaction.entity.TransactionStatus;
import com.ledger.transaction.entity.TransactionType;

import java.time.OffsetDateTime;

public record AccountTransactionResponse(
        Long transactionId,
        String referenceNumber,
        TransactionType transactionType,
        TransactionStatus status,
        OffsetDateTime createdAt) {
}