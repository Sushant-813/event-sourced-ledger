package com.ledger.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import com.ledger.account.exception.AccountNotFoundException;
import com.ledger.account.exception.DuplicateAccountNumberException;
import com.ledger.account.exception.InvalidAccountStatusTransitionException;

import java.util.stream.Collectors;

/**
 * Centralised exception handler for all REST error responses.
 *
 * Extends {@link ResponseEntityExceptionHandler} so that standard Spring MVC
 * exceptions (including {@link NoResourceFoundException} in Spring Framework 6+)
 * are intercepted here and returned as {@link ApiError} JSON instead of the
 * Whitelabel Error Page or Spring's default error format.
 *
 * {@link ConstraintViolationException} is handled separately because it comes
 * from the Bean Validation API and is not covered by ResponseEntityExceptionHandler.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // -------------------------------------------------------------------------
    // 404 — Missing route (Spring Framework 6 / Spring Boot 3.x)
    // -------------------------------------------------------------------------

    /**
     * Handles requests for routes that do not exist.
     *
     * In Spring Framework 6+, the DispatcherServlet throws
     * {@link NoResourceFoundException} (not the legacy NoHandlerFoundException)
     * when no handler mapping matches the request path.  By overriding this
     * method the response is our ApiError JSON rather than the Whitelabel Error Page.
     */
    @Override
    protected ResponseEntity<Object> handleNoResourceFoundException(
            NoResourceFoundException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        String path = extractPath(request);
        log.warn("404 Not Found: {}", path);

        ApiError body = ApiError.of(
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                "No resource found at: " + path,
                path
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    // -------------------------------------------------------------------------
    // 400 — Bean Validation on @RequestBody (@Valid)
    // -------------------------------------------------------------------------

    /**
     * Fired when a {@code @Valid}-annotated {@code @RequestBody} fails Jakarta
     * Validation constraints.  Aggregates all field errors into the message.
     * Will be exercised from Phase 1 onward when the first request DTO is introduced.
     */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        String path = extractPath(request);
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));

        log.warn("400 Validation failed on {}: {}", path, message);

        ApiError body = ApiError.of(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                message,
                path
        );
        return ResponseEntity.badRequest().body(body);
    }

    // -------------------------------------------------------------------------
    // 400 — Malformed or unreadable JSON body
    // -------------------------------------------------------------------------

    /**
     * Fired when the request body cannot be parsed (e.g. invalid JSON syntax).
     * Will be exercised from Phase 1 onward when controllers accept request bodies.
     */
    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        String path = extractPath(request);
        log.warn("400 Unreadable message on {}: {}", path, ex.getMessage());

        ApiError body = ApiError.of(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Malformed or unreadable request body",
                path
        );
        return ResponseEntity.badRequest().body(body);
    }

    // -------------------------------------------------------------------------
    // 405 — Wrong HTTP method
    // -------------------------------------------------------------------------

    /**
     * Fired when the path exists but the HTTP method is not mapped.
     * Will be exercised from Phase 1 onward when business controllers are mapped.
     */
    @Override
    protected ResponseEntity<Object> handleHttpRequestMethodNotSupported(
            HttpRequestMethodNotSupportedException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        String path = extractPath(request);
        log.warn("405 Method Not Allowed [{} {}]", ex.getMethod(), path);

        ApiError body = ApiError.of(
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                HttpStatus.METHOD_NOT_ALLOWED.getReasonPhrase(),
                "HTTP method '" + ex.getMethod() + "' is not supported for this endpoint",
                path
        );
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(body);
    }

    // -------------------------------------------------------------------------
    // 400 — Bean Validation on @PathVariable / @RequestParam (@Validated)
    // -------------------------------------------------------------------------

    /**
     * Fired when a {@code @Validated} path variable or query parameter fails a
     * Bean Validation constraint.  Not covered by ResponseEntityExceptionHandler
     * because ConstraintViolationException originates from the Bean Validation API.
     * Will be exercised from Phase 1 onward.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request) {

        String path = request.getRequestURI();
        String message = ex.getConstraintViolations().stream()
                .map(cv -> cv.getPropertyPath() + ": " + cv.getMessage())
                .collect(Collectors.joining("; "));

        log.warn("400 Constraint violation on {}: {}", path, message);

        ApiError body = ApiError.of(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                message,
                path
        );
        return ResponseEntity.badRequest().body(body);
    }

    // -------------------------------------------------------------------------
    // 404 — Account not found
    // -------------------------------------------------------------------------

    /**
     * Handles account lookups where the requested account does not exist.
     */
    @ExceptionHandler(AccountNotFoundException.class)
    public ResponseEntity<ApiError> handleAccountNotFound(
            AccountNotFoundException ex,
            HttpServletRequest request) {

        String path = request.getRequestURI();

        log.warn("404 Account not found on {}: {}", path, ex.getMessage());

        ApiError body = ApiError.of(
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                ex.getMessage(),
                path
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    // -------------------------------------------------------------------------
    // 409 — Duplicate account number
    // -------------------------------------------------------------------------

    /**
     * Handles attempts to create an account with an account number that
     * already exists.
     */
    @ExceptionHandler(DuplicateAccountNumberException.class)
    public ResponseEntity<ApiError> handleDuplicateAccountNumber(
            DuplicateAccountNumberException ex,
            HttpServletRequest request) {

        String path = request.getRequestURI();

        log.warn("409 Duplicate account number on {}: {}", path, ex.getMessage());

        ApiError body = ApiError.of(
                HttpStatus.CONFLICT.value(),
                HttpStatus.CONFLICT.getReasonPhrase(),
                ex.getMessage(),
                path
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    // -------------------------------------------------------------------------
    // 422 — Invalid account status transition
    // -------------------------------------------------------------------------

    /**
     * Handles business-rule violations involving the account status lifecycle.
     */
    @ExceptionHandler(InvalidAccountStatusTransitionException.class)
    public ResponseEntity<ApiError> handleInvalidAccountStatusTransition(
            InvalidAccountStatusTransitionException ex,
            HttpServletRequest request) {

        String path = request.getRequestURI();

        log.warn("422 Invalid account status transition on {}: {}",
                path, ex.getMessage());

        ApiError body = ApiError.of(
                HttpStatus.UNPROCESSABLE_ENTITY.value(),
                HttpStatus.UNPROCESSABLE_ENTITY.getReasonPhrase(),
                ex.getMessage(),
                path
        );

        return ResponseEntity
                .status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(body);
    }

    // -------------------------------------------------------------------------
    // 500 — Catch-all for any unhandled exception
    // -------------------------------------------------------------------------

    /**
     * Last-resort handler.  Logs the full exception for diagnosis but returns
     * only a generic message to the client; no internal details are exposed.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleAll(
            Exception ex,
            HttpServletRequest request) {

        String path = request.getRequestURI();
        log.error("500 Unexpected error on {}: {}", path, ex.getMessage(), ex);

        ApiError body = ApiError.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                "An unexpected error occurred. Please try again later.",
                path
        );
        return ResponseEntity.internalServerError().body(body);
    }

    // -------------------------------------------------------------------------
    // Utility
    // -------------------------------------------------------------------------

    /**
     * Extracts the request URI from a {@link WebRequest}.  Falls back to an
     * empty string when the request is not a {@link ServletWebRequest}.
     */
    private static String extractPath(WebRequest request) {
        if (request instanceof ServletWebRequest swr) {
            return swr.getRequest().getRequestURI();
        }
        return "";
    }
}
