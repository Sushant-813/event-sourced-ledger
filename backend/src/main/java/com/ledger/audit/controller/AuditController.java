package com.ledger.audit.controller;

import com.ledger.audit.dto.AccountEventResponse;
import com.ledger.audit.dto.AccountLedgerEntryResponse;
import com.ledger.audit.dto.AccountTransactionResponse;
import com.ledger.audit.dto.AuditBalanceResponse;
import com.ledger.audit.dto.AuditTrailResponse;
import com.ledger.audit.service.AuditService;
import com.ledger.common.dto.PagedResponse;
import com.ledger.common.pagination.PaginationConstants;
import com.ledger.common.validation.PaginationValidator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.ledger.common.validation.SortValidator;
import com.ledger.ledger.entity.EntryType;

import java.util.Set;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/accounts/{accountId}/audit")
@Validated
@Tag(name = "Audit", description = "Endpoints for account financial audit trails and historical balance reconstruction")
public class AuditController {

        private static final Set<String> EVENT_SORT_FIELDS = Set.of(
                        "occurredAt");

        private final AuditService auditService;

        public AuditController(AuditService auditService) {
                this.auditService = auditService;
        }

        @Operation(summary = "Get account event history", description = "Returns the complete chronological event timeline for an account.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Event history retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid account ID", content = @Content(schema = @Schema(implementation = Object.class))),
                        @ApiResponse(responseCode = "404", description = "Account not found", content = @Content(schema = @Schema(implementation = Object.class)))
        })
        @GetMapping("/events")
        public PagedResponse<AccountEventResponse> getEventHistory(

                        @Parameter(description = "Internal account ID", required = true, in = ParameterIn.PATH) @PathVariable @Positive(message = "accountId must be greater than 0") Long accountId,

                        @Parameter(description = "Zero-based page number", example = "0") @RequestParam(defaultValue = ""
                                        + PaginationConstants.DEFAULT_PAGE) int page,

                        @Parameter(description = "Number of events per page. Maximum 100.", example = "20") @RequestParam(defaultValue = ""
                                        + PaginationConstants.DEFAULT_SIZE) int size,

                        @Parameter(description = "Field used to sort events", example = "occurredAt") @RequestParam(defaultValue = "occurredAt") String sortBy,

                        @Parameter(description = "Sort direction", example = "asc") @RequestParam(defaultValue = "asc") String direction) {

                PaginationValidator.validate(page, size);

                SortValidator.validateAndBuild(
                                sortBy,
                                direction,
                                EVENT_SORT_FIELDS);

                return auditService.getEventHistory(
                                accountId,
                                page,
                                size,
                                sortBy,
                                direction);
        }

        @Operation(summary = "Get account transaction history", description = "Returns paginated financial transactions involving an account in event-derived chronological order.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Transaction history retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid account ID or pagination parameter", content = @Content(schema = @Schema(implementation = Object.class))),
                        @ApiResponse(responseCode = "404", description = "Account not found", content = @Content(schema = @Schema(implementation = Object.class)))
        })
        @GetMapping("/transactions")
        public PagedResponse<AccountTransactionResponse> getTransactionHistory(

                        @Parameter(description = "Internal account ID", required = true, in = ParameterIn.PATH) @PathVariable @Positive(message = "accountId must be greater than 0") Long accountId,

                        @Parameter(description = "Zero-based page number", example = "0") @RequestParam(defaultValue = ""
                                        + PaginationConstants.DEFAULT_PAGE) int page,

                        @Parameter(description = "Number of transactions per page. Maximum 100.", example = "20") @RequestParam(defaultValue = ""
                                        + PaginationConstants.DEFAULT_SIZE) int size) {

                PaginationValidator.validate(page, size);

                return auditService.getTransactionHistory(
                                accountId,
                                page,
                                size);
        }

        @Operation(summary = "Get account ledger history", description = "Returns all ledger entries affecting an account in chronological order.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Ledger history retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid account ID", content = @Content(schema = @Schema(implementation = Object.class))),
                        @ApiResponse(responseCode = "404", description = "Account not found", content = @Content(schema = @Schema(implementation = Object.class)))
        })
        @GetMapping("/ledger")
        public PagedResponse<AccountLedgerEntryResponse> getLedgerHistory(

                        @Parameter(description = "Internal account ID", required = true, in = ParameterIn.PATH) @PathVariable @Positive(message = "accountId must be greater than 0") Long accountId,

                        @Parameter(description = "Zero-based page number", example = "0") @RequestParam(defaultValue = ""
                                        + PaginationConstants.DEFAULT_PAGE) int page,

                        @Parameter(description = "Number of ledger entries per page. Maximum 100.", example = "20") @RequestParam(defaultValue = ""
                                        + PaginationConstants.DEFAULT_SIZE) int size,

                        @Parameter(description = "Field used to sort ledger entries", example = "createdAt") @RequestParam(defaultValue = "createdAt") String sortBy,

                        @Parameter(description = "Sort direction", example = "asc") @RequestParam(defaultValue = "asc") String direction,

                        @Parameter(description = "Optional ledger entry type filter", example = "CREDIT") @RequestParam(required = false) EntryType entryType) {

                PaginationValidator.validate(page, size);

                SortValidator.validateAndBuild(
                                sortBy,
                                direction,
                                Set.of("createdAt"));

                return auditService.getLedgerHistory(
                                accountId,
                                page,
                                size,
                                sortBy,
                                direction,
                                entryType);
        }

        @Operation(summary = "Get reconstructed account balance", description = "Returns the current reconstructed balance or the balance at a specified point in time.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Balance retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid account ID or asOf timestamp", content = @Content(schema = @Schema(implementation = Object.class))),
                        @ApiResponse(responseCode = "404", description = "Account not found", content = @Content(schema = @Schema(implementation = Object.class))),
                        @ApiResponse(responseCode = "500", description = "Financial integrity failure", content = @Content(schema = @Schema(implementation = Object.class)))
        })
        @GetMapping("/balance")
        public AuditBalanceResponse getBalance(
                        @Parameter(description = "Internal account ID", required = true, in = ParameterIn.PATH) @PathVariable @Positive(message = "accountId must be greater than 0") Long accountId,

                        @Parameter(description = "Optional ISO-8601 timestamp for historical balance reconstruction", in = ParameterIn.QUERY) @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime asOf) {

                return auditService.getBalance(accountId, asOf);
        }

        @Operation(summary = "Get account audit trail", description = "Returns a chronological explanation of how an account balance evolved event by event.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Audit trail retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid account ID or asOf timestamp", content = @Content(schema = @Schema(implementation = Object.class))),
                        @ApiResponse(responseCode = "404", description = "Account not found", content = @Content(schema = @Schema(implementation = Object.class))),
                        @ApiResponse(responseCode = "500", description = "Financial integrity failure", content = @Content(schema = @Schema(implementation = Object.class)))
        })
        @GetMapping("/trail")
        public AuditTrailResponse getAuditTrail(

                        @Parameter(description = "Internal account ID", required = true) @PathVariable @Positive(message = "accountId must be greater than 0") Long accountId,

                        @Parameter(description = "Optional ISO-8601 timestamp for historical reconstruction", example = "2026-09-19T12:00:00Z") @RequestParam(required = false) OffsetDateTime asOf,

                        @Parameter(description = "Zero-based page number", example = "0") @RequestParam(defaultValue = ""
                                        + PaginationConstants.DEFAULT_PAGE) int page,

                        @Parameter(description = "Number of audit trail items per page. Maximum 100.", example = "20") @RequestParam(defaultValue = ""
                                        + PaginationConstants.DEFAULT_SIZE) int size) {

                PaginationValidator.validate(page, size);

                return auditService.getAuditTrail(
                                accountId,
                                asOf,
                                page,
                                size);
        }
}