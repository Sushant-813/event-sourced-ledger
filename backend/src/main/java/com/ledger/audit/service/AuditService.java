package com.ledger.audit.service;

import com.ledger.audit.dto.AccountEventResponse;
import com.ledger.audit.dto.AccountLedgerEntryResponse;
import com.ledger.audit.dto.AccountTransactionResponse;
import com.ledger.audit.dto.AuditBalanceResponse;
import com.ledger.audit.dto.AuditTrailResponse;

import java.time.OffsetDateTime;
import java.util.List;

public interface AuditService {

    List<AccountEventResponse> getEventHistory(Long accountId);

    List<AccountTransactionResponse> getTransactionHistory(Long accountId);

    List<AccountLedgerEntryResponse> getLedgerHistory(Long accountId);

    AuditBalanceResponse getBalance(Long accountId, OffsetDateTime asOf);

    AuditTrailResponse getAuditTrail(Long accountId, OffsetDateTime asOf);
}