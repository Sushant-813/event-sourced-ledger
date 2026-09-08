package com.ledger.balance.service.impl;

import com.ledger.account.entity.Account;
import com.ledger.account.exception.AccountNotFoundException;
import com.ledger.account.repository.AccountRepository;
import com.ledger.balance.service.BalanceReconstructionService;
import com.ledger.common.constant.SystemAccountConstants;
import com.ledger.event.entity.Event;
import com.ledger.event.entity.EventType;
import com.ledger.event.repository.EventRepository;
import com.ledger.ledger.entity.EntryType;
import com.ledger.ledger.entity.LedgerEntry;
import com.ledger.ledger.repository.LedgerEntryRepository;
import com.ledger.transaction.entity.Transaction;
import com.ledger.transaction.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BalanceReconstructionServiceImpl
        implements BalanceReconstructionService {

    private final AccountRepository accountRepository;
    private final EventRepository eventRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    public BalanceReconstructionServiceImpl(
            AccountRepository accountRepository,
            EventRepository eventRepository,
            TransactionRepository transactionRepository,
            LedgerEntryRepository ledgerEntryRepository) {

        this.accountRepository = accountRepository;
        this.eventRepository = eventRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal reconstructCurrentBalance(Long accountId) {

        Account account = validateSupportedAccount(accountId);

        List<Event> events = eventRepository.findByAccountIdOrderByOccurredAtAscIdAsc(account.getId());

        return reconstructBalance(account, events);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal reconstructBalanceAt(
            Long accountId,
            OffsetDateTime asOf) {

        Account account = validateSupportedAccount(accountId);

        List<Event> events = eventRepository
                .findByAccountIdAndOccurredAtLessThanEqualOrderByOccurredAtAscIdAsc(
                        account.getId(),
                        asOf);

        return reconstructBalance(account, events);
    }

    private Account validateSupportedAccount(Long accountId) {

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(
                        "Account not found: " + accountId));

        if (SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER
                .equals(account.getAccountNumber())) {

            throw new IllegalStateException(
                    "Balance reconstruction is not supported for the SYS-CASH account");
        }

        return account;
    }

    private BigDecimal reconstructBalance(
            Account account,
            List<Event> events) {

        if (events.isEmpty()) {
            return BigDecimal.ZERO;
        }

        Set<Long> transactionIds = events.stream()
                .filter(this::isMonetaryEvent)
                .map(event -> {
                    if (event.getTransaction() == null) {
                        throw new IllegalStateException(
                                "Monetary event has no associated transaction: "
                                        + event.getId());
                    }

                    return event.getTransaction().getId();
                })
                .collect(Collectors.toSet());

        if (transactionIds.isEmpty()) {
            return BigDecimal.ZERO;
        }

        Map<Long, Transaction> transactionsById = loadTransactions(transactionIds);

        Map<Long, List<LedgerEntry>> ledgerEntriesByTransactionId = loadLedgerEntries(transactionIds);

        BigDecimal balance = BigDecimal.ZERO;

        for (Event event : events) {

            if (event.getEventType() == EventType.ACCOUNT_CREATED) {
                continue;
            }

            Transaction eventTransaction = event.getTransaction();

            if (eventTransaction == null) {
                throw new IllegalStateException(
                        "Monetary event has no associated transaction: "
                                + event.getId());
            }

            Long transactionId = eventTransaction.getId();

            Transaction transaction = transactionsById.get(transactionId);

            if (transaction == null) {
                throw new IllegalStateException(
                        "Transaction not found for event: "
                                + event.getId());
            }

            List<LedgerEntry> ledgerEntries = ledgerEntriesByTransactionId.get(transactionId);

            if (ledgerEntries == null || ledgerEntries.isEmpty()) {
                throw new IllegalStateException(
                        "No ledger entries found for transaction: "
                                + transactionId);
            }

            BigDecimal transactionEffect = ledgerEntries.stream()
                    .filter(entry -> entry.getAccount()
                            .getId()
                            .equals(account.getId()))
                    .map(this::calculateLedgerEntryEffect)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            boolean hasAccountEntry = ledgerEntries.stream()
                    .anyMatch(entry -> entry.getAccount()
                            .getId()
                            .equals(account.getId()));

            if (!hasAccountEntry) {
                throw new IllegalStateException(
                        "No ledger entry found for account "
                                + account.getId()
                                + " in transaction "
                                + transactionId);
            }

            balance = balance.add(transactionEffect);
        }

        return balance;
    }

    private boolean isMonetaryEvent(Event event) {

        return event.getEventType() != EventType.ACCOUNT_CREATED;
    }

    private Map<Long, Transaction> loadTransactions(
            Collection<Long> transactionIds) {

        return transactionRepository.findAllById(transactionIds)
                .stream()
                .collect(Collectors.toMap(
                        Transaction::getId,
                        Function.identity()));
    }

    private Map<Long, List<LedgerEntry>> loadLedgerEntries(
            Collection<Long> transactionIds) {

        return ledgerEntryRepository.findByTransactionIdIn(transactionIds)
                .stream()
                .collect(Collectors.groupingBy(
                        entry -> entry.getTransaction().getId()));
    }

    private BigDecimal calculateLedgerEntryEffect(
            LedgerEntry ledgerEntry) {

        if (ledgerEntry.getEntryType() == EntryType.CREDIT) {
            return ledgerEntry.getAmount();
        }

        return ledgerEntry.getAmount().negate();
    }
}