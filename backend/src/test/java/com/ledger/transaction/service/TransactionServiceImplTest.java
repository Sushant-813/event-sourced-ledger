package com.ledger.transaction.service;

import com.ledger.account.entity.Account;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.entity.AccountType;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceImplTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private LedgerEntryRepository ledgerEntryRepository;

    @Mock
    private LedgerService ledgerService;

    @Mock
    private EventService eventService;

    @InjectMocks
    private TransactionServiceImpl transactionService;

    private Account customerAccount;
    private Account systemAccount;

    @BeforeEach
    void setUp() {
        customerAccount = new Account();
        customerAccount.setAccountNumber("ACC001");
        customerAccount.setAccountName("John Doe");
        customerAccount.setAccountType(AccountType.SAVINGS);
        customerAccount.setStatus(AccountStatus.ACTIVE);

        systemAccount = new Account();
        systemAccount.setAccountNumber(
                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER);
        systemAccount.setAccountName("System Cash Reserve");
        systemAccount.setAccountType(AccountType.CURRENT);
        systemAccount.setStatus(AccountStatus.ACTIVE);
    }

    @Test
    void deposit_success() {

        // Arrange
        Long accountId = 1L;
        BigDecimal amount = new BigDecimal("100.00");
        DepositRequest request = new DepositRequest(amount);

        when(accountRepository.findByIdForUpdate(accountId))
                .thenReturn(Optional.of(customerAccount));

        when(accountRepository.findByAccountNumber(
                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER))
                .thenReturn(Optional.of(systemAccount));

        // Act
        TransactionResponse result = transactionService.deposit(accountId, request);

        // Assert
        assertEquals(TransactionType.DEPOSIT, result.transactionType());
        assertEquals(TransactionStatus.COMPLETED, result.status());
        assertEquals(amount, result.amount());
        assertEquals(customerAccount.getId(), result.accountId());

        ArgumentCaptor<List<LedgerEntry>> entriesCaptor = ArgumentCaptor.forClass(List.class);

        verify(ledgerService).recordTransaction(
                any(Transaction.class),
                entriesCaptor.capture());

        List<LedgerEntry> entries = entriesCaptor.getValue();

        assertEquals(2, entries.size());

        LedgerEntry debitEntry = entries.stream()
                .filter(entry -> entry.getEntryType() == EntryType.DEBIT)
                .findFirst()
                .orElseThrow();

        LedgerEntry creditEntry = entries.stream()
                .filter(entry -> entry.getEntryType() == EntryType.CREDIT)
                .findFirst()
                .orElseThrow();

        assertEquals(systemAccount, debitEntry.getAccount());
        assertEquals(customerAccount, creditEntry.getAccount());
        assertEquals(amount, debitEntry.getAmount());
        assertEquals(amount, creditEntry.getAmount());

        verify(eventService).recordEvent(
                eq(customerAccount),
                any(Transaction.class),
                eq(EventType.DEPOSIT),
                eq(null),
                any());
    }

    @Test
    void deposit_accountNotFound_throwsException() {

        // Arrange
        Long accountId = 999L;
        DepositRequest request = new DepositRequest(new BigDecimal("100.00"));

        when(accountRepository.findByIdForUpdate(accountId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
                AccountNotFoundException.class,
                () -> transactionService.deposit(accountId, request));

        verify(ledgerService, never())
                .recordTransaction(any(Transaction.class), any());

        verify(eventService, never())
                .recordEvent(any(), any(), any(), any(), any());
    }

    @Test
    void deposit_frozenAccount_throwsException() {

        // Arrange
        Long accountId = 1L;
        DepositRequest request = new DepositRequest(new BigDecimal("100.00"));

        customerAccount.setStatus(AccountStatus.FROZEN);

        when(accountRepository.findByIdForUpdate(accountId))
                .thenReturn(Optional.of(customerAccount));

        // Act & Assert
        assertThrows(
                AccountNotEligibleForTransactionException.class,
                () -> transactionService.deposit(accountId, request));

        verify(accountRepository, never())
                .findByAccountNumber(
                        SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER);

        verify(ledgerService, never())
                .recordTransaction(any(Transaction.class), any());

        verify(eventService, never())
                .recordEvent(any(), any(), any(), any(), any());
    }

    @Test
    void deposit_closedAccount_throwsException() {

        // Arrange
        Long accountId = 1L;
        DepositRequest request = new DepositRequest(new BigDecimal("100.00"));

        customerAccount.setStatus(AccountStatus.CLOSED);

        when(accountRepository.findByIdForUpdate(accountId))
                .thenReturn(Optional.of(customerAccount));

        // Act & Assert
        assertThrows(
                AccountNotEligibleForTransactionException.class,
                () -> transactionService.deposit(accountId, request));

        verify(accountRepository, never())
                .findByAccountNumber(
                        SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER);

        verify(ledgerService, never())
                .recordTransaction(any(Transaction.class), any());

        verify(eventService, never())
                .recordEvent(any(), any(), any(), any(), any());
    }

    @Test
    void deposit_systemCashAccount_throwsNotFoundException() {

        // Arrange
        Long accountId = 1L;
        DepositRequest request = new DepositRequest(new BigDecimal("100.00"));

        when(accountRepository.findByIdForUpdate(accountId))
                .thenReturn(Optional.of(systemAccount));

        // Act & Assert
        assertThrows(
                AccountNotFoundException.class,
                () -> transactionService.deposit(accountId, request));

        verify(accountRepository, never())
                .findByAccountNumber(
                        SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER);

        verify(ledgerService, never())
                .recordTransaction(any(Transaction.class), any());

        verify(eventService, never())
                .recordEvent(any(), any(), any(), any(), any());
    }

    @Test
    void deposit_systemCashAccountMissing_throwsIllegalStateException() {

        // Arrange
        Long accountId = 1L;
        DepositRequest request = new DepositRequest(new BigDecimal("100.00"));

        when(accountRepository.findByIdForUpdate(accountId))
                .thenReturn(Optional.of(customerAccount));

        when(accountRepository.findByAccountNumber(
                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
                IllegalStateException.class,
                () -> transactionService.deposit(accountId, request));

        verify(ledgerService, never())
                .recordTransaction(any(Transaction.class), any());

        verify(eventService, never())
                .recordEvent(any(), any(), any(), any(), any());
    }

    @Test
    void withdraw_success() {

        // Arrange
        Long accountId = 1L;
        BigDecimal amount = new BigDecimal("40.00");
        WithdrawalRequest request = new WithdrawalRequest(amount);

        when(accountRepository.findByIdForUpdate(accountId))
                .thenReturn(Optional.of(customerAccount));

        when(ledgerEntryRepository.computeBalanceByAccountId(accountId))
                .thenReturn(new BigDecimal("100.00"));

        when(accountRepository.findByAccountNumber(
                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER))
                .thenReturn(Optional.of(systemAccount));

        // Act
        TransactionResponse result = transactionService.withdraw(accountId, request);

        // Assert
        assertEquals(TransactionType.WITHDRAWAL, result.transactionType());
        assertEquals(TransactionStatus.COMPLETED, result.status());
        assertEquals(amount, result.amount());

        ArgumentCaptor<List<LedgerEntry>> entriesCaptor = ArgumentCaptor.forClass(List.class);

        verify(ledgerService).recordTransaction(
                any(Transaction.class),
                entriesCaptor.capture());

        List<LedgerEntry> entries = entriesCaptor.getValue();

        assertEquals(2, entries.size());

        LedgerEntry debitEntry = entries.stream()
                .filter(entry -> entry.getEntryType() == EntryType.DEBIT)
                .findFirst()
                .orElseThrow();

        LedgerEntry creditEntry = entries.stream()
                .filter(entry -> entry.getEntryType() == EntryType.CREDIT)
                .findFirst()
                .orElseThrow();

        assertEquals(customerAccount, debitEntry.getAccount());
        assertEquals(systemAccount, creditEntry.getAccount());
        assertEquals(amount, debitEntry.getAmount());
        assertEquals(amount, creditEntry.getAmount());

        verify(ledgerEntryRepository)
                .computeBalanceByAccountId(accountId);

        verify(eventService).recordEvent(
                eq(customerAccount),
                any(Transaction.class),
                eq(EventType.WITHDRAWAL),
                eq(null),
                any());
    }

    @Test
    void withdraw_exactBalance_success() {

        // Arrange
        Long accountId = 1L;
        BigDecimal amount = new BigDecimal("100.00");
        WithdrawalRequest request = new WithdrawalRequest(amount);

        when(accountRepository.findByIdForUpdate(accountId))
                .thenReturn(Optional.of(customerAccount));

        when(ledgerEntryRepository.computeBalanceByAccountId(accountId))
                .thenReturn(new BigDecimal("100.00"));

        when(accountRepository.findByAccountNumber(
                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER))
                .thenReturn(Optional.of(systemAccount));

        // Act
        TransactionResponse result = transactionService.withdraw(accountId, request);

        // Assert
        assertEquals(TransactionType.WITHDRAWAL, result.transactionType());
        assertEquals(TransactionStatus.COMPLETED, result.status());
        assertEquals(amount, result.amount());

        verify(ledgerService).recordTransaction(
                any(Transaction.class),
                any());

        verify(eventService).recordEvent(
                eq(customerAccount),
                any(Transaction.class),
                eq(EventType.WITHDRAWAL),
                eq(null),
                any());
    }

    @Test
    void withdraw_insufficientFunds_throwsException() {

        // Arrange
        Long accountId = 1L;
        BigDecimal amount = new BigDecimal("150.00");
        WithdrawalRequest request = new WithdrawalRequest(amount);

        when(accountRepository.findByIdForUpdate(accountId))
                .thenReturn(Optional.of(customerAccount));

        when(ledgerEntryRepository.computeBalanceByAccountId(accountId))
                .thenReturn(new BigDecimal("100.00"));

        // Act & Assert
        assertThrows(
                InsufficientFundsException.class,
                () -> transactionService.withdraw(accountId, request));

        verify(accountRepository, never())
                .findByAccountNumber(
                        SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER);

        verify(ledgerService, never())
                .recordTransaction(any(Transaction.class), any());

        verify(eventService, never())
                .recordEvent(any(), any(), any(), any(), any());
    }

    @Test
    void withdraw_frozenAccount_throwsException() {

        // Arrange
        Long accountId = 1L;
        WithdrawalRequest request = new WithdrawalRequest(new BigDecimal("40.00"));

        customerAccount.setStatus(AccountStatus.FROZEN);

        when(accountRepository.findByIdForUpdate(accountId))
                .thenReturn(Optional.of(customerAccount));

        // Act & Assert
        assertThrows(
                AccountNotEligibleForTransactionException.class,
                () -> transactionService.withdraw(accountId, request));

        verify(ledgerEntryRepository, never())
                .computeBalanceByAccountId(accountId);

        verify(accountRepository, never())
                .findByAccountNumber(
                        SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER);

        verify(ledgerService, never())
                .recordTransaction(any(Transaction.class), any());

        verify(eventService, never())
                .recordEvent(any(), any(), any(), any(), any());
    }

    @Test
    void withdraw_closedAccount_throwsException() {

        // Arrange
        Long accountId = 1L;
        WithdrawalRequest request = new WithdrawalRequest(new BigDecimal("40.00"));

        customerAccount.setStatus(AccountStatus.CLOSED);

        when(accountRepository.findByIdForUpdate(accountId))
                .thenReturn(Optional.of(customerAccount));

        // Act & Assert
        assertThrows(
                AccountNotEligibleForTransactionException.class,
                () -> transactionService.withdraw(accountId, request));

        verify(ledgerEntryRepository, never())
                .computeBalanceByAccountId(accountId);

        verify(accountRepository, never())
                .findByAccountNumber(
                        SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER);

        verify(ledgerService, never())
                .recordTransaction(any(Transaction.class), any());

        verify(eventService, never())
                .recordEvent(any(), any(), any(), any(), any());
    }

    @Test
    void withdraw_systemCashAccount_throwsNotFoundException() {

        // Arrange
        Long accountId = 1L;
        WithdrawalRequest request = new WithdrawalRequest(new BigDecimal("40.00"));

        when(accountRepository.findByIdForUpdate(accountId))
                .thenReturn(Optional.of(systemAccount));

        // Act & Assert
        assertThrows(
                AccountNotFoundException.class,
                () -> transactionService.withdraw(accountId, request));

        verify(ledgerEntryRepository, never())
                .computeBalanceByAccountId(accountId);

        verify(accountRepository, never())
                .findByAccountNumber(
                        SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER);

        verify(ledgerService, never())
                .recordTransaction(any(Transaction.class), any());

        verify(eventService, never())
                .recordEvent(any(), any(), any(), any(), any());
    }

}