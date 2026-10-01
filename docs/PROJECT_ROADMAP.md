# Project Roadmap

**Project Name:** Event-Sourced Ledger (Double-Entry Bank Core)  
**Version:** 1.1.0 (Full-Stack Source Checkpoint)  
**Current Status:**  
- **Backend (Phases 0–10):** COMPLETED — v1.0.0 RELEASED (2026-09-21)  
- **Frontend Planning & Documentation:** COMPLETED (2026-09-23)  
- **Frontend Phase F0 — Frontend Foundation:** COMPLETED (2026-09-23)  
- **Frontend Phase F1 — Account Experience:** COMPLETED (2026-09-23)  
- **Frontend Phase F2 — Monetary Operations:** COMPLETED (2026-09-27)  
- **Frontend Phase F3 — Financial History:** COMPLETED (2026-09-28)  
- **Frontend Phase F4 — Audit Experience:** COMPLETED (2026-09-29)  
- **Frontend Phase F5 — Dashboard & Release Readiness:** COMPLETED (2026-09-30)  
- **Post-F5 Frontend Enhancements:** COMPLETED (2026-09-30)  
  - Collapsible Desktop Sidebar (240px / 64px with persistence)  
  - Application-Wide Light/Dark Theme System (tokenized with persistence)  
  - Public Product Landing Page (`/`) with Dedicated Public Layout  
  - Internal Application Header Brand Navigation to Landing Page (`/`)  
- **Full-Stack Source Checkpoint (`v1.1.0`):** COMPLETED & TAGGED (2026-09-30)  
- **Production Deployment Roadmap (Phases D0–D8):** IN PROGRESS — Phases D0–D5 COMPLETED (2026-10-01)  
- **Next Phase (Phase D6):** Deploy Frontend to Vercel (READY FOR EXECUTION)  
- **Future Enhancements:** DEFERRED / POST-DEPLOYMENT  

---

# 1. Purpose

This document defines the master implementation roadmap for the Event-Sourced Ledger project.

Unlike the Product Requirements Document (PRD), which defines **what** should be built, this roadmap defines **when** and **in what order** features should be implemented.

The project intentionally followed a **backend-first** methodology:
1. Financial domain correctness and double-entry invariants were established first.
2. Backend v1.0.0 was fully stabilized, tested, and released.
3. Frontend planning and architectural specifications were finalized.
4. Frontend implementation proceeded against the frozen, authoritative backend contract across Phases F0–F5.
5. Post-F5 product-polish enhancements established desktop workspace flexibility, visual theme personalization, and public architectural positioning.
6. Full-stack source checkpoint was established, verified, and tagged as `v1.1.0`.
7. Production deployment proceeds across Phases D0–D8, establishing live cloud infrastructure (Render + Vercel) while strictly preserving backend authority and double-entry invariants.
8. Future enterprise capabilities remain strictly isolated from current deliverables.

---

# 2. Roadmap Philosophy

The project adheres to these core architectural and execution principles:

- **Build from the domain outward**: Validate financial models before building UI presentation.
- **Prioritize correctness before convenience**: Invariant safety and audit integrity take precedence over speed.
- **Validate business rules before building UI**: User interfaces reflect authoritative server state; they do not calculate or synthesize balances.
- **Contract-first frontend delivery**: The frontend is built to consume the frozen backend v1.0.0 REST API without altering backend behavior or inventing endpoints.
- **Complete one milestone before beginning the next**: Every phase is independently testable, documented, and verifiable before proceeding.
- **Operational and domain separation**: Cloud deployment and containerization are operational capabilities designed to host and expose the verified full-stack system without altering financial domain logic, accounting invariants, or server authority.

---

# 3. Current Scope & Project Status

### 3.1 What is Covered
- **Backend Core**: Event store, double-entry ledger, balance reconstruction, audit trail, pagination/sorting/filtering, pessimistic row locking, and REST APIs (**COMPLETED v1.0.0**).
- **Frontend Planning**: Frozen PRD, TRD, Design System tokens, and Frontend Architecture (**COMPLETED**).
- **Frontend Implementation**: Phase F0 (Frontend Foundation) COMPLETED (2026-09-23); Phase F1 (Account Experience) COMPLETED (2026-09-23); Phase F2 (Monetary Operations) COMPLETED (2026-09-27); Phase F3 (Financial History) COMPLETED (2026-09-28); Phase F4 (Audit Experience) COMPLETED (2026-09-29); Phase F5 (Dashboard & Release Readiness) COMPLETED (2026-09-30).
- **Post-F5 Frontend Enhancements**: Collapsible desktop sidebar, application-wide dark mode, public product landing page at `/`, and internal application header brand navigation to `/` (**COMPLETED 2026-09-30**).
- **Full-Stack Source Checkpoint**: Complete pre-deployment full-stack codebase tagged and pushed as `v1.1.0` (**COMPLETED 2026-09-30**).
- **Production Deployment (Phases D0–D8)**: Production cloud deployment to Render (PostgreSQL database & Dockerized Spring Boot backend) and Vercel (React + TypeScript + Vite frontend) (**READY FOR EXECUTION**).

### 3.2 What is Intentionally Deferred (Post-v1.0 / Post-Deployment)
- User authentication and Role-Based Access Control (RBAC).
- Global transaction/ledger search and exploratory analytics.
- Snapshotting, CQRS, and Kafka event streaming.
- Multi-currency support and distributed idempotency keys.
- Containerization (Docker) and automated CI/CD deployment pipelines.  
  *(Historical scope note: Docker containerization was originally deferred from the v1.0 backend milestone. As documented in Section 10, single-container Docker packaging is now formally adopted specifically as the operational runtime packaging for Render backend deployment in Phase D2. Multi-container orchestration and automated CI/CD pipelines remain deferred to subsequent phases.)*

---

# 4. Backend Development Roadmap (Historical Record)

---

## Phase 0 — Project Foundation

**Status: COMPLETED — 2026-08-10**

### Objective
Establish the project foundation.

### Deliverables
- Spring Boot project setup
- Maven configuration
- PostgreSQL configuration
- Flyway configuration
- Package structure
- Logging configuration
- Global exception handling
- Validation setup
- Swagger/OpenAPI
- Initial project documentation

### Success Criteria
Project starts successfully and development environment is fully operational.

---

## Phase 1 — Account Module

**Status: COMPLETED — 2026-08-12**

### Objective
Introduce the concept of financial accounts.

### Deliverables
- Account entity
- Account repository
- Account service
- Account APIs
- Account validation
- Account lifecycle management

### Success Criteria
Accounts can be created, retrieved, and managed successfully.

---

## Phase 2 — Ledger Foundation

**Status: COMPLETED — 2026-08-13**

### Objective
Build the accounting foundation.

### Deliverables
- Transaction model
- Ledger entry model
- Debit/Credit representation
- Double-entry rules
- Financial invariants

### Success Criteria
The application correctly models double-entry bookkeeping.

---

## Phase 3 — Event Store

**Status: COMPLETED — 2026-09-03**

### Objective
Introduce immutable financial history.

### Deliverables
- Event entity
- Event persistence
- Event recording
- Event retrieval
- Event replay foundation

### Success Criteria
Every financial action generates immutable events.

---

## Phase 4 — Deposit & Withdrawal Engine

**Status: COMPLETED — 2026-09-06**

### Objective
Implement basic monetary operations.

### Deliverables
- Deposit workflow
- Withdrawal workflow
- Double-entry ledger generation (SYS-CASH contra-account)
- Withdrawal balance validation from ledger history
- Per-account pessimistic row locking
- Event creation (DEPOSIT / WITHDRAWAL)
- SYS-CASH system contra-account seeded and isolated from public APIs

