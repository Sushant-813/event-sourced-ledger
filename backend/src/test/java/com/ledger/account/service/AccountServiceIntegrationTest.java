package com.ledger.account.service;

import com.ledger.account.dto.AccountResponse;
import com.ledger.account.dto.CreateAccountRequest;
import com.ledger.account.entity.AccountType;
import com.ledger.account.exception.DuplicateAccountNumberException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class AccountServiceIntegrationTest {

    @Autowired
    private AccountService accountService;

    @Test
    void concurrentDuplicateAccountCreation_allowsOnlyOneAccount() throws Exception {

        // Arrange
        String accountNumber = "CONCURRENT-" + UUID.randomUUID();

        CreateAccountRequest request = new CreateAccountRequest(
                accountNumber,
                "Concurrent Test Account",
                AccountType.SAVINGS);

        int threadCount = 2;

        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Future<Object>> futures = new ArrayList<>();

        try {
            for (int i = 0; i < threadCount; i++) {

                futures.add(executorService.submit(() -> {

                    readyLatch.countDown();

                    startLatch.await();

                    try {
                        return accountService.createAccount(request);
                    } catch (Exception ex) {
                        return ex;
                    }
                }));
            }

            // Make sure both threads are ready before releasing them.
            readyLatch.await();

            // Act
            startLatch.countDown();

            List<Object> results = new ArrayList<>();

            for (Future<Object> future : futures) {
                try {
                    results.add(future.get());
                } catch (ExecutionException ex) {
                    results.add(ex.getCause());
                }
            }

            // Assert
            long successfulCreations = results.stream()
                    .filter(AccountResponse.class::isInstance)
                    .count();

            long duplicateFailures = results.stream()
                    .filter(DuplicateAccountNumberException.class::isInstance)
                    .count();

            assertEquals(
                    1,
                    successfulCreations,
                    "Exactly one concurrent account creation should succeed");

            assertEquals(
                    1,
                    duplicateFailures,
                    "Exactly one concurrent account creation should be rejected as a duplicate");

            AccountResponse createdAccount = results.stream()
                    .filter(AccountResponse.class::isInstance)
                    .map(AccountResponse.class::cast)
                    .findFirst()
                    .orElseThrow();

            assertNotNull(createdAccount.id());
            assertEquals(accountNumber, createdAccount.accountNumber());

        } finally {
            executorService.shutdownNow();
        }
    }
}