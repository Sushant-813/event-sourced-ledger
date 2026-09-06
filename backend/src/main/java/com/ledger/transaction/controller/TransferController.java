package com.ledger.transaction.controller;

import com.ledger.transaction.dto.TransferRequest;
import com.ledger.transaction.dto.TransferResponse;
import com.ledger.transaction.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transfers")
@Validated
@Tag(name = "Transfers", description = "Account-to-account transfer operations")
public class TransferController {

    private final TransactionService transactionService;

    public TransferController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @Operation(summary = "Transfer funds", description = "Transfers funds from one ACTIVE customer account to another ACTIVE customer account.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Transfer completed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request", content = @Content(schema = @Schema(implementation = Object.class))),
            @ApiResponse(responseCode = "404", description = "Account not found", content = @Content(schema = @Schema(implementation = Object.class))),
            @ApiResponse(responseCode = "422", description = "Transfer cannot be completed", content = @Content(schema = @Schema(implementation = Object.class)))
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransferResponse transfer(
            @Valid @RequestBody TransferRequest request) {

        return transactionService.transfer(request);
    }
}