### Success Criteria
Deposits and withdrawals update ledger history correctly, maintain double-entry
balance invariants, and are protected against concurrent overdrafts via
per-account pessimistic row locking.

`mvn clean test` — **85 tests, 0 failures, BUILD SUCCESS**

---

## Phase 5 — Transfer Engine

**Status: COMPLETED — 2026-09-07**

### Objective
Implement atomic account-to-account transfers.

### Deliverables
- Transfer workflow (`POST /transfers`, `TransferController`, `TransferRequest`, `TransferResponse`)
- Debit generation (source account receives DEBIT)
- Credit generation (destination account receives equal CREDIT)
- Customer-to-customer double-entry ledger generation (no SYS-CASH participation)
- Business validation (existence, eligibility, SYS-CASH isolation, same-account rejection)
- Derived balance validation for source account
- Deterministic ascending account-ID pessimistic row locking and role restoration
- Event creation (`TRANSFER_DEBIT` and `TRANSFER_CREDIT` with null payload)
- Atomic transaction management with full rollback on failure

### Success Criteria
Transfers satisfy all double-entry accounting rules, execute atomically, eliminate
deadlocks under concurrent opposite-direction operations, and protect against
concurrent double-spending.

`mvn clean test` — **108 tests, 0 failures, BUILD SUCCESS**

---

## Phase 6 — Balance Reconstruction

**Status: COMPLETED — 2026-09-08**

### Objective
Derive account balances from financial history.

### Deliverables
- Event replay
- Ledger replay
- Balance calculation
- Historical balance computation

### Success Criteria
Balances can always be reconstructed from stored history.

`mvn clean test` — **126 tests, 0 failures, BUILD SUCCESS**

---

## Phase 7 — Audit Module

**Status: COMPLETED — 2026-09-13**

### Objective
Provide complete financial traceability.

### Deliverables
- Audit REST endpoints (`/accounts/{accountId}/audit/*`)
- Account event history timeline
- Account transaction history (event-derived ordering)
- Account ledger entry history
- Current and historical balance reconstruction (`asOf` parameter)
- Account audit trail with per-event financial effect and cumulative running balance
- Public API boundary enforcement with consistent `SYS-CASH` isolation (404)
- Constant-query batch loading ($O(1)$ relative to history length)

### Success Criteria
Every balance can be fully explained through historical events.

`mvn clean test` — **153 tests, 0 failures, BUILD SUCCESS**

---

## Phase 8 — API Refinement

**Status: COMPLETED — 2026-09-19**

### Objective
Improve API quality, predictability, and safety through deterministic pagination, safe sorting, dynamic filtering, and centralized validation.

### Deliverables
- Generic `PagedResponse<T>` pagination DTO (`content`, `page`, `size`, `totalPages`, `totalElements`)
- Centralized `PaginationConstants` (`DEFAULT_PAGE = 0`, `DEFAULT_SIZE = 20`, `MAX_SIZE = 100`)
- Centralized `PaginationValidator` (`page >= 0`, `1 <= size <= 100`)
- Centralized `SortValidator` with strict sort allowlists and automatic deterministic secondary `id` tie-breaker
- Account API pagination, filtering by `status` and `accountType`, and sorting allowlist (`createdAt`, `accountName`, `accountNumber` ONLY)
- Four explicit derived query methods in `AccountRepository` excluding `SYS-CASH` without `JpaSpecificationExecutor`
- Event history pagination and sorting on `occurredAt` with deterministic tie-breaker (no event-type filter)
- Transaction history pagination derived from canonical event order with unique transaction count and batch loading
- Audit ledger history pagination, sorting on `createdAt`, and optional `entryType` filter
- Audit trail pagination over fully reconstructed history with absolute running balances and `finalBalance` retention
- Centralized validation exceptions (`InvalidPageParameterException`, `InvalidSortFieldException`) returning standard `ApiError` 400

### Success Criteria
All collection endpoints support deterministic, drift-free pagination, bounded sorting, and filtering while preserving double-entry accounting invariants and event-derived reconstruction.

`mvn clean test` — **209 tests, 0 failures, BUILD SUCCESS**

---

## Phase 9 — Testing & Hardening

**Status: COMPLETED — 2026-09-21**

### Objective
Improve reliability, financial correctness, defensive validation, and concurrency safety.

### Deliverables
- P0: Core financial invariant verification (double-entry equilibrium, value conservation, deposit/withdrawal symmetry, replay parity)
- P1: REST API validation & business rule hardening (fractional cents rejection, error mapping uniformity, strict SYS-CASH isolation)
- Defensive validation at `LedgerService` boundary (transaction nullity, collection integrity, element reference match, debit/credit presence and balance)
- P2: Concurrency & thread safety verification (concurrent withdrawals with overdraft prevention, concurrent deposits, bidirectional deadlock-free transfers, mixed operations)
- Integration test suite expansion (`AccountServiceIntegrationTest`, `LedgerServiceIntegrationTest`, `AuditServiceIntegrationTest`, `TransactionServiceSysCashIntegrationTest`)
- Technical documentation updates

### Success Criteria
All critical financial workflows, accounting invariants, defensive service boundaries, and concurrent transaction execution are comprehensively tested against real PostgreSQL persistence.

`mvn clean test` — **244 tests, 0 failures, BUILD SUCCESS**

---

## Phase 10 — Backend v1.0 Release

**Status: COMPLETED — 2026-09-21**

### Objective
Prepare the first stable backend release.

### Deliverables
- Release-readiness audit completed across architecture, schema, APIs, and docs
- Code-quality cleanup (pom.xml version 1.0.0, OpenAPI version v1.0, centralized pagination constants, Transaction Swagger docs, dead setStatus removal, service indentation standardization)
- Database migration verification (Flyway V1–V5 verified, ddl-auto=validate compliant)
- Release-readiness verification completed
- Backend v1.0 release preparation completed

### Success Criteria
Backend reaches production-quality standards.

`mvn clean test` — **244 tests, 0 failures, BUILD SUCCESS**

---

# 5. Backend Milestones Summary

| Milestone | Outcome | Status | Completed Date |
| :--- | :--- | :--- | :--- |
| **M1** | Project Foundation Complete | COMPLETED | 2026-08-10 |
| **M2** | Account Module Complete | COMPLETED | 2026-08-12 |
| **M3** | Ledger Engine Complete | COMPLETED | 2026-08-13 |
| **M4** | Event Store Complete | COMPLETED | 2026-09-03 |
| **M5** | Monetary Operations Complete | COMPLETED | 2026-09-06 |
| **M6** | Transfer Engine Complete | COMPLETED | 2026-09-07 |
| **M7** | Balance Replay Complete | COMPLETED | 2026-09-08 |
| **M8** | Audit Module Complete | COMPLETED | 2026-09-13 |
| **M9** | Stable REST API Complete | COMPLETED | 2026-09-19 |
| **M10** | Backend v1.0.0 Released (244 tests, 0 failures) | COMPLETED | 2026-09-21 |

---

# 6. Frontend Planning & Documentation Milestone

**Status: COMPLETED — 2026-09-23**

Prior to initializing frontend code, the frontend product requirements, technical constraints, visual design system, and implementation architecture were formally analyzed, cross-referenced against the backend source, and finalized:

