package com.ledger.audit.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record AuditTrailResponse(
        Long accountId,
        BigDecimal finalBalance,
        OffsetDateTime asOf,
        List<AuditTrailItemResponse> items) {
}