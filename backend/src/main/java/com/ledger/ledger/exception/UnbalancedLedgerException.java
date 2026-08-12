package com.ledger.ledger.exception;

public class UnbalancedLedgerException extends RuntimeException {

    public UnbalancedLedgerException(String message) {
        super(message);
    }
}