| Document | Authority & Scope | Status |
| :--- | :--- | :--- |
| [`docs/FRONTEND_PRD.md`](file:///d:/PROJECTS/Event%20Sourced%20Ledger/docs/FRONTEND_PRD.md) | **WHAT the frontend must do**: Product capabilities, account-centric navigation model, supported views, workflows, and strict capability matrices. | Frozen v1.0.0 |
| [`docs/FRONTEND_TRD.md`](file:///d:/PROJECTS/Event%20Sourced%20Ledger/docs/FRONTEND_TRD.md) | **WHAT technical conditions must be satisfied**: Technical constraints, server authority, decimal safety, open wire-format boundaries, accessibility, and testing specifications. | Finalized Draft |
| [`docs/DESIGN.md`](file:///d:/PROJECTS/Event%20Sourced%20Ledger/docs/DESIGN.md) | **VISUAL & PRODUCT LANGUAGE authority**: Design principles, color system, typography (Inter/JetBrains Mono), tabular figure alignments, component specifications, and CSS custom property token mappings. | Frozen v1.0.0 |
| [`docs/FRONTEND_ARCHITECTURE.md`](file:///d:/PROJECTS/Event%20Sourced%20Ledger/docs/FRONTEND_ARCHITECTURE.md) | **HOW the frontend is structured & implemented**: Architectural layers, feature-based directory structure, React Router v7 routes, TanStack Query server state, decimal-safe `Money` value object contract, API error normalization, and testing architecture. | Finalized Baseline |

The next phase of project work is the concrete implementation of the frontend application.

---

# 7. Frontend Architectural Boundaries & Constraints

The frontend implementation must strictly observe the following technical and architectural boundaries:

1. **Backend Source of Truth**: The frontend is exclusively a presentation and workflow layer. The backend PostgreSQL database and Spring Boot application are the sole sources of truth for financial balances, double-entry invariance, and audit trails.
2. **Zero Client Balance Derivation**: The frontend never calculates running balances, never performs double-entry balancing, and never reconstructs historical state. All balances are retrieved from backend queries (`GET /accounts/{id}/audit/balance`).
3. **No Optimistic Financial Updates**: Mutations (deposit, withdrawal, transfer) do not apply optimistic updates to balances. Authoritative balances are re-read from the backend after successful mutation execution.
4. **Account Profile Balance Absence**: `AccountResponse` does not contain a balance field. Account list views display account identity without balances; no N+1 balance queries are permitted for account directories.
5. **Exact Backend Endpoint Paths**: The API client connects to the verified Spring Boot controller paths (`/accounts`, `/transfers`, `/accounts/{accountId}/audit/*`). **There is NO `/api/v1` prefix.**
6. **Decimal Safety**: Binary floating-point arithmetic (`Number`, `parseFloat`) is prohibited for monetary manipulation. All monetary amounts must be handled via an arbitrary-precision decimal abstraction.
7. **Monetary Wire-Format Verification (Resolved in F0)**: Verified in Phase F0 that the live backend emits `BigDecimal` monetary values as unquoted JSON numbers (e.g. `"amount": 100.50`). The frontend handles this defensively via `Money.fromWire(number | string)` using `decimal.js`, with the IEEE-754 precision boundary formally documented in ADR-030. Outbound values are serialized as exact strings. Backend serialization hardening is recommended for a future release; backend code remains untouched in F0.
8. **Transfer is a Workflow, Not a Page**: Because the backend provides no global transaction listing, transfers are implemented as an operational modal/workflow launched from Dashboard or Account surfaces, not a standalone global route.
9. **Supported Dashboard Metrics Only**: The Dashboard displays **exactly three metrics**: Total Accounts, Active Accounts, and Frozen Accounts (retrieved via 3 lightweight parallel `GET /accounts` queries reading `totalElements`). No derived metrics (such as closed accounts) or unverified global financial figures are supported.
10. **System Account Isolation**: `SYS-CASH` (ID 1) remains a backend-isolated contra-account and must never be exposed as an ordinary account in user-facing views or transfer selection dropdowns.
11. **Deferred Capabilities**: Frontend v1.0 has no authentication, no fake login screens, and no real-time WebSocket/SSE requirements.

---

# 8. Frontend Implementation Roadmap (Phases F0–F5)

The frontend implementation proceeds in six sequential, independently testable phases:

---

## Phase F0 — Frontend Foundation

**Status: COMPLETED — 2026-09-23**

### Objective
Initialize the frontend application shell, tooling, design system foundations, routing infrastructure, and core API client.

### Deliverables Completed
- React + TypeScript application initialized with Vite (`react ^19.1.0`, `vite ^6.3.5`, `typescript ~5.8.3`).
- Project directory structure established per `FRONTEND_ARCHITECTURE.md` (`src/features`, `src/components`, `src/api`, `src/utils`, `src/styles`, `src/routes`, `src/types`).
- Design System CSS custom properties in `src/styles/tokens.css` copied verbatim from `DESIGN.md` §30.
- Baseline typography (Inter and JetBrains Mono fonts via Google Fonts + CSS fallback) and modern CSS reset (`reset.css`, `main.css`).
- Layout components: `AppShell`, `TopBar` (60px header), `Sidebar` (240px desktop, off-canvas mobile), and `PageContainer` (1200px max-width cap).
- React Router v7 declarative route tree (`AppRoutes`, `RootLayout`, `AccountLayout` shell) with focus management on route change.
- Placeholder routes: `DashboardPage` (`/dashboard`), `Accounts` placeholder (`/accounts`), and catch-all `NotFoundPage` (404).
- Centralized `apiClient` (`fetch` wrapper) with `ApiError` normalization, typed query parameters (skipping null/undefined), and 204 handling.
- `ENDPOINTS` registry with verified controller paths and zero `/api/v1` prefix.
- `VITE_API_BASE_URL` environment configuration (`.env.example`) and Vite development proxy for `/accounts` and `/transfers` with SPA HTML bypass.
- TanStack React Query provider (`QueryClientProvider`) configured with 30s staleTime, 5min gcTime, 1 retry, no window focus refetch.
- Arbitrary-precision decimal `Money` value object backed by `decimal.js` with 20 decimal digits of precision and `ROUND_HALF_UP` rounding.
- Date utility (`src/utils/date.ts`) with ISO-8601 UTC formatting and `asOf` UTC parameter normalization.
- Vitest + React Testing Library test harness (`test-setup.ts`, `vitest.config.ts`).
- Responsive layout behavior verified (1280×900 desktop side-by-side, 390×844 mobile off-canvas with hamburger toggle).
- Accessibility foundation: `<header>`, `<nav>`, `<main id="main-content">`, `.skip-link`, and 2px primary focus ring.

### Explicit Scope Exclusions (F1+ Features NOT Implemented in F0)
- Account management, creation, or lifecycle UI is **NOT** implemented (deferred to F1).
- Deposit, withdrawal, or transfer UI is **NOT** implemented (deferred to F2).
- Transaction, ledger, event stream, or audit trail UI is **NOT** implemented (deferred to F3/F4).
- Dashboard metrics and analytics are **NOT** implemented (deferred to F1/F5).
- Placeholder routes contain zero data fetching and zero business logic.
- Backend code was **NOT** modified (`git diff -- backend/` is completely empty).

### Verification Gates Passed
- **Automated Tests:** `npm run test` — **64/64 passed** (Money tests: 34, Date tests: 18, API client tests: 12).
- **TypeScript Typecheck:** `npm run typecheck` — **PASS** (0 errors).
- **ESLint:** `npm run lint` — **PASS** (0 errors, 0 warnings).
- **Production Build:** `npm run build` — **PASS** (optimized static `/dist` bundle generated cleanly via Vite 6.4.3).
- **Chrome DevTools MCP Browser Verification:** Verified **B-01 through B-17** as completed and passing (app boot, non-blank render, semantic landmarks, TopBar, Sidebar, PageContainer, dashboard route, accounts route, account overview redirect, 404 page, 0 console errors, network inspection, 0 occurrences of `/api/v1`, 1280px desktop, 390px mobile, a11y landmarks/skip-link, and visible keyboard focus ring).
- **Live Monetary Wire-Format Verification:** Verified against running backend (`http://localhost:8080`) across deposit, balance, ledger, and trail endpoints. Backend emits `BigDecimal` as unquoted JSON numbers (`"amount": 100.50`). Formally recorded in **ADR-030** in `docs/DECISIONS.md`. Money value object provides precision-safe decimal math and string serialization while defensively handling number wire input. Backend remains untouched.

---

## Phase F1 — Account Experience

**Status: COMPLETED — 2026-09-23**

### Objective
Implement account portfolio browsing, account creation, account detail routing, and lifecycle state management.

### Deliverables Completed
- Accounts directory page (`/accounts`) rendering `AccountResponse` items in an accessible `DataTable`.
- Server-authoritative pagination (`page`, `size`) and filtering (`status`, `accountType`) synchronized with URL search parameters.
- Account creation workflow modal (`CreateAccountModal`, `POST /accounts`) with non-blank client validation, 409 conflict handling for duplicate account numbers, and navigation to account overview.
- Account context layout shell (`AccountLayout`) mapping `/accounts/:accountId` routes with account metadata banner (`StatusBadge`, `TechnicalIdBadge`).
- Account Overview tab (`/accounts/:accountId/overview`) displaying profile information, authoritative current balance (`GET /accounts/{id}/audit/balance` via `Money.fromWire()`), and status-gated lifecycle controls.
- Account lifecycle mutations (`useFreezeAccount`, `useActivateAccount`, `useCloseAccount`) with confirmation dialogs (`FreezeConfirmDialog`, `CloseConfirmDialog`), 422 business-rule error handling, duplicate submission prevention (`isPending`), and server cache invalidation.
- Error handling for missing accounts and `SYS-CASH` (HTTP 404 mapped to `AccountNotFoundView`).
- Comprehensive empty, loading skeleton, and error boundary states (`EmptyState`, `ErrorDisplay`, `LoadingSpinner`).
- Shared frontend design system infrastructure: `StatusBadge`, `TechnicalIdBadge`, `EmptyState`, `ErrorDisplay`, `DataTable`, `TablePagination`, `ModalDialog`, `ConfirmDialog`, `Toast`, `ToastViewport`, `ToastProvider`, `useToast`, `TabNav`.
- Strict financial correctness: zero client-side balance calculations, zero optimistic balance updates, no N+1 balance queries.
- Dashboard preservation: F0 `DashboardPage` remains untouched as a placeholder.

### Verification Gates Passed
- **Automated Tests:** `npm test` — **64/64 passed** (3 test files: `money.test.ts`, `date.test.ts`, `client.test.ts`).
- **TypeScript Typecheck:** `npm run typecheck` — **PASS** (0 errors).
- **Production Build:** `npm run build` (`tsc -b && vite build`) — **PASS** (clean compilation under `exactOptionalPropertyTypes: true` and optimized production bundle).
- **Manual Verification:** **PASS** (account directory, filtering, sorting, pagination, creation, required-field validation, duplicate account-number handling, overview, authoritative balance display, account navigation, deep linking/refresh, invalid account handling, freeze, activate, close, closed-account persistence, SYS-CASH protection, browser back/forward navigation, F1/F2/F3/F4 scope boundaries, and dashboard preservation).

---

## Phase F2 — Monetary Operations

**Status: COMPLETED — 2026-09-27**

### Objective
Implement monetary transaction workflows for deposits, withdrawals, and account-to-account transfers with strict decimal safety.

### Deliverables Completed
- Deposit modal/workflow (`DepositModal`, `POST /accounts/{accountId}/deposit`) with pre-flight monetary validation.
- Withdrawal modal/workflow (`WithdrawalModal`, `POST /accounts/{accountId}/withdrawal`) with positive amount validation and standard primary action styling (no destructive red).
- Transfer workflow modal (`TransferModal`, `POST /transfers`) with active account destination selector (excluding `SYS-CASH` and source account) and counterparty amount input.
- Monetary validation utility (`src/utils/validation.ts`, `validateMonetaryAmount`) enforcing `@DecimalMin("0.01")` and `@Digits(integer = 17, fraction = 2)` constraints without floating-point math.
- Dual submission prevention (button disablement on `isPending`, input locks, keyboard form submission lock).
- Integration with backend business validation (handling HTTP 400, 404, 422 Insufficient Funds, 422 Ineligible Account, 422 Invalid Transfer).
- Targeted post-mutation cache invalidation triggering authoritative balance re-fetch (`auditKeys.balance`) for affected accounts (zero optimistic updates; no redundant invalidation of account lists or details).
- Non-blocking toast notifications for transaction success with authoritative reference numbers.
- Strict monetary precision invariants maintained: zero `Number()`/`parseFloat()` conversions; exact wire serialization via `Money.toWireString()` and `Money.fromWire()`.
- Integration into `AccountOverviewPage` with monetary action buttons status-gated strictly to `ACTIVE` accounts.

### Explicit Scope Exclusions (F3+ Features NOT Implemented in F2)
- Transaction history lists and tables are NOT implemented (deferred to F3).
- Double-entry ledger entry journal views are NOT implemented (deferred to F3).
- Event stream inspection and raw event drawers are NOT implemented (deferred to F3).
- Audit trail view and historical balance reconstruction (`asOf`) are NOT implemented (deferred to F4).
- Dashboard aggregate metrics and shortcuts are NOT implemented (deferred to F5).
- Backend code was NOT modified (`git diff -- backend/` is completely empty).

### Verification Gates Passed
- **Automated Tests:** `npm test` — **123/123 passed** across 9 test files (including 23 validation tests, 6 mutation hook tests, 9 deposit tests, 9 withdrawal tests, 6 transfer tests, and 6 overview integration tests).
- **TypeScript Typecheck:** `npm run typecheck` — **PASS** (0 errors).
- **ESLint:** `npx eslint` across F2 files — **PASS** (0 errors, 0 warnings).
- **Production Build:** `npm run build` (`tsc -b && vite build`) — **PASS** (clean production bundle generated).
- **Manual Verification:** **PASS** (deposit, withdrawal, transfer, authoritative balance refresh, reference-number toasts, validation rejection, 422 error display and state preservation, SYS-CASH exclusion, source-account exclusion, and closed/frozen account status gating).

---

## Phase F3 — Financial History

**Status: COMPLETED — 2026-09-28**

### Objective
Implement immutable financial history inspection views scoped to the active account.

### Deliverables
- Account Transactions history tab (`/accounts/:accountId/transactions`) rendering `AccountTransactionResponse` items (ordered by canonical event sequence).
- Account Ledger entries tab (`/accounts/:accountId/ledger`) rendering double-entry debit/credit records with `entryType` filter and sort support.
- Account Events stream tab (`/accounts/:accountId/events`) rendering immutable domain events with sort on `occurredAt`.
- Slide-over inspection drawer for viewing raw event JSON payloads formatted safely.
- Server-driven pagination controls for all historical views synchronized via URL query parameters.
- Empty states for accounts with no transaction history.

### Success Criteria
Users can inspect account transactions, verify double-entry ledger lines, and review underlying immutable event payloads with accurate pagination.

---

## Phase F4 — Audit Experience

**Status: COMPLETED — 2026-09-29**

### Objective
Implement the core audit trail interface and historical balance reconstruction view.

### Deliverables
- Audit Trail tab (`/accounts/:accountId/audit`) consuming `AuditTrailResponse`.
- Tabular audit display showing `balanceChange`, cumulative `runningBalance`, `eventType`, and reference identifiers.
- Historical temporal query interface: `asOf` date-time picker normalized to UTC ISO-8601.
- Preservation of inclusive historical boundary semantics ($\text{occurredAt} \le \text{asOf}$).
- Prominent display of authoritative `finalBalance` (stable across audit pagination pages).
- Empty historical state handling for cutoff dates preceding account creation.
- Strict tabular numeric formatting (`font-variant-numeric: tabular-nums`) and color-coded financial indicators.

### Success Criteria
Users can trace every balance change from genesis to present, navigate paginated audit entries, and time-travel via `asOf` queries to view authoritative reconstructed historical balances.

---

## Phase F5 — Dashboard & Release Readiness

**Status: COMPLETED — 2026-09-30**

### Objective
Implement the portfolio Dashboard, verify responsive layout behavior, enforce WCAG AA accessibility, and validate the end-to-end frontend build.

### Deliverables Completed
- Dashboard page (`/dashboard`) displaying **exactly three metrics**:
  - Total Accounts
  - Active Accounts
  - Frozen Accounts
- Concurrently aggregated metrics via 3 lightweight parallel queries to `GET /accounts` consuming `totalElements`.
- Zero client-side financial calculations; server-authoritative state strictly preserved.
- Quick action shortcuts to trigger Account Creation, Deposit, Withdrawal, and Transfer modals.
- Transfer workflow constraints preserved: active accounts only, `SYS-CASH` excluded, source and destination must differ, no optimistic updates.
- Responsive layout verification across all 4 breakpoints (<640px, 640–1024px, 1024–1280px, >1280px with 1200px container cap).
- Accessibility audit: keyboard focus traps, `aria-live` region announcements, skip links, and color-independent status badges (WCAG 2.1 AA).
- Multi-tier automated testing:
  - Unit tests for `Money`, date formatters, and validators.
  - Component integration tests using Mock Service Worker (MSW).
  - Playwright E2E browser automation for the critical financial journey (creation -> deposit -> transfer -> audit trail).
- Production build validation (`npm run build`) generating optimized static `/dist` bundle without typecheck or lint warnings.

### Verification Gates Passed
- **Automated Tests:** `npm test` — **205/205 passed** across 23 test files (at F5 completion).
- **TypeScript Typecheck:** `npm run typecheck` — **PASS** (0 errors).
- **ESLint:** `npm run lint` — **PASS** (0 errors, 0 warnings).
- **Playwright E2E:** `npx playwright test` — **PASS** (critical financial journey automated in real browser).
- **Production Build:** `npm run build` — **PASS** (clean production bundle generated via Vite).

---

## Post-F5 Frontend Enhancements (Product Polish)

**Status: COMPLETED — 2026-09-30**

Following the formal completion and code review of Phase F5, four focused product-polish enhancements were implemented to elevate usability, workspace efficiency, and technical positioning without reopening F5 or modifying backend contracts:

### 1. Collapsible Desktop Sidebar
- Desktop sidebar supports expanded (240px) and collapsed (64px) states with smooth CSS transitions.
- Fully keyboard-accessible toggle button with explicit `aria-expanded` and `aria-label` attributes.
- Collapsed navigation items display accessible tooltips on hover and focus.
- State persists across page reloads via `localStorage` (`esl_sidebar_collapsed`).
- Desktop collapse behavior remains strictly decoupled from mobile off-canvas drawer behavior (<1024px).
- Respects `prefers-reduced-motion` preferences.

### 2. Application-Wide Light/Dark Theme System
- Integrated `ThemeProvider` and `useTheme` hook for reactive, application-wide theme state.
- `ThemeToggle` control integrated into `TopBar` and public landing page header.
- Tokenized semantic design system in `tokens.css` extended with comprehensive dark mode variables under `[data-theme="dark"]`.
- Theme preference persists across sessions via `localStorage` (`esl_theme`).
- Anti-flash inline script in `index.html` prevents Flash of Unstyled Content (FOUC).
- WCAG AA contrast ratios maintained across all text and UI elements in both light and dark themes.

### 3. Public Product Landing Page (`/`)
- Public showcase landing page introduced at `/` using a dedicated public layout (`LandingLayout`) without the internal application sidebar.
- Internal application dashboard lives at `/dashboard` within `RootLayout` (`AppShell`).
- Technical positioning highlights: double-entry accounting core, append-only event store, server-authoritative balances, point-in-time balance reconstruction, and account lifecycle governance.
- Structured sections: dedicated header, hero, core capabilities, architecture overview, technology stack, product preview with CTA, and footer.
- Zero marketing fluff, fake statistics, or unverified claims.

### 4. Application Header Brand Navigation
- Top-left "Ledger" logo and brand text in the internal application `TopBar` is clickable and navigates to `/`.
- Uses semantic React Router `<Link to="/">` with accessible label `Event-Sourced Ledger Home`.
- Preserves exact institutional visual styling while providing keyboard focus-visible indicators.

---

# 9. Frontend Milestones Summary

| Milestone | Outcome | Status | Target Phase |
| :--- | :--- | :--- | :--- |
| **MF0** | Project Shell, Routing, Styling Tokens & API Foundation | COMPLETED (2026-09-23) | Phase F0 |
| **MF1** | Account Directory, Overview, Creation & Lifecycle | COMPLETED (2026-09-23) | Phase F1 |
| **MF2** | Deposit, Withdrawal & Transfer Workflows | COMPLETED (2026-09-27) | Phase F2 |
| **MF3** | Transactions, Ledger Entries & Event Stream History | COMPLETED (2026-09-28) | Phase F3 |
| **MF4** | Audit Trail & Historical Balance Reconstruction (`asOf`) | COMPLETED (2026-09-29) | Phase F4 |
| **MF5** | Dashboard, Responsive / A11y Polish & End-to-End Validation | COMPLETED (2026-09-30) | Phase F5 |
| **Post-F5** | Collapsible Sidebar, Dark Mode, Public Landing Page & Brand Nav | COMPLETED (2026-09-30) | Post-F5 Polish |

---

# 10. Production Deployment Roadmap (Phases D0–D8)

### 10.1 Confirmed Deployment Decisions & Architecture
The production deployment strategy connects the independently verified Spring Boot backend and React frontend into a live, publicly accessible cloud environment while strictly preserving the system's foundational architectural invariants:

1. **Database:**
   - PostgreSQL hosted on **Render**.
   - Serves as the authoritative, durable relational datastore for all events, transactions, and ledger entries.
   - Connected via secure JDBC connection string (`LEDGER_DB_URL`, `LEDGER_DB_USERNAME`, `LEDGER_DB_PASSWORD`).
   - Flyway remains solely responsible for executing database migrations (`V1` through `V5`).
   - Hibernate schema validation (`ddl-auto=validate`) remains enabled to verify entity-to-schema alignment on startup.

2. **Backend:**
   - Spring Boot backend deployed on **Render**.
   - Packaged and containerized with Docker using a production-appropriate multi-stage build.
   - Render deploys and orchestrates the Dockerized backend service directly from GitHub.
   - Configured via environment variables for database credentials, port binding, and CORS configuration.
   - Remains the authoritative source of truth for all financial state, double-entry balancing, and balance reconstruction.

3. **Frontend:**
   - React + TypeScript + Vite SPA deployed on **Vercel**.
   - Optimized static bundle deployed to Vercel's global edge network.
   - Production frontend configured with `VITE_API_BASE_URL` pointing to the Render backend URL over HTTPS.
   - Single Page Application (SPA) routing and deep-linking rewrite rules configured via `vercel.json` to prevent 404s on sub-route reloads.
   - Performs zero financial calculations, zero optimistic balance mutations, and zero client-side balance reconstruction.

4. **Deployment Architecture:**

```text
   Users
      ↓
   Vercel
   React / TypeScript / Vite
      ↓ HTTPS REST
   Render
   Dockerized Spring Boot Backend
      ↓ JDBC
   Render PostgreSQL
```

5. **Architectural Principles & Invariants:**
   - **Backend Authority:** The backend remains the sole source of truth; all balances are derived server-side.
   - **Zero Client Calculation:** The frontend is strictly a presentation and command-dispatch layer.
   - **Financial Integrity:** Deployment preserves event sourcing, double-entry equilibrium, pessimistic concurrency control, and system contra-account (`SYS-CASH`) isolation.
   - **Configuration Hygiene:** Zero secrets or database credentials bundled in frontend client code or committed to repository source.

6. **Release Versioning Progression Model:**
The transition from full-stack development to verified production is governed by a strict versioning sequence:

```text
v1.0.0
Backend complete/released
        ↓
v1.1.0
Full-stack source checkpoint
        ↓
Deployment Roadmap
D0 → D1 → D2 → D3 → D4 → D5 → D6 → D7 → D8
        ↓
Production deployment complete
        ↓
Final production release/tag
```

- **`v1.0.0` (Backend Complete / Released):** Tagged and released on 2026-09-21 upon completion of Phases 0–10 (244 tests, 0 failures).
- **`v1.1.0` (Full-Stack Source Checkpoint):** Tagged and pushed on 2026-09-30 upon completion of Phases F0–F5 and Post-F5 product polish (205 frontend tests, Vitest + Playwright E2E). This tag represents the complete pre-deployment source baseline. **It is NOT the production release tag.**
- **`D0 → D8` (Deployment Execution Roadmap):** Sequential, verifiable infrastructure and operational rollout phases.
- **`Final Production Release / Tag`:** The final production release version and Git tag will be formally determined, tagged, and released only **after** production deployment and end-to-end cloud verification (D0–D8) are fully complete.

---

### 10.2 Phased Deployment Plan (Phases D0–D8)

## Phase D0 — Deployment Planning & Readiness

**Status: COMPLETED — 2026-09-30**

### Objective
Conduct a comprehensive repository and configuration audit to ensure full production readiness across backend, frontend, environment boundaries, and container definitions without initiating cloud deployment.

### Deliverables & Scope
- **Repository Readiness Audit:** Validate workspace cleanliness, branch alignment, and pre-deployment source integrity against the `v1.1.0` baseline.
- **Backend Configuration Review:** Audit `application.properties` and profile handling for production PostgreSQL connectivity, Flyway migration execution, Hibernate schema validation, and server port configuration.
- **Frontend Configuration Review:** Audit `vite.config.ts`, environment variables (`VITE_API_BASE_URL`), and API client endpoint registries to ensure complete elimination of development-only proxy dependencies.
- **Environment & Secret Boundaries:** Define the strict separation between public build-time frontend variables and private runtime backend credentials (`LEDGER_DB_URL`, `LEDGER_DB_USERNAME`, `LEDGER_DB_PASSWORD`).
- **CORS Requirements Analysis:** Define explicit CORS allowlists permitting cross-origin HTTPS requests from the Vercel production domain to the Render backend service while rejecting unauthorized origins.
- **Docker Requirements Definition:** Establish multi-stage Docker build specifications (Maven/JDK builder stage and lean JRE runtime stage) and comprehensive `.dockerignore` filters.
- **Production Build Validation:** Verify local generation of clean frontend static artifacts (`npm run build`) and backend executable JAR (`mvn clean package -DskipTests`).
- **Gap Identification:** Document all required configuration adjustments prior to cloud provisioning.
- **Execution Constraint:** Zero cloud resources provisioned and zero live deployment steps initiated in Phase D0.

### Verification Gates Passed
- **Repository Integrity:** Clean working tree on `main` branch aligned with `origin/main`; tag `v1.1.0` verified at commit `ef3f96a` as the pre-deployment source checkpoint; zero premature deployment files in repo.
- **Backend Audit:** Confirmed Spring Boot 3.5.16 on Java 21; verified `ddl-auto=validate`, Flyway V1–V5 enabled, and parameterized DB credentials (`LEDGER_DB_URL`, `LEDGER_DB_USERNAME`, `LEDGER_DB_PASSWORD`); identified hardcoded port gap requiring `server.port=${PORT:8080}` for Render dynamic port binding.
- **Frontend Audit:** Confirmed React 19 + TypeScript 5.8 + Vite 6.4.3; verified `VITE_API_BASE_URL` as production API client mechanism; verified Vite proxy is dev-only; identified SPA client routing rewrite requirement (`vercel.json`).
- **Secret & Boundary Audit:** Verified database credentials are strictly isolated to backend runtime; verified zero secret leakage in repository or frontend bundle; confirmed `VITE_API_BASE_URL` is public/client-facing.
- **CORS Audit:** Confirmed backend currently has zero CORS configuration (which worked locally due to Vite dev proxy); identified requirement for centralized `CorsConfig` supporting `cors.allowed-origins` prior to production cross-origin integration.
- **Docker Audit:** Confirmed no `Dockerfile` or `.dockerignore` exists; established multi-stage Docker build specification targeting Java 21; containerization intentionally deferred to D2.
- **Build Verification:** Local execution verified `mvn clean package -DskipTests` (BUILD SUCCESS, 9.7s) and `npm run build` (BUILD SUCCESS, 4.37s) produce clean, deployable production artifacts.
- **Zero Cloud Impact:** Verified zero cloud resources provisioned, zero deployment actions executed, and zero application code modified in Phase D0.

---

## Phase D1 — Production PostgreSQL on Render

**Status: COMPLETED — 2026-09-30**

### Objective
Provision and configure the managed PostgreSQL database instance on Render to serve as the production persistence store.

### Deliverables & Scope
- **Render PostgreSQL Provisioning:** Create and configure a managed PostgreSQL database instance on Render.
- **Connection Configuration:** Establish secure production database connection credentials.
- **Environment Configuration:** Configure database environment variables:
  - `LEDGER_DB_URL` (JDBC connection string with SSL enforcement, e.g., `jdbc:postgresql://<host>:<port>/<database>?sslmode=require`).
  - `LEDGER_DB_USERNAME` (production database user).
  - `LEDGER_DB_PASSWORD` (production database password).
- **PostgreSQL Connectivity Verification:** Validate remote network accessibility and authentication from external tools.
- **Flyway Migration Strategy Verification:** Confirm that Flyway migrations `V1__Create_Accounts.sql` through `V5__Seed_Sys_Cash_Account.sql` are prepared to execute sequentially against the clean remote schema upon backend startup.

### Verification Gates Passed
- Render Managed PostgreSQL instance `event-sourced-ledger-db` provisioned in Oregon (US West) on PostgreSQL 18; status reports `Available`.
- Assigned database name `ledger_db_6isw` with database user `ledger_user` on port 5432 established.
- Connection credentials securely provisioned and rotated; internal and external connection information available in Render dashboard.
- Verified database is in a clean state with zero application tables and no migrations applied; ready for automatic Flyway execution (`V1`–`V5`) upon backend startup.
- Zero application source code modified, and no manual schema creation or manual Flyway runs executed.

---

## Phase D2 — Dockerize Spring Boot Backend

**Status: COMPLETED — 2026-10-01**

### Objective
Containerize the Spring Boot backend using a production-ready multi-stage Docker build and verify local container execution and environment injection.

### Deliverables & Scope
- **Dockerfile Creation:** Author a production-appropriate multi-stage `Dockerfile`:
  - *Builder Stage:* Compile and package the Spring Boot application using Maven and OpenJDK 21 (`maven:3.9.9-eclipse-temurin-21-alpine`).
  - *Runtime Stage:* Lightweight Alpine JRE 21 base image (`eclipse-temurin:21-jre-alpine`) running as non-root user `10001:10001` (`ledgeruser:ledgergroup`).
- **Docker Ignore Configuration:** Author `backend/.dockerignore` to exclude `target/`, local logs, and IDE files from the build context.
- **Dynamic PORT Configuration:** Update `backend/src/main/resources/application.properties` to support dynamic port injection via `server.port=${PORT:8080}`.
- **Centralized CORS Configuration:** Author `backend/src/main/java/com/ledger/config/CorsConfig.java` with property-driven origin allowlist (`cors.allowed-origins`) defaulting to local development origins (`http://localhost:5173,http://localhost:3000`).
- **Behavioral CORS Testing:** Author `backend/src/test/java/com/ledger/config/CorsConfigTest.java` verifying allowed origins, unauthorized origin rejection, and preflight `OPTIONS` handling.
- **Local Container Build:** Build the Docker image locally (`docker build -t event-sourced-ledger-backend .`).
- **Isolated PostgreSQL Verification:** Verify container startup, environment variable ingestion (`LEDGER_DB_URL`, `LEDGER_DB_USERNAME`, `LEDGER_DB_PASSWORD`), Flyway migrations `V1`–`V5`, Hibernate schema validation (`ddl-auto=validate`), dynamic port override (`PORT=10000`), and live API smoke tests against an ephemeral local PostgreSQL 18 container without contacting the production Render database.

### Verification Gates Passed
- Host test suite passed with `BUILD SUCCESS` (249 tests run, 0 failures, 0 errors, 0 skipped).
- Multi-stage Docker image `event-sourced-ledger-backend:latest` compiled cleanly (396 MB uncompressed / 126 MB compressed).
- Container verified running as unprivileged user `10001:10001` (`ledgeruser`).
- Container initialized against clean temporary PostgreSQL 18 database with automatic Flyway `V1`–`V5` execution and Hibernate validation pass.
- Live REST smoke tests verified `/v3/api-docs` and `POST /accounts` / `GET /accounts` persistence.
- Dynamic port binding verified with `PORT=10000`.
- Live container CORS preflight verified returning `Access-Control-Allow-Origin: http://localhost:5173` and `http://localhost:3000`, rejecting unauthorized origins with HTTP 403.
- Secret hygiene confirmed: zero credentials baked in image layers; credentials injected strictly at runtime.
- Render database `ledger_db_6isw` remained 100% untouched.
- All temporary Docker containers and bridge network removed.
- Implementation committed as `699bd04`.

---

## Phase D3 — Deploy Backend to Render

**Status: READY FOR EXECUTION**

### Objective
Deploy the Dockerized Spring Boot backend to Render as a Web Service connected to the production Render PostgreSQL database.

### Deliverables & Scope
- **Render Service Creation:** Configure a new Web Service on Render referencing the GitHub repository.
- **Deployment Mode:** Connect the service to deploy using the project's root/backend `Dockerfile`.
- **Environment Variable Binding:** Inject production secrets and configuration via Render environment settings:
  - `LEDGER_DB_URL`, `LEDGER_DB_USERNAME`, `LEDGER_DB_PASSWORD` (referencing Render PostgreSQL).
  - `PORT` (configured to match Render's assigned port).
  - CORS allowed origins (configured for future Vercel domain).
- **Service Configuration:** Configure service plan, health check path, and start commands as required.
- **Database Interconnect:** Link backend service to the Render PostgreSQL instance within the same private/public network.
- **Endpoint Discovery:** Obtain the live production backend URL (e.g. `https://<service-name>.onrender.com`).

### Verification Gates
- Render build and deploy pipeline succeeds from GitHub source.
- Backend container boots successfully in the Render cloud runtime.
- Backend establishes JDBC connection to Render PostgreSQL.
- Public HTTPS backend URL is provisioned and responsive.

---

## Phase D4 — Backend Production Verification

**Status: PLANNED**

### Objective
Conduct rigorous functional and architectural verification of the deployed Render backend to confirm stability, invariant safety, and production readiness before initiating frontend deployment.

### Deliverables & Scope
- **Container Health & Log Audit:** Inspect Render runtime logs for clean Spring Boot startup with zero warnings or errors.
- **Database Connectivity Verification:** Confirm steady connection pooling with Render PostgreSQL.
- **Migration & Seeding Audit:** Verify Flyway applied migrations `V1`–`V5` and `SYS-CASH` contra-account exists at ID 1.
- **Hibernate Schema Validation:** Confirm `ddl-auto=validate` passed without schema mismatch.
- **Representative REST Endpoint Verification:** Test core collection endpoints (`GET /accounts`, `GET /accounts?status=ACTIVE`).
- **Representative Financial Flows:** Execute live production smoke flows:
  - Account creation (`POST /accounts`).
  - Account deposit (`POST /accounts/{id}/deposit`).
  - Account withdrawal (`POST /accounts/{id}/withdrawal`).
  - Account-to-account transfer (`POST /transfers`).
- **Audit & History Verification:** Test audit endpoints (`/accounts/{id}/audit/balance`, `/audit/trail`, `/audit/ledger`, `/audit/events`).
- **Invariant Verification:** Confirm double-entry balance equilibrium, optimistic/pessimistic row locking, and strict `SYS-CASH` API isolation (HTTP 404).
- **Readiness Sign-Off:** Formally approve backend production readiness prior to frontend deployment.

### Verification Gates
- Production backend logs confirm clean startup and zero uncaught exceptions.
- All core financial operations execute with complete double-entry correctness.
- Backend confirmed ready to receive frontend traffic.

---

## Phase D5 — Configure Frontend for Production

**Status: COMPLETED (2026-10-01)**

### Objective
Configure the React + TypeScript + Vite frontend for production deployment targeting the live Render backend, ensuring environment isolation and SPA routing compatibility.

### Deliverables & Scope
- **Production API URL Configuration:** Configured `VITE_API_BASE_URL=https://event-sourced-ledger-backend.onrender.com` via `frontend/.env.production` and updated `frontend/.env.example`.
- **Proxy Dependency Removal:** Confirmed production builds compile absolute Render backend URLs into the bundle (`BN="https://event-sourced-ledger-backend.onrender.com"`), completely bypassing Vite's dev proxy table.
- **Vite Production Optimization:** Verified `tsc -b && vite build` produces clean, content-hashed static assets (`dist/assets/index-*.js`, `dist/assets/index-*.css`).
- **SPA Fallback Configuration:** Created `frontend/vercel.json` with SPA rewrite rules (`/(.*)` -> `/index.html`) to support deep linking and page refreshes on Vercel Edge.
- **Local Production Simulation:** Executed `npx vite preview --port 5173` locally against the live Render backend and verified all core client routes (`/`, `/dashboard`, `/accounts`, `/accounts/:id/overview`, `/accounts/:id/audit`).
- **Secret Exposure Audit:** Conducted automated scan across all compiled files in `dist/`; confirmed zero database credentials, private keys, or backend secrets are leaked in client bundles.
- **Live Cloud Smoke Verification:** Executed real end-to-end account creation (`ACC-432303`) through the preview UI against the live Render backend; verified immediate reflection in accounts list and overview.

### Verification Gates
- `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
- Frontend test suite (`npm test` / Vitest) passes 210/210 unit tests across 24 test suites.
- `npm run build` compiles cleanly with zero errors.
- Secret-exposure audit clean across all `dist/` artifacts.
- Vite preview verified across all representative routes with direct communication to Render backend.

---

## Phase D6 — Deploy Frontend to Vercel

**Status: READY FOR EXECUTION**

### Objective
Deploy the React + TypeScript + Vite static frontend application to Vercel's global edge network.

### Deliverables & Scope
- **Vercel Project Setup:** Import and configure the GitHub repository in the Vercel dashboard.
- **Build Settings Configuration:** Configure root directory (`frontend`), build command (`npm run build`), output directory (`dist`), and install command (`npm install`).
- **Production Environment Variables:** Set `VITE_API_BASE_URL` in Vercel project environment settings.
- **SPA Routing Verification:** Ensure `vercel.json` rewrite configuration is active on Vercel edge routes.
- **Static Bundle Deployment:** Execute production deployment to Vercel.
- **Domain & SSL Provisioning:** Obtain the live production frontend URL (e.g. `https://<project-name>.vercel.app`) with automated SSL certificate.

### Verification Gates
- Vercel build and deployment pipeline succeeds with clean logs.
- Deployed frontend application loads over public HTTPS.
- Direct navigation and hard refresh on client routes (`/dashboard`, `/accounts`, `/accounts/2/overview`) resolve correctly without 404 errors.

---

## Phase D7 — Full-Stack Integration Verification

**Status: PLANNED**

### Objective
Execute comprehensive end-to-end integration testing and user journey validation across the live full-stack system deployed on Vercel and Render.

### Deliverables & Scope
- **Public Showcase & Brand Navigation:**
  - Verify public landing page (`/`) loads with hero, feature highlights, and architectural breakdown.
  - Verify theme toggle switches between institutional light and dark modes with persistence.
  - Verify navigation from landing page to `/dashboard` and internal header brand return to `/`.
- **Portfolio Dashboard:**
  - Verify aggregate metrics (Total Accounts, Active Accounts, Frozen Accounts) load from backend.
  - Verify quick-action shortcuts trigger corresponding modals.
- **Account Directory & Lifecycle:**
  - Verify account directory browsing, sorting, and status filtering (`/accounts`).
  - Verify account creation modal (`POST /accounts`) updates table and navigates to overview.
  - Verify account freeze, activate, and close lifecycle transitions.
- **Monetary Workflows:**
  - Execute live deposit and verify authoritative balance refresh.
  - Execute live withdrawal and verify balance decrease and insufficient funds rejection.
  - Execute account-to-account transfer between two accounts and verify counterparty balances.
- **Financial History Inspection:**
  - Verify transaction history reflects canonical event order (`/transactions`).
  - Verify double-entry ledger entries match debits and credits (`/ledger`).
  - Verify event stream displays immutable domain events with raw payload inspection (`/events`).
- **Audit Trail & Balance Reconstruction:**
  - Verify audit trail running balance matches final balance (`/audit`).
  - Verify point-in-time balance reconstruction using `asOf` temporal queries.
- **CORS & Network Integration:** Confirm cross-origin browser requests between Vercel and Render complete without CORS header rejections or preflight failures.
- **Automated E2E Verification:** Run relevant Playwright tests against live production URLs to validate the core user journey in real browser environments.

### Verification Gates
- All full-stack user journeys execute successfully in the live cloud deployment.
- Zero CORS errors, zero 404 routing errors, and zero client-side calculation anomalies.
- Automated Playwright E2E suite passes against production endpoints.

---

## Phase D8 — Production Hardening & Documentation

**Status: PLANNED**

### Objective
Harden production configurations, complete system documentation, establish operational runbooks, and create the final production release tag.

### Deliverables & Scope
- **CORS Hardening:** Restrict Render backend CORS allowed origins strictly to the production Vercel domain (eliminating wildcard or broad origins).
- **Environment & Secret Hygiene:** Conduct a final review of environment variables and access controls on Render and Vercel dashboards.
- **Production Logging Audit:** Confirm production logs capture operational metrics while omitting sensitive customer data or credentials.
- **Security & HTTPS Verification:** Confirm all communications are strictly encrypted over HTTPS and database connections enforce SSL.
- **Architecture Documentation:** Update system architecture documentation reflecting the live Render + Vercel deployment topology.
- **Documentation Synchronization:**
  - Update `README.md` with live production URLs, cloud deployment architecture, and environment configuration instructions.
  - Update `PROJECT_LOG.md` recording the complete chronological deployment milestone.
  - Update `docs/PROJECT_ROADMAP.md` recording phase completion statuses, verification dates, and test metrics.
- **Architectural Decision Records (ADRs):** Record any deployment-specific decisions in `docs/DECISIONS.md`.
- **Final Production Release:** Decide, tag, and publish the final production release Git tag following verified end-to-end stability.

### Verification Gates
- Production environment hardened, secured, and validated.
- All repository documentation synchronized with the live production deployment.
- Final production release tag created and published.

---

# 11. Production Deployment Milestones Summary

| Milestone | Outcome | Status | Target Phase |
| :--- | :--- | :--- | :--- |
| **MD0** | Deployment Planning & Readiness Audit | COMPLETED (2026-09-30) | Phase D0 |
| **MD1** | Production PostgreSQL on Render | COMPLETED (2026-09-30) | Phase D1 |
| **MD2** | Dockerize Spring Boot Backend | COMPLETED (2026-10-01) | Phase D2 |
| **MD3** | Deploy Dockerized Backend to Render | READY FOR EXECUTION | Phase D3 |
| **MD4** | Backend Production Verification | PLANNED | Phase D4 |
| **MD5** | Configure Frontend for Production | COMPLETED (2026-10-01) | Phase D5 |
| **MD6** | Deploy Frontend Static Bundle to Vercel | READY FOR EXECUTION | Phase D6 |
| **MD7** | Full-Stack Integration & E2E Cloud Verification | PLANNED | Phase D7 |
| **MD8** | Production Hardening, Documentation & Final Release Tagging | PLANNED | Phase D8 |

---

# 12. Future Enhancements (Beyond Production Deployment)

The following architectural and functional capabilities are intentionally excluded from the current v1.0 / v1.1.0 and production deployment scope and will be evaluated in future project phases:

### Security & Identity
- JWT authentication and token management.
- Role-Based Access Control (RBAC) with differentiated viewer, operator, and administrator roles.

### Financial Engine & Distributed Systems
- Distributed idempotency keys (`Idempotency-Key` headers) for write operations.
- Snapshotting engine for high-throughput balance reconstruction.
- Optimistic locking for high-concurrency account modifications.
- Multi-currency support (ISO-4217 currency codes, exchange rates).
- Command Query Responsibility Segregation (CQRS) and read-model projections.
- Kafka integration for distributed event streaming.

### User Experience & Analytics
- Global cross-account transaction and ledger explorer.
- Rich transaction visualization and flow diagrams.
- Real-time event streaming via WebSockets or Server-Sent Events (SSE).

### Infrastructure & Operations
- Multi-container orchestration (Kubernetes / ECS). *(Note: Single-container Docker packaging is adopted in Phase D2 for Render deployment).*
- Automated CI/CD deployment pipelines (GitHub Actions deployment workflows).
- Production monitoring, metrics collection, and OpenTelemetry distributed tracing.
- Automated database backup and disaster recovery automation.

---

# 13. Roadmap Maintenance & Guiding Philosophy

This roadmap is a living document. As development and deployment progress:
- Completed deployment phases will be marked with completion dates and verification metrics.
- Architectural boundaries defined in `ARCHITECTURE.md` and `FRONTEND_ARCHITECTURE.md` must be maintained during deployment.
- Production environment configurations must preserve backend financial authority and double-entry invariants at all times.

> **"Build the foundation before the interface; build the interface to reflect the truth of the foundation; deploy the system to preserve that truth in production."**

The backend is the immutable source of truth for the financial ledger. The frontend exists to provide clear, reliable, and accessible visibility into that truth. The production deployment infrastructure exists to deliver that verified truth securely and reliably to users. Every phase builds directly upon the verified correctness of the layer beneath it.