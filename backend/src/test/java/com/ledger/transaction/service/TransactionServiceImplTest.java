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
import com.ledger.transaction.exception.InvalidTransferException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.ledger.transaction.dto.TransferRequest;
import com.ledger.transaction.dto.TransferResponse;
import static org.mockito.Mockito.times;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
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
        private Account sourceAccount;
        private Account destinationAccount;

        @BeforeEach
        void setUp() {
                sourceAccount = new Account();
                sourceAccount.setAccountNumber("ACC002");
                sourceAccount.setAccountName("Source Account");
                sourceAccount.setAccountType(AccountType.SAVINGS);
                sourceAccount.setStatus(AccountStatus.ACTIVE);

                destinationAccount = new Account();
                destinationAccount.setAccountNumber("ACC003");
                destinationAccount.setAccountName("Destination Account");
                destinationAccount.setAccountType(AccountType.SAVINGS);
                destinationAccount.setStatus(AccountStatus.ACTIVE);
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

        @Test
        void transfer_success() {

                // Arrange
                Long sourceAccountId = 1L;
                Long destinationAccountId = 2L;
                BigDecimal amount = new BigDecimal("100.00");

                TransferRequest request = new TransferRequest(
                                sourceAccountId,
                                destinationAccountId,
                                amount);

                when(accountRepository.findByIdForUpdate(sourceAccountId))
                                .thenReturn(Optional.of(sourceAccount));

                when(accountRepository.findByIdForUpdate(destinationAccountId))
                                .thenReturn(Optional.of(destinationAccount));

                when(ledgerEntryRepository.computeBalanceByAccountId(sourceAccountId))
                                .thenReturn(new BigDecimal("500.00"));

                // Act
                TransferResponse response = transactionService.transfer(request);

                // Assert
                assertEquals(amount, response.amount());
                assertEquals(TransactionType.TRANSFER, response.transactionType());
                assertEquals(TransactionStatus.COMPLETED, response.status());

                ArgumentCaptor<Transaction> transactionCaptor = ArgumentCaptor.forClass(Transaction.class);

                ArgumentCaptor<List<LedgerEntry>> entriesCaptor = ArgumentCaptor.forClass(List.class);

                verify(ledgerService, times(1)).recordTransaction(
                                transactionCaptor.capture(),
                                entriesCaptor.capture());

                Transaction transaction = transactionCaptor.getValue();
                List<LedgerEntry> entries = entriesCaptor.getValue();

                assertEquals(TransactionType.TRANSFER,
                                transaction.getTransactionType());

                assertEquals(TransactionStatus.COMPLETED,
                                transaction.getStatus());

                assertEquals(2, entries.size());
                assertEquals(transaction, entries.get(0).getTransaction());
                assertEquals(transaction, entries.get(1).getTransaction());

                LedgerEntry debitEntry = entries.get(0);
                LedgerEntry creditEntry = entries.get(1);

                assertEquals(sourceAccount, debitEntry.getAccount());
                assertEquals(EntryType.DEBIT, debitEntry.getEntryType());
                assertEquals(amount, debitEntry.getAmount());

                assertEquals(destinationAccount, creditEntry.getAccount());
                assertEquals(EntryType.CREDIT, creditEntry.getEntryType());
                assertEquals(amount, creditEntry.getAmount());
                assertEquals(
                                debitEntry.getAmount(),
                                creditEntry.getAmount());

                assertEquals(
                                request.amount(),
                                debitEntry.getAmount());

                assertEquals(
                                request.amount(),
                                creditEntry.getAmount());

                verify(eventService, times(1)).recordEvent(
                                eq(sourceAccount),
                                eq(transaction),
                                eq(EventType.TRANSFER_DEBIT),
                                eq(null),
                                any());

                verify(eventService, times(1)).recordEvent(
                                eq(destinationAccount),
                                eq(transaction),
                                eq(EventType.TRANSFER_CREDIT),
                                eq(null),
                                any());
        }

        @Test
        void transfer_sameSourceAndDestination_throwsInvalidTransferException() {

                // Arrange
                Long accountId = 1L;

                TransferRequest request = new TransferRequest(
                                accountId,
                                accountId,
                                new BigDecimal("100.00"));

                // Act + Assert
                assertThrows(
                                InvalidTransferException.class,
                                () -> transactionService.transfer(request));

                verifyNoInteractions(accountRepository);
                verifyNoInteractions(ledgerEntryRepository);
                verifyNoInteractions(ledgerService);
                verifyNoInteractions(eventService);
        }

        @Test
        void transfer_sourceAccountNotFound_throwsAccountNotFoundException() {

                // Arrange
                Long sourceAccountId = 1L;
                Long destinationAccountId = 2L;

                TransferRequest request = new TransferRequest(
                                sourceAccountId,
                                destinationAccountId,
                                new BigDecimal("100.00"));

                when(accountRepository.findByIdForUpdate(sourceAccountId))
                                .thenReturn(Optional.empty());

                // Act + Assert
                assertThrows(
                                AccountNotFoundException.class,
                                () -> transactionService.transfer(request));

                verify(accountRepository)
                                .findByIdForUpdate(sourceAccountId);

                verifyNoInteractions(ledgerEntryRepository);
                verifyNoInteractions(ledgerService);
                verifyNoInteractions(eventService);
        }

        @Test
        void transfer_destinationAccountNotFound_throwsAccountNotFoundException() {

                // Arrange
                Long sourceAccountId = 1L;
                Long destinationAccountId = 2L;

                TransferRequest request = new TransferRequest(
                                sourceAccountId,
                                destinationAccountId,
                                new BigDecimal("100.00"));

                when(accountRepository.findByIdForUpdate(sourceAccountId))
                                .thenReturn(Optional.of(sourceAccount));

                when(accountRepository.findByIdForUpdate(destinationAccountId))
                                .thenReturn(Optional.empty());

                // Act + Assert
                assertThrows(
                                AccountNotFoundException.class,
                                () -> transactionService.transfer(request));

                verify(accountRepository)
                                .findByIdForUpdate(sourceAccountId);

                verify(accountRepository)
                                .findByIdForUpdate(destinationAccountId);

                verifyNoInteractions(ledgerEntryRepository);
                verifyNoInteractions(ledgerService);
                verifyNoInteractions(eventService);
        }

        @Test
        void transfer_sourceSystemCashAccount_throwsAccountNotFoundException() {

                // Arrange
                Long sourceAccountId = 1L;
                Long destinationAccountId = 2L;

                sourceAccount.setAccountNumber(
                                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER);

                TransferRequest request = new TransferRequest(
                                sourceAccountId,
                                destinationAccountId,
                                new BigDecimal("100.00"));

                when(accountRepository.findByIdForUpdate(sourceAccountId))
                                .thenReturn(Optional.of(sourceAccount));

                when(accountRepository.findByIdForUpdate(destinationAccountId))
                                .thenReturn(Optional.of(destinationAccount));

                // Act + Assert
                assertThrows(
                                AccountNotFoundException.class,
                                () -> transactionService.transfer(request));

                verifyNoInteractions(ledgerEntryRepository);
                verifyNoInteractions(ledgerService);
                verifyNoInteractions(eventService);
        }

        @Test
        void transfer_inactiveSourceAccount_throwsAccountNotEligibleForTransactionException() {

                // Arrange
                Long sourceAccountId = 1L;
                Long destinationAccountId = 2L;

                sourceAccount.setStatus(AccountStatus.FROZEN);

                TransferRequest request = new TransferRequest(
                                sourceAccountId,
                                destinationAccountId,
                                new BigDecimal("100.00"));

                when(accountRepository.findByIdForUpdate(sourceAccountId))
                                .thenReturn(Optional.of(sourceAccount));

                when(accountRepository.findByIdForUpdate(destinationAccountId))
                                .thenReturn(Optional.of(destinationAccount));

                // Act + Assert
                assertThrows(
                                AccountNotEligibleForTransactionException.class,
                                () -> transactionService.transfer(request));

                verifyNoInteractions(ledgerEntryRepository);
                verifyNoInteractions(ledgerService);
                verifyNoInteractions(eventService);
        }

        @Test
        void transfer_inactiveDestinationAccount_throwsAccountNotEligibleForTransactionException() {

                // Arrange
                Long sourceAccountId = 1L;
                Long destinationAccountId = 2L;

                destinationAccount.setStatus(AccountStatus.FROZEN);

                TransferRequest request = new TransferRequest(
                                sourceAccountId,
                                destinationAccountId,
                                new BigDecimal("100.00"));

                when(accountRepository.findByIdForUpdate(sourceAccountId))
                                .thenReturn(Optional.of(sourceAccount));

                when(accountRepository.findByIdForUpdate(destinationAccountId))
                                .thenReturn(Optional.of(destinationAccount));

                // Act + Assert
                assertThrows(
                                AccountNotEligibleForTransactionException.class,
                                () -> transactionService.transfer(request));

                verifyNoInteractions(ledgerEntryRepository);
                verifyNoInteractions(ledgerService);
                verifyNoInteractions(eventService);
        }

        @Test
        void transfer_insufficientFunds_throwsInsufficientFundsException() {

                // Arrange
                Long sourceAccountId = 1L;
                Long destinationAccountId = 2L;

                BigDecimal balance = new BigDecimal("50.00");
                BigDecimal transferAmount = new BigDecimal("100.00");

                TransferRequest request = new TransferRequest(
                                sourceAccountId,
                                destinationAccountId,
                                transferAmount);

                when(accountRepository.findByIdForUpdate(sourceAccountId))
                                .thenReturn(Optional.of(sourceAccount));

                when(accountRepository.findByIdForUpdate(destinationAccountId))
                                .thenReturn(Optional.of(destinationAccount));

                when(ledgerEntryRepository.computeBalanceByAccountId(sourceAccountId))
                                .thenReturn(balance);

                // Act + Assert
                assertThrows(
                                InsufficientFundsException.class,
                                () -> transactionService.transfer(request));

                verifyNoInteractions(ledgerService);
                verifyNoInteractions(eventService);
        }

        @Test
        void transfer_exactBalance_succeeds() {

                // Arrange
                Long sourceAccountId = 1L;
                Long destinationAccountId = 2L;

                BigDecimal amount = new BigDecimal("100.00");

                TransferRequest request = new TransferRequest(
                                sourceAccountId,
                                destinationAccountId,
                                amount);

                when(accountRepository.findByIdForUpdate(sourceAccountId))
                                .thenReturn(Optional.of(sourceAccount));

                when(accountRepository.findByIdForUpdate(destinationAccountId))
                                .thenReturn(Optional.of(destinationAccount));

                when(ledgerEntryRepository.computeBalanceByAccountId(sourceAccountId))
                                .thenReturn(amount);

                // Act
                TransferResponse response = transactionService.transfer(request);

                // Assert
                assertEquals(amount, response.amount());

                verify(ledgerService).recordTransaction(
                                any(Transaction.class),
                                anyList());

                verify(eventService).recordEvent(
                                eq(sourceAccount),
                                any(Transaction.class),
                                eq(EventType.TRANSFER_DEBIT),
                                eq(null),
                                any());

                verify(eventService).recordEvent(
                                eq(destinationAccount),
                                any(Transaction.class),
                                eq(EventType.TRANSFER_CREDIT),
                                eq(null),
                                any());
        }

        @Test
        void transfer_locksAccountsInAscendingIdOrder() {

                // Arrange
                Long sourceAccountId = 2L;
                Long destinationAccountId = 1L;

                BigDecimal amount = new BigDecimal("100.00");

                TransferRequest request = new TransferRequest(
                                sourceAccountId,
                                destinationAccountId,
                                amount);

                // The implementation should lock ID 1 first.
                when(accountRepository.findByIdForUpdate(destinationAccountId))
                                .thenReturn(Optional.of(destinationAccount));

                // Then lock ID 2.
                when(accountRepository.findByIdForUpdate(sourceAccountId))
                                .thenReturn(Optional.of(sourceAccount));

                when(ledgerEntryRepository.computeBalanceByAccountId(sourceAccountId))
                                .thenReturn(new BigDecimal("500.00"));

                // Act
                transactionService.transfer(request);

                // Assert
                InOrder inOrder = inOrder(accountRepository);

                inOrder.verify(accountRepository)
                                .findByIdForUpdate(destinationAccountId);

                inOrder.verify(accountRepository)
                                .findByIdForUpdate(sourceAccountId);
        }

}