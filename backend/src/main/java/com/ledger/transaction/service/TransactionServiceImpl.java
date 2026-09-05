package com.ledger.transaction.service;

import com.ledger.account.entity.Account;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.exception.AccountNotFoundException;
import com.ledger.account.repository.AccountRepository;
import com.ledger.common.constant.SystemAccountConstants;
import com.ledger.event.entity.EventType;
import com.ledger.event.service.EventService;
import com.ledger.ledger.entity.EntryType;
import com.ledger.ledger.entity.LedgerEntry;
import com.ledger.ledger.repository.LedgerEntryRepository;
import com.ledger.ledger.service.LedgerService;
import com.ledger.transaction.dto.DepositRequest;
import com.ledger.transaction.dto.TransactionResponse;
import com.ledger.transaction.dto.WithdrawalRequest;
import com.ledger.transaction.entity.Transaction;
import com.ledger.transaction.entity.TransactionStatus;
import com.ledger.transaction.entity.TransactionType;
import com.ledger.transaction.exception.AccountNotEligibleForTransactionException;
import com.ledger.transaction.exception.InsufficientFundsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
public class TransactionServiceImpl implements TransactionService {

    private final AccountRepository accountRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final LedgerService ledgerService;
    private final EventService eventService;

    public TransactionServiceImpl(
            AccountRepository accountRepository,
            LedgerEntryRepository ledgerEntryRepository,
            LedgerService ledgerService,
            EventService eventService) {
        this.accountRepository = accountRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.ledgerService = ledgerService;
        this.eventService = eventService;
    }

    // methods will go here
    @Override
    @Transactional(rollbackFor = Exception.class)
    public TransactionResponse deposit(Long accountId, DepositRequest request) {

        Account customerAccount = accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + accountId));

        if (SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER
                .equals(customerAccount.getAccountNumber())) {
            throw new AccountNotFoundException("Account not found: " + accountId);
        }

        if (customerAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new AccountNotEligibleForTransactionException(
                    "Account is not eligible for transaction: " + accountId);
        }

        Account systemAccount = accountRepository
                .findByAccountNumber(
                        SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER)
                .orElseThrow(() -> new IllegalStateException(
                        "System cash account is missing"));

        String referenceNumber = UUID.randomUUID().toString();
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        Transaction transaction = new Transaction(
                referenceNumber,
                TransactionType.DEPOSIT,
                TransactionStatus.COMPLETED,
                now);

        LedgerEntry debitEntry = new LedgerEntry(
                transaction,
                systemAccount,
                EntryType.DEBIT,
                request.amount(),
                now);

        LedgerEntry creditEntry = new LedgerEntry(
                transaction,
                customerAccount,
                EntryType.CREDIT,
                request.amount(),
                now);

        ledgerService.recordTransaction(
                transaction,
                List.of(debitEntry, creditEntry));

        eventService.recordEvent(
                customerAccount,
                transaction,
                EventType.DEPOSIT,
                null,
                now);

        return new TransactionResponse(
                transaction.getId(),
                transaction.getReferenceNumber(),
                transaction.getTransactionType(),
                transaction.getStatus(),
                customerAccount.getId(),
                request.amount(),
                transaction.getCreatedAt());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TransactionResponse withdraw(
            Long accountId,
            WithdrawalRequest request) {

        Account customerAccount = accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + accountId));

        if (SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER
                .equals(customerAccount.getAccountNumber())) {
            throw new AccountNotFoundException("Account not found: " + accountId);
        }

        if (customerAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new AccountNotEligibleForTransactionException(
                    "Account is not eligible for transaction: " + accountId);
        }

        BigDecimal balance = ledgerEntryRepository.computeBalanceByAccountId(accountId);

        if (balance.compareTo(request.amount()) < 0) {
            throw new InsufficientFundsException(
                    "Insufficient funds for account: " + accountId);
        }

        Account systemAccount = accountRepository
                .findByAccountNumber(
                        SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER)
                .orElseThrow(() -> new IllegalStateException(
                        "System cash account is missing"));

        String referenceNumber = UUID.randomUUID().toString();
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        Transaction transaction = new Transaction(
                referenceNumber,
                TransactionType.WITHDRAWAL,
                TransactionStatus.COMPLETED,
                now);

        LedgerEntry debitEntry = new LedgerEntry(
                transaction,
                customerAccount,
                EntryType.DEBIT,
                request.amount(),
                now);

        LedgerEntry creditEntry = new LedgerEntry(
                transaction,
                systemAccount,
                EntryType.CREDIT,
                request.amount(),
                now);

        ledgerService.recordTransaction(
                transaction,
                List.of(debitEntry, creditEntry));

        eventService.recordEvent(
                customerAccount,
                transaction,
                EventType.WITHDRAWAL,
                null,
                now);

        return new TransactionResponse(
                transaction.getId(),
                transaction.getReferenceNumber(),
                transaction.getTransactionType(),
                transaction.getStatus(),
                customerAccount.getId(),
                request.amount(),
                transaction.getCreatedAt());
    }
}