package com.ledger.ledger.service;

import com.ledger.ledger.entity.EntryType;
import com.ledger.ledger.entity.LedgerEntry;
import com.ledger.ledger.exception.InvalidLedgerEntryException;
import com.ledger.ledger.exception.UnbalancedLedgerException;
import com.ledger.ledger.repository.LedgerEntryRepository;
import com.ledger.transaction.entity.Transaction;
import com.ledger.transaction.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class LedgerServiceImpl implements LedgerService {

        private final TransactionRepository transactionRepository;
        private final LedgerEntryRepository ledgerEntryRepository;

        public LedgerServiceImpl(
                        TransactionRepository transactionRepository,
                        LedgerEntryRepository ledgerEntryRepository) {
                this.transactionRepository = transactionRepository;
                this.ledgerEntryRepository = ledgerEntryRepository;
        }

        @Override
        @Transactional
        public void recordTransaction(
                        Transaction transaction,
                        List<LedgerEntry> entries) {

                if (transaction == null) {
                        throw new IllegalArgumentException(
                                        "Transaction must not be null");
                }

                validateEntries(transaction, entries);

                BigDecimal debitTotal = calculateTotal(
                                entries,
                                EntryType.DEBIT);

                BigDecimal creditTotal = calculateTotal(
                                entries,
                                EntryType.CREDIT);

                if (debitTotal.compareTo(creditTotal) != 0) {
                        throw new UnbalancedLedgerException(
                                        "Transaction is unbalanced: debit total = "
                                                        + debitTotal
                                                        + ", credit total = "
                                                        + creditTotal);
                }

                transactionRepository.save(transaction);
                ledgerEntryRepository.saveAll(entries);
        }

        private void validateEntries(
                        Transaction transaction,
                        List<LedgerEntry> entries) {

                if (entries == null || entries.isEmpty()) {
                        throw new IllegalArgumentException(
                                        "Transaction must contain at least one ledger entry");
                }

                for (LedgerEntry entry : entries) {

                        if (entry == null) {
                                throw new InvalidLedgerEntryException(
                                                "Ledger entry must not be null");
                        }

                        if (entry.getTransaction() == null
                                        || entry.getTransaction() != transaction) {
                                throw new InvalidLedgerEntryException(
                                                "Ledger entry must be associated with the transaction being recorded");
                        }

                        if (entry.getEntryType() == null) {
                                throw new InvalidLedgerEntryException(
                                                "Ledger entry type is required");
                        }

                        if (entry.getAmount() == null
                                        || entry.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                                throw new InvalidLedgerEntryException(
                                                "Ledger entry amounts must be greater than zero");
                        }
                }

                boolean hasDebit = entries.stream()
                                .anyMatch(entry -> entry.getEntryType() == EntryType.DEBIT);

                boolean hasCredit = entries.stream()
                                .anyMatch(entry -> entry.getEntryType() == EntryType.CREDIT);

                if (!hasDebit) {
                        throw new UnbalancedLedgerException(
                                        "Transaction must contain at least one debit entry");
                }

                if (!hasCredit) {
                        throw new UnbalancedLedgerException(
                                        "Transaction must contain at least one credit entry");
                }
        }

        private BigDecimal calculateTotal(
                        List<LedgerEntry> entries,
                        EntryType entryType) {

                return entries.stream()
                                .filter(entry -> entry.getEntryType() == entryType)
                                .map(LedgerEntry::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
}