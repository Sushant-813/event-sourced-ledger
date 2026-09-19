package com.ledger.account;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledger.account.controller.AccountController;
import com.ledger.account.dto.AccountResponse;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.entity.AccountType;
import com.ledger.account.exception.AccountNotFoundException;
import com.ledger.account.exception.DuplicateAccountNumberException;
import com.ledger.account.exception.InvalidAccountStatusTransitionException;
import com.ledger.account.service.AccountService;
import com.ledger.common.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.ledger.common.dto.PagedResponse;

import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * API-layer tests for {@link AccountController}.
 *
 * Uses {@code standaloneSetup} with {@link GlobalExceptionHandler} registered
 * as controller
 * advice so that all 14 HTTP-layer scenarios can be exercised without loading a
 * full Spring
 * context or touching the database.
 */
@ExtendWith(MockitoExtension.class)
class AccountControllerTest {

        @Mock
        private AccountService accountService;

        @InjectMocks
        private AccountController accountController;

        private MockMvc mockMvc;

        private final ObjectMapper objectMapper = new ObjectMapper()
                        .findAndRegisterModules(); // registers JavaTimeModule for OffsetDateTime serialisation

        // -----------------------------------------------------------------------
        // Shared test fixture
        // -----------------------------------------------------------------------

        private static final Long ACCOUNT_ID = 1L;
        private static final String ACCOUNT_NUMBER = "ACC-001";
        private static final String ACCOUNT_NAME = "John Doe";

        private AccountResponse sampleResponse() {
                return new AccountResponse(
                                ACCOUNT_ID,
                                ACCOUNT_NUMBER,
                                ACCOUNT_NAME,
                                AccountType.SAVINGS,
                                AccountStatus.ACTIVE,
                                OffsetDateTime.parse("2026-01-01T00:00:00Z"),
                                OffsetDateTime.parse("2026-01-01T00:00:00Z"));
        }

        @BeforeEach
        void setUp() {

                mockMvc = MockMvcBuilders
                                .standaloneSetup(accountController)
                                .setControllerAdvice(new GlobalExceptionHandler())
                                .build();
        }

        // -----------------------------------------------------------------------
        // Test 1: POST /accounts — 201 Created
        // -----------------------------------------------------------------------

