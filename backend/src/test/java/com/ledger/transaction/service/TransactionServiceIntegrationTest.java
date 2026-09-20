package com.ledger.transaction.service;

import com.ledger.account.entity.Account;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.entity.AccountType;
import com.ledger.account.repository.AccountRepository;
import com.ledger.common.constant.SystemAccountConstants;
import com.ledger.event.service.EventService;
import com.ledger.ledger.repository.LedgerEntryRepository;
import com.ledger.transaction.dto.DepositRequest;
import com.ledger.transaction.dto.TransactionResponse;
import com.ledger.transaction.dto.WithdrawalRequest;
import com.ledger.transaction.entity.Transaction;
import com.ledger.transaction.entity.TransactionStatus;
import com.ledger.transaction.exception.InsufficientFundsException;
import com.ledger.transaction.repository.TransactionRepository;
import com.ledger.account.exception.AccountNotFoundException;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.jdbc.core.JdbcTemplate;
import com.ledger.event.entity.EventType;
import com.ledger.transaction.dto.TransferRequest;
import com.ledger.transaction.dto.TransferResponse;
import com.ledger.transaction.entity.TransactionType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;

@SpringBootTest
class TransactionServiceIntegrationTest {

        @Autowired
        private TransactionService transactionService;

        @Autowired
        private AccountRepository accountRepository;

        @Autowired
        private TransactionRepository transactionRepository;

        @Autowired
        private LedgerEntryRepository ledgerEntryRepository;

        @Autowired
        private JdbcTemplate jdbcTemplate;

        @SpyBean
        private EventService eventService;

        private final List<Long> testAccountIds = new ArrayList<>();

        @AfterEach
        void tearDown() {

                for (Long accountId : testAccountIds) {

                        List<Long> transactionIds = jdbcTemplate.queryForList(
                                        """
                                                        SELECT DISTINCT transaction_id
                                                        FROM ledger_entries
                                                        WHERE account_id = ?
                                                        """,
                                        Long.class,
                                        accountId);

                        if (!transactionIds.isEmpty()) {

                                for (Long transactionId : transactionIds) {

                                        jdbcTemplate.update(
                                                        "DELETE FROM events WHERE transaction_id = ?",
                                                        transactionId);

                                        jdbcTemplate.update(
                                                        "DELETE FROM ledger_entries WHERE transaction_id = ?",
                                                        transactionId);

                                        jdbcTemplate.update(
                                                        "DELETE FROM transactions WHERE id = ?",
                                                        transactionId);
                                }
                        }

                        jdbcTemplate.update(
                                        "DELETE FROM accounts WHERE id = ?",
                                        accountId);
                }

                testAccountIds.clear();
        }

        private Account createTestAccount() {

                OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

                Account account = new Account();

                account.setAccountNumber(
                                "ACC-IT-" + UUID.randomUUID());

                account.setAccountName("Integration Test Account");
                account.setAccountType(AccountType.SAVINGS);
                account.setStatus(AccountStatus.ACTIVE);
                account.setCreatedAt(now);
                account.setUpdatedAt(now);

                Account savedAccount = accountRepository.save(account);

                testAccountIds.add(savedAccount.getId());

                return savedAccount;
        }

        @Test
        void deposit_persistsTransactionLedgerEntriesAndEvent() {

                // Arrange
                Account account = createTestAccount();

                BigDecimal amount = new BigDecimal("100.00");

                DepositRequest request = new DepositRequest(amount);

                // Act
                TransactionResponse response = transactionService.deposit(
                                account.getId(),
                                request);

                // Assert - Transaction
                assertNotNull(response.transactionId());

                assertEquals(
                                TransactionStatus.COMPLETED,
                                response.status());

                assertEquals(
                                amount,
                                response.amount());

                assertEquals(
                                account.getId(),
                                response.accountId());

                assertEquals(
                                "DEPOSIT",
                                response.transactionType().name());

                // Assert - Transaction row
                Integer transactionCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM transactions
                                                WHERE id = ?
                                                """,
                                Integer.class,
                                response.transactionId());

                assertEquals(1, transactionCount);

                // Assert - Ledger rows
                Integer ledgerEntryCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries
                                                WHERE transaction_id = ?
                                                """,
                                Integer.class,
                                response.transactionId());

                assertEquals(2, ledgerEntryCount);

