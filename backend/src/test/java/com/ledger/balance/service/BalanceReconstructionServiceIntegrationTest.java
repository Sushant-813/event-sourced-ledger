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
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.ledger.transaction.dto.TransferRequest;
import com.ledger.transaction.dto.WithdrawalRequest;
import com.ledger.event.entity.Event;
import com.ledger.event.repository.EventRepository;
import com.ledger.common.constant.SystemAccountConstants;

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