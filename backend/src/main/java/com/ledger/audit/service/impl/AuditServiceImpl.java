package com.ledger.audit.service.impl;

import com.ledger.account.repository.AccountRepository;
import com.ledger.audit.service.AuditService;
import com.ledger.balance.service.BalanceReconstructionService;
import com.ledger.event.repository.EventRepository;
import com.ledger.ledger.repository.LedgerEntryRepository;
import com.ledger.transaction.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import com.ledger.account.entity.Account;
import com.ledger.account.exception.AccountNotFoundException;
import com.ledger.common.constant.SystemAccountConstants;
import com.ledger.audit.dto.AccountEventResponse;
import com.ledger.event.entity.Event;
import com.ledger.audit.dto.AccountTransactionResponse;
import com.ledger.transaction.entity.Transaction;
import com.ledger.audit.dto.AccountLedgerEntryResponse;
import com.ledger.ledger.entity.LedgerEntry;
import com.ledger.audit.dto.AuditBalanceResponse;
import com.ledger.audit.dto.AuditTrailItemResponse;
import com.ledger.audit.dto.AuditTrailResponse;
import com.ledger.event.entity.EventType;
import com.ledger.ledger.entity.EntryType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import java.util.List;

@Service
public class AuditServiceImpl implements AuditService {

    private final AccountRepository accountRepository;
    private final EventRepository eventRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final BalanceReconstructionService balanceReconstructionService;

    public AuditServiceImpl(
            AccountRepository accountRepository,
            EventRepository eventRepository,
            TransactionRepository transactionRepository,
            LedgerEntryRepository ledgerEntryRepository,
            BalanceReconstructionService balanceReconstructionService) {

        this.accountRepository = accountRepository;
        this.eventRepository = eventRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.balanceReconstructionService = balanceReconstructionService;
    }

    @Override
    public List<AccountEventResponse> getEventHistory(Long accountId) {

        validatePublicAccount(accountId);

        List<Event> events = eventRepository.findByAccountIdOrderByOccurredAtAscIdAsc(accountId);

        return events.stream()
                .map(event -> new AccountEventResponse(
                        event.getId(),
                        event.getEventType(),
                        event.getTransaction() != null
                                ? event.getTransaction().getId()
                                : null,
                        event.getPayload(),
                        event.getOccurredAt()))
                .toList();
    }

    @Override
    public List<AccountTransactionResponse> getTransactionHistory(Long accountId) {

        validatePublicAccount(accountId);

        List<Event> events = eventRepository.findByAccountIdOrderByOccurredAtAscIdAsc(accountId);

        Set<Long> transactionIds = events.stream()
                .map(Event::getTransaction)
                .filter(transaction -> transaction != null)
                .map(Transaction::getId)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (transactionIds.isEmpty()) {
            return List.of();
        }

        Map<Long, Transaction> transactionsById = transactionRepository.findAllById(transactionIds)
                .stream()
                .collect(Collectors.toMap(
                        Transaction::getId,
                        Function.identity()));

        return transactionIds.stream()
                .map(transactionsById::get)
                .filter(transaction -> transaction != null)
                .map(transaction -> new AccountTransactionResponse(
                        transaction.getId(),
                        transaction.getReferenceNumber(),
                        transaction.getTransactionType(),
                        transaction.getStatus(),
                        transaction.getCreatedAt()))
                .toList();
    }

    @Override
    public List<AccountLedgerEntryResponse> getLedgerHistory(Long accountId) {

        validatePublicAccount(accountId);

        List<LedgerEntry> ledgerEntries = ledgerEntryRepository
                .findByAccountIdOrderByCreatedAtAscIdAsc(accountId);

        Set<Long> transactionIds = ledgerEntries.stream()
                .map(LedgerEntry::getTransaction)
                .map(Transaction::getId)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        Map<Long, Transaction> transactionsById = transactionRepository.findAllById(transactionIds)
                .stream()
                .collect(Collectors.toMap(
                        Transaction::getId,
                        Function.identity()));

        return ledgerEntries.stream()
                .map(ledgerEntry -> {
                    Transaction transaction = transactionsById.get(
                            ledgerEntry.getTransaction().getId());

                    return new AccountLedgerEntryResponse(
                            ledgerEntry.getId(),
                            transaction.getId(),
                            transaction.getReferenceNumber(),
                            ledgerEntry.getEntryType(),
                            ledgerEntry.getAmount(),
                            ledgerEntry.getCreatedAt());
                })
                .toList();
    }

