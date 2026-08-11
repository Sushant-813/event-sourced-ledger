package com.ledger.account.dto;

import com.ledger.account.entity.AccountStatus;
import com.ledger.account.entity.AccountType;

import java.time.OffsetDateTime;

public record AccountResponse(
        Long id,
        String accountNumber,
        String accountName,
        AccountType accountType,
        AccountStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
}