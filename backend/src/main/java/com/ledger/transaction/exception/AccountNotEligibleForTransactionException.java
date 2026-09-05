package com.ledger.transaction.exception;

public class AccountNotEligibleForTransactionException extends RuntimeException {

    public AccountNotEligibleForTransactionException(String message) {
        super(message);
    }
}