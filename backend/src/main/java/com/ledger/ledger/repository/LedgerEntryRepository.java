package com.ledger.ledger.repository;

import com.ledger.ledger.entity.LedgerEntry;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {
    List<LedgerEntry> findByTransactionId(Long transactionId);

    List<LedgerEntry> findByAccountId(Long accountId);
}