# API Guidelines

**Project Name:** Event-Sourced Ledger (Double-Entry Bank Core)

**Version:** 1.0
Related Documents

- PRD.md                  ← Business requirements
- TRD.md                  ← Technology choices
- ARCHITECTURE.md         ← Layer responsibilities
- DATABASE_DESIGN.md      ← Data model
---

# 1. Purpose

This document defines the API design standards for the Event-Sourced Ledger project.

Its purpose is to ensure that every REST endpoint follows a consistent structure, naming convention, request format, response format, and error handling strategy.

These guidelines apply to all current and future APIs developed within the project.

---

# 2. API Design Philosophy

The API should be:

- Predictable
- Consistent
- Stateless
- Resource-Oriented
- Easy to Consume
- Easy to Extend

The API should expose business capabilities rather than database implementation details.

Clients should interact with business resources instead of internal entities.

---

# 3. REST Principles

Every endpoint should follow RESTful conventions.

## Resource-Oriented URLs

Good

```
/accounts
/accounts/{id}
/transactions
/events
```

Avoid

```
/createAccount
/getAllAccounts
/deleteTransaction
```

The URL identifies the resource.

The HTTP method identifies the action.

---

## Stateless Communication

Every request should contain all information required for processing.

The server must not depend on previous client requests.

---

## JSON Communication

All requests and responses use JSON.

Request

```json
{
  "amount": 500
}
```

Response

```json
{
  "id": 15,
  "status": "SUCCESS"
}
```

---

# 4. HTTP Methods

The project follows standard HTTP semantics.

| Method | Purpose |
|----------|----------|
| GET | Retrieve data |
| POST | Create resources or execute business actions |
| PUT | Replace an existing resource |
| PATCH | Partially update a resource |
| DELETE | Remove a resource (only where applicable) |

Business operations such as transfers may also use POST because they create new financial records.

---

# 5. URI Naming Conventions

Use:

- lowercase
- plural nouns
- hyphens when necessary

Examples

```
/accounts
/transactions
/events
/ledger-entries
```

Avoid:

```
/Account
/getAccounts
/accountList
```

---

# 6. Request Design

Every request should contain only the information required to perform the requested operation.

Request bodies should be represented using dedicated DTOs.

Business entities should never be exposed directly.

Example

```json
{
  "sourceAccountId": 1,
  "destinationAccountId": 2,
  "amount": 1000
}
```

---

# 7. Response Design

Responses should be:

- Minimal
- Predictable
- Consistent

Every successful response should return meaningful information.

Example

```json
{
  "transactionId": 125,
  "status": "SUCCESS",
  "timestamp": "2026-08-04T12:30:15Z"
}
```

Avoid returning unnecessary database fields.

---

# 8. HTTP Status Codes

Use standard HTTP status codes.

| Code | Meaning |
|--------|----------|
| 200 | Success |
| 201 | Resource Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource Not Found |
| 409 | Conflict |
| 422 | Business Rule Violation |
| 500 | Internal Server Error |

Status codes should accurately represent the outcome of the request.

---

# 9. Validation

Validation occurs in two stages.

## Request Validation

Ensures that incoming data is structurally valid.

Examples

- Required fields
- Positive amounts
- Valid identifiers
- String length

---

## Business Validation

Ensures that business rules are satisfied.

Examples

- Account exists
- Account is active
- Sufficient funds
- Balanced transaction

Business validation belongs inside the domain layer.

---

# 10. Error Response Format

Every error should follow a consistent structure.

Example

```json
{
  "timestamp": "2026-08-04T14:10:22Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Amount must be greater than zero",
  "path": "/transactions/deposit"
}
```

Error responses should never expose:

- Stack traces
- SQL statements
- Internal implementation details

---

# 11. Pagination

Endpoints returning collections support deterministic, bounded pagination to protect against
memory exhaustion and unconstrained database queries.

