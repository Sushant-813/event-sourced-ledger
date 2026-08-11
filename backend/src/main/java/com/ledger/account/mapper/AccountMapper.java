package com.ledger.account.mapper;

import com.ledger.account.dto.AccountResponse;
import com.ledger.account.entity.Account;
import org.springframework.stereotype.Component;

@Component
public class AccountMapper {

    public AccountResponse toResponse(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getAccountNumber(),
                account.getAccountName(),
                account.getAccountType(),
                account.getStatus(),
                account.getCreatedAt(),
                account.getUpdatedAt());
    }
}