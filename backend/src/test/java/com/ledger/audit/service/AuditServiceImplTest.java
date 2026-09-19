package com.ledger.audit.service;

import com.ledger.account.entity.Account;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.entity.AccountType;
import com.ledger.account.exception.AccountNotFoundException;
import com.ledger.account.repository.AccountRepository;
import com.ledger.audit.service.impl.AuditServiceImpl;
import com.ledger.balance.service.BalanceReconstructionService;
import com.ledger.common.constant.SystemAccountConstants;
import com.ledger.common.exception.InvalidPageParameterException;
import com.ledger.common.exception.InvalidSortFieldException;
import com.ledger.event.entity.Event;
import com.ledger.event.entity.EventType;
import com.ledger.event.repository.EventRepository;
import com.ledger.ledger.entity.EntryType;
import com.ledger.ledger.entity.LedgerEntry;
import com.ledger.ledger.repository.LedgerEntryRepository;
import com.ledger.transaction.entity.Transaction;
import com.ledger.transaction.entity.TransactionStatus;
import com.ledger.transaction.entity.TransactionType;
import com.ledger.transaction.repository.TransactionRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceImplTest {

        @Mock
        private AccountRepository accountRepository;

        @Mock
        private EventRepository eventRepository;

        @Mock
        private TransactionRepository transactionRepository;

        @Mock
        private LedgerEntryRepository ledgerEntryRepository;

        @Mock
        private BalanceReconstructionService balanceReconstructionService;

        private AuditServiceImpl auditService;

        @BeforeEach
        void setUp() {
                auditService = new AuditServiceImpl(
                                accountRepository,
                                eventRepository,
                                transactionRepository,
                                ledgerEntryRepository,
                                balanceReconstructionService);
        }

        @Test
        void getEventHistory_returnsEventsForPublicAccount() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Event accountCreatedEvent = event(
                                account,
                                null,
                                EventType.ACCOUNT_CREATED,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));

                setId(accountCreatedEvent, 10L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository.findByAccountId(
                                eq(accountId),
                                any(Pageable.class)))
                                .thenReturn(new PageImpl<>(
                                                List.of(accountCreatedEvent),
                                                PageRequest.of(0, 20),
                                                1));

                var result = auditService.getEventHistory(
                                accountId,
                                0,
                                20,
                                "occurredAt",
                                "asc");

                assertEquals(1, result.content().size());

                assertEquals(
                                10L,
                                result.content().get(0).eventId());

                assertEquals(
                                EventType.ACCOUNT_CREATED,
                                result.content().get(0).eventType());

                assertEquals(
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"),
                                result.content().get(0).occurredAt());

                assertEquals(0, result.page());
                assertEquals(20, result.size());
                assertEquals(1, result.totalPages());
                assertEquals(1, result.totalElements());

                verify(accountRepository).findById(accountId);

                verify(eventRepository)
                                .findByAccountId(
                                                eq(accountId),
                                                any(Pageable.class));
        }

        @Test
        void getEventHistory_usesAscendingOccurredAtAndIdSorting() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Event event = event(
                                account,
                                null,
                                EventType.ACCOUNT_CREATED,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));

                setId(event, 10L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository.findByAccountId(
                                eq(accountId),
                                any(Pageable.class)))
                                .thenReturn(new PageImpl<>(List.of(event)));

                auditService.getEventHistory(
                                accountId,
                                0,
                                20,
                                "occurredAt",
                                "asc");

                ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);

                verify(eventRepository).findByAccountId(
                                eq(accountId),
                                pageableCaptor.capture());

                Pageable pageable = pageableCaptor.getValue();

                assertEquals(0, pageable.getPageNumber());
                assertEquals(20, pageable.getPageSize());

                assertEquals(
                                Sort.by(Sort.Direction.ASC, "occurredAt")
                                                .and(Sort.by(Sort.Direction.ASC, "id")),
                                pageable.getSort());
        }

        @Test
        void getEventHistory_usesDescendingOccurredAtAndIdSorting() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Event event = event(
                                account,
                                null,
                                EventType.ACCOUNT_CREATED,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));

                setId(event, 10L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository.findByAccountId(
                                eq(accountId),
                                any(Pageable.class)))
                                .thenReturn(new PageImpl<>(List.of(event)));

                auditService.getEventHistory(
                                accountId,
                                1,
                                5,
                                "occurredAt",
                                "desc");

                ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);

                verify(eventRepository).findByAccountId(
                                eq(accountId),
                                pageableCaptor.capture());

                Pageable pageable = pageableCaptor.getValue();

                assertEquals(1, pageable.getPageNumber());
                assertEquals(5, pageable.getPageSize());

                assertEquals(
                                Sort.by(Sort.Direction.DESC, "occurredAt")
                                                .and(Sort.by(Sort.Direction.DESC, "id")),
                                pageable.getSort());
        }

        @Test
        void getEventHistory_throwsExceptionWhenAccountDoesNotExist() {

                Long accountId = 999L;

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.empty());

                assertThrows(
                                AccountNotFoundException.class,
                                () -> auditService.getEventHistory(
                                                accountId,
                                                0,
                                                20,
                                                "occurredAt",
                                                "asc"));

                verify(accountRepository).findById(accountId);

                verifyNoInteractions(
                                eventRepository,
                                transactionRepository,
                                ledgerEntryRepository,
                                balanceReconstructionService);
        }

        @Test
        void getEventHistory_throwsExceptionForSystemCashAccount() {

                Long accountId = 1L;

                Account systemAccount = systemAccount();
                setId(systemAccount, accountId);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(systemAccount));

                assertThrows(
                                AccountNotFoundException.class,
                                () -> auditService.getEventHistory(
                                                accountId,
                                                0,
                                                20,
                                                "occurredAt",
                                                "asc"));

                verify(accountRepository).findById(accountId);

                verifyNoInteractions(
                                eventRepository,
                                transactionRepository,
                                ledgerEntryRepository,
                                balanceReconstructionService);
        }

        @Test
        void getEventHistory_rejectsInvalidPage() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                assertThrows(
                                InvalidPageParameterException.class,
                                () -> auditService.getEventHistory(
                                                accountId,
                                                -1,
                                                20,
                                                "occurredAt",
                                                "asc"));

                verify(accountRepository).findById(accountId);

                verifyNoInteractions(eventRepository);
        }

        @Test
        void getEventHistory_rejectsZeroSize() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                assertThrows(
                                InvalidPageParameterException.class,
                                () -> auditService.getEventHistory(
                                                accountId,
                                                0,
                                                0,
                                                "occurredAt",
                                                "asc"));

                verify(accountRepository).findById(accountId);

                verifyNoInteractions(eventRepository);
        }

        @Test
        void getEventHistory_rejectsSizeAboveMaximum() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                assertThrows(
                                InvalidPageParameterException.class,
                                () -> auditService.getEventHistory(
                                                accountId,
                                                0,
                                                101,
                                                "occurredAt",
                                                "asc"));

                verify(accountRepository).findById(accountId);

                verifyNoInteractions(eventRepository);
        }

        @Test
        void getEventHistory_rejectsInvalidSortField() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                assertThrows(
                                InvalidSortFieldException.class,
                                () -> auditService.getEventHistory(
                                                accountId,
                                                0,
                                                20,
                                                "eventType",
                                                "asc"));

                verify(accountRepository).findById(accountId);

                verifyNoInteractions(eventRepository);
        }

        @Test
        void getEventHistory_rejectsInvalidDirection() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                assertThrows(
                                InvalidSortFieldException.class,
                                () -> auditService.getEventHistory(
                                                accountId,
                                                0,
                                                20,
                                                "occurredAt",
                                                "sideways"));

                verify(accountRepository).findById(accountId);

                verifyNoInteractions(eventRepository);
        }

        @Test
        void getTransactionHistory_returnsTransactionsInEventOrder() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Transaction firstTransaction = transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT);
                setId(firstTransaction, 100L);

                Transaction secondTransaction = transaction(
                                "TXN-002",
                                TransactionType.WITHDRAWAL);
                setId(secondTransaction, 200L);

                Event firstEvent = event(
                                account,
                                firstTransaction,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));
                setId(firstEvent, 10L);

                Event secondEvent = event(
                                account,
                                secondTransaction,
                                EventType.WITHDRAWAL,
                                OffsetDateTime.parse("2026-09-10T10:00:00Z"));
                setId(secondEvent, 20L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                                .thenReturn(List.of(firstEvent, secondEvent));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of(
                                                firstTransaction,
                                                secondTransaction));

                var result = auditService.getTransactionHistory(
                                accountId,
                                0,
                                20);

                assertEquals(2, result.content().size());

                assertEquals(
                                100L,
                                result.content().get(0).transactionId());

                assertEquals(
                                "TXN-001",
                                result.content().get(0).referenceNumber());

                assertEquals(
                                200L,
                                result.content().get(1).transactionId());

                assertEquals(
                                "TXN-002",
                                result.content().get(1).referenceNumber());

                assertEquals(0, result.page());
                assertEquals(20, result.size());
                assertEquals(1, result.totalPages());
                assertEquals(2, result.totalElements());

                verify(accountRepository).findById(accountId);

                verify(eventRepository)
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId);

                verify(transactionRepository)
                                .findAllById(anyCollection());
        }

        @Test
        void getTransactionHistory_removesDuplicateTransactions() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Transaction transaction = transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT);
                setId(transaction, 100L);

                Event firstEvent = event(
                                account,
                                transaction,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));
                setId(firstEvent, 10L);

                Event secondEvent = event(
                                account,
                                transaction,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse("2026-09-10T10:00:00Z"));
                setId(secondEvent, 20L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                                .thenReturn(List.of(firstEvent, secondEvent));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of(transaction));

                var result = auditService.getTransactionHistory(
                                accountId,
                                0,
                                20);

                assertEquals(1, result.content().size());

                assertEquals(
                                100L,
                                result.content().get(0).transactionId());

                assertEquals(
                                "TXN-001",
                                result.content().get(0).referenceNumber());

                assertEquals(1, result.totalElements());
                assertEquals(1, result.totalPages());

                verify(transactionRepository)
                                .findAllById(anyCollection());
        }

        @Test
        void getTransactionHistory_paginatesUniqueTransactionsInEventOrder() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Transaction firstTransaction = transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT);
                setId(firstTransaction, 100L);

                Transaction secondTransaction = transaction(
                                "TXN-002",
                                TransactionType.WITHDRAWAL);
                setId(secondTransaction, 200L);

                Transaction thirdTransaction = transaction(
                                "TXN-003",
                                TransactionType.DEPOSIT);
                setId(thirdTransaction, 300L);

                Event firstEvent = event(
                                account,
                                firstTransaction,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));
                setId(firstEvent, 10L);

                Event secondEvent = event(
                                account,
                                firstTransaction,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse("2026-09-10T09:01:00Z"));
                setId(secondEvent, 20L);

                Event thirdEvent = event(
                                account,
                                secondTransaction,
                                EventType.WITHDRAWAL,
                                OffsetDateTime.parse("2026-09-10T10:00:00Z"));
                setId(thirdEvent, 30L);

                Event fourthEvent = event(
                                account,
                                thirdTransaction,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse("2026-09-10T11:00:00Z"));
                setId(fourthEvent, 40L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                                .thenReturn(List.of(
                                                firstEvent,
                                                secondEvent,
                                                thirdEvent,
                                                fourthEvent));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of(secondTransaction));

                var result = auditService.getTransactionHistory(
                                accountId,
                                1,
                                1);

                assertEquals(1, result.content().size());

                assertEquals(
                                200L,
                                result.content().get(0).transactionId());

                assertEquals(
                                "TXN-002",
                                result.content().get(0).referenceNumber());

                assertEquals(1, result.page());
                assertEquals(1, result.size());
                assertEquals(3, result.totalPages());
                assertEquals(3, result.totalElements());

                verify(transactionRepository)
                                .findAllById(
                                                eq(List.of(200L)));
        }

        @Test
        void getTransactionHistory_returnsEmptyPageWhenPageIsOutOfRange() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Transaction transaction = transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT);
                setId(transaction, 100L);

                Event event = event(
                                account,
                                transaction,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));
                setId(event, 10L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                                .thenReturn(List.of(event));

                var result = auditService.getTransactionHistory(
                                accountId,
                                5,
                                20);

                assertEquals(0, result.content().size());
                assertEquals(5, result.page());
                assertEquals(20, result.size());
                assertEquals(1, result.totalPages());
                assertEquals(1, result.totalElements());

                verifyNoInteractions(transactionRepository);
        }

        @Test
        void getTransactionHistory_rejectsInvalidPage() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                assertThrows(
                                InvalidPageParameterException.class,
                                () -> auditService.getTransactionHistory(
                                                accountId,
                                                -1,
                                                20));

                verify(accountRepository).findById(accountId);

                verifyNoInteractions(
                                eventRepository,
                                transactionRepository);
        }

        @Test
        void getTransactionHistory_rejectsInvalidSize() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                assertThrows(
                                InvalidPageParameterException.class,
                                () -> auditService.getTransactionHistory(
                                                accountId,
                                                0,
                                                101));

                verify(accountRepository).findById(accountId);

                verifyNoInteractions(
                                eventRepository,
                                transactionRepository);
        }

        @Test
        void getTransactionHistory_returnsEmptyPageWhenNoTransactionsExist() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Event accountCreatedEvent = event(
                                account,
                                null,
                                EventType.ACCOUNT_CREATED,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));
                setId(accountCreatedEvent, 10L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                                .thenReturn(List.of(accountCreatedEvent));

                var result = auditService.getTransactionHistory(
                                accountId,
                                0,
                                20);

                assertEquals(0, result.content().size());
                assertEquals(0, result.totalElements());
                assertEquals(0, result.totalPages());
                assertEquals(0, result.page());
                assertEquals(20, result.size());

                verify(accountRepository).findById(accountId);

                verify(eventRepository)
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId);

                verifyNoInteractions(transactionRepository);
        }

        @Test
        void getLedgerHistory_returnsLedgerEntriesForAccount() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Transaction transaction = transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT);
                setId(transaction, 100L);

                LedgerEntry entry = ledgerEntry(
                                transaction,
                                account,
                                EntryType.CREDIT,
                                new BigDecimal("1000.00"));
                setId(entry, 50L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(ledgerEntryRepository.findByAccountId(
                                eq(accountId),
                                any(Pageable.class)))
                                .thenReturn(new PageImpl<>(
                                                List.of(entry),
                                                PageRequest.of(
                                                                0,
                                                                20,
                                                                Sort.by(
                                                                                Sort.Direction.ASC,
                                                                                "createdAt")
                                                                                .and(Sort.by(
                                                                                                Sort.Direction.ASC,
                                                                                                "id"))),
                                                1));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of(transaction));

                var result = auditService.getLedgerHistory(
                                accountId,
                                0,
                                20,
                                "createdAt",
                                "asc",
                                null);

                assertEquals(1, result.content().size());

                assertEquals(
                                50L,
                                result.content().get(0).ledgerEntryId());

                assertEquals(
                                100L,
                                result.content().get(0).transactionId());

                assertEquals(
                                "TXN-001",
                                result.content().get(0).referenceNumber());

                assertEquals(
                                EntryType.CREDIT,
                                result.content().get(0).entryType());

                assertEquals(
                                new BigDecimal("1000.00"),
                                result.content().get(0).amount());

                assertEquals(0, result.page());
                assertEquals(20, result.size());
                assertEquals(1, result.totalPages());
                assertEquals(1, result.totalElements());

                verify(accountRepository).findById(accountId);

                verify(ledgerEntryRepository)
                                .findByAccountId(
                                                eq(accountId),
                                                any(Pageable.class));

                verify(transactionRepository)
                                .findAllById(anyCollection());
        }

        @Test
        void getLedgerHistory_returnsEmptyPageWhenNoLedgerEntriesExist() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(ledgerEntryRepository.findByAccountId(
                                eq(accountId),
                                any(Pageable.class)))
                                .thenReturn(new PageImpl<>(
                                                List.of(),
                                                PageRequest.of(
                                                                0,
                                                                20,
                                                                Sort.by(
                                                                                Sort.Direction.ASC,
                                                                                "createdAt")
                                                                                .and(Sort.by(
                                                                                                Sort.Direction.ASC,
                                                                                                "id"))),
                                                0));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of());

                var result = auditService.getLedgerHistory(
                                accountId,
                                0,
                                20,
                                "createdAt",
                                "asc",
                                null);

                assertEquals(0, result.content().size());

                assertEquals(0, result.page());
                assertEquals(20, result.size());
                assertEquals(0, result.totalPages());
                assertEquals(0, result.totalElements());

                verify(accountRepository).findById(accountId);

                verify(ledgerEntryRepository)
                                .findByAccountId(
                                                eq(accountId),
                                                any(Pageable.class));

                verify(transactionRepository)
                                .findAllById(anyCollection());
        }

        @Test
        void getLedgerHistory_usesDescendingCreatedAtAndIdSorting() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Transaction transaction = transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT);
                setId(transaction, 100L);

                LedgerEntry entry = ledgerEntry(
                                transaction,
                                account,
                                EntryType.CREDIT,
                                new BigDecimal("1000.00"));
                setId(entry, 50L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(ledgerEntryRepository.findByAccountId(
                                eq(accountId),
                                any(Pageable.class)))
                                .thenReturn(new PageImpl<>(
                                                List.of(entry)));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of(transaction));

                auditService.getLedgerHistory(
                                accountId,
                                1,
                                5,
                                "createdAt",
                                "desc",
                                null);

                ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);

                verify(ledgerEntryRepository).findByAccountId(
                                eq(accountId),
                                pageableCaptor.capture());

                Pageable pageable = pageableCaptor.getValue();

                assertEquals(1, pageable.getPageNumber());
                assertEquals(5, pageable.getPageSize());

                assertEquals(
                                Sort.by(Sort.Direction.DESC, "createdAt")
                                                .and(Sort.by(
                                                                Sort.Direction.DESC,
                                                                "id")),
                                pageable.getSort());
        }

        @Test
        void getLedgerHistory_supportsEntryTypeFilter() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Transaction transaction = transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT);
                setId(transaction, 100L);

                LedgerEntry creditEntry = ledgerEntry(
                                transaction,
                                account,
                                EntryType.CREDIT,
                                new BigDecimal("1000.00"));
                setId(creditEntry, 50L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(ledgerEntryRepository.findByAccountIdAndEntryType(
                                eq(accountId),
                                eq(EntryType.CREDIT),
                                any(Pageable.class)))
                                .thenReturn(new PageImpl<>(
                                                List.of(creditEntry),
                                                PageRequest.of(
                                                                0,
                                                                20,
                                                                Sort.by(
                                                                                Sort.Direction.ASC,
                                                                                "createdAt")
                                                                                .and(Sort.by(
                                                                                                Sort.Direction.ASC,
                                                                                                "id"))),
                                                1));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of(transaction));

                var result = auditService.getLedgerHistory(
                                accountId,
                                0,
                                20,
                                "createdAt",
                                "asc",
                                EntryType.CREDIT);

                assertEquals(1, result.content().size());

                assertEquals(
                                EntryType.CREDIT,
                                result.content().get(0).entryType());

                assertEquals(1, result.totalElements());
                assertEquals(1, result.totalPages());

                verify(ledgerEntryRepository)
                                .findByAccountIdAndEntryType(
                                                eq(accountId),
                                                eq(EntryType.CREDIT),
                                                any(Pageable.class));

                verify(transactionRepository)
                                .findAllById(anyCollection());

                verify(ledgerEntryRepository, never())
                                .findByAccountId(
                                                eq(accountId),
                                                any(Pageable.class));
        }

        @Test
        void getBalance_returnsCurrentBalanceWhenAsOfIsNull() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                BigDecimal expectedBalance = new BigDecimal("1500.00");

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(balanceReconstructionService
                                .reconstructCurrentBalance(accountId))
                                .thenReturn(expectedBalance);

                var result = auditService.getBalance(
                                accountId,
                                null);

                assertEquals(
                                accountId,
                                result.accountId());

                assertEquals(
                                expectedBalance,
                                result.balance());

                assertEquals(
                                null,
                                result.asOf());

                verify(accountRepository).findById(accountId);

                verify(balanceReconstructionService)
                                .reconstructCurrentBalance(accountId);

                verify(balanceReconstructionService, never())
                                .reconstructBalanceAt(
                                                anyLong(),
                                                any());
        }

        @Test
        void getBalance_returnsHistoricalBalanceWhenAsOfIsProvided() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                OffsetDateTime asOf = OffsetDateTime.parse("2026-09-10T12:00:00Z");

                BigDecimal expectedBalance = new BigDecimal("1250.00");

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(balanceReconstructionService
                                .reconstructBalanceAt(accountId, asOf))
                                .thenReturn(expectedBalance);

                var result = auditService.getBalance(
                                accountId,
                                asOf);

                assertEquals(
                                accountId,
                                result.accountId());

                assertEquals(
                                expectedBalance,
                                result.balance());

                assertEquals(
                                asOf,
                                result.asOf());

                verify(accountRepository).findById(accountId);

                verify(balanceReconstructionService)
                                .reconstructBalanceAt(
                                                accountId,
                                                asOf);

                verify(balanceReconstructionService, never())
                                .reconstructCurrentBalance(anyLong());
        }

        @Test
        void getAuditTrail_calculatesRunningBalanceCorrectly() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Transaction depositTransaction = transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT);
                setId(depositTransaction, 100L);

                Transaction withdrawalTransaction = transaction(
                                "TXN-002",
                                TransactionType.WITHDRAWAL);
                setId(withdrawalTransaction, 200L);

                Event accountCreatedEvent = event(
                                account,
                                null,
                                EventType.ACCOUNT_CREATED,
                                OffsetDateTime.parse("2026-09-10T08:00:00Z"));
                setId(accountCreatedEvent, 10L);

                Event depositEvent = event(
                                account,
                                depositTransaction,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));
                setId(depositEvent, 20L);

                Event withdrawalEvent = event(
                                account,
                                withdrawalTransaction,
                                EventType.WITHDRAWAL,
                                OffsetDateTime.parse("2026-09-10T10:00:00Z"));
                setId(withdrawalEvent, 30L);

                LedgerEntry depositEntry = ledgerEntry(
                                depositTransaction,
                                account,
                                EntryType.CREDIT,
                                new BigDecimal("1000.00"));
                setId(depositEntry, 1000L);

                LedgerEntry withdrawalEntry = ledgerEntry(
                                withdrawalTransaction,
                                account,
                                EntryType.DEBIT,
                                new BigDecimal("250.00"));
                setId(withdrawalEntry, 2000L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                                .thenReturn(List.of(
                                                accountCreatedEvent,
                                                depositEvent,
                                                withdrawalEvent));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of(
                                                depositTransaction,
                                                withdrawalTransaction));

                when(ledgerEntryRepository.findByTransactionIdIn(anyCollection()))
                                .thenReturn(List.of(
                                                depositEntry,
                                                withdrawalEntry));

                var result = auditService.getAuditTrail(
                                accountId,
                                null,
                                0,
                                20);

                assertEquals(accountId, result.accountId());

                assertEquals(
                                new BigDecimal("750.00"),
                                result.finalBalance());

                assertEquals(null, result.asOf());

                assertEquals(3, result.items().size());

                assertEquals(
                                EventType.ACCOUNT_CREATED,
                                result.items().get(0).eventType());

                assertEquals(
                                BigDecimal.ZERO,
                                result.items().get(0).balanceChange());

                assertEquals(
                                BigDecimal.ZERO,
                                result.items().get(0).runningBalance());

                assertEquals(
                                EventType.DEPOSIT,
                                result.items().get(1).eventType());

                assertEquals(
                                100L,
                                result.items().get(1).transactionId());

                assertEquals(
                                "TXN-001",
                                result.items().get(1).referenceNumber());

                assertEquals(
                                new BigDecimal("1000.00"),
                                result.items().get(1).balanceChange());

                assertEquals(
                                new BigDecimal("1000.00"),
                                result.items().get(1).runningBalance());

                assertEquals(
                                EventType.WITHDRAWAL,
                                result.items().get(2).eventType());

                assertEquals(
                                200L,
                                result.items().get(2).transactionId());

                assertEquals(
                                "TXN-002",
                                result.items().get(2).referenceNumber());

                assertEquals(
                                new BigDecimal("-250.00"),
                                result.items().get(2).balanceChange());

                assertEquals(
                                new BigDecimal("750.00"),
                                result.items().get(2).runningBalance());

                verify(eventRepository)
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId);

                verify(transactionRepository)
                                .findAllById(anyCollection());

                verify(ledgerEntryRepository)
                                .findByTransactionIdIn(anyCollection());
        }

        @Test
        void getAuditTrail_paginatesAfterFullReconstruction() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Transaction depositTransaction = transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT);
                setId(depositTransaction, 100L);

                Transaction withdrawalTransaction = transaction(
                                "TXN-002",
                                TransactionType.WITHDRAWAL);
                setId(withdrawalTransaction, 200L);

                Event accountCreatedEvent = event(
                                account,
                                null,
                                EventType.ACCOUNT_CREATED,
                                OffsetDateTime.parse("2026-09-10T08:00:00Z"));
                setId(accountCreatedEvent, 10L);

                Event depositEvent = event(
                                account,
                                depositTransaction,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));
                setId(depositEvent, 20L);

                Event withdrawalEvent = event(
                                account,
                                withdrawalTransaction,
                                EventType.WITHDRAWAL,
                                OffsetDateTime.parse("2026-09-10T10:00:00Z"));
                setId(withdrawalEvent, 30L);

                LedgerEntry depositEntry = ledgerEntry(
                                depositTransaction,
                                account,
                                EntryType.CREDIT,
                                new BigDecimal("1000.00"));
                setId(depositEntry, 1000L);

                LedgerEntry withdrawalEntry = ledgerEntry(
                                withdrawalTransaction,
                                account,
                                EntryType.DEBIT,
                                new BigDecimal("250.00"));
                setId(withdrawalEntry, 2000L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                                .thenReturn(List.of(
                                                accountCreatedEvent,
                                                depositEvent,
                                                withdrawalEvent));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of(
                                                depositTransaction,
                                                withdrawalTransaction));

                when(ledgerEntryRepository.findByTransactionIdIn(anyCollection()))
                                .thenReturn(List.of(
                                                depositEntry,
                                                withdrawalEntry));

                // First page: ACCOUNT_CREATED + DEPOSIT
                var firstPage = auditService.getAuditTrail(
                                accountId,
                                null,
                                0,
                                2);

                assertEquals(accountId, firstPage.accountId());

                assertEquals(
                                new BigDecimal("750.00"),
                                firstPage.finalBalance());

                assertEquals(null, firstPage.asOf());

                assertEquals(0, firstPage.page());
                assertEquals(2, firstPage.size());
                assertEquals(2, firstPage.totalPages());
                assertEquals(3, firstPage.totalElements());

                assertEquals(2, firstPage.items().size());

                assertEquals(
                                EventType.ACCOUNT_CREATED,
                                firstPage.items().get(0).eventType());

                assertEquals(
                                BigDecimal.ZERO,
                                firstPage.items().get(0).runningBalance());

                assertEquals(
                                EventType.DEPOSIT,
                                firstPage.items().get(1).eventType());

                assertEquals(
                                new BigDecimal("1000.00"),
                                firstPage.items().get(1).runningBalance());

                // Second page: WITHDRAWAL
                var secondPage = auditService.getAuditTrail(
                                accountId,
                                null,
                                1,
                                2);

                assertEquals(accountId, secondPage.accountId());

                // Final balance must remain the complete-history balance.
                assertEquals(
                                new BigDecimal("750.00"),
                                secondPage.finalBalance());

                assertEquals(null, secondPage.asOf());

                assertEquals(1, secondPage.page());
                assertEquals(2, secondPage.size());
                assertEquals(2, secondPage.totalPages());
                assertEquals(3, secondPage.totalElements());

                assertEquals(1, secondPage.items().size());

                assertEquals(
                                EventType.WITHDRAWAL,
                                secondPage.items().get(0).eventType());

                // IMPORTANT:
                // This must be the absolute running balance,
                // not -250.00 relative to this page.
                assertEquals(
                                new BigDecimal("-250.00"),
                                secondPage.items().get(0).balanceChange());

                assertEquals(
                                new BigDecimal("750.00"),
                                secondPage.items().get(0).runningBalance());

                verify(accountRepository, times(2))
                                .findById(accountId);

                verify(eventRepository, times(2))
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId);

                verify(transactionRepository, times(2))
                                .findAllById(anyCollection());

                verify(ledgerEntryRepository, times(2))
                                .findByTransactionIdIn(anyCollection());
        }

        @Test
        void getAuditTrail_returnsEmptyPageWhenPageIsOutOfRange() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Event accountCreatedEvent = event(
                                account,
                                null,
                                EventType.ACCOUNT_CREATED,
                                OffsetDateTime.parse("2026-09-10T08:00:00Z"));
                setId(accountCreatedEvent, 10L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                                .thenReturn(List.of(accountCreatedEvent));

                var result = auditService.getAuditTrail(
                                accountId,
                                null,
                                1,
                                20);

                assertEquals(accountId, result.accountId());

                assertEquals(
                                BigDecimal.ZERO,
                                result.finalBalance());

                assertEquals(null, result.asOf());

                assertEquals(1, result.page());
                assertEquals(20, result.size());

                assertEquals(1, result.totalPages());
                assertEquals(1, result.totalElements());

                assertEquals(
                                List.of(),
                                result.items());

                verify(accountRepository)
                                .findById(accountId);

                verify(eventRepository)
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId);

                verify(accountRepository)
                                .findById(accountId);

                verify(eventRepository)
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId);
        }

        @Test
        void getAuditTrail_appliesAsOfBeforePagination() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Transaction depositTransaction = transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT);
                setId(depositTransaction, 100L);

                Transaction withdrawalTransaction = transaction(
                                "TXN-002",
                                TransactionType.WITHDRAWAL);
                setId(withdrawalTransaction, 200L);

                Event accountCreatedEvent = event(
                                account,
                                null,
                                EventType.ACCOUNT_CREATED,
                                OffsetDateTime.parse(
                                                "2026-09-10T08:00:00Z"));
                setId(accountCreatedEvent, 10L);

                Event depositEvent = event(
                                account,
                                depositTransaction,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse(
                                                "2026-09-10T09:00:00Z"));
                setId(depositEvent, 20L);

                Event withdrawalEvent = event(
                                account,
                                withdrawalTransaction,
                                EventType.WITHDRAWAL,
                                OffsetDateTime.parse(
                                                "2026-09-10T11:00:00Z"));
                setId(withdrawalEvent, 30L);

                LedgerEntry depositEntry = ledgerEntry(
                                depositTransaction,
                                account,
                                EntryType.CREDIT,
                                new BigDecimal("1000.00"));
                setId(depositEntry, 1000L);

                LedgerEntry withdrawalEntry = ledgerEntry(
                                withdrawalTransaction,
                                account,
                                EntryType.DEBIT,
                                new BigDecimal("250.00"));
                setId(withdrawalEntry, 2000L);

                OffsetDateTime asOf = OffsetDateTime.parse(
                                "2026-09-10T10:00:00Z");

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository
                                .findByAccountIdAndOccurredAtLessThanEqualOrderByOccurredAtAscIdAsc(
                                                accountId,
                                                asOf))
                                .thenReturn(List.of(
                                                accountCreatedEvent,
                                                depositEvent));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of(depositTransaction));

                when(ledgerEntryRepository.findByTransactionIdIn(anyCollection()))
                                .thenReturn(List.of(depositEntry));

                var result = auditService.getAuditTrail(
                                accountId,
                                asOf,
                                1,
                                1);

                assertEquals(accountId, result.accountId());

                assertEquals(
                                new BigDecimal("1000.00"),
                                result.finalBalance());

                assertEquals(asOf, result.asOf());

                assertEquals(1, result.page());
                assertEquals(1, result.size());
                assertEquals(2, result.totalPages());
                assertEquals(2, result.totalElements());

                assertEquals(1, result.items().size());

                assertEquals(
                                EventType.DEPOSIT,
                                result.items().get(0).eventType());

                assertEquals(
                                new BigDecimal("1000.00"),
                                result.items().get(0).balanceChange());

                assertEquals(
                                new BigDecimal("1000.00"),
                                result.items().get(0).runningBalance());

                verify(accountRepository)
                                .findById(accountId);

                verify(eventRepository)
                                .findByAccountIdAndOccurredAtLessThanEqualOrderByOccurredAtAscIdAsc(
                                                accountId,
                                                asOf);

                verify(transactionRepository)
                                .findAllById(anyCollection());

                verify(ledgerEntryRepository)
                                .findByTransactionIdIn(anyCollection());
        }

        @Test
        void getAuditTrail_returnsHistoricalTrailWhenAsOfIsProvided() {

                Long accountId = 1L;

                OffsetDateTime asOf = OffsetDateTime.parse("2026-09-10T09:30:00Z");

                Account account = customerAccount();
                setId(account, accountId);

                Transaction transaction = transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT);
                setId(transaction, 100L);

                Event depositEvent = event(
                                account,
                                transaction,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));
                setId(depositEvent, 10L);

                LedgerEntry depositEntry = ledgerEntry(
                                transaction,
                                account,
                                EntryType.CREDIT,
                                new BigDecimal("500.00"));
                setId(depositEntry, 1000L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository
                                .findByAccountIdAndOccurredAtLessThanEqualOrderByOccurredAtAscIdAsc(
                                                accountId,
                                                asOf))
                                .thenReturn(List.of(depositEvent));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of(transaction));

                when(ledgerEntryRepository.findByTransactionIdIn(anyCollection()))
                                .thenReturn(List.of(depositEntry));

                var result = auditService.getAuditTrail(
                                accountId,
                                asOf,
                                0,
                                20);

                assertEquals(accountId, result.accountId());

                assertEquals(
                                new BigDecimal("500.00"),
                                result.finalBalance());

                assertEquals(
                                asOf,
                                result.asOf());

                assertEquals(1, result.items().size());

                assertEquals(
                                EventType.DEPOSIT,
                                result.items().get(0).eventType());

                assertEquals(
                                new BigDecimal("500.00"),
                                result.items().get(0).balanceChange());

                assertEquals(
                                new BigDecimal("500.00"),
                                result.items().get(0).runningBalance());

                verify(eventRepository)
                                .findByAccountIdAndOccurredAtLessThanEqualOrderByOccurredAtAscIdAsc(
                                                accountId,
                                                asOf);

                verify(eventRepository, never())
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId);
        }

        @Test
        void getAuditTrail_throwsExceptionWhenMonetaryEventHasNoTransaction() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Event invalidEvent = event(
                                account,
                                null,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));
                setId(invalidEvent, 10L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                                .thenReturn(List.of(invalidEvent));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of());

                when(ledgerEntryRepository.findByTransactionIdIn(anyCollection()))
                                .thenReturn(List.of());

                IllegalStateException exception = assertThrows(
                                IllegalStateException.class,
                                () -> auditService.getAuditTrail(
                                                accountId,
                                                null,
                                                0,
                                                20));

                assertEquals(
                                "Monetary event has no associated transaction: 10",
                                exception.getMessage());
        }

        @Test
        void getAuditTrail_throwsExceptionWhenTransactionIsMissing() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Transaction transaction = transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT);
                setId(transaction, 100L);

                Event depositEvent = event(
                                account,
                                transaction,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));
                setId(depositEvent, 10L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                                .thenReturn(List.of(depositEvent));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of());

                when(ledgerEntryRepository.findByTransactionIdIn(anyCollection()))
                                .thenReturn(List.of());

                IllegalStateException exception = assertThrows(
                                IllegalStateException.class,
                                () -> auditService.getAuditTrail(
                                                accountId,
                                                null,
                                                0,
                                                20));

                assertEquals(
                                "Transaction not found for event: 10",
                                exception.getMessage());
        }

        @Test
        void getAuditTrail_throwsExceptionWhenLedgerEntriesAreMissing() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                Transaction transaction = transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT);
                setId(transaction, 100L);

                Event depositEvent = event(
                                account,
                                transaction,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));
                setId(depositEvent, 10L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                                .thenReturn(List.of(depositEvent));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of(transaction));

                when(ledgerEntryRepository.findByTransactionIdIn(anyCollection()))
                                .thenReturn(List.of());

                IllegalStateException exception = assertThrows(
                                IllegalStateException.class,
                                () -> auditService.getAuditTrail(
                                                accountId,
                                                null,
                                                0,
                                                20));

                assertEquals(
                                "No ledger entries found for transaction: 100",
                                exception.getMessage());
        }

        @Test
        void getAuditTrail_throwsExceptionWhenNoLedgerEntryBelongsToAccount() {

                Long accountId = 1L;

                Account requestedAccount = customerAccount();
                setId(requestedAccount, accountId);

                Account otherAccount = customerAccount();
                setId(otherAccount, 2L);

                Transaction transaction = transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT);
                setId(transaction, 100L);

                Event depositEvent = event(
                                requestedAccount,
                                transaction,
                                EventType.DEPOSIT,
                                OffsetDateTime.parse("2026-09-10T09:00:00Z"));
                setId(depositEvent, 10L);

                LedgerEntry otherAccountEntry = ledgerEntry(
                                transaction,
                                otherAccount,
                                EntryType.CREDIT,
                                new BigDecimal("500.00"));
                setId(otherAccountEntry, 1000L);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(requestedAccount));

                when(eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                                .thenReturn(List.of(depositEvent));

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of(transaction));

                when(ledgerEntryRepository.findByTransactionIdIn(anyCollection()))
                                .thenReturn(List.of(otherAccountEntry));

                IllegalStateException exception = assertThrows(
                                IllegalStateException.class,
                                () -> auditService.getAuditTrail(
                                                accountId,
                                                null,
                                                0,
                                                20));

                assertEquals(
                                "No ledger entry found for account 1 in transaction 100",
                                exception.getMessage());
        }

        @Test
        void getAuditTrail_returnsEmptyTrailWhenNoEventsExist() {

                Long accountId = 1L;

                Account account = customerAccount();
                setId(account, accountId);

                when(accountRepository.findById(accountId))
                                .thenReturn(Optional.of(account));

                when(eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                                .thenReturn(List.of());

                when(transactionRepository.findAllById(anyCollection()))
                                .thenReturn(List.of());

                when(ledgerEntryRepository.findByTransactionIdIn(anyCollection()))
                                .thenReturn(List.of());
                var result = auditService.getAuditTrail(
                                accountId,
                                null,
                                0,
                                20);

                assertEquals(accountId, result.accountId());

                assertEquals(
                                BigDecimal.ZERO,
                                result.finalBalance());

                assertEquals(null, result.asOf());

                assertEquals(0, result.items().size());

                verify(eventRepository)
                                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId);

                verify(transactionRepository)
                                .findAllById(anyCollection());

                verify(ledgerEntryRepository)
                                .findByTransactionIdIn(anyCollection());
        }

        private Account customerAccount() {

                Account account = new Account();

                account.setAccountNumber("ACC001");
                account.setAccountName("Test Customer");
                account.setAccountType(AccountType.SAVINGS);
                account.setStatus(AccountStatus.ACTIVE);

                return account;
        }

        private Account systemAccount() {

                Account account = new Account();

                account.setAccountNumber(
                                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER);

                account.setAccountName("System Cash");
                account.setAccountType(AccountType.CURRENT);
                account.setStatus(AccountStatus.ACTIVE);

                return account;
        }

        private Transaction transaction() {

                return new Transaction(
                                "TXN-001",
                                TransactionType.DEPOSIT,
                                TransactionStatus.COMPLETED,
                                OffsetDateTime.parse("2026-09-10T10:00:00Z"));
        }

        private Transaction transaction(
                        String referenceNumber,
                        TransactionType transactionType) {

                return new Transaction(
                                referenceNumber,
                                transactionType,
                                TransactionStatus.COMPLETED,
                                OffsetDateTime.parse("2026-09-10T10:00:00Z"));
        }

        private Event event(
                        Account account,
                        Transaction transaction,
                        EventType eventType,
                        OffsetDateTime occurredAt) {

                return new Event(
                                account,
                                transaction,
                                eventType,
                                null,
                                occurredAt);
        }

        private LedgerEntry ledgerEntry(
                        Transaction transaction,
                        Account account,
                        EntryType entryType,
                        BigDecimal amount) {

                return new LedgerEntry(
                                transaction,
                                account,
                                entryType,
                                amount,
                                OffsetDateTime.parse("2026-09-10T10:00:00Z"));
        }

        private void setId(
                        Object entity,
                        Long id) {

                try {
                        Field field = entity.getClass()
                                        .getDeclaredField("id");

                        field.setAccessible(true);
                        field.set(entity, id);

                } catch (ReflectiveOperationException ex) {
                        throw new RuntimeException(
                                        "Failed to set entity ID for test",
                                        ex);
                }
        }
}