## Generic Pagination Contract (`PagedResponse<T>`)

Normal collection endpoints return the project-owned `PagedResponse<T>` record:

```json
{
  "content": [ ... ],
  "page": 0,
  "size": 20,
  "totalPages": 5,
  "totalElements": 95
}
```

Metadata fields:
- `content`: Array of elements for the requested page
- `page`: Zero-based page number (`int`)
- `size`: Number of elements per page (`int`)
- `totalPages`: Total number of pages available (`int`)
- `totalElements`: Total number of elements matching the query across all pages (`long`)

## Pagination Defaults & Boundaries

Standard pagination constraints are centralized in `PaginationConstants` and enforced via `PaginationValidator`:
- `page` default: `0` (`DEFAULT_PAGE`)
- `size` default: `20` (`DEFAULT_SIZE`)
- Minimum `page`: `0` (negative page numbers throw `InvalidPageParameterException` → HTTP 400)
- Minimum `size`: `1` (`size < 1` throws `InvalidPageParameterException` → HTTP 400)
- Maximum `size`: `100` (`MAX_SIZE`; `size > 100` throws `InvalidPageParameterException` → HTTP 400)

## Out-of-Range Pages

Valid requests where the requested page is beyond the available data (e.g. `page = 10` when only
2 pages exist) return **HTTP 200 OK** with an empty content array (`"content": []`), while
preserving the accurate `page`, `size`, `totalPages`, and `totalElements` metadata. This conforms
to standard REST pagination semantics.

## Specialized Financial Audit Trail Response

