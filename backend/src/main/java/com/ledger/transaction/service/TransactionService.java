package com.ledger.transaction.service;

import com.ledger.transaction.dto.DepositRequest;
import com.ledger.transaction.dto.TransactionResponse;
import com.ledger.transaction.dto.WithdrawalRequest;
import com.ledger.transaction.dto.TransferRequest;
import com.ledger.transaction.dto.TransferResponse;

public interface TransactionService {

    TransactionResponse deposit(Long accountId, DepositRequest request);

    TransactionResponse withdraw(Long accountId, WithdrawalRequest request);

    TransferResponse transfer(TransferRequest request);
}