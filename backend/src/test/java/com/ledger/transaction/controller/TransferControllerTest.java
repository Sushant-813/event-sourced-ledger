package com.ledger.transaction.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledger.transaction.dto.TransferRequest;
import com.ledger.transaction.dto.TransferResponse;
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
import com.ledger.account.exception.AccountNotFoundException;
import com.ledger.transaction.exception.InvalidTransferException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TransferController.class)
class TransferControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TransactionService transactionService;

    @Test
    void transfer_success_returns201() throws Exception {

        // Arrange
        Long sourceAccountId = 1L;
        Long destinationAccountId = 2L;
        BigDecimal amount = new BigDecimal("100.00");

        TransferRequest request = new TransferRequest(
                sourceAccountId,
                destinationAccountId,
                amount);

        TransferResponse response = new TransferResponse(
                10L,
                "reference-123",
                TransactionType.TRANSFER,
                TransactionStatus.COMPLETED,
                sourceAccountId,
                destinationAccountId,
                amount,
                OffsetDateTime.now(ZoneOffset.UTC));

        when(transactionService.transfer(any(TransferRequest.class)))
                .thenReturn(response);

        // Act & Assert
        mockMvc.perform(post("/transfers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.transactionId").value(10))
                .andExpect(jsonPath("$.referenceNumber").value("reference-123"))
                .andExpect(jsonPath("$.transactionType").value("TRANSFER"))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.sourceAccountId").value(1))
                .andExpect(jsonPath("$.destinationAccountId").value(2))
                .andExpect(jsonPath("$.amount").value(100.00));

        verify(transactionService)
                .transfer(any(TransferRequest.class));
    }

    @Test
    void transfer_invalidAmount_returns400() throws Exception {

        // Arrange
        TransferRequest request = new TransferRequest(
                1L,
                2L,
                new BigDecimal("0.00"));

        // Act & Assert
        mockMvc.perform(post("/transfers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void transfer_invalidSourceAccountId_returns400() throws Exception {

        // Arrange
        TransferRequest request = new TransferRequest(
                0L,
                2L,
                new BigDecimal("100.00"));

        // Act & Assert
        mockMvc.perform(post("/transfers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void transfer_sameAccount_returns422() throws Exception {

        // Arrange
        Long accountId = 1L;

        TransferRequest request = new TransferRequest(
                accountId,
                accountId,
                new BigDecimal("100.00"));

        when(transactionService.transfer(any(TransferRequest.class)))
                .thenThrow(new InvalidTransferException(
                        "Source and destination accounts must be different"));

        // Act & Assert
        mockMvc.perform(post("/transfers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void transfer_accountNotFound_returns404() throws Exception {

        // Arrange
        TransferRequest request = new TransferRequest(
                1L,
                2L,
                new BigDecimal("100.00"));

        when(transactionService.transfer(any(TransferRequest.class)))
                .thenThrow(new AccountNotFoundException(
                        "Account not found with ID: 1"));

        // Act & Assert
        mockMvc.perform(post("/transfers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void transfer_invalidDestinationAccountId_returns400() throws Exception {

        // Arrange
        TransferRequest request = new TransferRequest(
                1L,
                0L,
                new BigDecimal("100.00"));

        // Act & Assert
        mockMvc.perform(post("/transfers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void transfer_insufficientFunds_returns422() throws Exception {

        // Arrange
        TransferRequest request = new TransferRequest(
                1L,
                2L,
                new BigDecimal("150.00"));

        when(transactionService.transfer(any(TransferRequest.class)))
                .thenThrow(new InsufficientFundsException(
                        "Insufficient funds for account: 1"));

        // Act & Assert
        mockMvc.perform(post("/transfers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void transfer_ineligibleAccount_returns422() throws Exception {

        // Arrange
        TransferRequest request = new TransferRequest(
                1L,
                2L,
                new BigDecimal("100.00"));

        when(transactionService.transfer(any(TransferRequest.class)))
                .thenThrow(new AccountNotEligibleForTransactionException(
                        "Account is not eligible for transaction"));

        // Act & Assert
        mockMvc.perform(post("/transfers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());
    }
}