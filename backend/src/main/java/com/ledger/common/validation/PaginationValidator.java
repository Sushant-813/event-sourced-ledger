package com.ledger.common.validation;

import com.ledger.common.exception.InvalidPageParameterException;
import com.ledger.common.pagination.PaginationConstants;

public final class PaginationValidator {

    private PaginationValidator() {
    }

    public static void validate(int page, int size) {

        if (page < 0) {
            throw new InvalidPageParameterException(
                    "page must be >= 0");
        }

        if (size < 1) {
            throw new InvalidPageParameterException(
                    "size must be >= 1");
        }

        if (size > PaginationConstants.MAX_SIZE) {
            throw new InvalidPageParameterException(
                    "size must be <= " + PaginationConstants.MAX_SIZE + " (requested: " + size + ")");
        }
    }
}