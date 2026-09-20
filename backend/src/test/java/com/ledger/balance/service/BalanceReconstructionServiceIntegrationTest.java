package com.ledger.balance.service;

import com.ledger.account.entity.Account;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.entity.AccountType;
import com.ledger.account.repository.AccountRepository;
import com.ledger.ledger.repository.LedgerEntryRepository;
import com.ledger.transaction.service.TransactionService;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import com.ledger.transaction.dto.DepositRequest;
import com.ledger.transaction.dto.TransferRequest;
import com.ledger.transaction.dto.WithdrawalRequest;
import com.ledger.event.entity.Event;
import com.ledger.event.repository.EventRepository;
import com.ledger.common.constant.SystemAccountConstants;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@SpringBootTest
class BalanceReconstructionServiceIntegrationTest {

        @Autowired
        private BalanceReconstructionService balanceReconstructionService;

        @Autowired
        private TransactionService transactionService;

        @Autowired
        private AccountRepository accountRepository;

        @Autowired
        private LedgerEntryRepository ledgerEntryRepository;

        @Autowired
        private EventRepository eventRepository;

        @Autowired
        private JdbcTemplate jdbcTemplate;

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

                        jdbcTemplate.update(
                                        "DELETE FROM accounts WHERE id = ?",
                                        accountId);
                }

                testAccountIds.clear();
        }

        private Account createTestAccount(
                        String accountNumber) {

                OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

                Account account = new Account();

                account.setAccountNumber(
                                accountNumber);

                account.setAccountName(
                                "Balance Reconstruction Integration Test Account");

                account.setAccountType(
                                AccountType.SAVINGS);

                account.setStatus(
                                AccountStatus.ACTIVE);

                account.setCreatedAt(now);

                account.setUpdatedAt(now);

                Account savedAccount = accountRepository.save(account);

                testAccountIds.add(
                                savedAccount.getId());

                return savedAccount;
        }

        private Account createTestAccount() {
                return createTestAccount(
                                "BAL-IT-" + UUID.randomUUID());
        }

        @Test
        void shouldReconstructBalanceAfterDeposit() {

                // Arrange
                Account account = createTestAccount();

                BigDecimal amount = new BigDecimal("100.00");

                DepositRequest request = new DepositRequest(amount);

                transactionService.deposit(
                                account.getId(),
                                request);

                // Act
                BigDecimal reconstructedBalance = balanceReconstructionService
                                .reconstructCurrentBalance(
                                                account.getId());

                BigDecimal directLedgerBalance = ledgerEntryRepository
                                .computeBalanceByAccountId(
                                                account.getId());

                // Assert
                assertEquals(
                                amount,
                                reconstructedBalance);

                assertEquals(
                                directLedgerBalance,
                                reconstructedBalance);
        }

        @Test
        void shouldReconstructBalanceAfterDepositAndWithdrawal() {

                // Arrange
                Account account = createTestAccount();

                BigDecimal depositAmount = new BigDecimal("100.00");

                BigDecimal withdrawalAmount = new BigDecimal("30.00");

                transactionService.deposit(
                                account.getId(),
                                new DepositRequest(depositAmount));

                transactionService.withdraw(
                                account.getId(),
                                new WithdrawalRequest(withdrawalAmount));

                // Act
                BigDecimal reconstructedBalance = balanceReconstructionService
                                .reconstructCurrentBalance(
                                                account.getId());

                BigDecimal directLedgerBalance = ledgerEntryRepository
                                .computeBalanceByAccountId(
                                                account.getId());

                // Assert
                BigDecimal expectedBalance = new BigDecimal("70.00");

                assertEquals(
                                0,
                                expectedBalance.compareTo(
                                                reconstructedBalance));

                assertEquals(
                                0,
                                directLedgerBalance.compareTo(
                                                reconstructedBalance));
        }

        @Test
        void shouldReconstructBalancesAfterTransfer() {

                // Arrange
                Account sourceAccount = createTestAccount();

                Account destinationAccount = createTestAccount();

                BigDecimal initialSourceBalance = new BigDecimal("100.00");

                BigDecimal transferAmount = new BigDecimal("40.00");

                transactionService.deposit(
                                sourceAccount.getId(),
                                new DepositRequest(initialSourceBalance));

                TransferRequest transferRequest = new TransferRequest(
                                sourceAccount.getId(),
                                destinationAccount.getId(),
                                transferAmount);

                transactionService.transfer(
                                transferRequest);

                // Act
                BigDecimal reconstructedSourceBalance = balanceReconstructionService
                                .reconstructCurrentBalance(
                                                sourceAccount.getId());

                BigDecimal reconstructedDestinationBalance = balanceReconstructionService
                                .reconstructCurrentBalance(
                                                destinationAccount.getId());

                BigDecimal directSourceBalance = ledgerEntryRepository
                                .computeBalanceByAccountId(
                                                sourceAccount.getId());

                BigDecimal directDestinationBalance = ledgerEntryRepository
                                .computeBalanceByAccountId(
                                                destinationAccount.getId());

                // Assert
                BigDecimal expectedSourceBalance = new BigDecimal("60.00");

                BigDecimal expectedDestinationBalance = new BigDecimal("40.00");

                assertEquals(
                                0,
                                expectedSourceBalance.compareTo(
                                                reconstructedSourceBalance));

                assertEquals(
                                0,
                                expectedDestinationBalance.compareTo(
                                                reconstructedDestinationBalance));

                assertEquals(
                                0,
                                directSourceBalance.compareTo(
                                                reconstructedSourceBalance));

                assertEquals(
                                0,
                                directDestinationBalance.compareTo(
                                                reconstructedDestinationBalance));
        }

        @Test
        void shouldMatchBalanceReconstructionWithEventStreamReplay() {

                // Arrange
                Account account = createTestAccount();

                BigDecimal depositAmount = new BigDecimal("200.00");
                BigDecimal withdrawalAmount = new BigDecimal("50.00");

                transactionService.deposit(
                                account.getId(),
                                new DepositRequest(depositAmount));

                transactionService.withdraw(
                                account.getId(),
                                new WithdrawalRequest(withdrawalAmount));

                // Act
                List<Event> events = eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(
                                                account.getId());

                BigDecimal replayedBalance = BigDecimal.ZERO;

                for (Event event : events) {

                        String eventType = event.getEventType().name();

                        if ("ACCOUNT_CREATED".equals(eventType)) {
                                continue;
                        }

                        Long transactionId = event.getTransaction().getId();

                        List<com.ledger.ledger.entity.LedgerEntry> ledgerEntries = ledgerEntryRepository
                                        .findByTransactionId(transactionId);

                        BigDecimal eventBalanceChange = BigDecimal.ZERO;

                        for (com.ledger.ledger.entity.LedgerEntry entry : ledgerEntries) {

                                // Only consider the ledger entry belonging to this account.
                                if (!entry.getAccount().getId().equals(account.getId())) {
                                        continue;
                                }

                                if (entry.getEntryType().name().equals("CREDIT")) {
                                        eventBalanceChange = eventBalanceChange.add(entry.getAmount());
                                } else if (entry.getEntryType().name().equals("DEBIT")) {
                                        eventBalanceChange = eventBalanceChange.subtract(entry.getAmount());
                                }
                        }

                        replayedBalance = replayedBalance.add(eventBalanceChange);
                }

                BigDecimal reconstructedBalance = balanceReconstructionService
                                .reconstructCurrentBalance(account.getId());

                // Assert
                assertEquals(
                                0,
                                replayedBalance.compareTo(reconstructedBalance),
                                "Event-ordered ledger replay must match balance reconstruction");

                assertEquals(
                                0,
                                new BigDecimal("150.00")
                                                .compareTo(reconstructedBalance));
        }

        @Test
        void shouldProduceIdenticalBalancesForIdenticalTransactionHistories() {

                // Arrange
                Account firstAccount = createTestAccount();
                Account secondAccount = createTestAccount();

                BigDecimal depositAmount = new BigDecimal("200.00");
                BigDecimal withdrawalAmount = new BigDecimal("50.00");

                // Account 1 history
                transactionService.deposit(
                                firstAccount.getId(),
                                new DepositRequest(depositAmount));

                transactionService.withdraw(
                                firstAccount.getId(),
                                new WithdrawalRequest(withdrawalAmount));

                // Account 2 history
                transactionService.deposit(
                                secondAccount.getId(),
                                new DepositRequest(depositAmount));

                transactionService.withdraw(
                                secondAccount.getId(),
                                new WithdrawalRequest(withdrawalAmount));

                // Act
                BigDecimal firstBalance = balanceReconstructionService
                                .reconstructCurrentBalance(
                                                firstAccount.getId());

                BigDecimal secondBalance = balanceReconstructionService
                                .reconstructCurrentBalance(
                                                secondAccount.getId());

                // Assert
                assertEquals(
                                0,
                                firstBalance.compareTo(secondBalance),
                                "Identical transaction histories must produce identical balances");

                assertEquals(
                                0,
                                new BigDecimal("150.00")
                                                .compareTo(firstBalance));
        }

        @Test
        void shouldUseEventIdAsTieBreakerWhenEventsHaveSameOccurredAt() {

                // Arrange
                Account account = createTestAccount();

                transactionService.deposit(
                                account.getId(),
                                new DepositRequest(
                                                new BigDecimal("100.00")));

                transactionService.withdraw(
                                account.getId(),
                                new WithdrawalRequest(
                                                new BigDecimal("30.00")));

                List<Event> events = eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(
                                                account.getId());

                Event depositEvent = events.stream()
                                .filter(event -> "DEPOSIT".equals(
                                                event.getEventType().name()))
                                .findFirst()
                                .orElseThrow();

                Event withdrawalEvent = events.stream()
                                .filter(event -> "WITHDRAWAL".equals(
                                                event.getEventType().name()))
                                .findFirst()
                                .orElseThrow();

                // The events were created sequentially, therefore the deposit
                // event must have the lower ID.
                assertEquals(
                                true,
                                depositEvent.getId() < withdrawalEvent.getId());

                OffsetDateTime identicalTimestamp = OffsetDateTime.of(
                                2026,
                                1,
                                1,
                                12,
                                0,
                                0,
                                0,
                                ZoneOffset.UTC);

                jdbcTemplate.update(
                                """
                                                UPDATE events
                                                SET occurred_at = ?
                                                WHERE id IN (?, ?)
                                                """,
                                identicalTimestamp,
                                depositEvent.getId(),
                                withdrawalEvent.getId());

                // Act
                List<Event> orderedEvents = eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(
                                                account.getId());

                Event orderedDepositEvent = orderedEvents.stream()
                                .filter(event -> "DEPOSIT".equals(
                                                event.getEventType().name()))
                                .findFirst()
                                .orElseThrow();

                Event orderedWithdrawalEvent = orderedEvents.stream()
                                .filter(event -> "WITHDRAWAL".equals(
                                                event.getEventType().name()))
                                .findFirst()
                                .orElseThrow();

                BigDecimal reconstructedBalance = balanceReconstructionService
                                .reconstructCurrentBalance(
                                                account.getId());

                // Assert
                assertEquals(
                                0,
                                identicalTimestamp.compareTo(
                                                orderedDepositEvent.getOccurredAt()));

                assertEquals(
                                0,
                                identicalTimestamp.compareTo(
                                                orderedWithdrawalEvent.getOccurredAt()));

                assertEquals(
                                true,
                                orderedDepositEvent.getId() < orderedWithdrawalEvent.getId(),
                                "When timestamps are equal, events must be ordered by ascending ID");

                assertEquals(
                                0,
                                new BigDecimal("70.00")
                                                .compareTo(reconstructedBalance));
        }

        @Test
        void shouldReconstructHistoricalBalanceAtEventBoundary() {

                // Arrange
                Account account = createTestAccount();

                BigDecimal depositAmount = new BigDecimal("100.00");

                BigDecimal withdrawalAmount = new BigDecimal("30.00");

                transactionService.deposit(
                                account.getId(),
                                new DepositRequest(depositAmount));

                List<Event> eventsAfterDeposit = eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(
                                                account.getId());

                Event depositEvent = eventsAfterDeposit.stream()
                                .filter(event -> "DEPOSIT".equals(
                                                event.getEventType().name()))
                                .findFirst()
                                .orElseThrow();

                OffsetDateTime asOf = depositEvent.getOccurredAt();

                transactionService.withdraw(
                                account.getId(),
                                new WithdrawalRequest(withdrawalAmount));

                Event withdrawalEvent = eventRepository
                                .findByAccountIdOrderByOccurredAtAscIdAsc(
                                                account.getId())
                                .stream()
                                .filter(event -> "WITHDRAWAL".equals(
                                                event.getEventType().name()))
                                .findFirst()
                                .orElseThrow();

                OffsetDateTime laterTimestamp = asOf.plusSeconds(1);

                jdbcTemplate.update(
                                """
                                                UPDATE events
                                                SET occurred_at = ?
                                                WHERE id = ?
                                                """,
                                laterTimestamp,
                                withdrawalEvent.getId());

                // Act
                BigDecimal historicalBalance = balanceReconstructionService
                                .reconstructBalanceAt(
                                                account.getId(),
                                                asOf);

                BigDecimal currentBalance = balanceReconstructionService
                                .reconstructCurrentBalance(
                                                account.getId());

                // Assert
                assertEquals(
                                0,
                                depositAmount.compareTo(
                                                historicalBalance));

                assertEquals(
                                0,
                                new BigDecimal("70.00")
                                                .compareTo(currentBalance));
        }

        @Test
        void shouldRejectBalanceReconstructionForSystemCashAccount() {

                // Arrange
                Account systemCashAccount = accountRepository
                                .findByAccountNumber(
                                                SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER)
                                .orElseThrow(() -> new IllegalStateException(
                                                "SYS-CASH account was not found"));

                // Act and Assert
                IllegalStateException exception = assertThrows(
                                IllegalStateException.class,
                                () -> balanceReconstructionService
                                                .reconstructCurrentBalance(
                                                                systemCashAccount.getId()));

                assertEquals(
                                "Balance reconstruction is not supported for the SYS-CASH account",
                                exception.getMessage());
        }
}