    @Override
    public AuditBalanceResponse getBalance(
            Long accountId,
            OffsetDateTime asOf) {

        validatePublicAccount(accountId);

        BigDecimal balance;

        if (asOf == null) {
            balance = balanceReconstructionService
                    .reconstructCurrentBalance(accountId);
        } else {
            balance = balanceReconstructionService
                    .reconstructBalanceAt(accountId, asOf);
        }

        return new AuditBalanceResponse(
                accountId,
                balance,
                asOf);
    }

    @Override
    public AuditTrailResponse getAuditTrail(
            Long accountId,
            OffsetDateTime asOf) {

        validatePublicAccount(accountId);

        List<Event> events;

        if (asOf == null) {
            events = eventRepository
                    .findByAccountIdOrderByOccurredAtAscIdAsc(accountId);
        } else {
            events = eventRepository
                    .findByAccountIdAndOccurredAtLessThanEqualOrderByOccurredAtAscIdAsc(
                            accountId,
                            asOf);
        }

        Set<Long> transactionIds = events.stream()
                .filter(event -> event.getTransaction() != null)
                .map(event -> event.getTransaction().getId())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        Map<Long, Transaction> transactionsById = transactionRepository.findAllById(transactionIds)
                .stream()
                .collect(Collectors.toMap(
                        Transaction::getId,
                        Function.identity()));

        Map<Long, List<LedgerEntry>> ledgerEntriesByTransactionId = ledgerEntryRepository
                .findByTransactionIdIn(transactionIds)
                .stream()
                .collect(Collectors.groupingBy(
                        entry -> entry.getTransaction().getId()));

        BigDecimal runningBalance = BigDecimal.ZERO;

        List<AuditTrailItemResponse> items = new java.util.ArrayList<>();

        for (Event event : events) {

            BigDecimal balanceChange = BigDecimal.ZERO;
            Long transactionId = null;
            String referenceNumber = null;

            if (event.getEventType() != EventType.ACCOUNT_CREATED) {

                if (event.getTransaction() == null) {
                    throw new IllegalStateException(
                            "Monetary event has no associated transaction: "
                                    + event.getId());
                }

                transactionId = event.getTransaction().getId();

                Transaction transaction = transactionsById.get(transactionId);

                if (transaction == null) {
                    throw new IllegalStateException(
                            "Transaction not found for event: "
                                    + event.getId());
                }

                referenceNumber = transaction.getReferenceNumber();

                List<LedgerEntry> ledgerEntries = ledgerEntriesByTransactionId.get(transactionId);

                if (ledgerEntries == null || ledgerEntries.isEmpty()) {
                    throw new IllegalStateException(
                            "No ledger entries found for transaction: "
                                    + transactionId);
                }

                balanceChange = ledgerEntries.stream()
                        .filter(entry -> entry.getAccount()
                                .getId()
                                .equals(accountId))
                        .map(entry -> {
                            if (entry.getEntryType() == EntryType.CREDIT) {
                                return entry.getAmount();
                            }

                            return entry.getAmount().negate();
                        })
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                boolean hasAccountEntry = ledgerEntries.stream()
                        .anyMatch(entry -> entry.getAccount()
                                .getId()
                                .equals(accountId));

                if (!hasAccountEntry) {
                    throw new IllegalStateException(
                            "No ledger entry found for account "
                                    + accountId
                                    + " in transaction "
                                    + transactionId);
                }

                runningBalance = runningBalance.add(balanceChange);
            }

            items.add(new AuditTrailItemResponse(
                    event.getId(),
                    event.getEventType(),
                    transactionId,
                    referenceNumber,
                    balanceChange,
                    runningBalance,
                    event.getOccurredAt()));
        }

        return new AuditTrailResponse(
                accountId,
                runningBalance,
                asOf,
                items);
    }

    private Account validatePublicAccount(Long accountId) {

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(
                        "Account not found: " + accountId));

        if (SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER
                .equals(account.getAccountNumber())) {

            throw new AccountNotFoundException(
                    "Account not found: " + accountId);
        }

        return account;
    }
}