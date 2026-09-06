package com.ledger.transaction.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record TransferRequest(

        @NotNull(message = "Source account ID is required") @Positive(message = "Source account ID must be positive") Long sourceAccountId,

        @NotNull(message = "Destination account ID is required") @Positive(message = "Destination account ID must be positive") Long destinationAccountId,

        @NotNull(message = "Amount is required") @DecimalMin(value = "0.01", message = "Amount must be at least 0.01") @Digits(integer = 17, fraction = 2, message = "Amount must have at most 17 integer digits and 2 decimal places") BigDecimal amount

) {
}