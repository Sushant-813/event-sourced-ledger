package com.ledger.common.exception;

import java.time.OffsetDateTime;

/**
 * Standard error response body returned by GlobalExceptionHandler for all
 * error conditions.  Fields align with the API_GUIDELINES.md §10 error format.
 *
 * @param timestamp ISO-8601 UTC instant when the error occurred
 * @param status    HTTP status code (e.g. 404)
 * @param error     HTTP reason phrase (e.g. "Not Found")
 * @param message   Human-readable description of the error
 * @param path      Request URI that produced the error
 */
public record ApiError(
        OffsetDateTime timestamp,
        int status,
        String error,
        String message,
        String path
) {

    /**
     * Factory method to reduce boilerplate at call sites; timestamps the error
     * at the moment of construction.
     */
    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(OffsetDateTime.now(), status, error, message, path);
    }
}
