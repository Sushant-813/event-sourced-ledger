package com.ledger.ledger.service;

import com.ledger.ledger.entity.EntryType;
import com.ledger.ledger.entity.LedgerEntry;
import com.ledger.ledger.repository.LedgerEntryRepository;
import com.ledger.transaction.entity.TransactionType;
import com.ledger.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import com.ledger.transaction.entity.Transaction;
import com.ledger.transaction.entity.TransactionStatus;
import com.ledger.ledger.exception.UnbalancedLedgerException;
import com.ledger.ledger.exception.InvalidLedgerEntryException;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;

import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.Mockito.verify;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;

class LedgerServiceImplTest {

    private TransactionRepository transactionRepository;
    private LedgerEntryRepository ledgerEntryRepository;

    private LedgerServiceImpl ledgerService;

    @BeforeEach
    void setUp() {
        transactionRepository = mock(TransactionRepository.class);
        ledgerEntryRepository = mock(LedgerEntryRepository.class);

        ledgerService = new LedgerServiceImpl(
                transactionRepository,
                ledgerEntryRepository);
    }

    @Test
    void shouldRecordBalancedTransaction() {
        // Arrange
        Transaction transaction = new Transaction(
                "TXN-001",
                TransactionType.DEPOSIT,
                TransactionStatus.PENDING,
                OffsetDateTime.now());

        LedgerEntry debit = new LedgerEntry(
                transaction,
                null,
                EntryType.DEBIT,
                new BigDecimal("100.00"),
                OffsetDateTime.now());

        LedgerEntry credit = new LedgerEntry(
                transaction,
                null,
                EntryType.CREDIT,
                new BigDecimal("100.00"),
                OffsetDateTime.now());

        List<LedgerEntry> entries = List.of(debit, credit);

        // Act
        ledgerService.recordTransaction(transaction, entries);

        // Assert
        verify(transactionRepository).save(transaction);
        verify(ledgerEntryRepository).saveAll(entries);
    }

    @Test
    void shouldRejectUnbalancedTransaction() {
        // Arrange
        Transaction transaction = new Transaction(
                "TXN-002",
                TransactionType.DEPOSIT,
                TransactionStatus.PENDING,
                OffsetDateTime.now());

        LedgerEntry debit = new LedgerEntry(
                transaction,
                null,
                EntryType.DEBIT,
                new BigDecimal("100.00"),
                OffsetDateTime.now());

        LedgerEntry credit = new LedgerEntry(
                transaction,
                null,
                EntryType.CREDIT,
                new BigDecimal("90.00"),
                OffsetDateTime.now());

        List<LedgerEntry> entries = List.of(debit, credit);

        // Act & Assert
        assertThrows(
                UnbalancedLedgerException.class,
                () -> ledgerService.recordTransaction(transaction, entries));

        verify(transactionRepository, never()).save(transaction);
        verify(ledgerEntryRepository, never()).saveAll(entries);
    }

    @Test
    void shouldRejectTransactionWhereCreditExceedsDebit() {
        // Arrange
        Transaction transaction = new Transaction(
                "TXN-003",
                TransactionType.DEPOSIT,
                TransactionStatus.PENDING,
                OffsetDateTime.now());

        LedgerEntry debit = new LedgerEntry(
                transaction,
                null,
                EntryType.DEBIT,
                new BigDecimal("90.00"),
                OffsetDateTime.now());

        LedgerEntry credit = new LedgerEntry(
                transaction,
                null,
                EntryType.CREDIT,
                new BigDecimal("100.00"),
                OffsetDateTime.now());

        List<LedgerEntry> entries = List.of(debit, credit);

        // Act & Assert
        assertThrows(
                UnbalancedLedgerException.class,
                () -> ledgerService.recordTransaction(transaction, entries));

        verify(transactionRepository, never()).save(transaction);
        verify(ledgerEntryRepository, never()).saveAll(entries);
    }

