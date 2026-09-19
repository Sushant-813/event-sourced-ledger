package com.ledger.account.service;

import com.ledger.account.dto.AccountResponse;
import com.ledger.account.dto.CreateAccountRequest;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.entity.AccountType;
import com.ledger.common.dto.PagedResponse;

public interface AccountService {

    AccountResponse createAccount(CreateAccountRequest request);

    PagedResponse<AccountResponse> getAllAccounts(
            int page,
            int size,
            String sortBy,
            String direction,
            AccountStatus status,
            AccountType accountType);

    AccountResponse getAccountById(Long id);

    AccountResponse getAccountByNumber(String accountNumber);

    AccountResponse freezeAccount(Long id);

    AccountResponse activateAccount(Long id);

    AccountResponse closeAccount(Long id);
}