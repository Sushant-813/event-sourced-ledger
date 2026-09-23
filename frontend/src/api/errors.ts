/**
 * API Error Types
 *
 * Defines the normalized error representation for all backend API failures.
 * Every error from the backend (4xx, 5xx) and every network failure is
 * normalized into an ApiError before it leaves the api/ layer.
 *
 * Backend error shape per API_GUIDELINES.md §10:
 * {
 *   "timestamp": "2026-08-04T14:10:22Z",
 *   "status": 400,
 *   "error": "Bad Request",
 *   "message": "Amount must be greater than zero",
 *   "path": "/transactions/deposit"
 * }
 */

/**
 * Represents the raw JSON error body returned by the backend on failure.
 * All fields except status are optional because network errors or
 * malformed responses may omit them.
 */
export interface BackendErrorBody {
  timestamp?: string
  status: number
  error: string
  message: string
  path?: string
}

/**
 * Normalized error type thrown by apiClient for all failure cases:
 *   - HTTP 4xx responses
 *   - HTTP 5xx responses
 *   - Network failures (DNS, CORS, connection refused, offline)
 *
 * Consumers should use the type guard helpers below rather than
 * checking status codes directly.
 */
export class ApiError extends Error {
  public readonly status: number
  public readonly errorTitle: string
  public readonly serverMessage: string
  public readonly path: string | undefined
  public readonly isNetworkError: boolean

  constructor(
    status: number,
    errorTitle: string,
    serverMessage: string,
    path?: string,
    isNetworkError = false
  ) {
    super(`[HTTP ${status}] ${errorTitle}: ${serverMessage}`)
    this.name = 'ApiError'
    this.status = status
    this.errorTitle = errorTitle
    this.serverMessage = serverMessage
    this.path = path
    this.isNetworkError = isNetworkError
  }
}

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

/** Account, transaction, or resource not found. */
export function isNotFound(err: unknown): boolean {
  return isApiError(err) && err.status === 404
}

/** Concurrent state conflict (e.g., account already in requested state). */
export function isConflict(err: unknown): boolean {
  return isApiError(err) && err.status === 409
}

/**
 * Business rule violation (HTTP 422).
 * Examples: insufficient funds, account not eligible for transaction,
 * transfer to same account.
 * API_GUIDELINES.md §8.
 */
export function isBusinessRuleViolation(err: unknown): boolean {
  return isApiError(err) && err.status === 422
}

/** Request validation failure (HTTP 400). */
export function isBadRequest(err: unknown): boolean {
  return isApiError(err) && err.status === 400
}
