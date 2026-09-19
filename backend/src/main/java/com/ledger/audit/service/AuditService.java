package com.ledger.audit.service;

import com.ledger.audit.dto.AccountEventResponse;
import com.ledger.audit.dto.AccountLedgerEntryResponse;
import com.ledger.audit.dto.AccountTransactionResponse;
import com.ledger.audit.dto.AuditBalanceResponse;
import com.ledger.audit.dto.AuditTrailResponse;
import com.ledger.common.dto.PagedResponse;
import com.ledger.ledger.entity.EntryType;

import java.time.OffsetDateTime;

public interface AuditService {

    PagedResponse<AccountEventResponse> getEventHistory(
            Long accountId,
            int page,
            int size,
            String sortBy,
            String direction);

    PagedResponse<AccountTransactionResponse> getTransactionHistory(
            Long accountId,
            int page,
            int size);

    PagedResponse<AccountLedgerEntryResponse> getLedgerHistory(
            Long accountId,
            int page,
            int size,
            String sortBy,
            String direction,
            EntryType entryType);

    AuditBalanceResponse getBalance(
            Long accountId,
            OffsetDateTime asOf);

    AuditTrailResponse getAuditTrail(
            Long accountId,
            OffsetDateTime asOf,
            int page,
            int size);
}