        @Test
        void createAccount_returns201() throws Exception {

                // Arrange
                String requestBody = """
                                {
                                  "accountNumber": "ACC-001",
                                  "accountName":   "John Doe",
                                  "accountType":   "SAVINGS"
                                }
                                """;

                when(accountService.createAccount(any())).thenReturn(sampleResponse());

                // Act & Assert
                mockMvc.perform(post("/accounts")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").value(ACCOUNT_ID))
                                .andExpect(jsonPath("$.accountNumber").value(ACCOUNT_NUMBER))
                                .andExpect(jsonPath("$.accountName").value(ACCOUNT_NAME))
                                .andExpect(jsonPath("$.accountType").value("SAVINGS"))
                                .andExpect(jsonPath("$.status").value("ACTIVE"));
        }

        // -----------------------------------------------------------------------
        // Test 2: POST /accounts — 400 missing required field
        // -----------------------------------------------------------------------

        @Test
        void createAccount_missingField_returns400() throws Exception {

                // Arrange — accountNumber is absent
                String requestBody = """
                                {
                                  "accountName": "John Doe",
                                  "accountType": "SAVINGS"
                                }
                                """;

                // Act & Assert
                mockMvc.perform(post("/accounts")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Bad Request"))
                                .andExpect(jsonPath("$.message").isNotEmpty())
                                .andExpect(jsonPath("$.path").value("/accounts"));
        }

        // -----------------------------------------------------------------------
        // Test 3: POST /accounts — 400 malformed JSON
        // -----------------------------------------------------------------------

        @Test
        void createAccount_malformedJson_returns400() throws Exception {

                // Arrange — body is not valid JSON
                String requestBody = "{ this is not json }";

                // Act & Assert
                mockMvc.perform(post("/accounts")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Bad Request"))
                                .andExpect(jsonPath("$.path").value("/accounts"));
        }

        // -----------------------------------------------------------------------
        // Test 4: POST /accounts — 400 invalid accountType enum value
        // -----------------------------------------------------------------------

        @Test
        void createAccount_invalidAccountType_returns400() throws Exception {

                // Arrange — "UNKNOWN" is not a valid AccountType
                String requestBody = """
                                {
                                  "accountNumber": "ACC-001",
                                  "accountName":   "John Doe",
                                  "accountType":   "UNKNOWN"
                                }
                                """;

                // Act & Assert
                mockMvc.perform(post("/accounts")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Bad Request"))
                                .andExpect(jsonPath("$.path").value("/accounts"));
        }

        // -----------------------------------------------------------------------
        // Test 5: POST /accounts — 409 duplicate account number
        // -----------------------------------------------------------------------

        @Test
        void createAccount_duplicate_returns409() throws Exception {

                // Arrange
                String requestBody = """
                                {
                                  "accountNumber": "ACC-001",
                                  "accountName":   "John Doe",
                                  "accountType":   "SAVINGS"
                                }
                                """;

                when(accountService.createAccount(any()))
                                .thenThrow(new DuplicateAccountNumberException(
                                                "Account number 'ACC-001' already exists"));

                // Act & Assert
                mockMvc.perform(post("/accounts")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.status").value(409))
                                .andExpect(jsonPath("$.error").value("Conflict"))
                                .andExpect(jsonPath("$.path").value("/accounts"));
        }

        // -----------------------------------------------------------------------
        // Test 6: GET /accounts — 200 paginated list
        // -----------------------------------------------------------------------

        @Test
        void getAllAccounts_returns200() throws Exception {

                // Arrange
                PagedResponse<AccountResponse> response = new PagedResponse<>(
                                List.of(sampleResponse()),
                                0,
                                20,
                                1,
                                1);

                when(accountService.getAllAccounts(
                                0,
                                20,
                                "createdAt",
                                "asc",
                                null,
                                null))
                                .thenReturn(response);

                // Act & Assert
                mockMvc.perform(get("/accounts")
                                .param("page", "0")
                                .param("size", "20"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content").isArray())
                                .andExpect(jsonPath("$.content[0].accountNumber")
                                                .value(ACCOUNT_NUMBER))
                                .andExpect(jsonPath("$.page").value(0))
                                .andExpect(jsonPath("$.size").value(20))
                                .andExpect(jsonPath("$.totalPages").value(1))
                                .andExpect(jsonPath("$.totalElements").value(1));
        }

        @Test
        void getAllAccounts_defaultsPaginationAndSorting() throws Exception {

                PagedResponse<AccountResponse> response = new PagedResponse<>(
                                List.of(sampleResponse()),
                                0,
                                20,
                                1,
                                1);

                when(accountService.getAllAccounts(
                                0,
                                20,
                                "createdAt",
                                "asc",
                                null,
                                null))
                                .thenReturn(response);

                mockMvc.perform(get("/accounts"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.page").value(0))
                                .andExpect(jsonPath("$.size").value(20))
                                .andExpect(jsonPath("$.totalPages").value(1))
                                .andExpect(jsonPath("$.totalElements").value(1))
                                .andExpect(jsonPath("$.content").isArray());
        }

        @Test
        void getAllAccounts_customPagination_returns200() throws Exception {

                PagedResponse<AccountResponse> response = new PagedResponse<>(
                                List.of(sampleResponse()),
                                2,
                                10,
                                5,
                                50);

                when(accountService.getAllAccounts(
                                2,
                                10,
                                "createdAt",
                                "asc",
                                null,
                                null))
                                .thenReturn(response);

                mockMvc.perform(get("/accounts")
                                .param("page", "2")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.page").value(2))
                                .andExpect(jsonPath("$.size").value(10))
                                .andExpect(jsonPath("$.totalPages").value(5))
                                .andExpect(jsonPath("$.totalElements").value(50));
        }

        @Test
        void getAllAccounts_filterByStatus_returns200() throws Exception {

                PagedResponse<AccountResponse> response = new PagedResponse<>(
                                List.of(sampleResponse()),
                                0,
                                20,
                                1,
                                1);

                when(accountService.getAllAccounts(
                                0,
                                20,
                                "createdAt",
                                "asc",
                                AccountStatus.ACTIVE,
                                null))
                                .thenReturn(response);

                mockMvc.perform(get("/accounts")
                                .param("status", "ACTIVE"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalElements").value(1));
        }

        @Test
        void getAllAccounts_filterByAccountType_returns200() throws Exception {

                PagedResponse<AccountResponse> response = new PagedResponse<>(
                                List.of(sampleResponse()),
                                0,
                                20,
                                1,
                                1);

                when(accountService.getAllAccounts(
                                0,
                                20,
                                "createdAt",
                                "asc",
                                null,
                                AccountType.SAVINGS))
                                .thenReturn(response);

                mockMvc.perform(get("/accounts")
                                .param("accountType", "SAVINGS"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalElements").value(1));
        }

        @Test
        void getAllAccounts_combinedFilters_returns200() throws Exception {

                PagedResponse<AccountResponse> response = new PagedResponse<>(
                                List.of(sampleResponse()),
                                0,
                                20,
                                1,
                                1);

                when(accountService.getAllAccounts(
                                0,
                                20,
                                "createdAt",
                                "asc",
                                AccountStatus.ACTIVE,
                                AccountType.SAVINGS))
                                .thenReturn(response);

                mockMvc.perform(get("/accounts")
                                .param("status", "ACTIVE")
                                .param("accountType", "SAVINGS"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalElements").value(1));
        }

        @Test
        void getAllAccounts_sortByAccountNameDescending_returns200() throws Exception {

                PagedResponse<AccountResponse> response = new PagedResponse<>(
                                List.of(sampleResponse()),
                                0,
                                20,
                                1,
                                1);

                when(accountService.getAllAccounts(
                                0,
                                20,
                                "accountName",
                                "desc",
                                null,
                                null))
                                .thenReturn(response);

                mockMvc.perform(get("/accounts")
                                .param("sortBy", "accountName")
                                .param("direction", "desc"))
                                .andExpect(status().isOk());
        }

        @Test
        void getAllAccounts_uppercaseDirection_returns200() throws Exception {

                PagedResponse<AccountResponse> response = new PagedResponse<>(
                                List.of(sampleResponse()),
                                0,
                                20,
                                1,
                                1);

                when(accountService.getAllAccounts(
                                0,
                                20,
                                "createdAt",
                                "DESC",
                                null,
                                null))
                                .thenReturn(response);

                mockMvc.perform(get("/accounts")
                                .param("direction", "DESC"))
                                .andExpect(status().isOk());
        }

        @Test
        void getAllAccounts_negativePage_returns400() throws Exception {

                mockMvc.perform(get("/accounts")
                                .param("page", "-1"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Bad Request"));
        }

        @Test
        void getAllAccounts_zeroSize_returns400() throws Exception {

                mockMvc.perform(get("/accounts")
                                .param("size", "0"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Bad Request"));
        }

        @Test
        void getAllAccounts_sizeAboveMaximum_returns400() throws Exception {

                mockMvc.perform(get("/accounts")
                                .param("size", "101"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Bad Request"));
        }

        @Test
        void getAllAccounts_invalidSortField_returns400() throws Exception {

                mockMvc.perform(get("/accounts")
                                .param("sortBy", "status"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Bad Request"));
        }

        @Test
        void getAllAccounts_invalidDirection_returns400() throws Exception {

                mockMvc.perform(get("/accounts")
                                .param("direction", "sideways"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Bad Request"));
        }

        @Test
        void getAllAccounts_outOfRangePage_returns200WithEmptyContent() throws Exception {

                PagedResponse<AccountResponse> response = new PagedResponse<>(
                                List.of(),
                                999,
                                20,
                                2,
                                25);

                when(accountService.getAllAccounts(
                                999,
                                20,
                                "createdAt",
                                "asc",
                                null,
                                null))
                                .thenReturn(response);

                mockMvc.perform(get("/accounts")
                                .param("page", "999")
                                .param("size", "20"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content").isArray())
                                .andExpect(jsonPath("$.content").isEmpty())
                                .andExpect(jsonPath("$.page").value(999))
                                .andExpect(jsonPath("$.size").value(20))
                                .andExpect(jsonPath("$.totalPages").value(2))
                                .andExpect(jsonPath("$.totalElements").value(25));
        }

        @Test
        void getAllAccounts_maximumPageSize_returns200() throws Exception {

                PagedResponse<AccountResponse> response = new PagedResponse<>(
                                List.of(),
                                0,
                                100,
                                0,
                                0);

                when(accountService.getAllAccounts(
                                0,
                                100,
                                "createdAt",
                                "asc",
                                null,
                                null))
                                .thenReturn(response);

                mockMvc.perform(get("/accounts")
                                .param("size", "100"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.size").value(100));
        }

        // -----------------------------------------------------------------------
        // Test 8: GET /accounts/{id} — 404 account not found
        // -----------------------------------------------------------------------

        @Test
        void getAccountById_notFound_returns404() throws Exception {

                // Arrange
                Long missingId = 99L;

                when(accountService.getAccountById(missingId))
                                .thenThrow(new AccountNotFoundException(
                                                "Account with id '99' not found"));

                // Act & Assert
                mockMvc.perform(get("/accounts/{id}", missingId))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.status").value(404))
                                .andExpect(jsonPath("$.error").value("Not Found"))
                                .andExpect(jsonPath("$.path").value("/accounts/99"));
        }

        // -----------------------------------------------------------------------
        // Test 9: GET /accounts/by-number/{accountNumber} — 200 account found
        // -----------------------------------------------------------------------

        @Test
        void getAccountByNumber_returns200() throws Exception {

                // Arrange
                when(accountService.getAccountByNumber(ACCOUNT_NUMBER)).thenReturn(sampleResponse());

                // Act & Assert
                mockMvc.perform(get("/accounts/by-number/{accountNumber}", ACCOUNT_NUMBER))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.accountNumber").value(ACCOUNT_NUMBER))
                                .andExpect(jsonPath("$.accountName").value(ACCOUNT_NAME));
        }

        // -----------------------------------------------------------------------
        // Test 10: GET /accounts/by-number/{accountNumber} — 404 not found
        // -----------------------------------------------------------------------

        @Test
        void getAccountByNumber_notFound_returns404() throws Exception {

                // Arrange
                String unknownNumber = "UNKNOWN";

                when(accountService.getAccountByNumber(unknownNumber))
                                .thenThrow(new AccountNotFoundException(
                                                "Account with number 'UNKNOWN' not found"));

                // Act & Assert
                mockMvc.perform(get("/accounts/by-number/{accountNumber}", unknownNumber))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.status").value(404))
                                .andExpect(jsonPath("$.error").value("Not Found"))
                                .andExpect(jsonPath("$.path").value("/accounts/by-number/UNKNOWN"));
        }

        // -----------------------------------------------------------------------
        // Test 11: PATCH /accounts/{id}/freeze — 200
        // -----------------------------------------------------------------------

        @Test
        void freezeAccount_returns200() throws Exception {

                // Arrange
                AccountResponse frozenResponse = new AccountResponse(
                                ACCOUNT_ID,
                                ACCOUNT_NUMBER,
                                ACCOUNT_NAME,
                                AccountType.SAVINGS,
                                AccountStatus.FROZEN,
                                OffsetDateTime.parse("2026-01-01T00:00:00Z"),
                                OffsetDateTime.parse("2026-01-02T00:00:00Z"));

                when(accountService.freezeAccount(ACCOUNT_ID)).thenReturn(frozenResponse);

                // Act & Assert
                mockMvc.perform(patch("/accounts/{id}/freeze", ACCOUNT_ID))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("FROZEN"));
        }

        // -----------------------------------------------------------------------
        // Test 12: PATCH /accounts/{id}/activate — 200
        // -----------------------------------------------------------------------

        @Test
        void activateAccount_returns200() throws Exception {

                // Arrange
                when(accountService.activateAccount(ACCOUNT_ID)).thenReturn(sampleResponse());

                // Act & Assert
                mockMvc.perform(patch("/accounts/{id}/activate", ACCOUNT_ID))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("ACTIVE"));
        }

        // -----------------------------------------------------------------------
        // Test 13: PATCH /accounts/{id}/close — 200
        // -----------------------------------------------------------------------

        @Test
        void closeAccount_returns200() throws Exception {

                // Arrange
                AccountResponse closedResponse = new AccountResponse(
                                ACCOUNT_ID,
                                ACCOUNT_NUMBER,
                                ACCOUNT_NAME,
                                AccountType.SAVINGS,
                                AccountStatus.CLOSED,
                                OffsetDateTime.parse("2026-01-01T00:00:00Z"),
                                OffsetDateTime.parse("2026-01-02T00:00:00Z"));

                when(accountService.closeAccount(ACCOUNT_ID)).thenReturn(closedResponse);

                // Act & Assert
                mockMvc.perform(patch("/accounts/{id}/close", ACCOUNT_ID))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("CLOSED"));
        }

        // -----------------------------------------------------------------------
        // Test 14: PATCH /accounts/{id}/close — 422 invalid status transition
        // -----------------------------------------------------------------------

        @Test
        void closeAccount_invalidTransition_returns422() throws Exception {

                // Arrange — account is already CLOSED
                when(accountService.closeAccount(ACCOUNT_ID))
                                .thenThrow(new InvalidAccountStatusTransitionException(
                                                "Cannot close account: current status is CLOSED"));

                // Act & Assert
                mockMvc.perform(patch("/accounts/{id}/close", ACCOUNT_ID))
                                .andExpect(status().isUnprocessableEntity())
                                .andExpect(jsonPath("$.status").value(422))
                                .andExpect(jsonPath("$.error").value("Unprocessable Entity"))
                                .andExpect(jsonPath("$.path").value("/accounts/1/close"));
        }
}