    @Test
    void shouldRejectTransactionWithoutDebit() {
        // Arrange
        Transaction transaction = new Transaction(
                "TXN-003",
                TransactionType.DEPOSIT,
                TransactionStatus.PENDING,
                OffsetDateTime.now());

        LedgerEntry credit = new LedgerEntry(
                transaction,
                null,
                EntryType.CREDIT,
                new BigDecimal("100.00"),
                OffsetDateTime.now());

        List<LedgerEntry> entries = List.of(credit);

        // Act & Assert
        assertThrows(
                UnbalancedLedgerException.class,
                () -> ledgerService.recordTransaction(transaction, entries));

        verify(transactionRepository, never()).save(transaction);
        verify(ledgerEntryRepository, never()).saveAll(entries);
    }

    @Test
    void shouldRejectTransactionWithoutCredit() {
        // Arrange
        Transaction transaction = new Transaction(
                "TXN-004",
                TransactionType.WITHDRAWAL,
                TransactionStatus.PENDING,
                OffsetDateTime.now());

        LedgerEntry debit = new LedgerEntry(
                transaction,
                null,
                EntryType.DEBIT,
                new BigDecimal("100.00"),
                OffsetDateTime.now());

        List<LedgerEntry> entries = List.of(debit);

        // Act & Assert
        assertThrows(
                UnbalancedLedgerException.class,
                () -> ledgerService.recordTransaction(transaction, entries));

        verify(transactionRepository, never()).save(transaction);
        verify(ledgerEntryRepository, never()).saveAll(entries);
    }

    @Test
    void shouldRejectEmptyLedgerEntries() {
        // Arrange
        Transaction transaction = new Transaction(
                "TXN-005",
                TransactionType.DEPOSIT,
                TransactionStatus.PENDING,
                OffsetDateTime.now());

        List<LedgerEntry> entries = List.of();

        // Act & Assert
        assertThrows(
                IllegalArgumentException.class,
                () -> ledgerService.recordTransaction(transaction, entries));

        verify(transactionRepository, never()).save(transaction);
        verify(ledgerEntryRepository, never()).saveAll(entries);
    }

    @Test
    void shouldRejectNullLedgerEntries() {
        // Arrange
        Transaction transaction = new Transaction(
                "TXN-006",
                TransactionType.DEPOSIT,
                TransactionStatus.PENDING,
                OffsetDateTime.now());

        // Act & Assert
        assertThrows(
                IllegalArgumentException.class,
                () -> ledgerService.recordTransaction(transaction, null));

        verify(transactionRepository, never()).save(transaction);
        verify(ledgerEntryRepository, never()).saveAll(anyList());
    }

    @Test
    void shouldRejectNullAmount() {
        // Arrange
        Transaction transaction = new Transaction(
                "TXN-007",
                TransactionType.DEPOSIT,
                TransactionStatus.PENDING,
                OffsetDateTime.now());

        LedgerEntry debit = new LedgerEntry(
                transaction,
                null,
                EntryType.DEBIT,
                null,
                OffsetDateTime.now());

        LedgerEntry credit = new LedgerEntry(
                transaction,
                null,
                EntryType.CREDIT,
                new BigDecimal("100.00"),
                OffsetDateTime.now());

        List<LedgerEntry> entries = List.of(debit, credit);

        // Act & Assert
        assertThrows(
                InvalidLedgerEntryException.class,
                () -> ledgerService.recordTransaction(transaction, entries));

        verify(transactionRepository, never()).save(transaction);
        verify(ledgerEntryRepository, never()).saveAll(entries);
    }

    @Test
    void shouldRejectZeroAmount() {
        // Arrange
        Transaction transaction = new Transaction(
                "TXN-008",
                TransactionType.DEPOSIT,
                TransactionStatus.PENDING,
                OffsetDateTime.now());

        LedgerEntry debit = new LedgerEntry(
                transaction,
                null,
                EntryType.DEBIT,
                BigDecimal.ZERO,
                OffsetDateTime.now());

        LedgerEntry credit = new LedgerEntry(
                transaction,
                null,
                EntryType.CREDIT,
                new BigDecimal("100.00"),
                OffsetDateTime.now());

        List<LedgerEntry> entries = List.of(debit, credit);

        // Act & Assert
        assertThrows(
                InvalidLedgerEntryException.class,
                () -> ledgerService.recordTransaction(transaction, entries));

        verify(transactionRepository, never()).save(transaction);
        verify(ledgerEntryRepository, never()).saveAll(entries);
    }

