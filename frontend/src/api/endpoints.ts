/**
 * API Endpoint Registry
 *
 * Centralized repository of all backend URL path generators.
 *
 * CRITICAL INVARIANTS:
 *   - NO /api/v1 prefix anywhere in this file. Paths are bare resource paths.
 *   - All paths verified against actual backend @RequestMapping annotations:
 *       AccountController      @RequestMapping("/accounts")
 *       TransactionController  @RequestMapping("/accounts")
 *       TransferController     @RequestMapping("/transfers")
 *       AuditController        @RequestMapping("/accounts/{accountId}/audit")
 *   - Do NOT duplicate these paths inside components or hooks.
 *     Always import from this registry.
 *
 * Source: API_GUIDELINES.md §21, FRONTEND_ARCHITECTURE.md §5.1, §5.2
 */

export const ENDPOINTS = {
  accounts: {
    /** GET /accounts — paginated account list */
    base: () => `/accounts`,
    /** GET /accounts/{id} — single account by internal ID */
    byId: (id: number | string) => `/accounts/${id}`,
    /** GET /accounts/by-number/{accountNumber} — lookup by business account number */
    byNumber: (accountNumber: string) => `/accounts/by-number/${accountNumber}`,
    /** PATCH /accounts/{id}/freeze — transition ACTIVE → FROZEN */
    freeze: (id: number | string) => `/accounts/${id}/freeze`,
    /** PATCH /accounts/{id}/activate — transition FROZEN → ACTIVE */
    activate: (id: number | string) => `/accounts/${id}/activate`,
    /** PATCH /accounts/{id}/close — terminal transition to CLOSED */
    close: (id: number | string) => `/accounts/${id}/close`,
    /** POST /accounts/{id}/deposit — deposit funds */
    deposit: (id: number | string) => `/accounts/${id}/deposit`,
    /** POST /accounts/{id}/withdrawal — withdraw funds */
    withdrawal: (id: number | string) => `/accounts/${id}/withdrawal`,
  },

  transfers: {
    /** POST /transfers — transfer funds between two ACTIVE accounts */
    base: () => `/transfers`,
  },

  audit: {
    /** GET /accounts/{id}/audit/events — paginated event stream */
    events: (accountId: number | string) => `/accounts/${accountId}/audit/events`,
    /** GET /accounts/{id}/audit/transactions — paginated transaction history */
    transactions: (accountId: number | string) => `/accounts/${accountId}/audit/transactions`,
    /** GET /accounts/{id}/audit/ledger — paginated double-entry ledger */
    ledger: (accountId: number | string) => `/accounts/${accountId}/audit/ledger`,
    /**
     * GET /accounts/{id}/audit/balance — reconstructed balance.
     * Optional asOf query param: ?asOf=2026-09-10T12:00:00Z
     * FRONTEND_ARCHITECTURE.md §12.1: backend is authoritative for all balances.
     */
    balance: (accountId: number | string) => `/accounts/${accountId}/audit/balance`,
    /**
     * GET /accounts/{id}/audit/trail — audit trail with running balances.
     * Uses specialized AuditTrailResponse (not PagedResponse<T>).
     * API_GUIDELINES.md §11 (Specialized Financial Audit Trail Response).
     */
    trail: (accountId: number | string) => `/accounts/${accountId}/audit/trail`,
  },
} as const
