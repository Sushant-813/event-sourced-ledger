package com.ledger.ledger.service;

import com.ledger.ledger.entity.LedgerEntry;
import com.ledger.transaction.entity.Transaction;

import java.util.List;

public interface LedgerService {

    void recordTransaction(
            Transaction transaction,
            List<LedgerEntry> entries);
}