    @Test
    void shouldRejectNegativeAmount() {
        // Arrange
        Transaction transaction = new Transaction(
                "TXN-009",
                TransactionType.DEPOSIT,
                TransactionStatus.PENDING,
                OffsetDateTime.now());

        LedgerEntry debit = new LedgerEntry(
                transaction,
                null,
                EntryType.DEBIT,
                new BigDecimal("-100.00"),
                OffsetDateTime.now());

        LedgerEntry credit = new LedgerEntry(
                transaction,
                null,
                EntryType.CREDIT,
                new BigDecimal("100.00"),
                OffsetDateTime.now());

        List<LedgerEntry> entries = List.of(debit, credit);

        // Act & Assert
        assertThrows(
                InvalidLedgerEntryException.class,
                () -> ledgerService.recordTransaction(transaction, entries));

        verify(transactionRepository, never()).save(transaction);
        verify(ledgerEntryRepository, never()).saveAll(entries);
    }

    @Test
    void shouldAllowMultipleCreditEntries() {
        // Arrange
        Transaction transaction = new Transaction(
                "TXN-010",
                TransactionType.TRANSFER,
                TransactionStatus.PENDING,
                OffsetDateTime.now());

        LedgerEntry debit = new LedgerEntry(
                transaction,
                null,
                EntryType.DEBIT,
                new BigDecimal("1000.00"),
                OffsetDateTime.now());

        LedgerEntry creditOne = new LedgerEntry(
                transaction,
                null,
                EntryType.CREDIT,
                new BigDecimal("600.00"),
                OffsetDateTime.now());

        LedgerEntry creditTwo = new LedgerEntry(
                transaction,
                null,
                EntryType.CREDIT,
                new BigDecimal("400.00"),
                OffsetDateTime.now());

        List<LedgerEntry> entries = List.of(
                debit,
                creditOne,
                creditTwo);

        // Act
        ledgerService.recordTransaction(transaction, entries);

        // Assert
        verify(transactionRepository).save(transaction);
        verify(ledgerEntryRepository).saveAll(entries);
    }

    @Test
    void shouldAllowMultipleDebitEntries() {
        // Arrange
        Transaction transaction = new Transaction(
                "TXN-011",
                TransactionType.TRANSFER,
                TransactionStatus.PENDING,
                OffsetDateTime.now());

        LedgerEntry debitOne = new LedgerEntry(
                transaction,
                null,
                EntryType.DEBIT,
                new BigDecimal("600.00"),
                OffsetDateTime.now());

        LedgerEntry debitTwo = new LedgerEntry(
                transaction,
                null,
                EntryType.DEBIT,
                new BigDecimal("400.00"),
                OffsetDateTime.now());

        LedgerEntry credit = new LedgerEntry(
                transaction,
                null,
                EntryType.CREDIT,
                new BigDecimal("1000.00"),
                OffsetDateTime.now());

        List<LedgerEntry> entries = List.of(
                debitOne,
                debitTwo,
                credit);

        // Act
        ledgerService.recordTransaction(transaction, entries);

        // Assert
        verify(transactionRepository).save(transaction);
        verify(ledgerEntryRepository).saveAll(entries);
    }

    @Test
    void shouldPersistTransactionBeforeLedgerEntries() {
        // Arrange
        Transaction transaction = new Transaction(
                "TXN-012",
                TransactionType.DEPOSIT,
                TransactionStatus.PENDING,
                OffsetDateTime.now());

        LedgerEntry debit = new LedgerEntry(
                transaction,
                null,
                EntryType.DEBIT,
                new BigDecimal("100.00"),
                OffsetDateTime.now());

        LedgerEntry credit = new LedgerEntry(
                transaction,
                null,
                EntryType.CREDIT,
                new BigDecimal("100.00"),
                OffsetDateTime.now());

        List<LedgerEntry> entries = List.of(debit, credit);

        // Act
        ledgerService.recordTransaction(transaction, entries);

        // Assert
        InOrder inOrder = inOrder(
                transactionRepository,
                ledgerEntryRepository);

        inOrder.verify(transactionRepository).save(transaction);
        inOrder.verify(ledgerEntryRepository).saveAll(entries);
    }
}