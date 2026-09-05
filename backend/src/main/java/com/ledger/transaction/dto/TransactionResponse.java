package com.ledger.transaction.dto;

import com.ledger.transaction.entity.TransactionStatus;
import com.ledger.transaction.entity.TransactionType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record TransactionResponse(
        Long transactionId,
        String referenceNumber,
        TransactionType transactionType,
        TransactionStatus status,
        Long accountId,
        BigDecimal amount,
        OffsetDateTime createdAt) {
}