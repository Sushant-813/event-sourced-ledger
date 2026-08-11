package com.ledger.account.dto;

import com.ledger.account.entity.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAccountRequest(

        @NotBlank @Size(max = 50) String accountNumber,

        @NotBlank @Size(max = 255) String accountName,

        @NotNull AccountType accountType

) {
}