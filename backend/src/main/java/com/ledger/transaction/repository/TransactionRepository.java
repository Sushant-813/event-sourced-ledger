package com.ledger.transaction.repository;

import com.ledger.transaction.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Optional<Transaction> findByReferenceNumber(String referenceNumber);

    boolean existsByReferenceNumber(String referenceNumber);
}