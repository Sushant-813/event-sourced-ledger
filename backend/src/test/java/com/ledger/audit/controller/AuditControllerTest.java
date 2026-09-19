package com.ledger.audit.controller;

import com.ledger.account.exception.AccountNotFoundException;
import com.ledger.audit.dto.AccountEventResponse;
import com.ledger.audit.dto.AccountLedgerEntryResponse;
import com.ledger.audit.dto.AccountTransactionResponse;
import com.ledger.audit.dto.AuditBalanceResponse;
import com.ledger.audit.dto.AuditTrailItemResponse;
import com.ledger.audit.dto.AuditTrailResponse;
import com.ledger.audit.service.AuditService;
import com.ledger.common.dto.PagedResponse;
import com.ledger.common.exception.GlobalExceptionHandler;
import com.ledger.event.entity.EventType;
import com.ledger.ledger.entity.EntryType;
import com.ledger.transaction.entity.TransactionStatus;
import com.ledger.transaction.entity.TransactionType;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuditControllerTest {

        @Mock
        private AuditService auditService;

        private MockMvc mockMvc;

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

                OffsetDateTime occurredAt = OffsetDateTime.parse(
                                "2026-09-10T10:00:00Z");

                AccountEventResponse eventResponse = new AccountEventResponse(
                                10L,
                                EventType.ACCOUNT_CREATED,
                                null,
                                null,
                                occurredAt);

                PagedResponse<AccountEventResponse> response = new PagedResponse<>(
                                List.of(eventResponse),
                                0,
                                20,
                                1,
                                1);

                when(auditService.getEventHistory(
                                ACCOUNT_ID,
                                0,
                                20,
                                "occurredAt",
                                "asc"))
                                .thenReturn(response);

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/events",
                                                ACCOUNT_ID))
                                .andExpect(status().isOk())
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].eventId")
                                                                .value(10))
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].eventType")
                                                                .value("ACCOUNT_CREATED"))
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].occurredAt")
                                                                .exists())
                                .andExpect(
                                                jsonPath("$.page")
                                                                .value(0))
                                .andExpect(
                                                jsonPath("$.size")
                                                                .value(20))
                                .andExpect(
                                                jsonPath("$.totalPages")
                                                                .value(1))
                                .andExpect(
                                                jsonPath("$.totalElements")
                                                                .value(1));

                verify(auditService)
                                .getEventHistory(
                                                ACCOUNT_ID,
                                                0,
                                                20,
                                                "occurredAt",
                                                "asc");
        }

        @Test
        void getEventHistory_supportsCustomPaginationAndDescendingSort()
                        throws Exception {

                OffsetDateTime occurredAt = OffsetDateTime.parse(
                                "2026-09-10T10:00:00Z");

                AccountEventResponse eventResponse = new AccountEventResponse(
                                20L,
                                EventType.DEPOSIT,
                                100L,
                                null,
                                occurredAt);

                PagedResponse<AccountEventResponse> response = new PagedResponse<>(
                                List.of(eventResponse),
                                1,
                                5,
                                3,
                                11);

                when(auditService.getEventHistory(
                                ACCOUNT_ID,
                                1,
                                5,
                                "occurredAt",
                                "desc"))
                                .thenReturn(response);

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/events",
                                                ACCOUNT_ID)
                                                .param("page", "1")
                                                .param("size", "5")
                                                .param("sortBy", "occurredAt")
                                                .param("direction", "desc"))
                                .andExpect(status().isOk())
                                .andExpect(
                                                jsonPath("$.page")
                                                                .value(1))
                                .andExpect(
                                                jsonPath("$.size")
                                                                .value(5))
                                .andExpect(
                                                jsonPath("$.totalPages")
                                                                .value(3))
                                .andExpect(
                                                jsonPath("$.totalElements")
                                                                .value(11))
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].eventId")
                                                                .value(20))
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].eventType")
                                                                .value("DEPOSIT"));

                verify(auditService)
                                .getEventHistory(
                                                ACCOUNT_ID,
                                                1,
                                                5,
                                                "occurredAt",
                                                "desc");
        }

        @Test
        void getEventHistory_returnsBadRequestForNegativePage()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/events",
                                                ACCOUNT_ID)
                                                .param("page", "-1"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"));

                verifyNoInteractions(auditService);
        }

        @Test
        void getEventHistory_returnsBadRequestForZeroSize()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/events",
                                                ACCOUNT_ID)
                                                .param("size", "0"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"));

                verifyNoInteractions(auditService);
        }

        @Test
        void getEventHistory_returnsBadRequestWhenSizeExceedsMaximum()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/events",
                                                ACCOUNT_ID)
                                                .param("size", "101"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"));

                verifyNoInteractions(auditService);
        }

        @Test
        void getEventHistory_returnsBadRequestForInvalidSortField()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/events",
                                                ACCOUNT_ID)
                                                .param("sortBy", "eventType"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"));

                verifyNoInteractions(auditService);
        }

        @Test
        void getEventHistory_returnsBadRequestForInvalidDirection()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/events",
                                                ACCOUNT_ID)
                                                .param("direction", "sideways"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"));

                verifyNoInteractions(auditService);
        }

        @Test
        void getTransactionHistory_returnsOk() throws Exception {

                OffsetDateTime createdAt = OffsetDateTime.parse(
                                "2026-09-10T10:00:00Z");

                AccountTransactionResponse response = new AccountTransactionResponse(
                                20L,
                                "TXN-001",
                                TransactionType.DEPOSIT,
                                TransactionStatus.COMPLETED,
                                createdAt);

                PagedResponse<AccountTransactionResponse> pagedResponse = new PagedResponse<>(
                                List.of(response),
                                0,
                                20,
                                1,
                                1);

                when(auditService.getTransactionHistory(
                                ACCOUNT_ID,
                                0,
                                20))
                                .thenReturn(pagedResponse);

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/transactions",
                                                ACCOUNT_ID))
                                .andExpect(status().isOk())
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].transactionId")
                                                                .value(20))
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].referenceNumber")
                                                                .value("TXN-001"))
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].transactionType")
                                                                .value("DEPOSIT"))
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].status")
                                                                .value("COMPLETED"))
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].createdAt")
                                                                .exists())
                                .andExpect(
                                                jsonPath("$.page")
                                                                .value(0))
                                .andExpect(
                                                jsonPath("$.size")
                                                                .value(20))
                                .andExpect(
                                                jsonPath("$.totalPages")
                                                                .value(1))
                                .andExpect(
                                                jsonPath("$.totalElements")
                                                                .value(1));

                verify(auditService)
                                .getTransactionHistory(
                                                ACCOUNT_ID,
                                                0,
                                                20);
        }

        @Test
        void getTransactionHistory_supportsCustomPagination()
                        throws Exception {

                PagedResponse<AccountTransactionResponse> response = new PagedResponse<>(
                                List.of(),
                                1,
                                5,
                                3,
                                11);

                when(auditService.getTransactionHistory(
                                ACCOUNT_ID,
                                1,
                                5))
                                .thenReturn(response);

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/transactions",
                                                ACCOUNT_ID)
                                                .param("page", "1")
                                                .param("size", "5"))
                                .andExpect(status().isOk())
                                .andExpect(
                                                jsonPath("$.page")
                                                                .value(1))
                                .andExpect(
                                                jsonPath("$.size")
                                                                .value(5))
                                .andExpect(
                                                jsonPath("$.totalPages")
                                                                .value(3))
                                .andExpect(
                                                jsonPath("$.totalElements")
                                                                .value(11));

                verify(auditService)
                                .getTransactionHistory(
                                                ACCOUNT_ID,
                                                1,
                                                5);
        }

        @Test
        void getTransactionHistory_returnsBadRequestForInvalidPage()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/transactions",
                                                ACCOUNT_ID)
                                                .param("page", "-1"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"));

                verifyNoInteractions(auditService);
        }

        @Test
        void getTransactionHistory_returnsBadRequestForInvalidSize()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/transactions",
                                                ACCOUNT_ID)
                                                .param("size", "101"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"));

                verifyNoInteractions(auditService);
        }

        @Test
        void getLedgerHistory_returnsOk() throws Exception {

                OffsetDateTime createdAt = OffsetDateTime.parse(
                                "2026-09-10T10:00:00Z");

                AccountLedgerEntryResponse response = new AccountLedgerEntryResponse(
                                30L,
                                20L,
                                "TXN-001",
                                EntryType.CREDIT,
                                new BigDecimal("1000.00"),
                                createdAt);

                PagedResponse<AccountLedgerEntryResponse> pagedResponse = new PagedResponse<>(
                                List.of(response),
                                0,
                                20,
                                1,
                                1);

                when(auditService.getLedgerHistory(
                                ACCOUNT_ID,
                                0,
                                20,
                                "createdAt",
                                "asc",
                                null))
                                .thenReturn(pagedResponse);

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/ledger",
                                                ACCOUNT_ID))
                                .andExpect(status().isOk())
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].ledgerEntryId")
                                                                .value(30))
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].transactionId")
                                                                .value(20))
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].referenceNumber")
                                                                .value("TXN-001"))
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].entryType")
                                                                .value("CREDIT"))
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].amount")
                                                                .value(1000.00))
                                .andExpect(
                                                jsonPath(
                                                                "$.content[0].createdAt")
                                                                .exists())
                                .andExpect(
                                                jsonPath("$.page")
                                                                .value(0))
                                .andExpect(
                                                jsonPath("$.size")
                                                                .value(20))
                                .andExpect(
                                                jsonPath("$.totalPages")
                                                                .value(1))
                                .andExpect(
                                                jsonPath("$.totalElements")
                                                                .value(1));

                verify(auditService)
                                .getLedgerHistory(
                                                ACCOUNT_ID,
                                                0,
                                                20,
                                                "createdAt",
                                                "asc",
                                                null);
        }

        @Test
        void getLedgerHistory_supportsCustomPaginationAndDescendingSort()
                        throws Exception {

                PagedResponse<AccountLedgerEntryResponse> response = new PagedResponse<>(
                                List.of(),
                                1,
                                5,
                                3,
                                11);

                when(auditService.getLedgerHistory(
                                ACCOUNT_ID,
                                1,
                                5,
                                "createdAt",
                                "desc",
                                null))
                                .thenReturn(response);

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/ledger",
                                                ACCOUNT_ID)
                                                .param("page", "1")
                                                .param("size", "5")
                                                .param("sortBy", "createdAt")
                                                .param("direction", "desc"))
                                .andExpect(status().isOk())
                                .andExpect(
                                                jsonPath("$.page")
                                                                .value(1))
                                .andExpect(
                                                jsonPath("$.size")
                                                                .value(5))
                                .andExpect(
                                                jsonPath("$.totalPages")
                                                                .value(3))
                                .andExpect(
                                                jsonPath("$.totalElements")
                                                                .value(11));

                verify(auditService)
                                .getLedgerHistory(
                                                ACCOUNT_ID,
                                                1,
                                                5,
                                                "createdAt",
                                                "desc",
                                                null);
        }

        @Test
        void getLedgerHistory_supportsCreditFilter()
                        throws Exception {

                PagedResponse<AccountLedgerEntryResponse> response = new PagedResponse<>(
                                List.of(),
                                0,
                                20,
                                0,
                                0);

                when(auditService.getLedgerHistory(
                                ACCOUNT_ID,
                                0,
                                20,
                                "createdAt",
                                "asc",
                                EntryType.CREDIT))
                                .thenReturn(response);

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/ledger",
                                                ACCOUNT_ID)
                                                .param(
                                                                "entryType",
                                                                "CREDIT"))
                                .andExpect(status().isOk())
                                .andExpect(
                                                jsonPath("$.page")
                                                                .value(0))
                                .andExpect(
                                                jsonPath("$.size")
                                                                .value(20))
                                .andExpect(
                                                jsonPath("$.totalPages")
                                                                .value(0))
                                .andExpect(
                                                jsonPath("$.totalElements")
                                                                .value(0));

                verify(auditService)
                                .getLedgerHistory(
                                                ACCOUNT_ID,
                                                0,
                                                20,
                                                "createdAt",
                                                "asc",
                                                EntryType.CREDIT);
        }

        @Test
        void getLedgerHistory_supportsDebitFilter()
                        throws Exception {

                PagedResponse<AccountLedgerEntryResponse> response = new PagedResponse<>(
                                List.of(),
                                0,
                                20,
                                0,
                                0);

                when(auditService.getLedgerHistory(
                                ACCOUNT_ID,
                                0,
                                20,
                                "createdAt",
                                "asc",
                                EntryType.DEBIT))
                                .thenReturn(response);

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/ledger",
                                                ACCOUNT_ID)
                                                .param(
                                                                "entryType",
                                                                "DEBIT"))
                                .andExpect(status().isOk())
                                .andExpect(
                                                jsonPath("$.page")
                                                                .value(0))
                                .andExpect(
                                                jsonPath("$.size")
                                                                .value(20))
                                .andExpect(
                                                jsonPath("$.totalPages")
                                                                .value(0))
                                .andExpect(
                                                jsonPath("$.totalElements")
                                                                .value(0));

                verify(auditService)
                                .getLedgerHistory(
                                                ACCOUNT_ID,
                                                0,
                                                20,
                                                "createdAt",
                                                "asc",
                                                EntryType.DEBIT);
        }

        @Test
        void getLedgerHistory_returnsBadRequestForInvalidEntryType()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/ledger",
                                                ACCOUNT_ID)
                                                .param(
                                                                "entryType",
                                                                "INVALID"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"));

                verifyNoInteractions(auditService);
        }

        @Test
        void getLedgerHistory_returnsBadRequestForNegativePage()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/ledger",
                                                ACCOUNT_ID)
                                                .param("page", "-1"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"));

                verifyNoInteractions(auditService);
        }

        @Test
        void getLedgerHistory_returnsBadRequestForZeroSize()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/ledger",
                                                ACCOUNT_ID)
                                                .param("size", "0"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"));

                verifyNoInteractions(auditService);
        }

        @Test
        void getLedgerHistory_returnsBadRequestWhenSizeExceedsMaximum()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/ledger",
                                                ACCOUNT_ID)
                                                .param("size", "101"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"));

                verifyNoInteractions(auditService);
        }

        @Test
        void getLedgerHistory_returnsBadRequestForInvalidSortField()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/ledger",
                                                ACCOUNT_ID)
                                                .param("sortBy", "amount"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"));

                verifyNoInteractions(auditService);
        }

        @Test
        void getLedgerHistory_returnsBadRequestForInvalidDirection()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/ledger",
                                                ACCOUNT_ID)
                                                .param(
                                                                "direction",
                                                                "sideways"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"));

                verifyNoInteractions(auditService);
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
                                null))
                                .thenReturn(response);

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/balance",
                                                ACCOUNT_ID))
                                .andExpect(status().isOk())
                                .andExpect(
                                                jsonPath("$.accountId")
                                                                .value(ACCOUNT_ID))
                                .andExpect(
                                                jsonPath("$.balance")
                                                                .value(1500.00))
                                .andExpect(
                                                jsonPath("$.asOf")
                                                                .doesNotExist());

                verify(auditService)
                                .getBalance(
                                                ACCOUNT_ID,
                                                null);
        }

        @Test
        void getBalance_returnsHistoricalBalanceWhenAsOfIsProvided()
                        throws Exception {

                OffsetDateTime asOf = OffsetDateTime.parse(
                                "2026-09-10T12:00:00Z");

                AuditBalanceResponse response = new AuditBalanceResponse(
                                ACCOUNT_ID,
                                new BigDecimal("1250.00"),
                                asOf);

                when(auditService.getBalance(
                                ACCOUNT_ID,
                                asOf))
                                .thenReturn(response);

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/balance",
                                                ACCOUNT_ID)
                                                .param(
                                                                "asOf",
                                                                "2026-09-10T12:00:00Z"))
                                .andExpect(status().isOk())
                                .andExpect(
                                                jsonPath("$.accountId")
                                                                .value(ACCOUNT_ID))
                                .andExpect(
                                                jsonPath("$.balance")
                                                                .value(1250.00))
                                .andExpect(
                                                jsonPath("$.asOf")
                                                                .exists());

                verify(auditService)
                                .getBalance(
                                                ACCOUNT_ID,
                                                asOf);
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
                                List.of(item),
                                0,
                                20,
                                1,
                                1);

                when(auditService.getAuditTrail(
                                ACCOUNT_ID,
                                null,
                                0,
                                20))
                                .thenReturn(response);

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/trail",
                                                ACCOUNT_ID))
                                .andExpect(status().isOk())
                                .andExpect(
                                                jsonPath("$.accountId")
                                                                .value(ACCOUNT_ID))
                                .andExpect(
                                                jsonPath("$.finalBalance")
                                                                .value(1000.00))
                                .andExpect(
                                                jsonPath("$.asOf")
                                                                .doesNotExist())
                                .andExpect(
                                                jsonPath("$.items")
                                                                .isArray())
                                .andExpect(
                                                jsonPath("$.items.length()")
                                                                .value(1))
                                .andExpect(
                                                jsonPath("$.items[0].eventId")
                                                                .value(10))
                                .andExpect(
                                                jsonPath("$.items[0].eventType")
                                                                .value("DEPOSIT"))
                                .andExpect(
                                                jsonPath("$.items[0].balanceChange")
                                                                .value(1000.00))
                                .andExpect(
                                                jsonPath("$.items[0].runningBalance")
                                                                .value(1000.00))
                                .andExpect(
                                                jsonPath("$.page")
                                                                .value(0))
                                .andExpect(
                                                jsonPath("$.size")
                                                                .value(20))
                                .andExpect(
                                                jsonPath("$.totalPages")
                                                                .value(1))
                                .andExpect(
                                                jsonPath("$.totalElements")
                                                                .value(1));

                verify(auditService)
                                .getAuditTrail(
                                                ACCOUNT_ID,
                                                null,
                                                0,
                                                20);
        }

        @Test
        void getAuditTrail_returnsHistoricalTrailWhenAsOfIsProvided()
                        throws Exception {

                OffsetDateTime asOf = OffsetDateTime.parse(
                                "2026-09-10T12:00:00Z");

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
                                List.of(item),
                                0,
                                20,
                                1,
                                1);

                when(auditService.getAuditTrail(
                                ACCOUNT_ID,
                                asOf,
                                0,
                                20))
                                .thenReturn(response);

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/trail",
                                                ACCOUNT_ID)
                                                .param(
                                                                "asOf",
                                                                "2026-09-10T12:00:00Z"))
                                .andExpect(status().isOk())
                                .andExpect(
                                                jsonPath("$.accountId")
                                                                .value(ACCOUNT_ID))
                                .andExpect(
                                                jsonPath("$.finalBalance")
                                                                .value(500.00))
                                .andExpect(
                                                jsonPath("$.asOf")
                                                                .exists())
                                .andExpect(
                                                jsonPath("$.items")
                                                                .isArray())
                                .andExpect(
                                                jsonPath("$.items.length()")
                                                                .value(1))
                                .andExpect(
                                                jsonPath("$.items[0].eventType")
                                                                .value("DEPOSIT"))
                                .andExpect(
                                                jsonPath("$.items[0].balanceChange")
                                                                .value(500.00))
                                .andExpect(
                                                jsonPath("$.items[0].runningBalance")
                                                                .value(500.00))
                                .andExpect(
                                                jsonPath("$.page")
                                                                .value(0))
                                .andExpect(
                                                jsonPath("$.size")
                                                                .value(20))
                                .andExpect(
                                                jsonPath("$.totalPages")
                                                                .value(1))
                                .andExpect(
                                                jsonPath("$.totalElements")
                                                                .value(1));

                verify(auditService)
                                .getAuditTrail(
                                                ACCOUNT_ID,
                                                asOf,
                                                0,
                                                20);
        }

        @Test
        void getEventHistory_returnsNotFoundWhenAccountDoesNotExist()
                        throws Exception {

                when(auditService.getEventHistory(
                                ACCOUNT_ID,
                                0,
                                20,
                                "occurredAt",
                                "asc"))
                                .thenThrow(
                                                new AccountNotFoundException(
                                                                "Account not found: "
                                                                                + ACCOUNT_ID));

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/events",
                                                ACCOUNT_ID))
                                .andExpect(status().isNotFound())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(404))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Not Found"))
                                .andExpect(
                                                jsonPath("$.message")
                                                                .value(
                                                                                "Account not found: "
                                                                                                + ACCOUNT_ID))
                                .andExpect(
                                                jsonPath("$.path")
                                                                .value(
                                                                                "/accounts/"
                                                                                                + ACCOUNT_ID
                                                                                                + "/audit/events"));

                verify(auditService)
                                .getEventHistory(
                                                ACCOUNT_ID,
                                                0,
                                                20,
                                                "occurredAt",
                                                "asc");
        }

        @Test
        void getBalance_returnsBadRequestWhenAsOfIsInvalid()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/balance",
                                                ACCOUNT_ID)
                                                .param(
                                                                "asOf",
                                                                "invalid-date"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"))
                                .andExpect(
                                                jsonPath("$.message")
                                                                .value(
                                                                                "Invalid value for parameter 'asOf'"))
                                .andExpect(
                                                jsonPath("$.path")
                                                                .value(
                                                                                "/accounts/"
                                                                                                + ACCOUNT_ID
                                                                                                + "/audit/balance"));

                verifyNoInteractions(auditService);
        }

        @Test
        void getAuditTrail_returnsBadRequestWhenAsOfIsInvalid()
                        throws Exception {

                mockMvc.perform(
                                get(
                                                "/accounts/{accountId}/audit/trail",
                                                ACCOUNT_ID)
                                                .param(
                                                                "asOf",
                                                                "invalid-date"))
                                .andExpect(status().isBadRequest())
                                .andExpect(
                                                jsonPath("$.status")
                                                                .value(400))
                                .andExpect(
                                                jsonPath("$.error")
                                                                .value("Bad Request"))
                                .andExpect(
                                                jsonPath("$.message")
                                                                .value(
                                                                                "Invalid value for parameter 'asOf'"))
                                .andExpect(
                                                jsonPath("$.path")
                                                                .value(
                                                                                "/accounts/"
                                                                                                + ACCOUNT_ID
                                                                                                + "/audit/trail"));

                verifyNoInteractions(auditService);
        }

        @Test
        void getAuditTrail_supportsCustomPagination() throws Exception {

                AuditTrailResponse response = new AuditTrailResponse(
                                ACCOUNT_ID,
                                new BigDecimal("2500.00"),
                                null,
                                List.of(),
                                1,
                                10,
                                3,
                                25);

                when(auditService.getAuditTrail(
                                ACCOUNT_ID,
                                null,
                                1,
                                10))
                                .thenReturn(response);

                mockMvc.perform(
                                get("/accounts/{accountId}/audit/trail", ACCOUNT_ID)
                                                .param("page", "1")
                                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.page").value(1))
                                .andExpect(jsonPath("$.size").value(10))
                                .andExpect(jsonPath("$.totalPages").value(3))
                                .andExpect(jsonPath("$.totalElements").value(25))
                                .andExpect(jsonPath("$.finalBalance").value(2500.00))
                                .andExpect(jsonPath("$.items").isArray())
                                .andExpect(jsonPath("$.items.length()").value(0));

                verify(auditService)
                                .getAuditTrail(
                                                ACCOUNT_ID,
                                                null,
                                                1,
                                                10);
        }

        @Test
        void getAuditTrail_supportsOutOfRangePage() throws Exception {

                AuditTrailResponse response = new AuditTrailResponse(
                                ACCOUNT_ID,
                                new BigDecimal("1000.00"),
                                null,
                                List.of(),
                                5,
                                20,
                                1,
                                3);

                when(auditService.getAuditTrail(
                                ACCOUNT_ID,
                                null,
                                5,
                                20))
                                .thenReturn(response);

                mockMvc.perform(
                                get("/accounts/{accountId}/audit/trail", ACCOUNT_ID)
                                                .param("page", "5")
                                                .param("size", "20"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.page").value(5))
                                .andExpect(jsonPath("$.size").value(20))
                                .andExpect(jsonPath("$.totalPages").value(1))
                                .andExpect(jsonPath("$.totalElements").value(3))
                                .andExpect(jsonPath("$.items").isArray())
                                .andExpect(jsonPath("$.items.length()").value(0))
                                .andExpect(jsonPath("$.finalBalance").value(1000.00));

                verify(auditService)
                                .getAuditTrail(
                                                ACCOUNT_ID,
                                                null,
                                                5,
                                                20);
        }

        @Test
        void getAuditTrail_returnsBadRequestForNegativePage()
                        throws Exception {

                mockMvc.perform(
                                get("/accounts/{accountId}/audit/trail", ACCOUNT_ID)
                                                .param("page", "-1"))
                                .andExpect(status().isBadRequest());

                verifyNoInteractions(auditService);
        }

        @Test
        void getAuditTrail_returnsBadRequestForInvalidSize()
                        throws Exception {

                mockMvc.perform(
                                get("/accounts/{accountId}/audit/trail", ACCOUNT_ID)
                                                .param("size", "101"))
                                .andExpect(status().isBadRequest());

                verifyNoInteractions(auditService);
        }
}