package com.ledger.audit.service.impl;

import com.ledger.account.entity.Account;
import com.ledger.account.exception.AccountNotFoundException;
import com.ledger.account.repository.AccountRepository;
import com.ledger.audit.dto.AccountEventResponse;
import com.ledger.audit.dto.AccountLedgerEntryResponse;
import com.ledger.audit.dto.AccountTransactionResponse;
import com.ledger.audit.dto.AuditBalanceResponse;
import com.ledger.audit.dto.AuditTrailItemResponse;
import com.ledger.audit.dto.AuditTrailResponse;
import com.ledger.audit.service.AuditService;
import com.ledger.balance.service.BalanceReconstructionService;
import com.ledger.common.constant.SystemAccountConstants;
import com.ledger.common.dto.PagedResponse;
import com.ledger.common.validation.PaginationValidator;
import com.ledger.common.validation.SortValidator;
import com.ledger.event.entity.Event;
import com.ledger.event.entity.EventType;
import com.ledger.event.repository.EventRepository;
import com.ledger.ledger.entity.EntryType;
import com.ledger.ledger.entity.LedgerEntry;
import com.ledger.ledger.repository.LedgerEntryRepository;
import com.ledger.transaction.entity.Transaction;
import com.ledger.transaction.repository.TransactionRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AuditServiceImpl implements AuditService {

        private static final Set<String> EVENT_SORT_FIELDS = Set.of(
                        "occurredAt");

        private static final Set<String> LEDGER_SORT_FIELDS = Set.of(
                        "createdAt");

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
        public PagedResponse<AccountEventResponse> getEventHistory(
                        Long accountId,
                        int page,
                        int size,
                        String sortBy,
                        String direction) {

                validatePublicAccount(accountId);

                PaginationValidator.validate(page, size);

                Sort sort = SortValidator.validateAndBuild(
                                sortBy,
                                direction,
                                EVENT_SORT_FIELDS);

                Pageable pageable = PageRequest.of(
                                page,
                                size,
                                sort);

                Page<Event> eventPage = eventRepository.findByAccountId(
                                accountId,
                                pageable);

                List<AccountEventResponse> content = eventPage.getContent()
                                .stream()
                                .map(event -> new AccountEventResponse(
                                                event.getId(),
                                                event.getEventType(),
                                                event.getTransaction() != null
                                                                ? event.getTransaction().getId()
                                                                : null,
                                                event.getPayload(),
                                                event.getOccurredAt()))
                                .toList();

                return new PagedResponse<>(
                                content,
                                eventPage.getNumber(),
                                eventPage.getSize(),
                                eventPage.getTotalPages(),
                                eventPage.getTotalElements());
        }

        @Override
        public PagedResponse<AccountTransactionResponse> getTransactionHistory(
                        Long accountId,
                        int page,
                        int size) {

                validatePublicAccount(accountId);

                PaginationValidator.validate(page, size);

                List<Event> events = eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId);

                List<Long> transactionIds = events.stream()
                                .map(Event::getTransaction)
                                .filter(transaction -> transaction != null)
                                .map(Transaction::getId)
                                .collect(Collectors.toCollection(LinkedHashSet::new))
                                .stream()
                                .toList();

                long totalElements = transactionIds.size();

                int totalPages = totalElements == 0
                                ? 0
                                : (int) ((totalElements + size - 1) / size);

                long startIndex = (long) page * size;

                if (startIndex >= totalElements) {
                        return new PagedResponse<>(
                                        List.of(),
                                        page,
                                        size,
                                        totalPages,
                                        totalElements);
                }

                int fromIndex = (int) startIndex;

                int toIndex = (int) Math.min(
                                startIndex + size,
                                totalElements);

                List<Long> pageTransactionIds = transactionIds.subList(
                                fromIndex,
                                toIndex);

                Map<Long, Transaction> transactionsById = transactionRepository
                                .findAllById(pageTransactionIds)
                                .stream()
                                .collect(Collectors.toMap(
                                                Transaction::getId,
                                                Function.identity()));

                List<AccountTransactionResponse> content = pageTransactionIds.stream()
                                .map(transactionsById::get)
                                .filter(transaction -> transaction != null)
                                .map(transaction -> new AccountTransactionResponse(
                                                transaction.getId(),
                                                transaction.getReferenceNumber(),
                                                transaction.getTransactionType(),
                                                transaction.getStatus(),
                                                transaction.getCreatedAt()))
                                .toList();

                return new PagedResponse<>(
                                content,
                                page,
                                size,
                                totalPages,
                                totalElements);
        }

        @Override
        public PagedResponse<AccountLedgerEntryResponse> getLedgerHistory(
                        Long accountId,
                        int page,
                        int size,
                        String sortBy,
                        String direction,
                        EntryType entryType) {

                validatePublicAccount(accountId);

                PaginationValidator.validate(page, size);

                Sort sort = SortValidator.validateAndBuild(
                                sortBy,
                                direction,
                                LEDGER_SORT_FIELDS);

                Pageable pageable = PageRequest.of(
                                page,
                                size,
                                sort);

                Page<LedgerEntry> ledgerPage;

                if (entryType != null) {
                        ledgerPage = ledgerEntryRepository
                                        .findByAccountIdAndEntryType(
                                                        accountId,
                                                        entryType,
                                                        pageable);
                } else {
                        ledgerPage = ledgerEntryRepository.findByAccountId(
                                        accountId,
                                        pageable);
                }

                List<Long> transactionIds = ledgerPage.getContent()
                                .stream()
                                .map(LedgerEntry::getTransaction)
                                .map(Transaction::getId)
                                .distinct()
                                .toList();

                Map<Long, Transaction> transactionsById = transactionRepository
                                .findAllById(transactionIds)
                                .stream()
                                .collect(Collectors.toMap(
                                                Transaction::getId,
                                                Function.identity()));

                List<AccountLedgerEntryResponse> content = ledgerPage
                                .getContent()
                                .stream()
                                .map(ledgerEntry -> {

                                        Long transactionId = ledgerEntry
                                                        .getTransaction()
                                                        .getId();

                                        Transaction transaction = transactionsById
                                                        .get(transactionId);

                                        if (transaction == null) {
                                                throw new IllegalStateException(
                                                                "Transaction not found for ledger entry: "
                                                                                + ledgerEntry.getId());
                                        }

                                        return new AccountLedgerEntryResponse(
                                                        ledgerEntry.getId(),
                                                        transaction.getId(),
                                                        transaction.getReferenceNumber(),
                                                        ledgerEntry.getEntryType(),
                                                        ledgerEntry.getAmount(),
                                                        ledgerEntry.getCreatedAt());
                                })
                                .toList();

                return new PagedResponse<>(
                                content,
                                ledgerPage.getNumber(),
                                ledgerPage.getSize(),
                                ledgerPage.getTotalPages(),
                                ledgerPage.getTotalElements());
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
                        OffsetDateTime asOf,
                        int page,
                        int size) {

                validatePublicAccount(accountId);

                PaginationValidator.validate(page, size);

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

                Map<Long, Transaction> transactionsById = transactionRepository
                                .findAllById(transactionIds)
                                .stream()
                                .collect(Collectors.toMap(
                                                Transaction::getId,
                                                Function.identity()));

                Map<Long, List<LedgerEntry>> ledgerEntriesByTransactionId = ledgerEntryRepository
                                .findByTransactionIdIn(transactionIds)
                                .stream()
                                .collect(Collectors.groupingBy(
                                                entry -> entry.getTransaction().getId()));

                /*
                 * Reconstruct the COMPLETE audit trail first.
                 *
                 * Pagination must happen only after running balances
                 * have been calculated so that every page contains
                 * absolute running balances.
                 */
                BigDecimal runningBalance = BigDecimal.ZERO;

                List<AuditTrailItemResponse> allItems = new java.util.ArrayList<>();

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
                                                .reduce(
                                                                BigDecimal.ZERO,
                                                                BigDecimal::add);

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

                        allItems.add(
                                        new AuditTrailItemResponse(
                                                        event.getId(),
                                                        event.getEventType(),
                                                        transactionId,
                                                        referenceNumber,
                                                        balanceChange,
                                                        runningBalance,
                                                        event.getOccurredAt()));
                }

                /*
                 * At this point runningBalance represents the balance
                 * after the COMPLETE reconstructed history.
                 */
                BigDecimal finalBalance = runningBalance;

                long totalElements = allItems.size();

                int totalPages = totalElements == 0
                                ? 0
                                : (int) ((totalElements + size - 1) / size);

                /*
                 * Slice only after complete reconstruction.
                 */
                long startIndex = (long) page * size;

                List<AuditTrailItemResponse> pageItems;

                if (startIndex >= totalElements) {

                        pageItems = List.of();

                } else {

                        int fromIndex = (int) startIndex;

                        int toIndex = (int) Math.min(
                                        startIndex + size,
                                        totalElements);

                        pageItems = allItems.subList(
                                        fromIndex,
                                        toIndex);
                }

                return new AuditTrailResponse(
                                accountId,
                                finalBalance,
                                asOf,
                                pageItems,
                                page,
                                size,
                                totalPages,
                                totalElements);
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