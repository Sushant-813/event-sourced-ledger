package com.ledger.audit.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record AuditBalanceResponse(
        Long accountId,
        BigDecimal balance,
        OffsetDateTime asOf) {
}