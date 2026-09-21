package com.ledger.transaction.controller;

import com.ledger.transaction.dto.DepositRequest;
import com.ledger.transaction.dto.TransactionResponse;
import com.ledger.transaction.dto.WithdrawalRequest;
import com.ledger.transaction.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/accounts")
@Validated
@Tag(name = "Transactions", description = "Deposit and withdrawal operations")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @Operation(summary = "Deposit funds", description = "Deposits funds into an ACTIVE customer account.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Deposit completed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request", content = @Content(schema = @Schema(implementation = Object.class))),
            @ApiResponse(responseCode = "404", description = "Account not found", content = @Content(schema = @Schema(implementation = Object.class))),
            @ApiResponse(responseCode = "422", description = "Deposit cannot be completed", content = @Content(schema = @Schema(implementation = Object.class)))
    })
    @PostMapping("/{accountId}/deposit")
    public ResponseEntity<TransactionResponse> deposit(
            @Parameter(description = "Internal account ID", required = true)
            @PathVariable @Positive(message = "Account ID must be positive") Long accountId,
            @Valid @RequestBody DepositRequest request) {

        TransactionResponse response = transactionService.deposit(accountId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @Operation(summary = "Withdraw funds", description = "Withdraws funds from an ACTIVE customer account.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Withdrawal completed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request", content = @Content(schema = @Schema(implementation = Object.class))),
            @ApiResponse(responseCode = "404", description = "Account not found", content = @Content(schema = @Schema(implementation = Object.class))),
            @ApiResponse(responseCode = "422", description = "Withdrawal cannot be completed", content = @Content(schema = @Schema(implementation = Object.class)))
    })
    @PostMapping("/{accountId}/withdrawal")
    public ResponseEntity<TransactionResponse> withdraw(
            @Parameter(description = "Internal account ID", required = true)
            @PathVariable @Positive(message = "Account ID must be positive") Long accountId,
            @Valid @RequestBody WithdrawalRequest request) {

        TransactionResponse response = transactionService.withdraw(accountId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}