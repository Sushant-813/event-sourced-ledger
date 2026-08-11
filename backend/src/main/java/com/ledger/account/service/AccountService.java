package com.ledger.account.service;

import com.ledger.account.dto.AccountResponse;
import com.ledger.account.dto.CreateAccountRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AccountService {

    AccountResponse createAccount(CreateAccountRequest request);

    Page<AccountResponse> getAllAccounts(Pageable pageable);

    AccountResponse getAccountById(Long id);

    AccountResponse getAccountByNumber(String accountNumber);

    AccountResponse freezeAccount(Long id);

    AccountResponse activateAccount(Long id);

    AccountResponse closeAccount(Long id);
}