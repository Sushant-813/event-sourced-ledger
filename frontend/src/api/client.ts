/**
 * Centralized API Client
 *
 * Single fetch wrapper for all communication with the Event-Sourced Ledger backend.
 *
 * Responsibilities:
 *   1. Prefix requests with VITE_API_BASE_URL (empty in dev → Vite proxy routes to :8080)
 *   2. Build URL with typed query parameters; skip null/undefined entries
 *   3. Set Accept: application/json and Content-Type: application/json where applicable
 *   4. Normalize all non-2xx responses into ApiError using the BackendErrorBody shape
 *   5. Map network failures (fetch throws) to ApiError { status: 0, isNetworkError: true }
 *   6. Return parsed JSON for 2xx responses; return undefined for 204 No Content
 *
 * ARCHITECTURAL INVARIANTS (FRONTEND_ARCHITECTURE.md §5):
 *   - NEVER append /api/v1 to any path. Paths come from ENDPOINTS registry verbatim.
 *   - NEVER perform optimistic balance updates (FRONTEND_ARCHITECTURE.md §14.2).
 *   - NEVER store response data in component state — use React Query hooks instead.
 *
 * Source: FRONTEND_ARCHITECTURE.md §5, API_GUIDELINES.md §10
 */

import { ApiError, type BackendErrorBody } from './errors'

/**
 * Base URL of the backend API.
 * Empty string in development (requests go through Vite proxy).
 * Set VITE_API_BASE_URL in .env.local for direct connection without proxy.
 */
const BASE_URL: string = (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? ''

/**
 * Query parameter value types accepted by apiClient.
 * null and undefined are filtered out — not appended to the URL.
 */
export type QueryParamValue = string | number | boolean | null | undefined

export interface RequestOptions extends RequestInit {
  /** Typed query parameters. null/undefined values are silently omitted. */
  params?: Record<string, QueryParamValue>
}

/**
 * Core fetch wrapper.
 *
 * @param endpoint - Path relative to BASE_URL. Must not contain /api/v1.
 *                   Use ENDPOINTS registry values exclusively.
 * @param options  - Standard RequestInit plus optional params object.
 * @returns Parsed JSON response body typed as T.
 * @throws ApiError for all non-2xx responses and network failures.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchInit } = options

  // Build the final URL. Use window.location.origin as a dummy base so that
  // URL() can parse a path-only endpoint string when BASE_URL is empty.
  const rawUrl = `${BASE_URL}${endpoint}`
  const url = new URL(rawUrl, window.location.origin)

  // Append query parameters — skip null/undefined values entirely
  if (params !== undefined) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  // Build request headers
  const headers = new Headers(fetchInit.headers)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }
  if (fetchInit.body !== null && fetchInit.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Execute the fetch — catch network-level failures
  let response: Response
  try {
    response = await fetch(url.toString(), { ...fetchInit, headers })
  } catch {
    // Network failure: DNS error, connection refused, CORS (no preflight response),
    // browser offline. No HTTP status is available.
    throw new ApiError(
      0,
      'Network Error',
      'Unable to connect to the ledger server. Please check your connection.',
      endpoint,
      true
    )
  }

  // 204 No Content: successful response with no body
  if (response.status === 204) {
    return undefined as T
  }

  // 2xx success: parse and return JSON
  if (response.ok) {
    return response.json() as Promise<T>
  }

  // Non-2xx: parse backend ApiError shape and normalize
  let errorBody: Partial<BackendErrorBody> = {}
  try {
    errorBody = (await response.json()) as Partial<BackendErrorBody>
  } catch {
    // Response body was not parseable JSON (e.g., HTML error page from proxy)
    // Fall through with empty errorBody and use status text as fallback
  }

  throw new ApiError(
    response.status,
    errorBody.error ?? response.statusText,
    errorBody.message ?? 'An unexpected error occurred.',
    errorBody.path ?? endpoint
  )
}
