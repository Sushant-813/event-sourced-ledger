package com.ledger.ledger.repository;

import com.ledger.ledger.entity.LedgerEntry;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {
    List<LedgerEntry> findByTransactionId(Long transactionId);

    List<LedgerEntry> findByAccountId(Long accountId);

    @Query("""
            SELECT COALESCE(
                SUM(
                    CASE
                        WHEN e.entryType = com.ledger.ledger.entity.EntryType.CREDIT
                        THEN e.amount
                        ELSE -e.amount
                    END
                ),
                0
            )
            FROM LedgerEntry e
            WHERE e.account.id = :accountId
            """)
    BigDecimal computeBalanceByAccountId(@Param("accountId") Long accountId);
}