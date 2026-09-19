package com.ledger.account.repository;

import com.ledger.account.entity.Account;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.entity.AccountType;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByAccountNumber(String accountNumber);

    boolean existsByAccountNumber(String accountNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.id = :id")
    Optional<Account> findByIdForUpdate(@Param("id") Long id);

    Page<Account> findAllByAccountNumberNot(
            String accountNumber,
            Pageable pageable);

    Page<Account> findAllByAccountNumberNotAndStatus(
            String accountNumber,
            AccountStatus status,
            Pageable pageable);

    Page<Account> findAllByAccountNumberNotAndAccountType(
            String accountNumber,
            AccountType accountType,
            Pageable pageable);

    Page<Account> findAllByAccountNumberNotAndStatusAndAccountType(
            String accountNumber,
            AccountStatus status,
            AccountType accountType,
            Pageable pageable);
}