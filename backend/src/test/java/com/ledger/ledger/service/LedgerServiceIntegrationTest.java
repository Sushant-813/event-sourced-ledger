package com.ledger.ledger.service;

import com.ledger.account.entity.Account;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.entity.AccountType;
import com.ledger.account.repository.AccountRepository;
import com.ledger.ledger.entity.EntryType;
import com.ledger.ledger.entity.LedgerEntry;
import com.ledger.ledger.exception.InvalidLedgerEntryException;
import com.ledger.ledger.exception.UnbalancedLedgerException;
import com.ledger.ledger.repository.LedgerEntryRepository;
import com.ledger.transaction.entity.Transaction;
import com.ledger.transaction.entity.TransactionStatus;
import com.ledger.transaction.entity.TransactionType;
import com.ledger.transaction.repository.TransactionRepository;

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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
class LedgerServiceIntegrationTest {

        @Autowired
        private LedgerService ledgerService;

        @Autowired
        private AccountRepository accountRepository;

        @Autowired
        private TransactionRepository transactionRepository;

        @Autowired
        private LedgerEntryRepository ledgerEntryRepository;

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
                                        "DELETE FROM events WHERE account_id = ?",
                                        accountId);

                        jdbcTemplate.update(
                                        "DELETE FROM accounts WHERE id = ?",
                                        accountId);
                }

                testAccountIds.clear();
        }

        @Test
        void recordTransaction_persistsTransactionAndBalancedLedgerEntries() {

                Account debitAccount = createTestAccount();

                Account creditAccount = createTestAccount();

                Transaction transaction = createTransaction();

                LedgerEntry debitEntry = createLedgerEntry(
                                transaction,
                                debitAccount,
                                EntryType.DEBIT,
                                new BigDecimal("500.00"));

                LedgerEntry creditEntry = createLedgerEntry(
                                transaction,
                                creditAccount,
                                EntryType.CREDIT,
                                new BigDecimal("500.00"));

                ledgerService.recordTransaction(
                                transaction,
                                List.of(
                                                debitEntry,
                                                creditEntry));

                assertEquals(
                                true,
                                transaction.getId() != null);

                List<LedgerEntry> entries = ledgerEntryRepository
                                .findByTransactionId(
                                                transaction.getId());

                assertEquals(
                                2,
                                entries.size());

                BigDecimal debitTotal = entries.stream()
                                .filter(entry -> entry.getEntryType() == EntryType.DEBIT)
                                .map(LedgerEntry::getAmount)
                                .reduce(
                                                BigDecimal.ZERO,
                                                BigDecimal::add);

                BigDecimal creditTotal = entries.stream()
                                .filter(entry -> entry.getEntryType() == EntryType.CREDIT)
                                .map(LedgerEntry::getAmount)
                                .reduce(
                                                BigDecimal.ZERO,
                                                BigDecimal::add);

                assertEquals(
                                0,
                                debitTotal.compareTo(creditTotal));

                assertEquals(
                                new BigDecimal("500.00"),
                                debitTotal);

                assertEquals(
                                new BigDecimal("500.00"),
                                creditTotal);
        }

        @Test
        void recordTransaction_persistsMultipleEntriesAndMaintainsDoubleEntryInvariant() {

                Account debitAccount = createTestAccount();

                Account creditAccountOne = createTestAccount();

                Account creditAccountTwo = createTestAccount();

                Transaction transaction = createTransaction();

                LedgerEntry debitEntry = createLedgerEntry(
                                transaction,
                                debitAccount,
                                EntryType.DEBIT,
                                new BigDecimal("1000.00"));

                LedgerEntry creditEntryOne = createLedgerEntry(
                                transaction,
                                creditAccountOne,
                                EntryType.CREDIT,
                                new BigDecimal("600.00"));

                LedgerEntry creditEntryTwo = createLedgerEntry(
                                transaction,
                                creditAccountTwo,
                                EntryType.CREDIT,
                                new BigDecimal("400.00"));

                ledgerService.recordTransaction(
                                transaction,
                                List.of(
                                                debitEntry,
                                                creditEntryOne,
                                                creditEntryTwo));

                List<LedgerEntry> entries = ledgerEntryRepository
                                .findByTransactionId(
                                                transaction.getId());

                assertEquals(
                                3,
                                entries.size());

                BigDecimal debitTotal = entries.stream()
                                .filter(entry -> entry.getEntryType() == EntryType.DEBIT)
                                .map(LedgerEntry::getAmount)
                                .reduce(
                                                BigDecimal.ZERO,
                                                BigDecimal::add);

                BigDecimal creditTotal = entries.stream()
                                .filter(entry -> entry.getEntryType() == EntryType.CREDIT)
                                .map(LedgerEntry::getAmount)
                                .reduce(
                                                BigDecimal.ZERO,
                                                BigDecimal::add);

                assertEquals(
                                0,
                                debitTotal.compareTo(creditTotal));

                assertEquals(
                                new BigDecimal("1000.00"),
                                debitTotal);

                assertEquals(
                                new BigDecimal("1000.00"),
                                creditTotal);
        }

        @Test
        void recordTransaction_rejectsUnbalancedEntries() {

                Account debitAccount = createTestAccount();

                Account creditAccount = createTestAccount();

                Transaction transaction = createTransaction();

                LedgerEntry debitEntry = createLedgerEntry(
                                transaction,
                                debitAccount,
                                EntryType.DEBIT,
                                new BigDecimal("500.00"));

                LedgerEntry creditEntry = createLedgerEntry(
                                transaction,
                                creditAccount,
                                EntryType.CREDIT,
                                new BigDecimal("400.00"));

                assertThrows(
                                UnbalancedLedgerException.class,
                                () -> ledgerService.recordTransaction(
                                                transaction,
                                                List.of(
                                                                debitEntry,
                                                                creditEntry)));

                assertNull(
                                transaction.getId());

                assertNull(
                                debitEntry.getId());

                assertNull(
                                creditEntry.getId());
        }

        @Test
        void recordTransaction_rejectsTransactionWithoutDebitAndCredit() {

                Account account = createTestAccount();

                Transaction transaction = createTransaction();

                LedgerEntry creditEntry = createLedgerEntry(
                                transaction,
                                account,
                                EntryType.CREDIT,
                                new BigDecimal("500.00"));

                assertThrows(
                                UnbalancedLedgerException.class,
                                () -> ledgerService.recordTransaction(
                                                transaction,
                                                List.of(creditEntry)));

                assertNull(
                                transaction.getId());

                assertNull(
                                creditEntry.getId());
        }

        @Test
        void recordTransaction_rejectsEntriesMismatchedToTransaction() {
                // Arrange
                Transaction transaction = createTransaction();
                Transaction differentTransaction = createTransaction();

                Account account = createTestAccount();

                LedgerEntry debit = createLedgerEntry(
                                transaction,
                                account,
                                EntryType.DEBIT,
                                new BigDecimal("100.00"));

                LedgerEntry credit = createLedgerEntry(
                                differentTransaction,
                                account,
                                EntryType.CREDIT,
                                new BigDecimal("100.00"));

                List<LedgerEntry> entries = List.of(debit, credit);

                // Act & Assert
                assertThrows(
                                InvalidLedgerEntryException.class,
                                () -> ledgerService.recordTransaction(transaction, entries));

                assertNull(transaction.getId());
                assertNull(debit.getId());
                assertNull(credit.getId());
        }

        private Account createTestAccount() {

                OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

                Account account = new Account();

                account.setAccountNumber(
                                "LIT-" + UUID.randomUUID());

                account.setAccountName(
                                "Ledger Integration Test Account");

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

        private Transaction createTransaction() {

                return new Transaction(
                                "LEDGER-IT-" + UUID.randomUUID(),
                                TransactionType.TRANSFER,
                                TransactionStatus.COMPLETED,
                                OffsetDateTime.now(ZoneOffset.UTC));
        }

        private LedgerEntry createLedgerEntry(
                        Transaction transaction,
                        Account account,
                        EntryType entryType,
                        BigDecimal amount) {

                return new LedgerEntry(
                                transaction,
                                account,
                                entryType,
                                amount,
                                OffsetDateTime.now(ZoneOffset.UTC));
        }
}