# Project Roadmap

**Project Name:** Event-Sourced Ledger (Double-Entry Bank Core)  
**Version:** 1.1.0  
**Current Status:**  
- **Backend (Phases 0–10):** COMPLETED — v1.0.0 RELEASED (2026-09-21)  
- **Frontend Planning & Documentation:** COMPLETED (2026-09-23)  
- **Frontend Phase F0 — Frontend Foundation:** COMPLETED (2026-09-23)  
- **Frontend Implementation (Phases F1–F5):** NEXT / READY FOR EXECUTION (Phase F1 Next)  
- **Future Enhancements:** DEFERRED / POST-v1.0  

---

# 1. Purpose

This document defines the master implementation roadmap for the Event-Sourced Ledger project.

Unlike the Product Requirements Document (PRD), which defines **what** should be built, this roadmap defines **when** and **in what order** features should be implemented.

The project intentionally followed a **backend-first** methodology:
1. Financial domain correctness and double-entry invariants were established first.
2. Backend v1.0.0 was fully stabilized, tested, and released.
3. Frontend planning and architectural specifications were finalized.
4. Frontend implementation can now proceed against a frozen, authoritative backend contract.
5. Future enterprise capabilities remain strictly isolated from current v1.0 deliverables.

---

# 2. Roadmap Philosophy

The project adheres to these core architectural and execution principles:

- **Build from the domain outward**: Validate financial models before building UI presentation.
- **Prioritize correctness before convenience**: Invariant safety and audit integrity take precedence over speed.
- **Validate business rules before building UI**: User interfaces reflect authoritative server state; they do not calculate or synthesize balances.
- **Contract-first frontend delivery**: The frontend is built to consume the frozen backend v1.0.0 REST API without altering backend behavior or inventing endpoints.
- **Complete one milestone before beginning the next**: Every phase is independently testable, documented, and verifiable before proceeding.

---

# 3. Current Scope & Project Status

### 3.1 What is Covered
- **Backend Core**: Event store, double-entry ledger, balance reconstruction, audit trail, pagination/sorting/filtering, pessimistic row locking, and REST APIs (**COMPLETED v1.0.0**).
- **Frontend Planning**: Frozen PRD, TRD, Design System tokens, and Frontend Architecture (**COMPLETED**).
- **Frontend Implementation**: Phase F0 (Frontend Foundation) COMPLETED (2026-09-23); Feature Phases F1–F5 UPCOMING (Phase F1 Account Experience Next).

### 3.2 What is Intentionally Deferred (Post-v1.0)
- User authentication and Role-Based Access Control (RBAC).
- Global transaction/ledger search and exploratory analytics.
- Snapshotting, CQRS, and Kafka event streaming.
- Multi-currency support and distributed idempotency keys.
- Containerization (Docker) and automated CI/CD deployment pipelines.

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

### Objective
Implement monetary transaction workflows for deposits, withdrawals, and account-to-account transfers with strict decimal safety.

### Deliverables
- Deposit modal/workflow (`POST /accounts/{accountId}/deposit`) with 2-decimal pre-flight validation.
- Withdrawal modal/workflow (`POST /accounts/{accountId}/withdrawal`) with positive amount validation.
- Transfer workflow modal (`POST /transfers`) with source/destination account selection (excluding `SYS-CASH`) and amount input.
- Dual submission prevention (button disablement on `isPending`, keyboard form lock).
- Integration with backend business validation (handling HTTP 400, 409 Insufficient Funds, 409 Account Frozen/Closed, 422).
- Post-mutation cache invalidation triggering authoritative balance re-fetch (zero optimistic balance updates).
- Non-blocking toast notifications for transaction success with reference numbers.

### Success Criteria
Monetary operations execute accurately, prevent duplicate clicks, present backend business validation errors clearly, and refresh authoritative balances without optimistic calculation.

---

## Phase F3 — Financial History

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

## Phase F5 — Dashboard & Cross-Cutting Quality

### Objective
Implement the portfolio Dashboard, verify responsive layout behavior, enforce WCAG AA accessibility, and validate the end-to-end frontend build.

### Deliverables
- Dashboard page (`/dashboard`) displaying **exactly three metrics**:
  - Total Accounts
  - Active Accounts
  - Frozen Accounts
- Concurrently aggregated metrics via 3 lightweight parallel queries to `GET /accounts`.
- Quick action shortcuts to trigger Account Creation, Deposit, Withdrawal, and Transfer modals.
- Responsive layout verification across all 4 breakpoints (<640px, 640–1024px, 1024–1280px, >1280px with 1200px container cap).
- Accessibility audit: keyboard focus traps, `aria-live` region announcements, skip links, and color-independent status badges (WCAG 2.1 AA).
- Multi-tier automated testing:
  - Unit tests for `Money`, date formatters, and validators.
  - Component integration tests using Mock Service Worker (MSW).
  - Playwright E2E tests for critical financial journeys (creation -> deposit -> transfer -> audit trail).
- Production build validation (`npm run build`) generating optimized static `/dist` bundle without typecheck or lint warnings.

### Success Criteria
Dashboard accurately displays portfolio counts, UI is fully responsive and keyboard-accessible, and all automated unit, integration, and E2E tests pass cleanly.

---

# 9. Frontend Milestones Summary

| Milestone | Outcome | Status | Target Phase |
| :--- | :--- | :--- | :--- |
| **MF0** | Project Shell, Routing, Styling Tokens & API Foundation | COMPLETED (2026-09-23) | Phase F0 |
| **MF1** | Account Directory, Overview, Creation & Lifecycle | COMPLETED (2026-09-23) | Phase F1 |
| **MF2** | Deposit, Withdrawal & Transfer Workflows | UPCOMING (Next) | Phase F2 |
| **MF3** | Transactions, Ledger Entries & Event Stream History | UPCOMING | Phase F3 |
| **MF4** | Audit Trail & Historical Balance Reconstruction (`asOf`) | UPCOMING | Phase F4 |
| **MF5** | Dashboard, Responsive / A11y Polish & End-to-End Validation | UPCOMING | Phase F5 |

---

# 10. Future Enhancements (Beyond v1.0)

The following architectural and functional capabilities are intentionally excluded from the current Frontend v1.0 scope and will be evaluated in future project phases:

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
- Docker containerization and multi-container orchestration.
- Automated CI/CD deployment pipelines.
- Production monitoring, metrics collection, and OpenTelemetry tracing.

---

# 11. Roadmap Maintenance & Guiding Philosophy

This roadmap is a living document. As development progresses:
- Completed frontend phases will be marked with completion dates and test metrics.
- Architectural boundaries defined in `FRONTEND_ARCHITECTURE.md` must be maintained during implementation.
- New capabilities must not be added to the v1.0 roadmap without corresponding PRD and TRD updates.

> **"Build the foundation before the interface; build the interface to reflect the truth of the foundation."**

The backend is the immutable source of truth for the financial ledger. The frontend exists to provide clear, reliable, and accessible visibility into that truth. Every implementation phase builds directly upon the verified correctness of the layer beneath it.