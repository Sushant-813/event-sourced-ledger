/**
 * Common shared types used across the application.
 *
 * These types mirror the generic backend API contracts defined in
 * docs/API_GUIDELINES.md §11 (Pagination) and §12 (Sorting).
 */

/**
 * PagedResponse<T>
 *
 * Generic paginated collection response used by all standard collection
 * endpoints. See API_GUIDELINES.md §11.
 *
 * All fields match the backend PagedResponse<T> record exactly:
 *   - content: T[]        — array of elements for the requested page
 *   - page: number        — zero-based page number (int)
 *   - size: number        — number of elements per page (int)
 *   - totalPages: number  — total number of pages available (int)
 *   - totalElements: number — total elements across all pages (long)
 */
export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalPages: number
  totalElements: number
}

/**
 * Sort direction for API query parameters.
 * API_GUIDELINES.md §12: allowed values are "asc" and "desc" (case-insensitive on server).
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Base pagination query parameters.
 * Bounds per API_GUIDELINES.md §11:
 *   page >= 0, 1 <= size <= 100
 */
export interface PaginationParams {
  page?: number
  size?: number
}

/**
 * Base sort query parameters.
 */
export interface SortParams {
  sortBy?: string
  direction?: SortDirection
}