The audit trail endpoint (`GET /accounts/{accountId}/audit/trail`) intentionally does not use
`PagedResponse<T>`. Instead, it uses the specialized `AuditTrailResponse` DTO to preserve critical
financial context (`accountId`, `finalBalance`, `asOf`) alongside the paginated `items` slice.
See [Section 21](#get-account-audit-trail) for details.

## No Global Response Envelope

The project deliberately avoids global response envelope wrappers (such as `{ "data": ..., "meta": ... }`).
Single-resource endpoints return the resource representation directly, and collection endpoints return
`PagedResponse<T>` or `AuditTrailResponse`.

---

# 12. Sorting

Collection endpoints support safe, predictable sorting with deterministic ordering guarantees.

## Query Parameters

- `sortBy`: Name of the field to sort by (e.g. `createdAt`, `occurredAt`)
- `direction`: Sort direction (`asc` or `desc`, case-insensitive)

## Strict Sort Allowlisting

Every sortable endpoint enforces an explicit, immutable allowlist of supported sort fields via
`SortValidator`. Supplying an unallowed sort field throws `InvalidSortFieldException` (HTTP 400 Bad Request),
preventing SQL injection, property path errors, and unauthorized exposure of internal database fields.
Similarly, invalid sort directions (values other than `asc` or `desc`) throw `InvalidSortFieldException` (HTTP 400).

## Deterministic ID Tie-Breaker

To eliminate "pagination drift" (records appearing on multiple pages or being skipped across page
fetches when sort field values are identical), `SortValidator` automatically appends a secondary
sort on `id` using the **same requested direction**:

$$\text{ORDER BY } \text{sortBy } \text{dir}, \text{ id } \text{dir}$$

For example, `sortBy=createdAt&direction=desc` produces `ORDER BY createdAt DESC, id DESC`.

## Presentation Sorting vs. Canonical History

Public presentation sorting requested at the API boundary applies only to presentation formatting.
It does **not** alter the internal canonical reconstruction order (`occurredAt ASC, id ASC`) used
for balance calculation and ledger replay.

---

# 13. Filtering

Filtering is supported via explicit query parameters on collection endpoints.

## Rules

- **Pre-Pagination Filtering:** All filtering is executed in the database **before** counting,
  sorting, and pagination. `totalElements` and `totalPages` always reflect the filtered result set.
- **Filter vs. Sort Separation:** Filtering parameters (such as `status` and `accountType` on
  `/accounts`) are strictly filters and are **not** sortable fields. Supplying a filter field to
  `sortBy` is rejected with HTTP 400 Bad Request.
- **System Account Boundary:** Account filtering permanently excludes the internal `SYS-CASH`
  contra-account across all filter combinations.
- **Timeline Invariance:** Certain endpoints intentionally disallow filtering to protect domain
  integrity. For example, `GET /accounts/{accountId}/audit/events` does not support filtering by
  `eventType`, ensuring the event timeline remains complete and audit-compliant.

---

# 14. Versioning Strategy

The initial version of the project does not expose explicit API versioning.

Future versions may adopt URI versioning.

Example

```
/api/v1/accounts
```

Breaking changes should introduce a new API version.

---

# 15. Idempotency

Read operations must always be idempotent.

Future versions may introduce idempotency keys for financial operations.

Example

```
POST /transactions

Idempotency-Key:
```

This prevents duplicate financial transactions.

---

# 16. Date & Time Standards

All timestamps should use ISO-8601 format.

Example

```
2026-08-04T14:25:30Z
```

Store timestamps in UTC.

Convert to local time only at presentation.

---

# 17. Monetary Values

Monetary values must never use floating-point types.

Amounts should be represented using precise decimal types.

Example

```
1000.50
```

Precision must never be lost during financial calculations.

---

# 18. API Documentation

Every endpoint should be documented using OpenAPI / Swagger.

Documentation should include:

- Endpoint description
- Request schema
- Response schema
- Validation rules
- Error responses
- Example payloads

Swagger is the source of endpoint documentation.

This document defines only the design standards.

---

# 19. Security Guidelines

Authentication is intentionally excluded from the initial implementation.

Future versions may introduce:

- JWT Authentication
- Role-Based Authorization
- Permissions
- Refresh Tokens

Business logic should remain independent of authentication mechanisms.

---

# 20. Consistency Rules

Every API should follow these rules.

- Use plural resource names.
- Return appropriate HTTP status codes.
- Use JSON.
- Validate input.
- Return consistent error responses.
- Never expose internal entities.
- Never expose database implementation details.
- Keep endpoints resource-oriented.
- Keep request and response formats predictable.

---

# 21. Implemented Endpoints Reference

This section documents the endpoints implemented through Phase 8.

---

## Account Endpoints (Phase 1 & Phase 8 Refinement)

### POST /accounts

Creates a new customer account.

**Request Body:** `CreateAccountRequest`

```json
{
  "accountNumber": "ACC-1001",
  "accountName": "Alice Savings",
  "accountType": "SAVINGS"
}
```

**Success Response:** `201 Created` — `AccountResponse`

---

### GET /accounts

Returns a paginated list of customer accounts with optional filtering and sorting. Excludes `SYS-CASH`.

**Query Parameters:**

| Parameter | Type | Required | Default | Description / Constraints |
|-----------|------|----------|---------|---------------------------|
| `page` | `int` | No | `0` | Zero-based page number. Must be `>= 0`. |
| `size` | `int` | No | `20` | Number of accounts per page. Must be `>= 1` and `<= 100`. |
| `sortBy` | `string` | No | `createdAt` | Field used to sort accounts. Allowed fields ONLY: `createdAt`, `accountName`, `accountNumber`. |
| `direction` | `string` | No | `asc` | Sort direction. Allowed values: `asc`, `desc` (case-insensitive). |
| `status` | `AccountStatus` | No | — | Filter by status (`ACTIVE`, `FROZEN`, `CLOSED`). Filter only, NOT sortable. |
| `accountType` | `AccountType` | No | — | Filter by account type (`SAVINGS`, `CURRENT`). Filter only, NOT sortable. |

**Sorting & Filtering Rules:**
- Filtering is executed before counting, sorting, and pagination in database queries.
- `accountType` and `status` are filters only. Passing them to `sortBy` returns HTTP 400.
- Every sort query automatically includes a deterministic secondary tie-breaker on `id` in the same requested direction.

**Success Response:** `200 OK` — `PagedResponse<AccountResponse>`

```json
{
  "content": [
    {
      "id": 1,
      "accountNumber": "ACC-1001",
      "accountName": "Alice Savings",
      "accountType": "SAVINGS",
      "status": "ACTIVE",
      "createdAt": "2026-08-12T10:00:00Z",
      "updatedAt": "2026-08-12T10:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalPages": 1,
  "totalElements": 1
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | `page < 0`, `size < 1`, or `size > 100` (`InvalidPageParameterException`) |
| 400 | `sortBy` is not in allowlist or `direction` is not `asc`/`desc` (`InvalidSortFieldException`) |

---

### GET /accounts/{id}

Returns a single customer account by internal ID. Returns 404 if missing or if `id` resolves to `SYS-CASH`.

---

### GET /accounts/by-number/{accountNumber}

Returns a single customer account by business account number. Returns 404 if missing or if `accountNumber` is `SYS-CASH`.

---

### PATCH /accounts/{id}/freeze

Transitions an `ACTIVE` account to `FROZEN`. Returns 404 for `SYS-CASH`.

---

### PATCH /accounts/{id}/activate

Transitions a `FROZEN` account to `ACTIVE`. Returns 404 for `SYS-CASH`.

---

### PATCH /accounts/{id}/close

Transitions an `ACTIVE` or `FROZEN` account to `CLOSED`. `CLOSED` is terminal. Returns 404 for `SYS-CASH`.

---

## Transaction Endpoints (Phase 4)

### POST /accounts/{accountId}/deposit

Deposits funds into a customer account.

**Path Variable:**
- `accountId` — internal account ID (must be positive)

**Request Body:** `DepositRequest`

```json
{
  "amount": "100.00"
}
```

- `amount`: required, must be `> 0`, maximum 17 integer digits, 2 decimal places

**Success Response:** `201 Created` — `TransactionResponse`

```json
{
  "transactionId": 42,
  "referenceNumber": "550e8400-e29b-41d4-a716-446655440000",
  "transactionType": "DEPOSIT",
  "status": "COMPLETED",
  "accountId": 7,
  "amount": "100.00",
  "createdAt": "2026-09-06T01:30:00Z"
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | `amount` is null, zero, negative, or exceeds precision |
| 400 | `accountId` path variable is not a positive integer |
| 404 | Account not found, or account resolves to `SYS-CASH` |
| 422 | Account status is `FROZEN` or `CLOSED` |
| 500 | `SYS-CASH` system account missing from database (data integrity violation) |

---

### POST /accounts/{accountId}/withdrawal

Withdraws funds from a customer account.

**Path Variable:**
- `accountId` — internal account ID (must be positive)

**Request Body:** `WithdrawalRequest`

```json
{
  "amount": "40.00"
}
```

- `amount`: required, must be `> 0`, maximum 17 integer digits, 2 decimal places

**Success Response:** `201 Created` — `TransactionResponse`

```json
{
  "transactionId": 43,
  "referenceNumber": "662f9511-f30c-52e5-b827-557766551111",
  "transactionType": "WITHDRAWAL",
  "status": "COMPLETED",
  "accountId": 7,
  "amount": "40.00",
  "createdAt": "2026-09-06T01:31:00Z"
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | `amount` is null, zero, negative, or exceeds precision |
| 400 | `accountId` path variable is not a positive integer |
| 404 | Account not found, or account resolves to `SYS-CASH` |
| 422 | Account status is `FROZEN` or `CLOSED` |
| 422 | Withdrawal amount exceeds the account's derived ledger balance |
| 500 | `SYS-CASH` system account missing from database (data integrity violation) |

---

## Transfer Endpoints (Phase 5)

### POST /transfers

Transfers funds between two distinct ACTIVE customer accounts.

**Request Body:** `TransferRequest`

```json
{
  "sourceAccountId": 1,
  "destinationAccountId": 2,
  "amount": "100.00"
}
```

- `sourceAccountId`: required, must be a positive integer
- `destinationAccountId`: required, must be a positive integer
- `amount`: required, must be `> 0`, maximum 17 integer digits, 2 decimal places

**Success Response:** `201 Created` — `TransferResponse`

```json
{
  "transactionId": 44,
  "referenceNumber": "773a0622-g41d-63f6-c938-668877662222",
  "transactionType": "TRANSFER",
  "status": "COMPLETED",
  "sourceAccountId": 1,
  "destinationAccountId": 2,
  "amount": "100.00",
  "createdAt": "2026-09-07T01:32:00Z"
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | `amount` is null, zero, negative, or exceeds precision |
| 400 | `sourceAccountId` or `destinationAccountId` is null or not a positive integer |
| 404 | Source or destination account not found |
| 404 | Source or destination account resolves to `SYS-CASH` |
| 422 | Source and destination account IDs are identical (`InvalidTransferException`) |
| 422 | Source or destination account status is `FROZEN` or `CLOSED` (`AccountNotEligibleForTransactionException`) |
| 422 | Transfer amount exceeds source account's derived ledger balance (`InsufficientFundsException`) |

---

## Audit Endpoints (Phase 7 & Phase 8 Refinement)

### Get Account Event History

```http
GET /accounts/{accountId}/audit/events?page=0&size=20&sortBy=occurredAt&direction=asc
```

Returns a paginated chronological event history for an account.

**Path Variable:**
- `accountId` — internal account ID (must be positive)

**Query Parameters:**
- `page`: zero-based page number (optional, default `0`, min `0`)
- `size`: number of events per page (optional, default `20`, min `1`, max `100`)
- `sortBy`: field to sort by (optional, default `occurredAt`). Allowed field ONLY: `occurredAt`.
- `direction`: sort direction (optional, default `asc`). Allowed values: `asc`, `desc`.

**Rules:**
- No `eventType` filter is supported; event stream completeness is preserved.
- Automatic secondary tie-breaker on `id` in the same direction.
- Presentation sorting does not affect internal canonical reconstruction order.

**Response (`200 OK`):** `PagedResponse<AccountEventResponse>`

```json
{
  "content": [
    {
      "eventId": 10,
      "eventType": "ACCOUNT_CREATED",
      "transactionId": null,
      "payload": null,
      "occurredAt": "2026-09-10T09:00:00Z"
    },
    {
      "eventId": 20,
      "eventType": "DEPOSIT",
      "transactionId": 100,
      "payload": null,
      "occurredAt": "2026-09-10T10:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalPages": 1,
  "totalElements": 2
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| 400 | `accountId` is non-positive or non-numeric (`ConstraintViolationException`) |
| 400 | `page < 0`, `size < 1`, or `size > 100` (`InvalidPageParameterException`) |
| 400 | `sortBy` is not `occurredAt` or `direction` is not `asc`/`desc` (`InvalidSortFieldException`) |
| 404 | Account not found or resolves to `SYS-CASH` (`AccountNotFoundException`) |

---

### Get Account Transaction History

```http
GET /accounts/{accountId}/audit/transactions?page=0&size=20
```

Returns paginated financial transactions involving an account in event-derived chronological order.

**Path Variable:**
- `accountId` — internal account ID (must be positive)

**Query Parameters:**
- `page`: zero-based page number (optional, default `0`, min `0`)
- `size`: number of transactions per page (optional, default `20`, min `1`, max `100`)

**Event-Derived Ordering & Pagination:**
- No arbitrary database pagination of events.
- Canonical events are loaded in chronological order (`occurredAt ASC, id ASC`).
- Unique transaction IDs are extracted preserving first-occurrence order into a `LinkedHashSet`.
- `totalElements` represents the total count of unique transactions.
- The requested page slice of transaction IDs is computed in memory.
- Only transactions for the requested page slice are batch-loaded via `transactionRepository.findAllById`.
- Event-derived order is restored for the final page response.

**Response (`200 OK`):** `PagedResponse<AccountTransactionResponse>`

```json
{
  "content": [
    {
      "transactionId": 100,
      "referenceNumber": "TXN-001",
      "transactionType": "DEPOSIT",
      "status": "COMPLETED",
      "createdAt": "2026-09-10T10:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalPages": 1,
  "totalElements": 1
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| 400 | `accountId` is non-positive or non-numeric |
| 400 | `page < 0`, `size < 1`, or `size > 100` (`InvalidPageParameterException`) |
| 404 | Account not found or resolves to `SYS-CASH` |

---

### Get Account Ledger History

```http
GET /accounts/{accountId}/audit/ledger?page=0&size=20&sortBy=createdAt&direction=asc&entryType=CREDIT
```

Returns paginated double-entry ledger entries affecting the account with matched transaction reference numbers.

**Path Variable:**
- `accountId` — internal account ID (must be positive)

**Query Parameters:**
- `page`: zero-based page number (optional, default `0`, min `0`)
- `size`: number of entries per page (optional, default `20`, min `1`, max `100`)
- `sortBy`: field to sort by (optional, default `createdAt`). Allowed field ONLY: `createdAt`.
- `direction`: sort direction (optional, default `asc`). Allowed values: `asc`, `desc`.
- `entryType`: optional filter by entry type (`CREDIT`, `DEBIT`). Filtered before count/sort/pagination.

**Batch Loading:**
- Associated transactions for the paginated ledger slice are batch-loaded in bulk via `findAllById`,
  guaranteeing $O(1)$ query complexity without N+1 repository calls.

**Response (`200 OK`):** `PagedResponse<AccountLedgerEntryResponse>`

```json
{
  "content": [
    {
      "ledgerEntryId": 50,
      "transactionId": 100,
      "referenceNumber": "TXN-001",
      "entryType": "CREDIT",
      "amount": "1000.00",
      "createdAt": "2026-09-10T10:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalPages": 1,
  "totalElements": 1
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| 400 | `accountId` is non-positive or non-numeric |
| 400 | `page < 0`, `size < 1`, or `size > 100` (`InvalidPageParameterException`) |
| 400 | `sortBy` is not `createdAt` or `direction` is not `asc`/`desc` (`InvalidSortFieldException`) |
| 404 | Account not found or resolves to `SYS-CASH` |

---

### Get Reconstructed Account Balance

```http
GET /accounts/{accountId}/audit/balance
GET /accounts/{accountId}/audit/balance?asOf=2026-09-10T12:00:00Z
```

Returns the reconstructed balance of the account derived from its historical records. When `asOf`
is omitted, returns the current reconstructed balance and `asOf = null`. When `asOf` is provided,
reconstructs the balance inclusive of all events where `occurredAt <= asOf`.

**Response (`200 OK`):** `AuditBalanceResponse`

```json
{
  "accountId": 1,
  "balance": "1500.00",
  "asOf": "2026-09-10T12:00:00Z"
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| 400 | `accountId` is non-positive or non-numeric |
| 400 | `asOf` query parameter is malformed / invalid ISO-8601 string |
| 404 | Account not found or resolves to `SYS-CASH` |
| 500 | Historical data integrity invariant violated |

---

### Get Account Audit Trail

```http
GET /accounts/{accountId}/audit/trail?page=0&size=20
GET /accounts/{accountId}/audit/trail?asOf=2026-09-10T12:00:00Z&page=0&size=20
```

Returns a paginated chronological explanation of how the account balance evolved.

**Path Variable:**
- `accountId` — internal account ID (must be positive)

**Query Parameters:**
- `asOf`: optional ISO-8601 timestamp for historical reconstruction boundary
- `page`: zero-based page number (optional, default `0`, min `0`)
- `size`: number of audit trail items per page (optional, default `20`, min `1`, max `100`)

**Accounting & Pagination Invariants:**
1. **Full History Reconstructed First:** Complete canonical event history up to `asOf` is replayed
   and reconstructed before any pagination slicing occurs.
2. **Absolute Running Balances:** Running balances represent absolute cumulative values from account
   inception, never relative to the current page.
3. **True Final Balance:** `finalBalance` reflects the complete reconstructed balance across the full
   event history, unaffected by the requested page.
4. **Post-Reconstruction Slicing:** Slicing of `items` occurs AFTER full running-balance accumulation.
5. **Out-of-Range Behavior:** Valid out-of-range page requests return HTTP 200 with an empty `items: []`
   array while retaining accurate `finalBalance`, `totalPages`, and `totalElements` metadata.
6. **No Arbitrary Sorting/Filtering:** Arbitrary sorting or filtering is disallowed to preserve chronological
   financial truth.
7. **Batch Loading:** Transactions and ledger entries are batch-loaded in bulk, preventing N+1 queries.

**Response (`200 OK`):** `AuditTrailResponse`

```json
{
  "accountId": 1,
  "finalBalance": "750.00",
  "asOf": null,
  "items": [
    {
      "eventId": 10,
      "eventType": "ACCOUNT_CREATED",
      "transactionId": null,
      "referenceNumber": null,
      "balanceChange": "0.00",
      "runningBalance": "0.00",
      "occurredAt": "2026-09-10T08:00:00Z"
    },
    {
      "eventId": 20,
      "eventType": "DEPOSIT",
      "transactionId": 100,
      "referenceNumber": "TXN-001",
      "balanceChange": "1000.00",
      "runningBalance": "1000.00",
      "occurredAt": "2026-09-10T09:00:00Z"
    },
    {
      "eventId": 30,
      "eventType": "WITHDRAWAL",
      "transactionId": 200,
      "referenceNumber": "TXN-002",
      "balanceChange": "-250.00",
      "runningBalance": "750.00",
      "occurredAt": "2026-09-10T10:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalPages": 1,
  "totalElements": 3
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| 400 | `accountId` is non-positive or non-numeric |
| 400 | `asOf` query parameter is malformed / invalid ISO-8601 string |
| 400 | `page < 0`, `size < 1`, or `size > 100` (`InvalidPageParameterException`) |
| 404 | Account not found or resolves to `SYS-CASH` |
| 500 | Historical data integrity invariant violated |

---

## SYS-CASH System Account

`SYS-CASH` is an internal system contra-account used for double-entry accounting in
single-account deposit and withdrawal operations. It is not a customer account and is
not exposed through any public API:

- It does not appear in `GET /accounts` paginated results.
- All public account lookup, status mutation, deposit, withdrawal, transfer, and audit
  operations return 404 when any target account resolves to `SYS-CASH`.
- Customer-to-customer transfers operate directly between customer accounts and do
  not involve `SYS-CASH`.

Clients cannot interact with `SYS-CASH` through any documented endpoint.

---

# 22. Future Enhancements

Future API capabilities may include:

- Bulk Operations
- Batch Processing
- API Versioning
- Idempotency Keys
- Cursor Pagination
- Rate Limiting
- HATEOAS
- Event Streaming
- Webhooks

These enhancements should remain compatible with the core API philosophy.

---

# 23. Guiding Philosophy

> **"An API is a contract, not an implementation."**

Clients should interact with stable business capabilities rather than internal application details.

Every endpoint should be intuitive, consistent, and resilient to future evolution.

A well-designed API minimizes surprises, encourages correct usage, and remains maintainable as the system grows.