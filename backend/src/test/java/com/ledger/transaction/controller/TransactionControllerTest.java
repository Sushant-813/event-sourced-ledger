package com.ledger.transaction.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledger.transaction.dto.DepositRequest;
import com.ledger.transaction.dto.TransactionResponse;
import com.ledger.transaction.dto.WithdrawalRequest;
import com.ledger.transaction.entity.TransactionStatus;
import com.ledger.transaction.entity.TransactionType;
import com.ledger.transaction.exception.AccountNotEligibleForTransactionException;
import com.ledger.transaction.exception.InsufficientFundsException;
import com.ledger.transaction.service.TransactionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TransactionController.class)
class TransactionControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @MockBean
        private TransactionService transactionService;

        @Test
        void deposit_success_returns201() throws Exception {

                // Arrange
                Long accountId = 1L;
                BigDecimal amount = new BigDecimal("100.00");

                DepositRequest request = new DepositRequest(amount);

                TransactionResponse response = new TransactionResponse(
                                10L,
                                "reference-123",
                                TransactionType.DEPOSIT,
                                TransactionStatus.COMPLETED,
                                accountId,
                                amount,
                                OffsetDateTime.now(ZoneOffset.UTC));

                when(transactionService.deposit(eq(accountId), any(DepositRequest.class)))
                                .thenReturn(response);

                // Act & Assert
                mockMvc.perform(post("/accounts/{accountId}/deposit", accountId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.transactionId").value(10))
                                .andExpect(jsonPath("$.referenceNumber").value("reference-123"))
                                .andExpect(jsonPath("$.transactionType").value("DEPOSIT"))
                                .andExpect(jsonPath("$.status").value("COMPLETED"))
                                .andExpect(jsonPath("$.accountId").value(1))
                                .andExpect(jsonPath("$.amount").value(100.00));

                verify(transactionService)
                                .deposit(eq(accountId), any(DepositRequest.class));
        }

        @Test
        void withdrawal_success_returns201() throws Exception {

                // Arrange
                Long accountId = 1L;
                BigDecimal amount = new BigDecimal("40.00");

                WithdrawalRequest request = new WithdrawalRequest(amount);

                TransactionResponse response = new TransactionResponse(
                                11L,
                                "reference-456",
                                TransactionType.WITHDRAWAL,
                                TransactionStatus.COMPLETED,
                                accountId,
                                amount,
                                OffsetDateTime.now(ZoneOffset.UTC));

                when(transactionService.withdraw(eq(accountId), any(WithdrawalRequest.class)))
                                .thenReturn(response);

                // Act & Assert
                mockMvc.perform(post("/accounts/{accountId}/withdrawal", accountId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.transactionId").value(11))
                                .andExpect(jsonPath("$.referenceNumber").value("reference-456"))
                                .andExpect(jsonPath("$.transactionType").value("WITHDRAWAL"))
                                .andExpect(jsonPath("$.status").value("COMPLETED"))
                                .andExpect(jsonPath("$.accountId").value(1))
                                .andExpect(jsonPath("$.amount").value(40.00));

                verify(transactionService)
                                .withdraw(eq(accountId), any(WithdrawalRequest.class));
        }

        @Test
        void deposit_invalidAmount_returns400() throws Exception {

                // Arrange
                DepositRequest request = new DepositRequest(new BigDecimal("0.00"));

                // Act & Assert
                mockMvc.perform(post("/accounts/{accountId}/deposit", 1L)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void withdrawal_invalidAmount_returns400() throws Exception {

                // Arrange
                WithdrawalRequest request = new WithdrawalRequest(new BigDecimal("0.00"));

                // Act & Assert
                mockMvc.perform(post("/accounts/{accountId}/withdrawal", 1L)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void deposit_invalidAccountId_returns400() throws Exception {

                // Arrange
                DepositRequest request = new DepositRequest(new BigDecimal("100.00"));

                // Act & Assert
                mockMvc.perform(post("/accounts/{accountId}/deposit", 0L)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void withdrawal_invalidAccountId_returns400() throws Exception {

                // Arrange
                WithdrawalRequest request = new WithdrawalRequest(new BigDecimal("40.00"));

                // Act & Assert
                mockMvc.perform(post("/accounts/{accountId}/withdrawal", 0L)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void withdrawal_insufficientFunds_returns422() throws Exception {

                // Arrange
                Long accountId = 1L;

                WithdrawalRequest request = new WithdrawalRequest(new BigDecimal("150.00"));

                when(transactionService.withdraw(
                                eq(accountId),
                                any(WithdrawalRequest.class)))
                                .thenThrow(new InsufficientFundsException(
                                                "Insufficient funds for account: " + accountId));

                // Act & Assert
                mockMvc.perform(post("/accounts/{accountId}/withdrawal", accountId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isUnprocessableEntity());
        }

        @Test
        void deposit_frozenAccount_returns422() throws Exception {

                // Arrange
                Long accountId = 1L;

                DepositRequest request = new DepositRequest(new BigDecimal("100.00"));

                when(transactionService.deposit(
                                eq(accountId),
                                any(DepositRequest.class)))
                                .thenThrow(new AccountNotEligibleForTransactionException(
                                                "Account is not eligible for transaction: " + accountId));

                // Act & Assert
                mockMvc.perform(post("/accounts/{accountId}/deposit", accountId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isUnprocessableEntity());
        }

        @Test
        void deposit_fractionalCents_returns400() throws Exception {

                DepositRequest request = new DepositRequest(
                                new BigDecimal("100.001"));

                mockMvc.perform(
                                post("/accounts/{accountId}/deposit", 1L)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                                objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void withdrawal_fractionalCents_returns400() throws Exception {

                WithdrawalRequest request = new WithdrawalRequest(
                                new BigDecimal("50.005"));

                mockMvc.perform(
                                post("/accounts/{accountId}/withdrawal", 1L)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                                objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }
}