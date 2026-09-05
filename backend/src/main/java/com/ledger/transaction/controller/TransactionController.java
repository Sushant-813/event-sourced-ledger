package com.ledger.transaction.controller;

import com.ledger.transaction.dto.DepositRequest;
import com.ledger.transaction.dto.TransactionResponse;
import com.ledger.transaction.dto.WithdrawalRequest;
import com.ledger.transaction.service.TransactionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/accounts")
@Validated
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/{accountId}/deposit")
    public ResponseEntity<TransactionResponse> deposit(
            @PathVariable @Positive(message = "Account ID must be positive") Long accountId,
            @Valid @RequestBody DepositRequest request) {

        TransactionResponse response = transactionService.deposit(accountId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/{accountId}/withdrawal")
    public ResponseEntity<TransactionResponse> withdraw(
            @PathVariable @Positive(message = "Account ID must be positive") Long accountId,
            @Valid @RequestBody WithdrawalRequest request) {

        TransactionResponse response = transactionService.withdraw(accountId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}