                // Assert - Customer receives CREDIT
                Integer customerCreditCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries
                                                WHERE transaction_id = ?
                                                  AND account_id = ?
                                                  AND entry_type = 'CREDIT'
                                                  AND amount = ?
                                                """,
                                Integer.class,
                                response.transactionId(),
                                account.getId(),
                                amount);

                assertEquals(1, customerCreditCount);

                // Assert - SYS-CASH provides DEBIT
                Integer systemDebitCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries le
                                                JOIN accounts a ON a.id = le.account_id
                                                WHERE le.transaction_id = ?
                                                  AND a.account_number = ?
                                                  AND le.entry_type = 'DEBIT'
                                                  AND le.amount = ?
                                                """,
                                Integer.class,
                                response.transactionId(),
                                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER,
                                amount);

                assertEquals(1, systemDebitCount);

                // Assert - Event
                Integer eventCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM events
                                                WHERE transaction_id = ?
                                                  AND account_id = ?
                                                  AND event_type = 'DEPOSIT'
                                                """,
                                Integer.class,
                                response.transactionId(),
                                account.getId());

                assertEquals(1, eventCount);

                // Assert - Event payload remains null
                Integer nullPayloadCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM events
                                                WHERE transaction_id = ?
                                                  AND account_id = ?
                                                  AND event_type = 'DEPOSIT'
                                                  AND payload IS NULL
                                                """,
                                Integer.class,
                                response.transactionId(),
                                account.getId());

                assertEquals(1, nullPayloadCount);

                // Assert - Derived customer balance
                BigDecimal balance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT' THEN amount
                                                            WHEN entry_type = 'DEBIT' THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                account.getId());

                assertEquals(
                                0,
                                balance.compareTo(amount));
        }

        @Test
        void deposit_eventFailure_rollsBackTransactionLedgerAndEvent() {

                // Arrange
                Account account = createTestAccount();

                BigDecimal amount = new BigDecimal("100.00");

                DepositRequest request = new DepositRequest(amount);

                Integer initialTransactionCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM transactions t
                                                JOIN ledger_entries le
                                                    ON le.transaction_id = t.id
                                                WHERE le.account_id = ?
                                                """,
                                Integer.class,
                                account.getId());

                Integer initialLedgerEntryCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                Integer.class,
                                account.getId());

                Integer initialEventCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM events
                                                WHERE account_id = ?
                                                """,
                                Integer.class,
                                account.getId());

                BigDecimal initialBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT' THEN amount
                                                            WHEN entry_type = 'DEBIT' THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                account.getId());

                /*
                 * Execute the real EventService method first so that the Event
                 * is actually persisted inside the surrounding transaction.
                 * Then deliberately throw an exception to force rollback.
                 */
                doAnswer(invocation -> {

                        invocation.callRealMethod();

                        throw new RuntimeException(
                                        "Simulated event persistence failure");

                }).when(eventService).recordEvent(
                                any(Account.class),
                                any(Transaction.class),
                                eq(EventType.DEPOSIT),
                                eq((String) null),
                                any());

                // Act & Assert
                assertThrows(
                                RuntimeException.class,
                                () -> transactionService.deposit(
                                                account.getId(),
                                                request));

                // Assert - Transaction state unchanged
                Integer finalTransactionCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM transactions t
                                                JOIN ledger_entries le
                                                    ON le.transaction_id = t.id
                                                WHERE le.account_id = ?
                                                """,
                                Integer.class,
                                account.getId());

                assertEquals(
                                initialTransactionCount,
                                finalTransactionCount);

                // Assert - Ledger state unchanged
                Integer finalLedgerEntryCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                Integer.class,
                                account.getId());

                assertEquals(
                                initialLedgerEntryCount,
                                finalLedgerEntryCount);

                // Assert - Event state unchanged
                Integer finalEventCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM events
                                                WHERE account_id = ?
                                                """,
                                Integer.class,
                                account.getId());

                assertEquals(
                                initialEventCount,
                                finalEventCount);

                // Assert - Balance unchanged
                BigDecimal finalBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT' THEN amount
                                                            WHEN entry_type = 'DEBIT' THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                account.getId());

                assertEquals(
                                0,
                                initialBalance.compareTo(finalBalance));
        }

        @Test
        void transfer_persistsTransactionLedgerEntriesAndEvents() {

                // Arrange
                Account sourceAccount = createTestAccount();
                Account destinationAccount = createTestAccount();

                BigDecimal initialSourceBalance = new BigDecimal("500.00");
                BigDecimal transferAmount = new BigDecimal("100.00");

                // Fund the source account first.
                transactionService.deposit(
                                sourceAccount.getId(),
                                new DepositRequest(initialSourceBalance));

                TransferRequest request = new TransferRequest(
                                sourceAccount.getId(),
                                destinationAccount.getId(),
                                transferAmount);

                // Act
                TransferResponse response = transactionService.transfer(request);

                // Assert - Response
                assertNotNull(response.transactionId());

                assertEquals(
                                sourceAccount.getId(),
                                response.sourceAccountId());

                assertEquals(
                                destinationAccount.getId(),
                                response.destinationAccountId());

                assertEquals(
                                transferAmount,
                                response.amount());

                assertEquals(
                                TransactionType.TRANSFER,
                                response.transactionType());

                assertEquals(
                                TransactionStatus.COMPLETED,
                                response.status());

                // Assert - Transaction row
                Integer transactionCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM transactions
                                                WHERE id = ?
                                                """,
                                Integer.class,
                                response.transactionId());

                assertEquals(1, transactionCount);

                // Assert - Exactly two ledger entries
                Integer ledgerEntryCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries
                                                WHERE transaction_id = ?
                                                """,
                                Integer.class,
                                response.transactionId());

                assertEquals(2, ledgerEntryCount);

                // Assert - Source receives one DEBIT
                Integer sourceDebitCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries
                                                WHERE transaction_id = ?
                                                  AND account_id = ?
                                                  AND entry_type = 'DEBIT'
                                                  AND amount = ?
                                                """,
                                Integer.class,
                                response.transactionId(),
                                sourceAccount.getId(),
                                transferAmount);

                assertEquals(1, sourceDebitCount);

                // Assert - Destination receives one CREDIT
                Integer destinationCreditCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries
                                                WHERE transaction_id = ?
                                                  AND account_id = ?
                                                  AND entry_type = 'CREDIT'
                                                  AND amount = ?
                                                """,
                                Integer.class,
                                response.transactionId(),
                                destinationAccount.getId(),
                                transferAmount);

                assertEquals(1, destinationCreditCount);

                // Assert - Source event
                Integer sourceEventCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM events
                                                WHERE transaction_id = ?
                                                  AND account_id = ?
                                                  AND event_type = 'TRANSFER_DEBIT'
                                                  AND payload IS NULL
                                                """,
                                Integer.class,
                                response.transactionId(),
                                sourceAccount.getId());

                assertEquals(1, sourceEventCount);

                // Assert - Destination event
                Integer destinationEventCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM events
                                                WHERE transaction_id = ?
                                                  AND account_id = ?
                                                  AND event_type = 'TRANSFER_CREDIT'
                                                  AND payload IS NULL
                                                """,
                                Integer.class,
                                response.transactionId(),
                                destinationAccount.getId());

                assertEquals(1, destinationEventCount);

                // Assert - Final source balance
                BigDecimal sourceBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT' THEN amount
                                                            WHEN entry_type = 'DEBIT' THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                sourceAccount.getId());

                assertEquals(
                                0,
                                sourceBalance.compareTo(
                                                new BigDecimal("400.00")));

                // Assert - Final destination balance
                BigDecimal destinationBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT' THEN amount
                                                            WHEN entry_type = 'DEBIT' THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                destinationAccount.getId());

                assertEquals(
                                0,
                                destinationBalance.compareTo(
                                                new BigDecimal("100.00")));
        }

        @Test
        void transfer_eventFailure_rollsBackTransactionLedgerAndEvents() {

                // Arrange
                Account sourceAccount = createTestAccount();
                Account destinationAccount = createTestAccount();

                BigDecimal initialSourceBalance = new BigDecimal("500.00");
                BigDecimal transferAmount = new BigDecimal("100.00");

                // Fund the source account first.
                transactionService.deposit(
                                sourceAccount.getId(),
                                new DepositRequest(initialSourceBalance));

                TransferRequest request = new TransferRequest(
                                sourceAccount.getId(),
                                destinationAccount.getId(),
                                transferAmount);

                // Capture initial transaction counts
                Integer initialSourceTransactionCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM transactions t
                                                JOIN ledger_entries le
                                                    ON le.transaction_id = t.id
                                                WHERE le.account_id = ?
                                                """,
                                Integer.class,
                                sourceAccount.getId());

                Integer initialDestinationTransactionCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM transactions t
                                                JOIN ledger_entries le
                                                    ON le.transaction_id = t.id
                                                WHERE le.account_id = ?
                                                """,
                                Integer.class,
                                destinationAccount.getId());

                // Capture initial ledger entry counts
                Integer initialSourceLedgerEntryCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                Integer.class,
                                sourceAccount.getId());

                Integer initialDestinationLedgerEntryCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                Integer.class,
                                destinationAccount.getId());

                // Capture initial event counts
                Integer initialSourceEventCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM events
                                                WHERE account_id = ?
                                                """,
                                Integer.class,
                                sourceAccount.getId());

                Integer initialDestinationEventCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM events
                                                WHERE account_id = ?
                                                """,
                                Integer.class,
                                destinationAccount.getId());

                // Capture initial balances
                BigDecimal initialSourceBalanceBeforeTransfer = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT' THEN amount
                                                            WHEN entry_type = 'DEBIT' THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                sourceAccount.getId());

                BigDecimal initialDestinationBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT' THEN amount
                                                            WHEN entry_type = 'DEBIT' THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                destinationAccount.getId());

                /*
                 * Persist the event first inside the surrounding transaction,
                 * then deliberately throw an exception to force the entire
                 * transfer transaction to roll back.
                 */
                doAnswer(invocation -> {

                        invocation.callRealMethod();

                        throw new RuntimeException(
                                        "Simulated event persistence failure");

                }).when(eventService).recordEvent(
                                any(Account.class),
                                any(Transaction.class),
                                any(EventType.class),
                                eq((String) null),
                                any());

                // Act & Assert
                assertThrows(
                                RuntimeException.class,
                                () -> transactionService.transfer(request));

                // Assert - Source transaction state unchanged
                Integer finalSourceTransactionCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM transactions t
                                                JOIN ledger_entries le
                                                    ON le.transaction_id = t.id
                                                WHERE le.account_id = ?
                                                """,
                                Integer.class,
                                sourceAccount.getId());

                assertEquals(
                                initialSourceTransactionCount,
                                finalSourceTransactionCount);

                // Assert - Destination transaction state unchanged
                Integer finalDestinationTransactionCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM transactions t
                                                JOIN ledger_entries le
                                                    ON le.transaction_id = t.id
                                                WHERE le.account_id = ?
                                                """,
                                Integer.class,
                                destinationAccount.getId());

                assertEquals(
                                initialDestinationTransactionCount,
                                finalDestinationTransactionCount);

                // Assert - Source ledger state unchanged
                Integer finalSourceLedgerEntryCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                Integer.class,
                                sourceAccount.getId());

                assertEquals(
                                initialSourceLedgerEntryCount,
                                finalSourceLedgerEntryCount);

                // Assert - Destination ledger state unchanged
                Integer finalDestinationLedgerEntryCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                Integer.class,
                                destinationAccount.getId());

                assertEquals(
                                initialDestinationLedgerEntryCount,
                                finalDestinationLedgerEntryCount);

                // Assert - Source event state unchanged
                Integer finalSourceEventCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM events
                                                WHERE account_id = ?
                                                """,
                                Integer.class,
                                sourceAccount.getId());

                assertEquals(
                                initialSourceEventCount,
                                finalSourceEventCount);

                // Assert - Destination event state unchanged
                Integer finalDestinationEventCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM events
                                                WHERE account_id = ?
                                                """,
                                Integer.class,
                                destinationAccount.getId());

                assertEquals(
                                initialDestinationEventCount,
                                finalDestinationEventCount);

                // Assert - Source balance unchanged
                BigDecimal finalSourceBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT' THEN amount
                                                            WHEN entry_type = 'DEBIT' THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                sourceAccount.getId());

                assertEquals(
                                0,
                                initialSourceBalanceBeforeTransfer.compareTo(
                                                finalSourceBalance));

                // Assert - Destination balance unchanged
                BigDecimal finalDestinationBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT' THEN amount
                                                            WHEN entry_type = 'DEBIT' THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                destinationAccount.getId());

                assertEquals(
                                0,
                                initialDestinationBalance.compareTo(
                                                finalDestinationBalance));
        }

        @Test
        void transfer_exactBalance_succeedsAndLeavesSourceBalanceZero() {

                // Arrange
                Account sourceAccount = createTestAccount();
                Account destinationAccount = createTestAccount();

                BigDecimal transferAmount = new BigDecimal("100.00");

                // Fund the source with exactly the transfer amount.
                transactionService.deposit(
                                sourceAccount.getId(),
                                new DepositRequest(transferAmount));

                TransferRequest request = new TransferRequest(
                                sourceAccount.getId(),
                                destinationAccount.getId(),
                                transferAmount);

                // Act
                TransferResponse response = transactionService.transfer(request);

                // Assert - Transfer succeeded
                assertNotNull(response.transactionId());

                assertEquals(
                                TransactionType.TRANSFER,
                                response.transactionType());

                assertEquals(
                                TransactionStatus.COMPLETED,
                                response.status());

                // Assert - Source balance is exactly zero
                BigDecimal sourceBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT' THEN amount
                                                            WHEN entry_type = 'DEBIT' THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                sourceAccount.getId());

                assertEquals(
                                0,
                                sourceBalance.compareTo(BigDecimal.ZERO));

                // Assert - Destination received the full amount
                BigDecimal destinationBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT' THEN amount
                                                            WHEN entry_type = 'DEBIT' THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                destinationAccount.getId());

                assertEquals(
                                0,
                                destinationBalance.compareTo(transferAmount));
        }

        @Test
        void concurrentOppositeDirectionTransfers_bothSucceed() throws Exception {

                // Arrange
                Account accountA = createTestAccount();
                Account accountB = createTestAccount();

                BigDecimal initialBalance = new BigDecimal("200.00");
                BigDecimal transferAmount = new BigDecimal("100.00");

                // Fund both accounts.
                transactionService.deposit(
                                accountA.getId(),
                                new DepositRequest(initialBalance));

                transactionService.deposit(
                                accountB.getId(),
                                new DepositRequest(initialBalance));

                TransferRequest firstRequest = new TransferRequest(
                                accountA.getId(),
                                accountB.getId(),
                                transferAmount);

                TransferRequest secondRequest = new TransferRequest(
                                accountB.getId(),
                                accountA.getId(),
                                transferAmount);

                int threadCount = 2;

                ExecutorService executor = Executors.newFixedThreadPool(threadCount);

                CountDownLatch startLatch = new CountDownLatch(1);

                Future<TransferResponse> firstAttempt = executor.submit(() -> {

                        startLatch.await();

                        return transactionService.transfer(
                                        firstRequest);
                });

                Future<TransferResponse> secondAttempt = executor.submit(() -> {

                        startLatch.await();

                        return transactionService.transfer(
                                        secondRequest);
                });

                // Act
                startLatch.countDown();

                List<TransferResponse> successfulTransfers = new ArrayList<>();

                try {

                        for (Future<TransferResponse> attempt : List.of(firstAttempt, secondAttempt)) {

                                successfulTransfers.add(
                                                attempt.get());
                        }

                } finally {

                        executor.shutdown();
                }

                // Assert - both transfers succeeded
                assertEquals(
                                2,
                                successfulTransfers.size());

                // Assert - both responses are completed transfers
                for (TransferResponse transfer : successfulTransfers) {

                        assertEquals(
                                        TransactionType.TRANSFER,
                                        transfer.transactionType());

                        assertEquals(
                                        TransactionStatus.COMPLETED,
                                        transfer.status());

                        assertEquals(
                                        0,
                                        transfer.amount()
                                                        .compareTo(
                                                                        transferAmount));
                }

                // Assert - Account A balance remains unchanged
                BigDecimal finalBalanceA = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                accountA.getId());

                assertEquals(
                                0,
                                finalBalanceA.compareTo(
                                                initialBalance));

                // Assert - Account B balance remains unchanged
                BigDecimal finalBalanceB = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                accountB.getId());

                assertEquals(
                                0,
                                finalBalanceB.compareTo(
                                                initialBalance));

                // Assert - exactly two TRANSFER transactions exist
                Integer transferTransactionCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM transactions
                                                WHERE transaction_type = 'TRANSFER'
                                                  AND id IN (
                                                      SELECT DISTINCT transaction_id
                                                      FROM ledger_entries
                                                      WHERE account_id IN (?, ?)
                                                  )
                                                """,
                                Integer.class,
                                accountA.getId(),
                                accountB.getId());

                assertEquals(
                                2,
                                transferTransactionCount);
        }

        @Test
        void concurrentTransfersFromSameSource_onlyOneSucceeds() throws Exception {

                // Arrange
                Account sourceAccount = createTestAccount();
                Account firstDestinationAccount = createTestAccount();
                Account secondDestinationAccount = createTestAccount();

                BigDecimal initialBalance = new BigDecimal("100.00");
                BigDecimal transferAmount = new BigDecimal("80.00");

                // Fund the source account.
                transactionService.deposit(
                                sourceAccount.getId(),
                                new DepositRequest(initialBalance));

                TransferRequest firstRequest = new TransferRequest(
                                sourceAccount.getId(),
                                firstDestinationAccount.getId(),
                                transferAmount);

                TransferRequest secondRequest = new TransferRequest(
                                sourceAccount.getId(),
                                secondDestinationAccount.getId(),
                                transferAmount);

                int threadCount = 2;

                ExecutorService executor = Executors.newFixedThreadPool(threadCount);

                CountDownLatch startLatch = new CountDownLatch(1);

                Future<TransferResponse> firstAttempt = executor.submit(() -> {

                        startLatch.await();

                        return transactionService.transfer(
                                        firstRequest);
                });

                Future<TransferResponse> secondAttempt = executor.submit(() -> {

                        startLatch.await();

                        return transactionService.transfer(
                                        secondRequest);
                });

                // Act
                startLatch.countDown();

                List<TransferResponse> successfulTransfers = new ArrayList<>();

                int insufficientFundsFailures = 0;

                try {

                        for (Future<TransferResponse> attempt : List.of(firstAttempt, secondAttempt)) {

                                try {

                                        successfulTransfers.add(
                                                        attempt.get());

                                } catch (java.util.concurrent.ExecutionException ex) {

                                        if (ex.getCause() instanceof InsufficientFundsException) {

                                                insufficientFundsFailures++;

                                        } else {

                                                throw ex;
                                        }
                                }
                        }

                } finally {

                        executor.shutdown();
                }

                // Assert - exactly one transfer succeeded
                assertEquals(
                                1,
                                successfulTransfers.size());

                // Assert - exactly one transfer failed
                assertEquals(
                                1,
                                insufficientFundsFailures);

                TransferResponse successfulTransfer = successfulTransfers.get(0);

                assertEquals(
                                TransactionType.TRANSFER,
                                successfulTransfer.transactionType());

                assertEquals(
                                TransactionStatus.COMPLETED,
                                successfulTransfer.status());

                assertEquals(
                                0,
                                successfulTransfer.amount()
                                                .compareTo(
                                                                transferAmount));

                // Assert - source account balance is 20.00
                BigDecimal finalSourceBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                sourceAccount.getId());

                assertEquals(
                                0,
                                finalSourceBalance.compareTo(
                                                new BigDecimal("20.00")));

                // Assert - exactly one destination received 80.00
                BigDecimal firstDestinationBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                firstDestinationAccount.getId());

                BigDecimal secondDestinationBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                secondDestinationAccount.getId());

                int destinationsReceivingTransfer = 0;

                if (firstDestinationBalance.compareTo(
                                transferAmount) == 0) {

                        destinationsReceivingTransfer++;
                }

                if (secondDestinationBalance.compareTo(
                                transferAmount) == 0) {

                        destinationsReceivingTransfer++;
                }

                assertEquals(
                                1,
                                destinationsReceivingTransfer);

                // Assert - exactly one successful transfer transaction exists
                Integer transferTransactionCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM transactions
                                                WHERE transaction_type = 'TRANSFER'
                                                  AND id IN (
                                                      SELECT DISTINCT transaction_id
                                                      FROM ledger_entries
                                                      WHERE account_id = ?
                                                  )
                                                """,
                                Integer.class,
                                sourceAccount.getId());

                assertEquals(
                                1,
                                transferTransactionCount);
        }

        @Test
        void concurrentWithdrawals_onlyOneSucceeds() throws Exception {

                // Arrange
                Account account = createTestAccount();

                // Establish initial balance of $100.00.
                transactionService.deposit(
                                account.getId(),
                                new DepositRequest(new BigDecimal("100.00")));

                BigDecimal withdrawalAmount = new BigDecimal("80.00");

                WithdrawalRequest request = new WithdrawalRequest(withdrawalAmount);

                int threadCount = 2;

                ExecutorService executor = Executors.newFixedThreadPool(threadCount);

                CountDownLatch startLatch = new CountDownLatch(1);

                Future<TransactionResponse> firstAttempt = executor.submit(() -> {

                        startLatch.await();

                        return transactionService.withdraw(
                                        account.getId(),
                                        request);
                });

                Future<TransactionResponse> secondAttempt = executor.submit(() -> {

                        startLatch.await();

                        return transactionService.withdraw(
                                        account.getId(),
                                        request);
                });

                // Act
                startLatch.countDown();

                List<TransactionResponse> successfulWithdrawals = new ArrayList<>();

                int insufficientFundsFailures = 0;

                try {
                        for (Future<TransactionResponse> attempt : List.of(firstAttempt, secondAttempt)) {

                                try {
                                        successfulWithdrawals.add(attempt.get());

                                } catch (java.util.concurrent.ExecutionException ex) {

                                        if (ex.getCause() instanceof InsufficientFundsException) {

                                                insufficientFundsFailures++;

                                        } else {
                                                throw ex;
                                        }
                                }
                        }
                } finally {
                        executor.shutdown();
                }

                // Assert - exactly one withdrawal succeeded
                assertEquals(
                                1,
                                successfulWithdrawals.size());

                // Assert - exactly one withdrawal failed
                assertEquals(
                                1,
                                insufficientFundsFailures);

                // Assert - successful transaction is a withdrawal
                TransactionResponse successfulWithdrawal = successfulWithdrawals.get(0);

                assertEquals(
                                TransactionStatus.COMPLETED,
                                successfulWithdrawal.status());

                assertEquals(
                                new BigDecimal("80.00"),
                                successfulWithdrawal.amount());

                assertEquals(
                                account.getId(),
                                successfulWithdrawal.accountId());

                // Assert - final customer balance is $20.00
                BigDecimal finalBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                account.getId());

                assertEquals(
                                0,
                                finalBalance.compareTo(
                                                new BigDecimal("20.00")));

                // Assert - exactly one withdrawal transaction exists
                Integer withdrawalTransactionCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM transactions
                                                WHERE transaction_type = 'WITHDRAWAL'
                                                  AND id IN (
                                                      SELECT transaction_id
                                                      FROM ledger_entries
                                                      WHERE account_id = ?
                                                  )
                                                """,
                                Integer.class,
                                account.getId());

                assertEquals(
                                1,
                                withdrawalTransactionCount);

                // Assert — exactly two ledger entries for the successful withdrawal
                int withdrawalLedgerEntryCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries le
                                                JOIN transactions t ON t.id = le.transaction_id
                                                WHERE t.id = ?
                                                """,
                                Integer.class,
                                successfulWithdrawal.transactionId());

                assertEquals(2, withdrawalLedgerEntryCount);

                // Assert — customer account has exactly one DEBIT entry
                int customerDebitCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries
                                                WHERE transaction_id = ?
                                                  AND account_id = ?
                                                  AND entry_type = 'DEBIT'
                                                """,
                                Integer.class,
                                successfulWithdrawal.transactionId(),
                                account.getId());

                assertEquals(1, customerDebitCount);

                // Assert — SYS-CASH has exactly one CREDIT entry
                int systemCashCreditCount = jdbcTemplate.queryForObject(
                                """
                                                SELECT COUNT(*)
                                                FROM ledger_entries le
                                                JOIN accounts a ON a.id = le.account_id
                                                WHERE le.transaction_id = ?
                                                  AND a.account_number = ?
                                                  AND le.entry_type = 'CREDIT'
                                                """,
                                Integer.class,
                                successfulWithdrawal.transactionId(),
                                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER);

                assertEquals(1, systemCashCreditCount);
        }

        @Test
        void systemCashAccount_existsAndIsActive() {

                // Act
                Account systemAccount = accountRepository
                                .findByAccountNumber(
                                                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER)
                                .orElseThrow();

                // Assert
                assertEquals(
                                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER,
                                systemAccount.getAccountNumber());

                assertEquals(
                                AccountStatus.ACTIVE,
                                systemAccount.getStatus());

                assertEquals(
                                AccountType.CURRENT,
                                systemAccount.getAccountType());

                assertTrue(
                                systemAccount.getId() != null);
        }

        @Test
        void directOperationsOnSystemCashAccount_areRejected() {

                // Arrange
                Account systemCash = accountRepository
                                .findByAccountNumber(
                                                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER)
                                .orElseThrow();

                Account customerAccount = createTestAccount();

                BigDecimal amount = new BigDecimal("100.00");

                // Act & Assert - Deposit directly into SYS-CASH
                assertThrows(
                                AccountNotFoundException.class,
                                () -> transactionService.deposit(
                                                systemCash.getId(),
                                                new DepositRequest(amount)));

                // Act & Assert - Withdraw directly from SYS-CASH
                assertThrows(
                                AccountNotFoundException.class,
                                () -> transactionService.withdraw(
                                                systemCash.getId(),
                                                new WithdrawalRequest(amount)));

                // Act & Assert - SYS-CASH as transfer source
                assertThrows(
                                AccountNotFoundException.class,
                                () -> transactionService.transfer(
                                                new TransferRequest(
                                                                systemCash.getId(),
                                                                customerAccount.getId(),
                                                                amount)));

                // Act & Assert - SYS-CASH as transfer destination
                assertThrows(
                                AccountNotFoundException.class,
                                () -> transactionService.transfer(
                                                new TransferRequest(
                                                                customerAccount.getId(),
                                                                systemCash.getId(),
                                                                amount)));
        }

        @Test
        void allCompletedTransactionsMaintainDoubleEntryInvariant() {

                // Arrange
                Account firstAccount = createTestAccount();
                Account secondAccount = createTestAccount();

                // Initial funding
                transactionService.deposit(
                                firstAccount.getId(),
                                new DepositRequest(new BigDecimal("500.00")));

                transactionService.deposit(
                                secondAccount.getId(),
                                new DepositRequest(new BigDecimal("300.00")));

                // Withdrawal
                transactionService.withdraw(
                                firstAccount.getId(),
                                new WithdrawalRequest(new BigDecimal("100.00")));

                // Transfer
                transactionService.transfer(
                                new TransferRequest(
                                                firstAccount.getId(),
                                                secondAccount.getId(),
                                                new BigDecimal("150.00")));

                // Act
                List<Long> unbalancedTransactions = jdbcTemplate.queryForList(
                                """
                                                SELECT transaction_id
                                                FROM ledger_entries
                                                GROUP BY transaction_id
                                                HAVING SUM(
                                                    CASE
                                                        WHEN entry_type = 'DEBIT'
                                                            THEN amount
                                                        WHEN entry_type = 'CREDIT'
                                                            THEN -amount
                                                        ELSE 0
                                                    END
                                                ) <> 0
                                                """,
                                Long.class);

                // Assert
                assertTrue(
                                unbalancedTransactions.isEmpty(),
                                "Every completed transaction must have equal debit and credit totals");
        }

        @Test
        void depositAndWithdrawalMaintainCustomerSystemCashSymmetry() {

                // Arrange
                Account account = createTestAccount();

                Account systemCash = accountRepository
                                .findByAccountNumber(
                                                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER)
                                .orElseThrow();

                BigDecimal depositAmount = new BigDecimal("200.00");
                BigDecimal withdrawalAmount = new BigDecimal("75.00");

                BigDecimal customerBalanceBefore = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                account.getId());

                BigDecimal systemCashBalanceBefore = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                systemCash.getId());

                // Act
                transactionService.deposit(
                                account.getId(),
                                new DepositRequest(depositAmount));

                transactionService.withdraw(
                                account.getId(),
                                new WithdrawalRequest(withdrawalAmount));

                // Assert
                BigDecimal customerBalanceAfter = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                account.getId());

                BigDecimal systemCashBalanceAfter = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                systemCash.getId());

                BigDecimal expectedCustomerDelta = depositAmount.subtract(withdrawalAmount);

                BigDecimal expectedSystemCashDelta = expectedCustomerDelta.negate();

                BigDecimal actualCustomerDelta = customerBalanceAfter.subtract(customerBalanceBefore);

                BigDecimal actualSystemCashDelta = systemCashBalanceAfter.subtract(systemCashBalanceBefore);

                assertEquals(
                                0,
                                expectedCustomerDelta.compareTo(actualCustomerDelta),
                                "Customer balance delta must equal deposits minus withdrawals");

                assertEquals(
                                0,
                                expectedSystemCashDelta.compareTo(actualSystemCashDelta),
                                "SYS-CASH delta must be exactly opposite to customer balance delta");
        }

        @Test
        void transferConservesValue() {

                // Arrange
                Account sourceAccount = createTestAccount();
                Account destinationAccount = createTestAccount();

                BigDecimal initialSourceBalance = new BigDecimal("500.00");
                BigDecimal transferAmount = new BigDecimal("175.00");

                transactionService.deposit(
                                sourceAccount.getId(),
                                new DepositRequest(initialSourceBalance));

                Account systemCash = accountRepository
                                .findByAccountNumber(
                                                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER)
                                .orElseThrow();

                BigDecimal sourceBalanceBefore = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                sourceAccount.getId());

                BigDecimal destinationBalanceBefore = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                destinationAccount.getId());

                BigDecimal systemCashBalanceBefore = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                systemCash.getId());

                BigDecimal totalCustomerValueBefore = sourceBalanceBefore.add(destinationBalanceBefore);

                // Act
                transactionService.transfer(
                                new TransferRequest(
                                                sourceAccount.getId(),
                                                destinationAccount.getId(),
                                                transferAmount));

                // Assert
                BigDecimal sourceBalanceAfter = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                sourceAccount.getId());

                BigDecimal destinationBalanceAfter = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                destinationAccount.getId());

                BigDecimal systemCashBalanceAfter = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                systemCash.getId());

                BigDecimal totalCustomerValueAfter = sourceBalanceAfter.add(destinationBalanceAfter);

                // Source loses exactly the transferred amount
                assertEquals(
                                0,
                                sourceBalanceBefore
                                                .subtract(transferAmount)
                                                .compareTo(sourceBalanceAfter),
                                "Source account must decrease by exactly the transfer amount");

                // Destination gains exactly the transferred amount
                assertEquals(
                                0,
                                destinationBalanceBefore
                                                .add(transferAmount)
                                                .compareTo(destinationBalanceAfter),
                                "Destination account must increase by exactly the transfer amount");

                // Total customer value is conserved
                assertEquals(
                                0,
                                totalCustomerValueBefore.compareTo(totalCustomerValueAfter),
                                "Transfer must conserve total customer value");

                // SYS-CASH must not participate in customer-to-customer transfers
                assertEquals(
                                0,
                                systemCashBalanceBefore.compareTo(systemCashBalanceAfter),
                                "SYS-CASH balance must remain unchanged during a customer transfer");
        }

        @Test
        void concurrentDeposits_allSucceedAndBalanceIsCorrect() throws Exception {

                // Arrange
                Account account = createTestAccount();

                BigDecimal depositAmount = new BigDecimal("20.00");

                int threadCount = 5;

                ExecutorService executor = Executors.newFixedThreadPool(threadCount);

                CountDownLatch startLatch = new CountDownLatch(1);

                List<Future<TransactionResponse>> attempts = new ArrayList<>();

                for (int i = 0; i < threadCount; i++) {

                        attempts.add(
                                        executor.submit(() -> {

                                                startLatch.await();

                                                return transactionService.deposit(
                                                                account.getId(),
                                                                new DepositRequest(depositAmount));
                                        }));
                }

                // Act
                startLatch.countDown();

                List<TransactionResponse> successfulDeposits = new ArrayList<>();

                try {

                        for (Future<TransactionResponse> attempt : attempts) {

                                successfulDeposits.add(
                                                attempt.get());
                        }

                } finally {

                        executor.shutdown();
                }

                // Assert - all deposits succeeded
                assertEquals(
                                threadCount,
                                successfulDeposits.size());

                // Assert - every transaction completed
                for (TransactionResponse response : successfulDeposits) {

                        assertEquals(
                                        TransactionStatus.COMPLETED,
                                        response.status());

                        assertEquals(
                                        account.getId(),
                                        response.accountId());

                        assertEquals(
                                        0,
                                        response.amount()
                                                        .compareTo(depositAmount));
                }

                // Assert - final reconstructed balance
                BigDecimal finalBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                account.getId());

                BigDecimal expectedBalance = depositAmount.multiply(
                                BigDecimal.valueOf(threadCount));

                assertEquals(
                                0,
                                finalBalance.compareTo(expectedBalance),
                                "Concurrent deposits must produce the expected final balance");

                // Assert - each deposit creates exactly two ledger entries
                for (TransactionResponse response : successfulDeposits) {

                        Integer ledgerEntryCount = jdbcTemplate.queryForObject(
                                        """
                                                        SELECT COUNT(*)
                                                        FROM ledger_entries
                                                        WHERE transaction_id = ?
                                                        """,
                                        Integer.class,
                                        response.transactionId());

                        assertEquals(
                                        2,
                                        ledgerEntryCount,
                                        "Each deposit transaction must create exactly two ledger entries");
                }
        }

        @Test
        void concurrentDepositsAndWithdrawals_balanceNeverGoesNegative() throws Exception {

                // Arrange
                Account account = createTestAccount();

                BigDecimal initialBalance = new BigDecimal("100.00");
                BigDecimal operationAmount = new BigDecimal("20.00");

                // Establish enough initial balance for several concurrent withdrawals.
                transactionService.deposit(
                                account.getId(),
                                new DepositRequest(initialBalance));

                int depositCount = 5;
                int withdrawalCount = 10;

                int threadCount = depositCount + withdrawalCount;

                ExecutorService executor = Executors.newFixedThreadPool(threadCount);

                CountDownLatch startLatch = new CountDownLatch(1);

                List<Future<TransactionResponse>> depositAttempts = new ArrayList<>();

                List<Future<TransactionResponse>> withdrawalAttempts = new ArrayList<>();

                // Concurrent deposits
                for (int i = 0; i < depositCount; i++) {

                        depositAttempts.add(
                                        executor.submit(() -> {

                                                startLatch.await();

                                                return transactionService.deposit(
                                                                account.getId(),
                                                                new DepositRequest(operationAmount));
                                        }));
                }

                // Concurrent withdrawals
                for (int i = 0; i < withdrawalCount; i++) {

                        withdrawalAttempts.add(
                                        executor.submit(() -> {

                                                startLatch.await();

                                                return transactionService.withdraw(
                                                                account.getId(),
                                                                new WithdrawalRequest(operationAmount));
                                        }));
                }

                // Act
                startLatch.countDown();

                List<TransactionResponse> successfulDeposits = new ArrayList<>();

                List<TransactionResponse> successfulWithdrawals = new ArrayList<>();

                int insufficientFundsFailures = 0;

                try {

                        for (Future<TransactionResponse> attempt : depositAttempts) {

                                successfulDeposits.add(
                                                attempt.get());
                        }

                        for (Future<TransactionResponse> attempt : withdrawalAttempts) {

                                try {

                                        successfulWithdrawals.add(
                                                        attempt.get());

                                } catch (java.util.concurrent.ExecutionException ex) {

                                        if (ex.getCause() instanceof InsufficientFundsException) {

                                                insufficientFundsFailures++;

                                        } else {

                                                throw ex;
                                        }
                                }
                        }

                } finally {

                        executor.shutdown();
                }

                // Assert - every deposit succeeded
                assertEquals(
                                depositCount,
                                successfulDeposits.size());

                // Assert - withdrawals either succeed or fail only because of
                // insufficient funds.
                assertEquals(
                                withdrawalCount,
                                successfulWithdrawals.size()
                                                + insufficientFundsFailures);

                // Assert - every successful deposit completed
                for (TransactionResponse response : successfulDeposits) {

                        assertEquals(
                                        TransactionStatus.COMPLETED,
                                        response.status());

                        assertEquals(
                                        0,
                                        response.amount()
                                                        .compareTo(operationAmount));
                }

                // Assert - every successful withdrawal completed
                for (TransactionResponse response : successfulWithdrawals) {

                        assertEquals(
                                        TransactionStatus.COMPLETED,
                                        response.status());

                        assertEquals(
                                        0,
                                        response.amount()
                                                        .compareTo(operationAmount));
                }

                // Assert - final balance can never be negative
                BigDecimal finalBalance = jdbcTemplate.queryForObject(
                                """
                                                SELECT COALESCE(
                                                    SUM(
                                                        CASE
                                                            WHEN entry_type = 'CREDIT'
                                                                THEN amount
                                                            WHEN entry_type = 'DEBIT'
                                                                THEN -amount
                                                        END
                                                    ),
                                                    0
                                                )
                                                FROM ledger_entries
                                                WHERE account_id = ?
                                                """,
                                BigDecimal.class,
                                account.getId());

                assertTrue(
                                finalBalance.compareTo(BigDecimal.ZERO) >= 0,
                                "Concurrent operations must never produce a negative balance");

                // Assert - final balance matches the successful operations
                BigDecimal expectedBalance = initialBalance
                                .add(
                                                operationAmount.multiply(
                                                                BigDecimal.valueOf(
                                                                                successfulDeposits.size())))
                                .subtract(
                                                operationAmount.multiply(
                                                                BigDecimal.valueOf(
                                                                                successfulWithdrawals.size())));

                assertEquals(
                                0,
                                finalBalance.compareTo(expectedBalance),
                                "Final balance must reflect only successfully completed operations");

                // Assert - every successful operation is double-entry balanced
                List<Long> successfulTransactionIds = new ArrayList<>();

                successfulDeposits.forEach(
                                response -> successfulTransactionIds.add(
                                                response.transactionId()));

                successfulWithdrawals.forEach(
                                response -> successfulTransactionIds.add(
                                                response.transactionId()));

                for (Long transactionId : successfulTransactionIds) {

                        Integer ledgerEntryCount = jdbcTemplate.queryForObject(
                                        """
                                                        SELECT COUNT(*)
                                                        FROM ledger_entries
                                                        WHERE transaction_id = ?
                                                        """,
                                        Integer.class,
                                        transactionId);

                        assertEquals(
                                        2,
                                        ledgerEntryCount,
                                        "Every successful transaction must contain exactly two ledger entries");
                }
        }
}