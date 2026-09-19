package com.ledger.common.validation;

import com.ledger.common.exception.InvalidPageParameterException;

public final class PaginationValidator {

    public static final int DEFAULT_PAGE = 0;
    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

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

        if (size > MAX_SIZE) {
            throw new InvalidPageParameterException(
                    "size must be <= 100 (requested: " + size + ")");
        }
    }
}