package com.ledger.audit.service;

import com.ledger.account.entity.Account;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.entity.AccountType;
import com.ledger.account.exception.AccountNotFoundException;
import com.ledger.account.repository.AccountRepository;
import com.ledger.audit.dto.AuditTrailResponse;
import com.ledger.balance.service.BalanceReconstructionService;
import com.ledger.common.constant.SystemAccountConstants;
import com.ledger.event.entity.Event;
import com.ledger.event.entity.EventType;
import com.ledger.event.repository.EventRepository;
import com.ledger.ledger.entity.EntryType;
import com.ledger.transaction.dto.DepositRequest;
import com.ledger.transaction.dto.WithdrawalRequest;
import com.ledger.transaction.service.TransactionService;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
class AuditServiceIntegrationTest {

    @Autowired
    private AuditService auditService;

    @Autowired
    private BalanceReconstructionService balanceReconstructionService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AccountRepository accountRepository;

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

            /*
             * Remove lifecycle/other events that may not be linked
             * to a transaction.
             */
            jdbcTemplate.update(
                    "DELETE FROM events WHERE account_id = ?",
                    accountId);

            jdbcTemplate.update(
                    "DELETE FROM accounts WHERE id = ?",
                    accountId);
        }

        testAccountIds.clear();
    }

    @Test
    void getBalance_matchesBalanceReconstructionService() {

        Account account = createTestAccount();

        transactionService.deposit(
                account.getId(),
                new DepositRequest(
                        new BigDecimal("500.00")));

        transactionService.withdraw(
                account.getId(),
                new WithdrawalRequest(
                        new BigDecimal("125.00")));

        BigDecimal auditBalance = auditService
                .getBalance(
                        account.getId(),
                        null)
                .balance();

        BigDecimal reconstructedBalance = balanceReconstructionService
                .reconstructCurrentBalance(
                        account.getId());

        assertEquals(
                0,
                auditBalance.compareTo(
                        reconstructedBalance));

        assertEquals(
                0,
                new BigDecimal("375.00")
                        .compareTo(auditBalance));
    }

    @Test
    void getBalance_matchesHistoricalBalanceReconstruction() {

        Account account = createTestAccount();

        transactionService.deposit(
                account.getId(),
                new DepositRequest(
                        new BigDecimal("500.00")));

        Event depositEvent = eventRepository
                .findByAccountIdOrderByOccurredAtAscIdAsc(
                        account.getId())
                .stream()
                .filter(event -> event.getEventType() == EventType.DEPOSIT)
                .findFirst()
                .orElseThrow();

        OffsetDateTime asOf = depositEvent.getOccurredAt();

        transactionService.withdraw(
                account.getId(),
                new WithdrawalRequest(
                        new BigDecimal("125.00")));

        BigDecimal auditHistoricalBalance = auditService
                .getBalance(
                        account.getId(),
                        asOf)
                .balance();

        BigDecimal reconstructedHistoricalBalance = balanceReconstructionService
                .reconstructBalanceAt(
                        account.getId(),
                        asOf);

        assertEquals(
                0,
                auditHistoricalBalance.compareTo(
                        reconstructedHistoricalBalance));

        assertEquals(
                0,
                new BigDecimal("500.00")
                        .compareTo(
                                auditHistoricalBalance));
    }

    @Test
    void getAuditTrail_matchesBalanceReconstructionAndCalculatesRunningBalances() {

        Account account = createTestAccount();

        transactionService.deposit(
                account.getId(),
                new DepositRequest(
                        new BigDecimal("1000.00")));

        transactionService.withdraw(
                account.getId(),
                new WithdrawalRequest(
                        new BigDecimal("250.00")));

        AuditTrailResponse result = auditService.getAuditTrail(
                account.getId(),
                null,
                0,
                20);

        BigDecimal reconstructedBalance = balanceReconstructionService
                .reconstructCurrentBalance(
                        account.getId());

        assertEquals(
                0,
                result.finalBalance()
                        .compareTo(
                                reconstructedBalance));

        assertEquals(
                0,
                new BigDecimal("750.00")
                        .compareTo(
                                result.finalBalance()));

        // DEPOSIT + WITHDRAWAL
        assertEquals(
                2,
                result.items().size());

        // DEPOSIT
        assertEquals(
                EventType.DEPOSIT,
                result.items()
                        .get(0)
                        .eventType());

        assertEquals(
                new BigDecimal("1000.00"),
                result.items()
                        .get(0)
                        .balanceChange());

        assertEquals(
                new BigDecimal("1000.00"),
                result.items()
                        .get(0)
                        .runningBalance());

        // WITHDRAWAL
        assertEquals(
                EventType.WITHDRAWAL,
                result.items()
                        .get(1)
                        .eventType());

        assertEquals(
                new BigDecimal("-250.00"),
                result.items()
                        .get(1)
                        .balanceChange());

        assertEquals(
                new BigDecimal("750.00"),
                result.items()
                        .get(1)
                        .runningBalance());
    }

    @Test
    void getAuditTrail_paginatesAfterCompleteHistoryReconstruction() {

        Account account = createTestAccount();

        transactionService.deposit(
                account.getId(),
                new DepositRequest(
                        new BigDecimal("1000.00")));

        transactionService.withdraw(
                account.getId(),
                new WithdrawalRequest(
                        new BigDecimal("250.00")));

        AuditTrailResponse firstPage = auditService.getAuditTrail(
                account.getId(),
                null,
                0,
                2);

        assertEquals(
                0,
                firstPage.page());

        assertEquals(
                2,
                firstPage.size());

        assertEquals(
                1,
                firstPage.totalPages());

        assertEquals(
                2,
                firstPage.totalElements());

        assertEquals(
                2,
                firstPage.items().size());

        // First item: DEPOSIT
        assertEquals(
                EventType.DEPOSIT,
                firstPage.items()
                        .get(0)
                        .eventType());

        assertEquals(
                new BigDecimal("1000.00"),
                firstPage.items()
                        .get(0)
                        .balanceChange());

        assertEquals(
                new BigDecimal("1000.00"),
                firstPage.items()
                        .get(0)
                        .runningBalance());

        // Second item: WITHDRAWAL
        assertEquals(
                EventType.WITHDRAWAL,
                firstPage.items()
                        .get(1)
                        .eventType());

        assertEquals(
                new BigDecimal("-250.00"),
                firstPage.items()
                        .get(1)
                        .balanceChange());

        assertEquals(
                new BigDecimal("750.00"),
                firstPage.items()
                        .get(1)
                        .runningBalance());

        /*
         * finalBalance represents the complete reconstructed history,
         * not the balance of an individual page.
         */
        assertEquals(
                new BigDecimal("750.00"),
                firstPage.finalBalance());
    }

    @Test
    void getAuditTrail_historicalAsOfExcludesLaterTransactions() {

        Account account = createTestAccount();

        transactionService.deposit(
                account.getId(),
                new DepositRequest(
                        new BigDecimal("1000.00")));

        Event depositEvent = eventRepository
                .findByAccountIdOrderByOccurredAtAscIdAsc(
                        account.getId())
                .stream()
                .filter(event -> event.getEventType() == EventType.DEPOSIT)
                .findFirst()
                .orElseThrow();

        OffsetDateTime asOf = depositEvent.getOccurredAt();

        transactionService.withdraw(
                account.getId(),
                new WithdrawalRequest(
                        new BigDecimal("250.00")));

        AuditTrailResponse result = auditService.getAuditTrail(
                account.getId(),
                asOf,
                0,
                20);

        assertEquals(
                asOf,
                result.asOf());

        assertEquals(
                new BigDecimal("1000.00"),
                result.finalBalance());

        // DEPOSIT only — later WITHDRAWAL is excluded by asOf
        assertEquals(
                1,
                result.items().size());

        assertEquals(
                EventType.DEPOSIT,
                result.items()
                        .get(0)
                        .eventType());

        assertEquals(
                new BigDecimal("1000.00"),
                result.items()
                        .get(0)
                        .balanceChange());

        assertEquals(
                new BigDecimal("1000.00"),
                result.items()
                        .get(0)
                        .runningBalance());
    }

    @Test
    void getLedgerHistory_returnsRealLedgerEntriesAndSupportsEntryTypeFilter() {

        Account account = createTestAccount();

        transactionService.deposit(
                account.getId(),
                new DepositRequest(
                        new BigDecimal("500.00")));

        transactionService.withdraw(
                account.getId(),
                new WithdrawalRequest(
                        new BigDecimal("100.00")));

        var result = auditService.getLedgerHistory(
                account.getId(),
                0,
                20,
                "createdAt",
                "asc",
                EntryType.CREDIT);

        assertEquals(
                1,
                result.totalElements());

        assertEquals(
                1,
                result.content().size());

        assertEquals(
                EntryType.CREDIT,
                result.content()
                        .get(0)
                        .entryType());

        assertEquals(
                new BigDecimal("500.00"),
                result.content()
                        .get(0)
                        .amount());
    }

    @Test
    void getTransactionHistory_returnsUniqueTransactionsInEventOrder() {

        Account account = createTestAccount();

        transactionService.deposit(
                account.getId(),
                new DepositRequest(
                        new BigDecimal("500.00")));

        transactionService.withdraw(
                account.getId(),
                new WithdrawalRequest(
                        new BigDecimal("100.00")));

        var result = auditService.getTransactionHistory(
                account.getId(),
                0,
                20);

        assertEquals(
                2,
                result.totalElements());

        assertEquals(
                2,
                result.content().size());

        assertEquals(
                "DEPOSIT",
                result.content()
                        .get(0)
                        .transactionType()
                        .name());

        assertEquals(
                "WITHDRAWAL",
                result.content()
                        .get(1)
                        .transactionType()
                        .name());

        assertEquals(
                true,
                result.content()
                        .get(0)
                        .createdAt()
                        .compareTo(
                                result.content()
                                        .get(1)
                                        .createdAt()) <= 0);
    }

    @Test
    void getEventHistory_returnsEventsInDeterministicOrder() {

        Account account = createTestAccount();

        transactionService.deposit(
                account.getId(),
                new DepositRequest(
                        new BigDecimal("100.00")));

        transactionService.withdraw(
                account.getId(),
                new WithdrawalRequest(
                        new BigDecimal("25.00")));

        var result = auditService.getEventHistory(
                account.getId(),
                0,
                20,
                "occurredAt",
                "asc");

        // DEPOSIT + WITHDRAWAL
        assertEquals(
                2,
                result.totalElements());

        assertEquals(
                2,
                result.content().size());

        assertEquals(
                EventType.DEPOSIT,
                result.content()
                        .get(0)
                        .eventType());

        assertEquals(
                EventType.WITHDRAWAL,
                result.content()
                        .get(1)
                        .eventType());

        assertEquals(
                true,
                result.content()
                        .get(0)
                        .occurredAt()
                        .compareTo(
                                result.content()
                                        .get(1)
                                        .occurredAt()) <= 0);
    }

    @Test
    void auditMethods_rejectSystemCashAccount() {

        Account systemCashAccount = accountRepository
                .findByAccountNumber(
                        SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER)
                .orElseThrow();

        assertThrows(
                AccountNotFoundException.class,
                () -> auditService.getBalance(
                        systemCashAccount.getId(),
                        null));

        assertThrows(
                AccountNotFoundException.class,
                () -> auditService.getAuditTrail(
                        systemCashAccount.getId(),
                        null,
                        0,
                        20));

        assertThrows(
                AccountNotFoundException.class,
                () -> auditService.getEventHistory(
                        systemCashAccount.getId(),
                        0,
                        20,
                        "occurredAt",
                        "asc"));

        assertThrows(
                AccountNotFoundException.class,
                () -> auditService.getTransactionHistory(
                        systemCashAccount.getId(),
                        0,
                        20));

        assertThrows(
                AccountNotFoundException.class,
                () -> auditService.getLedgerHistory(
                        systemCashAccount.getId(),
                        0,
                        20,
                        "createdAt",
                        "asc",
                        null));
    }

    private Account createTestAccount() {

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        Account account = new Account();

        account.setAccountNumber(
                "AUDIT-IT-" + UUID.randomUUID());

        account.setAccountName(
                "Audit Integration Test Account");

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
}