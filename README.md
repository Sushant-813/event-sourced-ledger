# Event-Sourced Ledger

A learning and portfolio implementation of a **double-entry financial ledger** built on event
sourcing principles, featuring a **Java / Spring Boot** backend and a **React / TypeScript**
frontend.

Rather than storing account balances as mutable fields, this system is designed so that every
financial action is recorded as an immutable event. Current state is derived from that historical
record — never stored as a mutable source of truth. The backend serves as the authoritative
source of truth for financial state, double-entry invariant enforcement, and balance reconstruction;
the frontend consumes read models and dispatches commands without performing client-side financial
calculations or balance reconstruction.

> **Project Status:**
> - **Backend v1.0.0:** Complete and verified (Phases 0–10).
> - **Frontend Phase F0 (Frontend Foundation):** Complete and verified.
> - **Frontend Phase F1 (Account Experience):** Complete and verified.
> - **Frontend Phase F2 (Monetary Operations):** Next phase.
>
> See the [Project Roadmap](docs/PROJECT_ROADMAP.md) and [Current Status](#current-status).

---

## Current Status

### Backend (v1.0.0 Complete)

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Project Foundation | **COMPLETED** (2026-08-10) |
| Phase 1 | Account Module | **COMPLETED** (2026-08-12) |
| Phase 2 | Ledger Foundation | **COMPLETED** (2026-08-13) |
| Phase 3 | Event Store | **COMPLETED** (2026-09-03) |
| Phase 4 | Deposit & Withdrawal Engine | **COMPLETED** (2026-09-06) |
| Phase 5 | Transfer Engine | **COMPLETED** (2026-09-07) |
| Phase 6 | Balance Reconstruction | **COMPLETED** (2026-09-08) |
| Phase 7 | Audit Module | **COMPLETED** (2026-09-13) |
| Phase 8 | API Refinement | **COMPLETED** (2026-09-19) |
| Phase 9 | Testing & Hardening | **COMPLETED** (2026-09-21) |
| Phase 10 | Backend v1.0 Release | **COMPLETED** (2026-09-21) |

### Frontend (Phase F1 Complete — Phased Implementation In Progress)

| Phase | Description | Status | Target |
|-------|-------------|--------|--------|
| Phase F0 | Frontend Foundation | **COMPLETED** (2026-09-23) | Foundation Shell & Tooling |
| Phase F1 | Account Directory, Overview, Creation & Lifecycle | **COMPLETED** (2026-09-23) | Account Management UI |
| Phase F2 | Deposit, Withdrawal & Transfer Workflows | **UPCOMING** (Next) | Transaction Forms & Modals |
| Phase F3 | Transactions, Ledger Entries & Event Stream History | **UPCOMING** | History & Journal Tables |
| Phase F4 | Audit Trail & Balance Reconstruction Views | **UPCOMING** | Reconstructed Timeline & Trail |
| Phase F5 | Dashboard Metrics, Polish & Frontend Release Readiness | **UPCOMING** | Final Polish & Production Readiness |

### Phase 1 — Account Module (completed)

Phase 1 introduced the first business domain: **Account**. The following is implemented and
fully tested:

- `Account` JPA entity with `AccountType` (`SAVINGS`, `CURRENT`) and `AccountStatus`
  (`ACTIVE`, `FROZEN`, `CLOSED`) enums
- PostgreSQL `accounts` table managed by Flyway migration `V1__Create_Accounts.sql`
- `AccountRepository` (Spring Data JPA)
- `AccountService` and `AccountServiceImpl` enforcing all business rules:
  - Duplicate account-number prevention (pre-check + concurrent DB constraint translation)
  - Account lifecycle: `ACTIVE → FROZEN`, `ACTIVE → CLOSED`, `FROZEN → ACTIVE`,
    `FROZEN → CLOSED`; `CLOSED` is terminal
- `AccountController` — seven REST endpoints (see [Current API](#current-api))
- Request validation via Jakarta Validation
- Centralized exception handling (`GlobalExceptionHandler` / `ApiError`) covering 400, 404,
  409, 422, and 500 responses
- Swagger/OpenAPI annotations on all account endpoints
- `ddl-auto=validate` — Hibernate verifies entity/schema compatibility at startup
- 17 unit tests (service layer) + 14 API-layer tests (MockMvc) + 1 context smoke test

**Verified result:**

```
mvn clean test
Tests run: 45, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

---

### Phase 2 — Ledger Foundation (completed)

Phase 2 built the accounting foundation on top of the Account domain:

- `Transaction` JPA entity with `TransactionType` (`DEPOSIT`, `WITHDRAWAL`, `TRANSFER`) and
  `TransactionStatus` (`PENDING`, `COMPLETED`, `FAILED`) enums
- `LedgerEntry` JPA entity with `EntryType` (`DEBIT`, `CREDIT`) enum — **intentionally
  immutable**: no setters, no update lifecycle
- PostgreSQL `transactions` table managed by Flyway migration `V2__Create_Transactions.sql`
- PostgreSQL `ledger_entries` table managed by Flyway migration `V3__Create_Ledger_Entries.sql`;
  monetary amounts stored as `NUMERIC(19,2)` (see ADR-020)
- `TransactionRepository` and `LedgerEntryRepository` (Spring Data JPA)
- `LedgerService` and `LedgerServiceImpl` enforcing all double-entry rules:
  - Null/empty entry collections rejected with `IllegalArgumentException`
  - Invalid amounts (null, zero, negative) rejected with `InvalidLedgerEntryException` (422)
  - Missing DEBIT or CREDIT entries rejected with `UnbalancedLedgerException` (422)
  - Total debits must equal total credits; imbalance rejected with `UnbalancedLedgerException` (422)
- `GlobalExceptionHandler` extended with handlers for `InvalidLedgerEntryException` and
  `UnbalancedLedgerException`
- **No REST endpoints** — Phase 2 is a service and persistence layer only

**Verified result:**

```
mvn test
Tests run: 45, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

---

### Phase 3 — Event Store (completed)

Phase 3 introduced immutable financial history — the event-sourcing backbone of the ledger.
The following is implemented and fully tested:

- `EventType` enum with exactly five approved values: `ACCOUNT_CREATED`, `DEPOSIT`,
  `WITHDRAWAL`, `TRANSFER_DEBIT`, `TRANSFER_CREDIT`
- `Event` JPA entity — **intentionally immutable**: no setters, no update lifecycle;
  `occurred_at` is caller-supplied; `transaction` and `payload` are nullable
- PostgreSQL `events` table managed by Flyway migration `V4__Create_Events.sql`;
  deterministic ordering index on `(account_id, occurred_at, id)`
- `EventRepository` (Spring Data JPA) with deterministically ordered retrieval:
  `occurred_at ASC, id ASC` — see ADR-023
- `EventService` and `EventServiceImpl` with explicit null validation for `account`,
  `eventType`, and `occurredAt`; empty event collections returned normally; `EventNotFoundException`
  thrown only for a missing event ID
- `GlobalExceptionHandler` extended with a handler for `EventNotFoundException` (HTTP 404)
- **No REST endpoints** — Phase 3 is a service and persistence layer only
- **No balance reconstruction** — event replay logic belongs to Phase 6

**Verified result:**

```
mvn test
Tests run: 61, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

---

### Phase 4 — Deposit & Withdrawal Engine (completed)

Phase 4 introduced the first monetary operations. The following is implemented and
fully tested:

- `TransactionService` and `TransactionServiceImpl` implementing deposit and withdrawal
  workflows within a single `@Transactional` boundary
- Both operations produce a balanced double-entry ledger pair via `LedgerService`:
  - **Deposit:** `SYS-CASH` DEBIT / Customer CREDIT
  - **Withdrawal:** Customer DEBIT / `SYS-CASH` CREDIT
- Withdrawal balance is derived from `LedgerEntry` aggregation — no mutable balance column
- `InsufficientFundsException` (422) for withdrawals exceeding the derived balance
- `AccountNotEligibleForTransactionException` (422) for frozen or closed accounts
- Customer account row locked with `PESSIMISTIC_WRITE` for per-account serialization
  of concurrent monetary operations (see ADR-025)
- `SYS-CASH` system contra-account seeded by Flyway migration `V5__Seed_System_Account.sql`;
  isolated from all public Account APIs — all public access returns 404 (see ADR-024)
- `TransactionController` — two new REST endpoints:
  - `POST /accounts/{accountId}/deposit` (201 Created)
  - `POST /accounts/{accountId}/withdrawal` (201 Created)
- `TransactionResponse` DTO returned on success: `transactionId`, `referenceNumber`,
  `transactionType`, `status`, `accountId`, `amount`, `createdAt`
- `DEPOSIT` and `WITHDRAWAL` events recorded per operation; `Event.payload` remains `null`
- `GlobalExceptionHandler` extended with handlers for `InsufficientFundsException` and
  `AccountNotEligibleForTransactionException` (both 422)
- `SystemAccountConstants` — centralized constant for `SYS-CASH` identity

**Verified result:**

```
mvn clean test
Tests run: 85, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

---

### Phase 5 — Transfer Engine (completed)

Phase 5 introduced atomic customer-account transfers. The following is implemented and
fully tested:

- `POST /transfers` creates a completed `TRANSFER` transaction between two customer accounts
- Source account receives a `DEBIT`; destination account receives an equal `CREDIT`; no
  `SYS-CASH` entry participates
- Source/destination validation covers existence, exact `SYS-CASH` isolation, `ACTIVE` status,
  same-account rejection, valid amounts, and sufficient derived source balance
- Both customer accounts are locked with `PESSIMISTIC_WRITE` in ascending account-ID order,
  preventing opposite-direction lock-order inversion and serializing competing source debits
- Two immutable events are recorded in the same transaction: `TRANSFER_DEBIT` for the source
  account and `TRANSFER_CREDIT` for the destination account; both use a null payload
- `TransferRequest` and `TransferResponse` DTOs, `TransferController`, and
  `InvalidTransferException` (422) follow established API and error conventions
- No schema migration was required; existing transaction, ledger-entry, and event structures
  already support transfers

**Verified result:**

```
mvn clean test
Tests run: 108, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

---

### Phase 6 — Balance Reconstruction (completed)

Phase 6 implemented the internal service that derives customer-account balances by replaying
immutable event history and validating the corresponding double-entry ledger records:

- `BalanceReconstructionService` provides current and point-in-time operations:
  - `reconstructCurrentBalance(Long accountId)`
  - `reconstructBalanceAt(Long accountId, OffsetDateTime asOf)`
- `BalanceReconstructionServiceImpl` executes within a read-only transaction and validates that
  the account exists; `SYS-CASH` is explicitly excluded because it has no customer-balance
  semantics.
- Events are replayed in deterministic `occurredAt ASC, id ASC` order. `ACCOUNT_CREATED` is a
  non-monetary lifecycle event and has no balance effect.
- The service derives each effect from ledger entries: `CREDIT` increases a balance and `DEBIT`
  decreases it. Multiple matching entries for the same account and transaction are summed.
- Historical reconstruction includes events at the requested timestamp (`occurredAt <= asOf`)
  and returns zero when no monetary events precede it.
- Transactions and ledger entries are batch-loaded before replay, avoiding queries inside the
  per-event loop.
- Structural inconsistencies fail fast rather than returning a potentially incorrect balance:
  missing event transactions, missing referenced transactions, missing ledger entries, or no
  entry for the reconstructed account.
- No controller, DTO, public endpoint, schema migration, snapshot, or cache was added; balance
  reconstruction remains an internal capability for the Phase 7 Audit Module.

**Verified result:**

```
mvn clean test
Tests run: 126, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

See [ADR-027](docs/DECISIONS.md) and the [Phase 6 project-log entry](docs/PROJECT_LOG.md) for
the implementation rationale and full verification record.

---

### Phase 7 — Audit Module (completed)

Phase 7 delivered complete financial traceability through public read-only audit APIs:

- `AuditController` mapped to `/accounts/{accountId}/audit/*` exposing five endpoints:
  - `GET /events` — chronological account event timeline (`occurred_at ASC, id ASC`)
  - `GET /transactions` — financial transactions involving the account (ordered by event timeline occurrence)
  - `GET /ledger` — double-entry ledger entries affecting the account with transaction reference numbers
  - `GET /balance` — reconstructed current balance or historical point-in-time balance (`asOf` parameter)
  - `GET /trail` — event-by-event audit trail showing signed financial effect and cumulative running balance
- Financial effects are derived directly from underlying double-entry ledger entries (`CREDIT` increases,
  `DEBIT` decreases), never inferred solely from `EventType`
- Lifecycle events (`ACCOUNT_CREATED`) record `balanceChange = 0.00` and preserve running balance
- `SYS-CASH` system account is strictly isolated from all audit endpoints; queries return 404
- Constant $O(1)$ query complexity relative to history length via bulk batch loading
- Jakarta Validation on path variables (`@Positive`) and centralized error handling for malformed `asOf` timestamps
- Zero database migrations required; strictly read-only query surface
- 17 service unit tests + 10 controller MockMvc tests (27 new tests; 153 total)

**Verified result:**

```
mvn clean test
Tests run: 153, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

See [ADR-028](docs/DECISIONS.md) and the [Phase 7 project-log entry](docs/PROJECT_LOG.md) for
the implementation rationale and full verification record.

---

### Phase 8 — API Refinement (completed)

Phase 8 established production-grade pagination, sorting, filtering, and centralized parameter
validation across all collection endpoints in the system:

- `PagedResponse<T>` generic immutable record (`content`, `page`, `size`, `totalPages`, `totalElements`)
  standardizing collection response payloads across the API
- Centralized pagination constraints: `page >= 0` (default 0), `1 <= size <= 100` (default 20);
  enforced by `PaginationValidator`
- Centralized sorting allowlists and directions enforced by `SortValidator`
- Automatic deterministic secondary tie-breaker on `id` in the same requested direction, eliminating
  pagination drift
- `GET /accounts` pagination, filtering by `status` and `accountType`, and sorting allowlist
  (`createdAt`, `accountName`, `accountNumber` ONLY); `status` and `accountType` are filters only
- Four explicit derived query methods on `AccountRepository` excluding `SYS-CASH` without
  `JpaSpecificationExecutor`
- `GET /accounts/{accountId}/audit/events` pagination and sorting on `occurredAt` with deterministic
  tie-breaker (no event-type filter; presentation sorting decoupled from canonical event replay)
- `GET /accounts/{accountId}/audit/transactions` pagination in event-derived chronological order; unique
  transaction IDs derived from events, sliced in memory, and batch-loaded
- `GET /accounts/{accountId}/audit/ledger` pagination, sorting on `createdAt`, and optional `entryType`
  filter (`CREDIT`, `DEBIT`); transactions batch-loaded to eliminate N+1 queries
- Specialized `AuditTrailResponse` for `GET /accounts/{accountId}/audit/trail` retaining `finalBalance`,
  `asOf`, and pagination metadata; running balances are absolute and calculated after complete
  reconstruction before page slicing
- Valid out-of-range page requests return HTTP 200 with empty collections (`content: []` or `items: []`)
- Centralized exception handling in `GlobalExceptionHandler` mapping `InvalidPageParameterException` and
  `InvalidSortFieldException` to HTTP 400 Bad Request `ApiError` JSON
- 27 controller MockMvc tests + 5 service unit tests added (56 new tests; 209 total)

**Verified result:**

```
mvn clean test
Tests run: 209, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

See [ADR-029](docs/DECISIONS.md) and the [Phase 8 project-log entry](docs/PROJECT_LOG.md) for
the implementation rationale and full verification record.

---

### Phase 9 — Testing & Hardening (completed)

Phase 9 completed comprehensive verification, edge-case coverage, financial invariant validation, defensive boundary hardening, and concurrency stress testing:

- **P0 Core Financial Correctness**: Verified double-entry invariant ($\sum \text{debits} = \sum \text{credits}$) globally across database entries; verified exact transfer value conservation; verified customer/`SYS-CASH` deposit and withdrawal symmetry; verified balance reconstruction against independent event stream replay.
- **P1 API & Business-Rule Hardening**: Enforced rejection of fractional-cent monetary inputs (`@Digits(integer = 12, fraction = 2)`) returning HTTP 400; rigorously tested `SYS-CASH` isolation across all public endpoints (returning 404 on lookups, 422 on transfer attempts, and exclusion from listings and reconstruction); verified uniform `ApiError` responses for validation errors, malformed JSON, and domain exceptions.
- **LedgerService Defensive Validation**: Hardened `LedgerServiceImpl` to reject null transactions, null/empty entry lists, null entries, mismatched transaction references, null entry types, non-positive amounts, missing debit/credit entries, and imbalanced totals with specific domain exceptions before database interaction.
- **P2 Concurrency Hardening**: Validated pessimistic row-level locking (`SELECT ... FOR UPDATE`) and deterministic lock ordering under high concurrent thread load against real PostgreSQL; proved overdraft prevention under competing withdrawals, deadlock-free bidirectional transfers, exact balance conservation under interleaved deposits and withdrawals, and concurrent duplicate account rejection.
- **Integration Test Expansion**: Added dedicated integration tests against real PostgreSQL for Account, Ledger, Audit, and Transaction services (`AccountServiceIntegrationTest`, `LedgerServiceIntegrationTest`, `AuditServiceIntegrationTest`, `TransactionServiceSysCashIntegrationTest`).
- 35 new tests added (244 total tests across unit, integration, and controller layers).

**Verified result:**

```
mvn clean test
Tests run: 244, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

See the [Phase 9 project-log entry](docs/PROJECT_LOG.md) for the full verification record.

---

### Phase 10 — Backend v1.0 Release (completed)

Phase 10 finalized release readiness, code quality, and release metadata preparation for Backend v1.0:

- Completed comprehensive release-readiness audit across architecture, API contracts, schema, and tests (zero functional or blocking defects)
- Promoted Maven project version to `1.0.0` and OpenAPI documentation version to `v1.0`
- Centralized pagination constants in `PaginationValidator` to use `PaginationConstants.MAX_SIZE` as single source of truth
- Added curated OpenAPI / Swagger documentation annotations (`@Tag`, `@Operation`, `@ApiResponses`, `@Parameter`) to `TransactionController` for deposit and withdrawal endpoints
- Removed dead `Transaction.setStatus()` setter to enforce complete post-construction entity immutability
- Standardized `TransactionServiceImpl` to standard 4-space indentation
- Confirmed Flyway schema integrity (`V1`–`V5`) without modification
- Full test suite verified with zero failures

**Verified result:**

```
mvn clean test
Tests run: 244, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

---

## Frontend Status

**Frontend Phase F0 — Frontend Foundation** is complete.

Phase F0 established the frontend application scaffold, design system tokens, layout shell, routing
infrastructure, and centralized API client. The frontend is under active phased implementation;
application features are introduced incrementally across phases F1 through F5.

### Implemented in Phase F0

- **Application Scaffold & Tooling**: Initialized with Vite, React 19, TypeScript 5.8, ESLint 9, and Vitest 3.
- **Directory Structure**: Established clean architecture per `FRONTEND_ARCHITECTURE.md` (`src/features`, `src/components`, `src/api`, `src/utils`, `src/styles`, `src/routes`, `src/types`).
- **Design System Tokens**: CSS custom properties implemented in `src/styles/tokens.css` copied verbatim from `DESIGN.md` §30 (color palette, surfaces, borders, radius, spacing, shadows, transitions).
- **Typography & Reset**: Baseline typography loading Inter for UI copy and JetBrains Mono with tabular figures for monetary values, account numbers, and IDs, paired with a modern CSS reset (`reset.css`, `main.css`).
- **Responsive AppShell**: Layout components comprising `TopBar` (60px header), `Sidebar` (240px persistent desktop sidebar, off-canvas mobile drawer with hamburger toggle), and `PageContainer` (1200px max-width content cap).
- **Routing Infrastructure**: React Router v7 declarative route tree (`AppRoutes`, `RootLayout`, `AccountLayout` shell) with focus management shifting keyboard focus to `<main id="main-content">` on navigation.
- **Placeholder Views**: Minimal placeholder routes for `/dashboard`, `/accounts`, and a 404 catch-all (`NotFoundPage`).
- **Centralized API Client**: Native `fetch` wrapper (`apiClient`) with automatic query parameter serialization (skipping `null`/`undefined`), HTTP 204 handling, and `ApiError` normalization mapped from backend error bodies.
- **Endpoints Registry**: Centralized `ENDPOINTS` registry matching backend Spring Boot controller mappings with **zero `/api/v1` prefix**.
- **Development Proxy**: Vite dev server configured to proxy `/accounts` and `/transfers` to `http://localhost:8080` with SPA HTML navigation bypass.
- **State Management & Caching**: TanStack React Query (`QueryClientProvider`) configured with baseline caching (30s stale time, 5min garbage collection).
- **Money Value Object**: Arbitrary-precision decimal arithmetic backed by `decimal.js` (20 decimal digits of precision, `ROUND_HALF_UP` rounding), comparison helpers, localized display formatting, and exact 2-decimal-place outbound wire serialization (`toWireString()`).
- **Date Utilities**: ISO-8601 UTC string parsing and localized presentation formatting (`src/utils/date.ts`).
- **Testing Foundation**: Vitest with jsdom environment, React Testing Library, and custom DOM matchers.
- **Accessibility Foundation**: Semantic HTML5 landmarks (`<header>`, `<nav>`, `<main id="main-content">`), `.skip-link`, and a 2px primary focus ring.

### What Is NOT Implemented Yet (Future Phases F1–F5)

The frontend is in its foundation phase. In accordance with the phased project roadmap, the following
features are explicitly deferred to future phases and are **not yet implemented**:

- Account directory, account detail, account creation modal, and freeze/activate/close lifecycle UI (Phase F1)
- Deposit, withdrawal, and transfer workflows and forms (Phase F2)
- Transaction lists, ledger entry tables, and event stream history (Phase F3)
- Point-in-time balance reconstruction UI and event-by-event audit trail views (Phase F4)
- Live dashboard portfolio metrics and aggregate financial statistics (Phases F1 / F5)

Placeholder routes contain no business logic or data fetching.

### Verification Summary

Frontend Phase F0 passes all quality gates:

- **Automated Tests:** `npm run test` — **64/64 passed** (Money: 34, Date: 18, API client: 12)
- **TypeScript Typecheck:** `npm run typecheck` (`tsc --noEmit`) and `tsc -b` — **PASS** (0 errors)
- **Linting:** `npm run lint` (`eslint . --max-warnings 0`) — **PASS** (0 errors, 0 warnings)
- **Production Build:** `npm run build` (`tsc -b && vite build`) — **PASS** (optimized static bundle)
- **Browser Verification:** Completed via Chrome DevTools MCP (verified app boot, semantic landmarks, AppShell layout, desktop 1280px and mobile 390px responsive behavior, route transitions, zero console errors, zero `/api/v1` calls, and keyboard focus rings).

### Monetary Wire-Format Finding (ADR-030)

During Phase F0 verification against the running backend, live HTTP responses were inspected across
monetary endpoints. The current backend (v1.0.0) serializes monetary `BigDecimal` fields as **unquoted
JSON numbers** (e.g. `"amount": 100.50`).

In JavaScript, unquoted numeric literals are parsed by the browser runtime's native `JSON.parse` into
IEEE-754 double-precision floats, which provide 53 bits of precision (~15–17 decimal digits). Values
exceeding this limit will experience precision loss before frontend application code runs. While the
frontend `Money` value object uses arbitrary-precision `decimal.js` and handles number inputs
defensively, calling `String(number)` cannot recover precision already lost at the JSON parse boundary.

This finding and a future recommendation for backend Jackson serialization hardening
(`@JsonSerialize(using = ToStringSerializer.class)`) are formally documented in
[ADR-030](docs/DECISIONS.md). Backend v1.0.0 remains frozen and untouched during frontend implementation.

---

## Architecture

```
Presentation  →  AccountController
               →  TransactionController
               →  TransferController
               →  AuditController
Application   →  AccountService / AccountServiceImpl
               →  TransactionService / TransactionServiceImpl
               →  LedgerService / LedgerServiceImpl
               →  EventService / EventServiceImpl
               →  BalanceReconstructionService / BalanceReconstructionServiceImpl
               →  AuditService / AuditServiceImpl
Domain        →  Account, Transaction, LedgerEntry, Event entities, enums, DTOs, exceptions
Persistence   →  AccountRepository, TransactionRepository, LedgerEntryRepository, EventRepository
Database      →  PostgreSQL (schema managed by Flyway)
```

- **No business logic in controllers.** Controllers handle HTTP concerns only.
- **No persistence logic in services.** Services delegate all database access to repositories.
- **Entities are never exposed directly** through the REST layer; all responses use DTOs.
- **Constructor injection** is used throughout.

Financial history is immutable and authoritative. Balances are derived from ordered events and
their corresponding ledger entries, without a mutable balance column. The Phase 7 Audit Module
exposes complete historical traceability and event-by-event balance explanations to clients.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the complete architectural specification.

### Frontend Architecture

```
User Interface  →  AppShell (TopBar, Sidebar, PageContainer)
                →  Feature Views (Dashboard, Accounts, etc.)
State & Data    →  TanStack React Query (server-state caching)
                →  React Router v7 (declarative routing & focus management)
Domain / Utils  →  Money (decimal.js arbitrary-precision value object)
                →  Date formatting & validation helpers
Infrastructure  →  apiClient (fetch wrapper with ApiError normalization)
                →  ENDPOINTS (exact backend controller paths, no /api/v1)
Network         →  Vite Dev Proxy (dev) / Reverse Proxy (prod) → Backend REST API
```

See [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md) and [docs/DESIGN.md](docs/DESIGN.md)
for the complete frontend architectural and design system specifications.

---

## Technology Stack

### Backend

| Component | Technology | Version |
|-----------|------------|---------|
| Language | Java | 21 (LTS) |
| Framework | Spring Boot | 3.5.16 |
| Build Tool | Maven | 1.0.0 |
| Database | PostgreSQL | — |
| ORM | Spring Data JPA / Hibernate | — |
| Schema Migration | Flyway | — |
| Validation | Jakarta Validation | — |
| API Documentation | Swagger / OpenAPI 3 (springdoc) | v1.0 (springdoc 2.8.13) |
| Logging | SLF4J / Logback | — |
| Testing | JUnit 5 / Mockito / Spring Boot Test | — |

### Frontend (Phase F0 Baseline)

| Component | Technology | Version |
|-----------|------------|---------|
| UI Framework | React | ^19.1.0 |
| Language | TypeScript | ~5.8.3 |
| Build Tool / Dev Server | Vite | ^6.3.5 |
| Routing | React Router | ^7.6.3 |
| Server State Caching | TanStack React Query | ^5.81.5 |
| Monetary Math | decimal.js | ^10.5.0 |
| Test Runner | Vitest | ^3.2.4 |
| Component Testing | React Testing Library | ^16.3.0 |
| Test DOM Environment | jsdom | ^26.1.0 |
| Linter | ESLint (Flat Config) | ^9.30.0 |

---

## Current API

All responses conform to the standard `ApiError` error structure on failure.

### Account Endpoints (Phase 1 & Phase 8 Refinement)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/accounts` | Create a new account (returns 201) |
| `GET` | `/accounts` | Paginated list of accounts with filtering (`status`, `accountType`) and sorting (`createdAt`, `accountName`, `accountNumber`; excludes `SYS-CASH`) |
| `GET` | `/accounts/{id}` | Get a single account by internal ID |
| `GET` | `/accounts/by-number/{accountNumber}` | Get a single account by business account number |
| `PATCH` | `/accounts/{id}/freeze` | Transition account from `ACTIVE` to `FROZEN` |
| `PATCH` | `/accounts/{id}/activate` | Transition account from `FROZEN` to `ACTIVE` |
| `PATCH` | `/accounts/{id}/close` | Transition account to `CLOSED` (terminal state) |

### Transaction Endpoints (Phases 4–5)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/accounts/{accountId}/deposit` | Deposit funds into a customer account (returns 201) |
| `POST` | `/accounts/{accountId}/withdrawal` | Withdraw funds from a customer account (returns 201) |
| `POST` | `/transfers` | Transfer funds between customer accounts (returns 201) |

### Audit Endpoints (Phase 7 & Phase 8 Refinement)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/accounts/{accountId}/audit/events` | Paginated chronological event history (sortBy: `occurredAt`, direction: `asc`/`desc`) |
| `GET` | `/accounts/{accountId}/audit/transactions` | Paginated financial transactions in event-derived order |
| `GET` | `/accounts/{accountId}/audit/ledger` | Paginated ledger entries with reference numbers (sortBy: `createdAt`, optional `entryType` filter) |
| `GET` | `/accounts/{accountId}/audit/balance` | Reconstructed balance (optional `asOf` ISO-8601 query param) |
| `GET` | `/accounts/{accountId}/audit/trail` | Paginated event-by-event balance explanation with running balance (`asOf`, `page`, `size`) |

Interactive API documentation is available at `/swagger-ui.html` when the application is
running.

---

## Database

- **PostgreSQL** is the relational database.
- **Flyway** is the sole schema authority. Hibernate does not create, modify, or drop schema
  objects.
- **Phase 1 migration:** `V1__Create_Accounts.sql` — creates the `accounts` table.
- **Phase 2 migrations:**
  - `V2__Create_Transactions.sql` — creates the `transactions` table with unique constraint
    on `reference_number` and check constraints on `transaction_type` and `status`.
  - `V3__Create_Ledger_Entries.sql` — creates the `ledger_entries` table with `NUMERIC(19,2)`
    monetary precision, foreign keys to `transactions` and `accounts` (both `ON DELETE RESTRICT`),
    check constraints on `entry_type` and `amount`, and indexes on `transaction_id` and `account_id`.
- **Phase 3 migration:** `V4__Create_Events.sql` — creates the `events` table with a CHECK
  constraint on `event_type`, foreign keys to `accounts` and `transactions`, and indexes
  supporting deterministic chronological event retrieval.
- **Phase 4 migration:** `V5__Seed_System_Account.sql` — seeds the internal `SYS-CASH`
  system contra-account. No DDL changes; `ddl-auto=validate` compatibility preserved.
- **Phase 6:** no schema migration was required. The reconstruction service replays the existing
  event, transaction, and ledger-entry records.
- `spring.jpa.hibernate.ddl-auto=validate` — Hibernate validates `Account`, `Transaction`,
  `LedgerEntry`, and `Event` entity mappings against the live schema on every startup.
- Current Flyway schema version: **5**.

See [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) for the complete schema specification.

---

## Local Development

### Prerequisites

- Java 21
- Maven
- PostgreSQL (running locally)

### Environment Variables

This project reads database credentials exclusively from environment variables. Set the
following before starting the application:

```bash
LEDGER_DB_URL=jdbc:postgresql://localhost:5432/ledger_db
LEDGER_DB_USERNAME=<your-db-username>
LEDGER_DB_PASSWORD=<your-db-password>
```

The `LEDGER_DB_*` prefix is intentional — it avoids conflicts with environment variables used
by other local projects (see [ADR-017](docs/DECISIONS.md)).

### Compile

```bash
cd backend
mvn clean compile
```

### Run

```bash
cd backend
mvn spring-boot:run
```

The application starts on `http://localhost:8080`. Flyway applies any pending migrations
automatically on startup.

### Test

```bash
cd backend
mvn clean test
```

### Frontend Development

#### Prerequisites

- Node.js 20+
- npm 10+

#### Setup & Install

```bash
cd frontend
npm install
```

#### Run Development Server

```bash
cd frontend
npm run dev
```

The frontend development server starts at `http://localhost:5173`. In development, Vite
automatically proxies API requests (`/accounts`, `/transfers`) to the backend running at
`http://localhost:8080`.

#### Run Tests

```bash
cd frontend
npm run test
```

#### Run Typecheck

```bash
cd frontend
npm run typecheck
```

#### Run Linter

```bash
cd frontend
npm run lint
```

#### Build Production Bundle

```bash
cd frontend
npm run build
```

---

## Testing

Full backend test suite (`mvn clean test`):

| Test class | Type | Tests |
|---|---|---|
| `AccountServiceImplTest` | Unit (Mockito, no DB) | 22 |
| `AccountControllerTest` | API layer (MockMvc + `GlobalExceptionHandler`) | 27 |
| `AccountServiceIntegrationTest` | Integration (Spring Boot, PostgreSQL required) | 1 |
| `LedgerServiceImplTest` | Unit (Mockito, no DB) | 17 |
| `LedgerServiceIntegrationTest` | Integration (Spring Boot, PostgreSQL required) | 5 |
| `EventServiceImplTest` | Unit (Mockito, no DB) | 16 |
| `TransactionServiceImplTest` | Unit (Mockito, no DB) | 22 |
| `TransactionControllerTest` | API layer (MockMvc + `GlobalExceptionHandler`) | 10 |
| `TransferControllerTest` | API layer (MockMvc + `GlobalExceptionHandler`) | 9 |
| `TransactionServiceIntegrationTest` | Integration (Spring Boot, PostgreSQL required) | 15 |
| `TransactionServiceSysCashIntegrationTest` | Integration (Spring Boot, PostgreSQL required) | 4 |
| `BalanceReconstructionServiceImplTest` | Unit (Mockito, no DB) | 13 |
| `BalanceReconstructionServiceIntegrationTest` | Integration (Spring Boot, PostgreSQL required) | 8 |
| `AuditServiceImplTest` | Unit (Mockito, no DB) | 33 |
| `AuditControllerTest` | API layer (MockMvc + `GlobalExceptionHandler`) | 32 |
| `AuditServiceIntegrationTest` | Integration (Spring Boot, PostgreSQL required) | 9 |
| `LedgerApplicationTests` | Context smoke test (full Spring Boot, PostgreSQL required) | 1 |
| **Total** | | **244** |

**Verified result:**

```
mvn clean test
Tests run: 244, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

### Frontend Test Suite (`npm run test`)

Vitest test suite executing in jsdom:

| Test Suite | Module | Tests |
|---|---|---|
| `money.test.ts` | Arbitrary-precision decimal value object & formatting | 34 |
| `date.test.ts` | UTC parsing, presentation formatting & asOf normalization | 18 |
| `client.test.ts` | API client, query param serialization & ApiError handling | 12 |
| **Total** | | **64** |

**Verified result:**

```text
Test Files  3 passed (3)
     Tests  64 passed (64)
```

---

## Repository Structure

```
event-sourced-ledger/
├── backend/
│   ├── pom.xml                          # Maven project descriptor
│   └── src/
│       ├── main/
│       │   ├── java/com/ledger/         # Application source (account, balance, event,
│       │   │                             # ledger, and transaction modules)
│       │   └── resources/
│       │       ├── application.properties
│       │       ├── logback-spring.xml
│       │       └── db/migration/        # Flyway SQL migrations
│       └── test/
│           └── java/com/ledger/         # Test source
├── frontend/
│   ├── package.json                     # NPM project descriptor & scripts
│   ├── vite.config.ts                   # Vite build & proxy configuration
│   ├── vitest.config.ts                 # Vitest test runner configuration
│   ├── tsconfig.json                    # Solution-style TypeScript configuration
│   ├── public/                          # Static assets (favicons, SVG icons)
│   └── src/
│       ├── api/                         # Centralized API client & endpoints registry
│       ├── components/                  # Shared UI components & layout shell
│       ├── features/                    # Feature domain modules (accounts, transactions, audit)
│       ├── routes/                      # Route tree & layout routing
│       ├── styles/                      # Design system tokens, typography & reset
│       ├── types/                       # Shared TypeScript definitions
│       └── utils/                       # Money value object & date utilities
├── docs/                                # Project documentation
│   └── ai/AI_DEVELOPMENT_ENVIRONMENT.md # AI-assisted development configuration
├── .gitignore
└── README.md                            # This file
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [PRD](docs/PRD.md) | Business objectives, problem statement, and success criteria |
| [TRD](docs/TRD.md) | Technology stack, dependencies, and technical requirements |
| [Frontend PRD](docs/FRONTEND_PRD.md) | Frontend user journeys, view requirements, and success metrics |
| [Frontend TRD](docs/FRONTEND_TRD.md) | Frontend technical baseline, dependencies, and bundle budgets |
| [Architecture](docs/ARCHITECTURE.md) | Backend system architecture, layers, and design principles |
| [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md) | Frontend component hierarchy, state management, and routing |
| [Design System](docs/DESIGN.md) | Visual language, design tokens, color palette, and accessibility |
| [Database Design](docs/DATABASE_DESIGN.md) | Schema design, entities, constraints, and migration strategy |
| [API Guidelines](docs/API_GUIDELINES.md) | REST conventions, request/response format, and error handling |
| [Coding Standards](docs/CODING_STANDARDS.md) | Code style, structure, and implementation guidelines |
| [Project Roadmap](docs/PROJECT_ROADMAP.md) | Phased implementation plan and milestones (Phases 0–10 & F0–F5) |
| [Architecture Decisions](docs/DECISIONS.md) | Architecture Decision Records (ADR-001 through ADR-030) |
| [Project Log](docs/PROJECT_LOG.md) | Chronological record of completed milestones |

---

## Development Roadmap

### Backend (v1.0.0 Complete)

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Project Foundation | **COMPLETED** |
| Phase 1 | Account Module | **COMPLETED** |
| Phase 2 | Ledger Foundation | **COMPLETED** |
| Phase 3 | Event Store | **COMPLETED** |
| Phase 4 | Deposit & Withdrawal Engine | **COMPLETED** |
| Phase 5 | Transfer Engine | **COMPLETED** |
| Phase 6 | Balance Reconstruction | **COMPLETED** (2026-09-08) |
| Phase 7 | Audit Module | **COMPLETED** (2026-09-13) |
| Phase 8 | API Refinement | **COMPLETED** (2026-09-19) |
| Phase 9 | Testing & Hardening | **COMPLETED** (2026-09-21) |
| Phase 10 | Backend v1.0 Release | **COMPLETED** (2026-09-21) |

### Frontend (Phased Implementation In Progress)

| Phase | Description | Status | Target |
|-------|-------------|--------|--------|
| Phase F0 | Frontend Foundation | **COMPLETED** (2026-09-23) | Foundation Shell & Tooling |
| Phase F1 | Account Directory, Overview, Creation & Lifecycle | **UPCOMING** | Account Management UI |
| Phase F2 | Deposit, Withdrawal & Transfer Workflows | **UPCOMING** | Transaction Forms & Modals |
| Phase F3 | Transactions, Ledger Entries & Event Stream History | **UPCOMING** | History & Journal Tables |
| Phase F4 | Audit Trail & Balance Reconstruction Views | **UPCOMING** | Reconstructed Timeline & Trail |
| Phase F5 | Dashboard Metrics, Polish & Frontend Release Readiness | **UPCOMING** | Final Polish & Production Readiness |

See [docs/PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md) for the full phased plan and deliverables.

---

## Core Concepts

The following principles define the project's architecture and are progressively implemented
across the development phases.

**Event Sourcing** — Every financial action is persisted as an immutable event. No event is
ever updated or deleted. Current account state is derived by replaying the event history.

**Double-Entry Accounting** — Every transaction generates matching debit and credit ledger
entries. The ledger remains balanced at all times.

**Immutable History** — Financial records are append-only. Historical data is preserved
indefinitely and can be replayed to reconstruct any past state.

**Derived Balances** — Account balances are never stored as a primary value. They are computed
from the accumulated ledger history on demand.

**Schema Versioning** — All database schema changes are managed exclusively through Flyway
migration scripts. Hibernate validates against the migrated schema; it does not manage schema.

---

## Development Philosophy

This project follows:

- **Documentation-first development** — requirements and decisions are documented before
  implementation begins
- **Architecture-first decisions** — significant technical choices are recorded as ADRs in
  [docs/DECISIONS.md](docs/DECISIONS.md)
- **Incremental phases** — each phase has a defined scope; no phase begins before the previous
  one is complete and tested
- **Correctness before convenience** — financial correctness and data integrity take priority
  over performance optimisations
- **Tests before phase completion** — every phase must pass its full test suite before the
  next phase begins
- **Synchronized documentation** — the Project Log and Roadmap are updated as each phase
  completes

---

## AI-Assisted Development

This project uses an AI-assisted development workflow. The configuration and guidelines for AI
agents operating within this repository are documented in
[docs/ai/AI_DEVELOPMENT_ENVIRONMENT.md](docs/ai/AI_DEVELOPMENT_ENVIRONMENT.md).
