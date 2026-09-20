package com.ledger.transaction.service;

import com.ledger.account.entity.Account;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.entity.AccountType;
import com.ledger.account.exception.AccountNotFoundException;
import com.ledger.account.repository.AccountRepository;
import com.ledger.common.constant.SystemAccountConstants;
import com.ledger.transaction.dto.DepositRequest;
import com.ledger.transaction.dto.TransferRequest;
import com.ledger.transaction.dto.WithdrawalRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
class TransactionServiceSysCashIntegrationTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AccountRepository accountRepository;

    @Test
    void depositToSystemCash_isRejected() {
        Account systemCash = getSystemCashAccount();

        assertThrows(
                AccountNotFoundException.class,
                () -> transactionService.deposit(
                        systemCash.getId(),
                        new DepositRequest(
                                new BigDecimal("100.00"))));
    }

    @Test
    void withdrawalFromSystemCash_isRejected() {
        Account systemCash = getSystemCashAccount();

        assertThrows(
                AccountNotFoundException.class,
                () -> transactionService.withdraw(
                        systemCash.getId(),
                        new WithdrawalRequest(
                                new BigDecimal("100.00"))));
    }

    @Test
    void transferFromSystemCash_isRejected() {
        Account systemCash = getSystemCashAccount();
        Account customerAccount = createCustomerAccount();

        assertThrows(
                AccountNotFoundException.class,
                () -> transactionService.transfer(
                        new TransferRequest(
                                systemCash.getId(),
                                customerAccount.getId(),
                                new BigDecimal("100.00"))));
    }

    @Test
    void transferToSystemCash_isRejected() {
        Account systemCash = getSystemCashAccount();
        Account customerAccount = createCustomerAccount();

        assertThrows(
                AccountNotFoundException.class,
                () -> transactionService.transfer(
                        new TransferRequest(
                                customerAccount.getId(),
                                systemCash.getId(),
                                new BigDecimal("100.00"))));
    }

    private Account getSystemCashAccount() {
        Account systemCash = accountRepository
                .findByAccountNumber(
                        SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER)
                .orElseThrow();

        assertNotNull(systemCash.getId());

        return systemCash;
    }

    private Account createCustomerAccount() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        Account account = new Account();
        account.setAccountNumber(
                "SYSCASH-IT-" + System.currentTimeMillis());
        account.setAccountName(
                "SYS-CASH Integration Test Account");
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(AccountStatus.ACTIVE);
        account.setCreatedAt(now);
        account.setUpdatedAt(now);

        return accountRepository.save(account);
    }
}