package com.ledger.account.exception;

public class DuplicateAccountNumberException extends RuntimeException {

    public DuplicateAccountNumberException(String message) {
        super(message);
    }
}