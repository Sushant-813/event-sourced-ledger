package com.ledger.ledger.repository;

import com.ledger.ledger.entity.LedgerEntry;

import java.util.List;
import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.ledger.ledger.entity.EntryType;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {
    List<LedgerEntry> findByTransactionId(Long transactionId);

    List<LedgerEntry> findByAccountId(Long accountId);

    List<LedgerEntry> findByAccountIdOrderByCreatedAtAscIdAsc(Long accountId);

    List<LedgerEntry> findByTransactionIdIn(Collection<Long> transactionIds);

    Page<LedgerEntry> findByAccountId(
            Long accountId,
            Pageable pageable);

    Page<LedgerEntry> findByAccountIdAndEntryType(
            Long accountId,
            EntryType entryType,
            Pageable pageable);

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