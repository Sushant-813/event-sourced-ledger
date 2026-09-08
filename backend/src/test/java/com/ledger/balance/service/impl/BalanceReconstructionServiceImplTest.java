package com.ledger.balance.service.impl;

import com.ledger.account.entity.Account;
import com.ledger.account.exception.AccountNotFoundException;
import com.ledger.account.repository.AccountRepository;
import com.ledger.common.constant.SystemAccountConstants;
import com.ledger.event.entity.Event;
import com.ledger.event.entity.EventType;
import com.ledger.event.repository.EventRepository;
import com.ledger.ledger.entity.EntryType;
import com.ledger.ledger.entity.LedgerEntry;
import com.ledger.ledger.repository.LedgerEntryRepository;
import com.ledger.transaction.entity.Transaction;
import com.ledger.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BalanceReconstructionServiceImplTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private LedgerEntryRepository ledgerEntryRepository;

    private BalanceReconstructionServiceImpl balanceReconstructionService;

    @BeforeEach
    void setUp() {
        balanceReconstructionService = new BalanceReconstructionServiceImpl(
                accountRepository,
                eventRepository,
                transactionRepository,
                ledgerEntryRepository);
    }

    @Test
    void shouldThrowAccountNotFoundExceptionWhenAccountDoesNotExist() {

        // Arrange
        Long accountId = 1L;

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
                AccountNotFoundException.class,
                () -> balanceReconstructionService
                        .reconstructCurrentBalance(accountId));

        verify(accountRepository).findById(accountId);

        verifyNoInteractions(
                eventRepository,
                transactionRepository,
                ledgerEntryRepository);
    }

    @Test
    void shouldReturnZeroWhenValidAccountHasNoEvents() {

        // Arrange
        Long accountId = 1L;

        Account account = customerAccount(accountId);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(eventRepository
                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                .thenReturn(List.of());

        // Act
        BigDecimal result = balanceReconstructionService
                .reconstructCurrentBalance(accountId);

        // Assert
        assertEquals(BigDecimal.ZERO, result);

        verify(accountRepository).findById(accountId);

        verify(eventRepository)
                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId);

        verifyNoInteractions(
                transactionRepository,
                ledgerEntryRepository);
    }

    @Test
    void shouldRejectSysCashReconstruction() {

        // Arrange
        Long accountId = 1L;

        Account systemAccount = mock(Account.class);

        when(systemAccount.getAccountNumber())
                .thenReturn(
                        SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(systemAccount));

        // Act & Assert
        assertThrows(
                IllegalStateException.class,
                () -> balanceReconstructionService
                        .reconstructCurrentBalance(accountId));

        verify(accountRepository).findById(accountId);

        verifyNoInteractions(
                eventRepository,
                transactionRepository,
                ledgerEntryRepository);
    }

    @Test
    void shouldReturnZeroForAccountCreatedEvent() {

        // Arrange
        Long accountId = 1L;

        Account account = customerAccount(accountId);

        Event accountCreatedEvent = lifecycleEvent(EventType.ACCOUNT_CREATED);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(eventRepository
                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                .thenReturn(List.of(accountCreatedEvent));

        // Act
        BigDecimal result = balanceReconstructionService
                .reconstructCurrentBalance(accountId);

        // Assert
        assertEquals(BigDecimal.ZERO, result);

        verifyNoInteractions(
                transactionRepository,
                ledgerEntryRepository);
    }

    @Test
    void shouldIncreaseBalanceForCreditLedgerEntry() {

        // Arrange
        Long accountId = 1L;
        Long transactionId = 10L;

        Account account = customerAccount(accountId);

        Transaction transaction = transaction(transactionId);

        Event depositEvent = monetaryEvent(
                EventType.DEPOSIT,
                transaction);

        LedgerEntry creditEntry = ledgerEntry(
                transaction,
                account,
                EntryType.CREDIT,
                new BigDecimal("100.00"));

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(eventRepository
                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                .thenReturn(List.of(depositEvent));

        when(transactionRepository.findAllById(anyCollection()))
                .thenReturn(List.of(transaction));

        when(ledgerEntryRepository
                .findByTransactionIdIn(anyCollection()))
                .thenReturn(List.of(creditEntry));

        // Act
        BigDecimal result = balanceReconstructionService
                .reconstructCurrentBalance(accountId);

        // Assert
        assertEquals(
                new BigDecimal("100.00"),
                result);

        verify(transactionRepository)
                .findAllById(anyCollection());

        verify(ledgerEntryRepository)
                .findByTransactionIdIn(anyCollection());
    }

    @Test
    void shouldDecreaseBalanceForDebitLedgerEntry() {

        // Arrange
        Long accountId = 1L;
        Long transactionId = 10L;

        Account account = customerAccount(accountId);

        Transaction transaction = transaction(transactionId);

        Event withdrawalEvent = monetaryEvent(
                EventType.WITHDRAWAL,
                transaction);

        LedgerEntry debitEntry = ledgerEntry(
                transaction,
                account,
                EntryType.DEBIT,
                new BigDecimal("40.00"));

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(eventRepository
                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                .thenReturn(List.of(withdrawalEvent));

        when(transactionRepository.findAllById(anyCollection()))
                .thenReturn(List.of(transaction));

        when(ledgerEntryRepository
                .findByTransactionIdIn(anyCollection()))
                .thenReturn(List.of(debitEntry));

        // Act
        BigDecimal result = balanceReconstructionService
                .reconstructCurrentBalance(accountId);

        // Assert
        assertEquals(
                new BigDecimal("-40.00"),
                result);
    }

    @Test
    void shouldReconstructBalanceFromMultipleEvents() {

        // Arrange
        Long accountId = 1L;

        Account account = customerAccount(accountId);

        Transaction depositTransaction = transaction(10L);

        Transaction withdrawalTransaction = transaction(20L);

        Event depositEvent = monetaryEvent(
                EventType.DEPOSIT,
                depositTransaction);

        Event withdrawalEvent = monetaryEvent(
                EventType.WITHDRAWAL,
                withdrawalTransaction);

        LedgerEntry depositEntry = ledgerEntry(
                depositTransaction,
                account,
                EntryType.CREDIT,
                new BigDecimal("100.00"));

        LedgerEntry withdrawalEntry = ledgerEntry(
                withdrawalTransaction,
                account,
                EntryType.DEBIT,
                new BigDecimal("30.00"));

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(eventRepository
                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                .thenReturn(
                        List.of(
                                depositEvent,
                                withdrawalEvent));

        when(transactionRepository.findAllById(anyCollection()))
                .thenReturn(
                        List.of(
                                depositTransaction,
                                withdrawalTransaction));

        when(ledgerEntryRepository
                .findByTransactionIdIn(anyCollection()))
                .thenReturn(
                        List.of(
                                depositEntry,
                                withdrawalEntry));

        // Act
        BigDecimal result = balanceReconstructionService
                .reconstructCurrentBalance(accountId);

        // Assert
        assertEquals(
                new BigDecimal("70.00"),
                result);
    }

    @Test
    void shouldSumMultipleLedgerEntriesForSameAccountAndTransaction() {

        // Arrange
        Long accountId = 1L;
        Long transactionId = 10L;

        Account account = customerAccount(accountId);

        Transaction transaction = transaction(transactionId);

        Event event = monetaryEvent(
                EventType.DEPOSIT,
                transaction);

        LedgerEntry firstCredit = ledgerEntry(
                transaction,
                account,
                EntryType.CREDIT,
                new BigDecimal("60.00"));

        LedgerEntry secondCredit = ledgerEntry(
                transaction,
                account,
                EntryType.CREDIT,
                new BigDecimal("40.00"));

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(eventRepository
                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                .thenReturn(List.of(event));

        when(transactionRepository.findAllById(anyCollection()))
                .thenReturn(List.of(transaction));

        when(ledgerEntryRepository
                .findByTransactionIdIn(anyCollection()))
                .thenReturn(
                        List.of(
                                firstCredit,
                                secondCredit));

        // Act
        BigDecimal result = balanceReconstructionService
                .reconstructCurrentBalance(accountId);

        // Assert
        assertEquals(
                new BigDecimal("100.00"),
                result);
    }

    @Test
    void shouldIncludeEventsAtHistoricalBoundary() {

        // Arrange
        Long accountId = 1L;
        Long transactionId = 10L;

        OffsetDateTime asOf = OffsetDateTime.parse(
                "2026-09-08T10:00:00Z");

        Account account = customerAccount(accountId);

        Transaction transaction = transaction(transactionId);

        Event depositEvent = monetaryEvent(
                EventType.DEPOSIT,
                transaction);

        LedgerEntry creditEntry = ledgerEntry(
                transaction,
                account,
                EntryType.CREDIT,
                new BigDecimal("100.00"));

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(eventRepository
                .findByAccountIdAndOccurredAtLessThanEqualOrderByOccurredAtAscIdAsc(
                        accountId,
                        asOf))
                .thenReturn(List.of(depositEvent));

        when(transactionRepository.findAllById(anyCollection()))
                .thenReturn(List.of(transaction));

        when(ledgerEntryRepository
                .findByTransactionIdIn(anyCollection()))
                .thenReturn(List.of(creditEntry));

        // Act
        BigDecimal result = balanceReconstructionService
                .reconstructBalanceAt(
                        accountId,
                        asOf);

        // Assert
        assertEquals(
                new BigDecimal("100.00"),
                result);

        verify(eventRepository)
                .findByAccountIdAndOccurredAtLessThanEqualOrderByOccurredAtAscIdAsc(
                        accountId,
                        asOf);
    }

    @Test
    void shouldReturnZeroForHistoricalPointBeforeMonetaryEvents() {

        // Arrange
        Long accountId = 1L;

        OffsetDateTime asOf = OffsetDateTime.parse(
                "2026-09-08T09:00:00Z");

        Account account = customerAccount(accountId);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(eventRepository
                .findByAccountIdAndOccurredAtLessThanEqualOrderByOccurredAtAscIdAsc(
                        accountId,
                        asOf))
                .thenReturn(List.of());

        // Act
        BigDecimal result = balanceReconstructionService
                .reconstructBalanceAt(
                        accountId,
                        asOf);

        // Assert
        assertEquals(BigDecimal.ZERO, result);

        verifyNoInteractions(
                transactionRepository,
                ledgerEntryRepository);
    }

    @Test
    void shouldFailWhenMonetaryEventHasNoTransaction() {

        // Arrange
        Long accountId = 1L;

        Account account = customerAccount(accountId);

        Event invalidEvent = mock(Event.class);

        when(invalidEvent.getEventType())
                .thenReturn(EventType.DEPOSIT);

        when(invalidEvent.getTransaction())
                .thenReturn(null);

        when(invalidEvent.getId())
                .thenReturn(100L);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(eventRepository
                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                .thenReturn(List.of(invalidEvent));

        // Act & Assert
        assertThrows(
                IllegalStateException.class,
                () -> balanceReconstructionService
                        .reconstructCurrentBalance(accountId));

        verifyNoInteractions(
                transactionRepository,
                ledgerEntryRepository);
    }

    @Test
    void shouldFailWhenReferencedTransactionIsMissing() {

        // Arrange
        Long accountId = 1L;
        Long transactionId = 10L;

        Account account = customerAccount(accountId);

        Transaction transaction = transaction(transactionId);

        Event event = monetaryEvent(
                EventType.DEPOSIT,
                transaction);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(eventRepository
                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                .thenReturn(List.of(event));

        when(transactionRepository.findAllById(anyCollection()))
                .thenReturn(List.of());

        when(ledgerEntryRepository
                .findByTransactionIdIn(anyCollection()))
                .thenReturn(List.of());

        // Act & Assert
        assertThrows(
                IllegalStateException.class,
                () -> balanceReconstructionService
                        .reconstructCurrentBalance(accountId));
    }

    @Test
    void shouldFailWhenTransactionHasNoLedgerEntryForAccount() {

        // Arrange
        Long accountId = 1L;
        Long otherAccountId = 2L;
        Long transactionId = 10L;

        Account account = customerAccount(accountId);

        Account otherAccount = mock(Account.class);

        when(otherAccount.getId())
                .thenReturn(otherAccountId);

        Transaction transaction = transaction(transactionId);

        Event event = monetaryEvent(
                EventType.DEPOSIT,
                transaction);

        LedgerEntry otherAccountEntry = mock(LedgerEntry.class);

        when(otherAccountEntry.getTransaction())
                .thenReturn(transaction);

        when(otherAccountEntry.getAccount())
                .thenReturn(otherAccount);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(eventRepository
                .findByAccountIdOrderByOccurredAtAscIdAsc(accountId))
                .thenReturn(List.of(event));

        when(transactionRepository.findAllById(anyCollection()))
                .thenReturn(List.of(transaction));

        when(ledgerEntryRepository
                .findByTransactionIdIn(anyCollection()))
                .thenReturn(List.of(otherAccountEntry));

        // Act & Assert
        assertThrows(
                IllegalStateException.class,
                () -> balanceReconstructionService
                        .reconstructCurrentBalance(accountId));
    }

    private Account customerAccount(Long accountId) {

        Account account = mock(Account.class);

        when(account.getId())
                .thenReturn(accountId);

        when(account.getAccountNumber())
                .thenReturn("ACC-" + accountId);

        return account;
    }

    private Transaction transaction(Long transactionId) {

        Transaction transaction = mock(Transaction.class);

        when(transaction.getId())
                .thenReturn(transactionId);

        return transaction;
    }

    private Event lifecycleEvent(EventType eventType) {

        Event event = mock(Event.class);

        when(event.getEventType())
                .thenReturn(eventType);

        return event;
    }

    private Event monetaryEvent(
            EventType eventType,
            Transaction transaction) {

        Event event = mock(Event.class);

        when(event.getEventType())
                .thenReturn(eventType);

        when(event.getTransaction())
                .thenReturn(transaction);

        return event;
    }

    private LedgerEntry ledgerEntry(
            Transaction transaction,
            Account account,
            EntryType entryType,
            BigDecimal amount) {

        LedgerEntry ledgerEntry = mock(LedgerEntry.class);

        when(ledgerEntry.getTransaction())
                .thenReturn(transaction);

        when(ledgerEntry.getAccount())
                .thenReturn(account);

        when(ledgerEntry.getEntryType())
                .thenReturn(entryType);

        when(ledgerEntry.getAmount())
                .thenReturn(amount);

        return ledgerEntry;
    }
}