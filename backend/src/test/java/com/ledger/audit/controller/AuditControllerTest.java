package com.ledger.audit.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledger.audit.dto.AccountEventResponse;
import com.ledger.audit.service.AuditService;
import com.ledger.common.exception.GlobalExceptionHandler;
import com.ledger.event.entity.EventType;
import com.ledger.transaction.entity.TransactionType;
import com.ledger.transaction.entity.TransactionStatus;
import com.ledger.audit.dto.AccountLedgerEntryResponse;
import com.ledger.ledger.entity.EntryType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.ledger.audit.dto.AccountTransactionResponse;
import com.ledger.audit.dto.AuditBalanceResponse;
import com.ledger.audit.dto.AuditTrailItemResponse;
import com.ledger.audit.dto.AuditTrailResponse;
import com.ledger.event.entity.EventType;
import com.ledger.account.exception.AccountNotFoundException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuditControllerTest {

    @Mock
    private AuditService auditService;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .findAndRegisterModules();

    private static final Long ACCOUNT_ID = 1L;

    @BeforeEach
    void setUp() {

        AuditController auditController = new AuditController(auditService);

        mockMvc = MockMvcBuilders
                .standaloneSetup(auditController)
                .setControllerAdvice(
                        new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getEventHistory_returnsOk() throws Exception {

        OffsetDateTime occurredAt = OffsetDateTime.parse("2026-09-10T10:00:00Z");

        AccountEventResponse response = new AccountEventResponse(
                10L,
                EventType.ACCOUNT_CREATED,
                null,
                null,
                occurredAt);

        when(auditService.getEventHistory(ACCOUNT_ID))
                .thenReturn(List.of(response));

        mockMvc.perform(
                get("/accounts/{accountId}/audit/events",
                        ACCOUNT_ID))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$[0].eventId").value(10))
                .andExpect(
                        jsonPath("$[0].eventType")
                                .value("ACCOUNT_CREATED"))
                .andExpect(
                        jsonPath("$[0].occurredAt")
                                .exists());

        verify(auditService)
                .getEventHistory(ACCOUNT_ID);
    }

    @Test
    void getTransactionHistory_returnsOk() throws Exception {

        OffsetDateTime createdAt = OffsetDateTime.parse("2026-09-10T10:00:00Z");

        AccountTransactionResponse response = new AccountTransactionResponse(
                20L,
                "TXN-001",
                TransactionType.DEPOSIT,
                TransactionStatus.COMPLETED,
                createdAt);

        when(auditService.getTransactionHistory(ACCOUNT_ID))
                .thenReturn(List.of(response));

        mockMvc.perform(
                get("/accounts/{accountId}/audit/transactions",
                        ACCOUNT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].transactionId").value(20))
                .andExpect(jsonPath("$[0].referenceNumber")
                        .value("TXN-001"))
                .andExpect(jsonPath("$[0].transactionType")
                        .value("DEPOSIT"))
                .andExpect(jsonPath("$[0].status")
                        .value("COMPLETED"))
                .andExpect(jsonPath("$[0].createdAt")
                        .exists());

        verify(auditService)
                .getTransactionHistory(ACCOUNT_ID);
    }

    @Test
    void getLedgerHistory_returnsOk() throws Exception {

        OffsetDateTime createdAt = OffsetDateTime.parse("2026-09-10T10:00:00Z");

        AccountLedgerEntryResponse response = new AccountLedgerEntryResponse(
                30L,
                20L,
                "TXN-001",
                EntryType.CREDIT,
                new BigDecimal("1000.00"),
                createdAt);

        when(auditService.getLedgerHistory(ACCOUNT_ID))
                .thenReturn(List.of(response));

        mockMvc.perform(
                get("/accounts/{accountId}/audit/ledger",
                        ACCOUNT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ledgerEntryId").value(30))
                .andExpect(jsonPath("$[0].transactionId").value(20))
                .andExpect(jsonPath("$[0].referenceNumber")
                        .value("TXN-001"))
                .andExpect(jsonPath("$[0].entryType")
                        .value("CREDIT"))
                .andExpect(jsonPath("$[0].amount")
                        .value(1000.00))
                .andExpect(jsonPath("$[0].createdAt")
                        .exists());

        verify(auditService)
                .getLedgerHistory(ACCOUNT_ID);
    }

    @Test
    void getBalance_returnsCurrentBalanceWhenAsOfIsNotProvided()
            throws Exception {

        AuditBalanceResponse response = new AuditBalanceResponse(
                ACCOUNT_ID,
                new BigDecimal("1500.00"),
                null);

        when(auditService.getBalance(
                ACCOUNT_ID,
                null)).thenReturn(response);

        mockMvc.perform(
                get("/accounts/{accountId}/audit/balance",
                        ACCOUNT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountId")
                        .value(ACCOUNT_ID))
                .andExpect(jsonPath("$.balance")
                        .value(1500.00))
                .andExpect(jsonPath("$.asOf")
                        .doesNotExist());

        verify(auditService)
                .getBalance(ACCOUNT_ID, null);
    }

    @Test
    void getBalance_returnsHistoricalBalanceWhenAsOfIsProvided()
            throws Exception {

        OffsetDateTime asOf = OffsetDateTime.parse("2026-09-10T12:00:00Z");

        AuditBalanceResponse response = new AuditBalanceResponse(
                ACCOUNT_ID,
                new BigDecimal("1250.00"),
                asOf);

        when(auditService.getBalance(
                ACCOUNT_ID,
                asOf)).thenReturn(response);

        mockMvc.perform(
                get("/accounts/{accountId}/audit/balance",
                        ACCOUNT_ID)
                        .param(
                                "asOf",
                                "2026-09-10T12:00:00Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountId")
                        .value(ACCOUNT_ID))
                .andExpect(jsonPath("$.balance")
                        .value(1250.00))
                .andExpect(jsonPath("$.asOf")
                        .exists());

        verify(auditService)
                .getBalance(ACCOUNT_ID, asOf);
    }

    @Test
    void getAuditTrail_returnsCurrentTrailWhenAsOfIsNotProvided()
            throws Exception {

        AuditTrailItemResponse item = new AuditTrailItemResponse(
                10L,
                EventType.DEPOSIT,
                20L,
                "TXN-001",
                new BigDecimal("1000.00"),
                new BigDecimal("1000.00"),
                OffsetDateTime.parse(
                        "2026-09-10T10:00:00Z"));

        AuditTrailResponse response = new AuditTrailResponse(
                ACCOUNT_ID,
                new BigDecimal("1000.00"),
                null,
                List.of(item));

        when(auditService.getAuditTrail(
                ACCOUNT_ID,
                null)).thenReturn(response);

        mockMvc.perform(
                get("/accounts/{accountId}/audit/trail",
                        ACCOUNT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountId")
                        .value(ACCOUNT_ID))
                .andExpect(jsonPath("$.finalBalance")
                        .value(1000.00))
                .andExpect(jsonPath("$.asOf")
                        .doesNotExist())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items.length()")
                        .value(1))
                .andExpect(jsonPath("$.items[0].eventId")
                        .value(10))
                .andExpect(jsonPath("$.items[0].eventType")
                        .value("DEPOSIT"))
                .andExpect(jsonPath("$.items[0].balanceChange")
                        .value(1000.00))
                .andExpect(jsonPath("$.items[0].runningBalance")
                        .value(1000.00));

        verify(auditService)
                .getAuditTrail(ACCOUNT_ID, null);
    }

    @Test
    void getAuditTrail_returnsHistoricalTrailWhenAsOfIsProvided()
            throws Exception {

        OffsetDateTime asOf = OffsetDateTime.parse("2026-09-10T12:00:00Z");

        AuditTrailItemResponse item = new AuditTrailItemResponse(
                10L,
                EventType.DEPOSIT,
                20L,
                "TXN-001",
                new BigDecimal("500.00"),
                new BigDecimal("500.00"),
                OffsetDateTime.parse(
                        "2026-09-10T10:00:00Z"));

        AuditTrailResponse response = new AuditTrailResponse(
                ACCOUNT_ID,
                new BigDecimal("500.00"),
                asOf,
                List.of(item));

        when(auditService.getAuditTrail(
                ACCOUNT_ID,
                asOf)).thenReturn(response);

        mockMvc.perform(
                get("/accounts/{accountId}/audit/trail",
                        ACCOUNT_ID)
                        .param(
                                "asOf",
                                "2026-09-10T12:00:00Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountId")
                        .value(ACCOUNT_ID))
                .andExpect(jsonPath("$.finalBalance")
                        .value(500.00))
                .andExpect(jsonPath("$.asOf")
                        .exists())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items.length()")
                        .value(1))
                .andExpect(jsonPath("$.items[0].eventType")
                        .value("DEPOSIT"))
                .andExpect(jsonPath("$.items[0].balanceChange")
                        .value(500.00))
                .andExpect(jsonPath("$.items[0].runningBalance")
                        .value(500.00));

        verify(auditService)
                .getAuditTrail(
                        ACCOUNT_ID,
                        asOf);
    }

    @Test
    void getEventHistory_returnsNotFoundWhenAccountDoesNotExist()
            throws Exception {

        when(auditService.getEventHistory(ACCOUNT_ID))
                .thenThrow(
                        new AccountNotFoundException(
                                "Account not found: " + ACCOUNT_ID));

        mockMvc.perform(
                get("/accounts/{accountId}/audit/events",
                        ACCOUNT_ID))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message")
                        .value("Account not found: " + ACCOUNT_ID))
                .andExpect(jsonPath("$.path")
                        .value("/accounts/" + ACCOUNT_ID + "/audit/events"));

        verify(auditService)
                .getEventHistory(ACCOUNT_ID);
    }

    @Test
    void getBalance_returnsBadRequestWhenAsOfIsInvalid()
            throws Exception {

        mockMvc.perform(
                get("/accounts/{accountId}/audit/balance",
                        ACCOUNT_ID)
                        .param("asOf", "invalid-date"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error")
                        .value("Bad Request"))
                .andExpect(jsonPath("$.message")
                        .value("Invalid value for parameter 'asOf'"))
                .andExpect(jsonPath("$.path")
                        .value("/accounts/" + ACCOUNT_ID + "/audit/balance"));

        verifyNoInteractions(auditService);
    }

    @Test
    void getAuditTrail_returnsBadRequestWhenAsOfIsInvalid()
            throws Exception {

        mockMvc.perform(
                get("/accounts/{accountId}/audit/trail",
                        ACCOUNT_ID)
                        .param("asOf", "invalid-date"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error")
                        .value("Bad Request"))
                .andExpect(jsonPath("$.message")
                        .value("Invalid value for parameter 'asOf'"))
                .andExpect(jsonPath("$.path")
                        .value("/accounts/" + ACCOUNT_ID + "/audit/trail"));

        verifyNoInteractions(auditService);
    }
}