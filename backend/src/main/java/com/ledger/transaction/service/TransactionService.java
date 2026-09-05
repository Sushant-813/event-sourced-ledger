package com.ledger.transaction.service;

import com.ledger.transaction.dto.DepositRequest;
import com.ledger.transaction.dto.TransactionResponse;
import com.ledger.transaction.dto.WithdrawalRequest;

public interface TransactionService {

    TransactionResponse deposit(Long accountId, DepositRequest request);

    TransactionResponse withdraw(Long accountId, WithdrawalRequest request);
}