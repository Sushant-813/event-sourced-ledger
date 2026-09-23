/**
 * Date Utilities
 *
 * Handles ISO-8601 UTC timestamp formatting and the asOf parameter
 * normalization required for historical balance reconstruction.
 *
 * Design rules (API_GUIDELINES.md §16, DESIGN.md §5):
 *   - All timestamps from the backend are ISO-8601 UTC strings.
 *   - Display conversion to local time happens ONLY at the presentation layer.
 *   - asOf parameter sent to the backend MUST be UTC ISO-8601 format.
 *
 * The asOf utility is part of F0 because it is an architectural boundary
 * used by F4 audit queries. Establishing it here ensures consistent
 * UTC handling from the first moment it is consumed.
 */

/**
 * Formats an ISO-8601 UTC timestamp string for display in the UI.
 *
 * Converts UTC to the browser's local timezone for presentation.
 * Returns a safe fallback string if the input is invalid.
 *
 * Examples (assuming UTC+5:30 locale):
 *   formatTimestamp("2026-09-10T09:00:00Z") → "10 Sep 2026, 14:30"
 *   formatTimestamp(null)                    → "—"
 *   formatTimestamp("not-a-date")           → "Invalid date"
 *
 * @param isoString - ISO-8601 UTC string from backend response.
 * @returns Formatted local date-time string, or a safe fallback.
 */
export function formatTimestamp(isoString: string | null | undefined): string {
  if (isoString === null || isoString === undefined || isoString.trim() === '') {
    return '—'
  }

  const date = new Date(isoString)
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Formats an ISO-8601 UTC timestamp for compact date-only display.
 *
 * @param isoString - ISO-8601 UTC string from backend response.
 * @returns Formatted local date string (e.g. "10 Sep 2026"), or a safe fallback.
 */
export function formatDate(isoString: string | null | undefined): string {
  if (isoString === null || isoString === undefined || isoString.trim() === '') {
    return '—'
  }

  const date = new Date(isoString)
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Normalizes a local datetime string (from a datetime-local HTML input)
 * into a UTC ISO-8601 string suitable for use as the asOf query parameter.
 *
 * The historical balance endpoint expects:
 *   GET /accounts/{id}/audit/balance?asOf=2026-09-10T12:00:00Z
 *   (inclusive: occurredAt <= asOf)
 *
 * The datetime-local HTML input produces a string like "2026-09-10T17:30"
 * (local time, no timezone). This function treats it as local time and
 * converts it to UTC ISO-8601.
 *
 * Returns null if the input is empty or invalid.
 *
 * @param localDatetimeString - Value from a datetime-local input element.
 * @returns UTC ISO-8601 string (e.g. "2026-09-10T12:00:00.000Z") or null.
 */
export function normalizeAsOf(localDatetimeString: string | null | undefined): string | null {
  if (localDatetimeString === null || localDatetimeString === undefined || localDatetimeString.trim() === '') {
    return null
  }

  const date = new Date(localDatetimeString)
  if (isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

/**
 * Returns the current UTC datetime as an ISO-8601 string.
 * Useful as a default value for the asOf date-time picker.
 */
export function nowUtcIso(): string {
  return new Date().toISOString()
}
