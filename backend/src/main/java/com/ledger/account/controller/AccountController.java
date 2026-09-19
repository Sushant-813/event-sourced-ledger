package com.ledger.account.controller;

import com.ledger.account.dto.AccountResponse;
import com.ledger.account.dto.CreateAccountRequest;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.entity.AccountType;
import com.ledger.account.service.AccountService;
import com.ledger.common.dto.PagedResponse;
import com.ledger.common.pagination.PaginationConstants;
import com.ledger.common.validation.PaginationValidator;
import com.ledger.common.validation.SortValidator;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/accounts")
@Validated
@Tag(name = "Accounts", description = "Account lifecycle and account lookup operations")
public class AccountController {

        private static final Set<String> ACCOUNT_SORT_FIELDS = Set.of(
                        "createdAt",
                        "accountName",
                        "accountNumber");

        private final AccountService accountService;

        public AccountController(AccountService accountService) {
                this.accountService = accountService;
        }

        @Operation(summary = "Create an account", description = "Creates a new account with an initial ACTIVE status.")
        @ApiResponses({
                        @ApiResponse(responseCode = "201", description = "Account created successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request", content = @Content(schema = @Schema(implementation = Object.class))),
                        @ApiResponse(responseCode = "409", description = "Account number already exists", content = @Content(schema = @Schema(implementation = Object.class)))
        })
        @PostMapping
        @ResponseStatus(HttpStatus.CREATED)
        public AccountResponse createAccount(
                        @Valid @RequestBody CreateAccountRequest request) {

                return accountService.createAccount(request);
        }

        @Operation(summary = "List accounts", description = "Returns a paginated list of accounts with optional filtering and sorting.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Accounts retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid pagination, sorting, or filtering parameter")
        })
        @GetMapping
        public PagedResponse<AccountResponse> getAllAccounts(

                        @Parameter(description = "Zero-based page number", example = "0") @RequestParam(defaultValue = ""
                                        + PaginationConstants.DEFAULT_PAGE) int page,

                        @Parameter(description = "Number of accounts per page. Maximum 100.", example = "20") @RequestParam(defaultValue = ""
                                        + PaginationConstants.DEFAULT_SIZE) int size,

                        @Parameter(description = "Field used to sort accounts", example = "createdAt") @RequestParam(defaultValue = "createdAt") String sortBy,

                        @Parameter(description = "Sort direction", example = "asc") @RequestParam(defaultValue = "asc") String direction,

                        @Parameter(description = "Filter accounts by status", example = "ACTIVE") @RequestParam(required = false) AccountStatus status,

                        @Parameter(description = "Filter accounts by account type", example = "SAVINGS") @RequestParam(required = false) AccountType accountType) {

                /*
                 * Validate at the controller boundary.
                 *
                 * This is important because controller tests use a mocked
                 * AccountService, so service-level validation would otherwise
                 * not execute.
                 */
                PaginationValidator.validate(page, size);

                SortValidator.validateAndBuild(
                                sortBy,
                                direction,
                                ACCOUNT_SORT_FIELDS);

                return accountService.getAllAccounts(
                                page,
                                size,
                                sortBy,
                                direction,
                                status,
                                accountType);
        }

        @Operation(summary = "Get account by ID", description = "Returns a single account using its internal ID.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Account found"),
                        @ApiResponse(responseCode = "404", description = "Account not found")
        })
        @GetMapping("/{id:\\d+}")
        public AccountResponse getAccountById(
                        @Parameter(description = "Internal account ID", required = true) @PathVariable @Positive(message = "id must be greater than 0") Long id) {

                return accountService.getAccountById(id);
        }

        @Operation(summary = "Get account by account number", description = "Returns a single account using its business account number.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Account found"),
                        @ApiResponse(responseCode = "404", description = "Account not found")
        })
        @GetMapping("/by-number/{accountNumber}")
        public AccountResponse getAccountByNumber(
                        @Parameter(description = "Business account number", required = true) @PathVariable @Size(min = 1, max = 50, message = "accountNumber must be between 1 and 50 characters") String accountNumber) {

                return accountService.getAccountByNumber(accountNumber);
        }

        @Operation(summary = "Freeze an account", description = "Transitions an ACTIVE account to FROZEN.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Account frozen successfully"),
                        @ApiResponse(responseCode = "404", description = "Account not found"),
                        @ApiResponse(responseCode = "422", description = "Invalid account status transition")
        })
        @PatchMapping("/{id:\\d+}/freeze")
        public AccountResponse freezeAccount(
                        @Parameter(description = "Internal account ID", required = true) @PathVariable @Positive(message = "id must be greater than 0") Long id) {

                return accountService.freezeAccount(id);
        }

        @Operation(summary = "Activate an account", description = "Transitions a FROZEN account to ACTIVE.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Account activated successfully"),
                        @ApiResponse(responseCode = "404", description = "Account not found"),
                        @ApiResponse(responseCode = "422", description = "Invalid account status transition")
        })
        @PatchMapping("/{id:\\d+}/activate")
        public AccountResponse activateAccount(
                        @Parameter(description = "Internal account ID", required = true) @PathVariable @Positive(message = "id must be greater than 0") Long id) {

                return accountService.activateAccount(id);
        }

        @Operation(summary = "Close an account", description = "Transitions an ACTIVE or FROZEN account to CLOSED. CLOSED is terminal.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Account closed successfully"),
                        @ApiResponse(responseCode = "404", description = "Account not found"),
                        @ApiResponse(responseCode = "422", description = "Invalid account status transition")
        })
        @PatchMapping("/{id:\\d+}/close")
        public AccountResponse closeAccount(
                        @Parameter(description = "Internal account ID", required = true) @PathVariable @Positive(message = "id must be greater than 0") Long id) {

                return accountService.closeAccount(id);
        }
}