# Project Roadmap

**Project Name:** Event-Sourced Ledger (Double-Entry Bank Core)

**Version:** 1.0
---

# 1. Purpose

This document defines the implementation roadmap for the Event-Sourced Ledger project.

Unlike the Product Requirements Document (PRD), which defines **what** should be built, this roadmap defines **when** and **in what order** features should be implemented.

The roadmap intentionally focuses on **backend development first**.

Frontend development will begin only after the backend reaches a stable v1.0 release.

---

# 2. Roadmap Philosophy

The project follows these principles.

- Build from the domain outward.
- Prioritize correctness before convenience.
- Validate business rules before building UI.
- Complete one milestone before beginning the next.
- Keep every phase independently testable.

The backend serves as the foundation for the entire application.

---

# 3. Current Scope

This roadmap covers:

- Backend implementation
- Domain modeling
- Financial logic
- Database design
- REST APIs
- Testing
- Documentation

The following are intentionally excluded from this version of the roadmap:

- Frontend development
- Authentication
- Docker
- CI/CD
- Advanced distributed architecture

These will be planned after Backend v1.0.

---

# 4. Backend Development Roadmap

---

# Phase 0 — Project Foundation

**Status: COMPLETED — 2026-08-10**

## Objective

Establish the project foundation.

## Deliverables

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

## Success Criteria

Project starts successfully and development environment is fully operational.

---

# Phase 1 — Account Module

**Status: COMPLETED — 2026-08-12**

## Objective

Introduce the concept of financial accounts.

## Deliverables

- Account entity
- Account repository
- Account service
- Account APIs
- Account validation
- Account lifecycle management

## Success Criteria

Accounts can be created, retrieved, and managed successfully.

---

# Phase 2 — Ledger Foundation

**Status: COMPLETED — 2026-08-13**

## Objective

Build the accounting foundation.

## Deliverables

- Transaction model
- Ledger entry model
- Debit/Credit representation
- Double-entry rules
- Financial invariants

## Success Criteria

The application correctly models double-entry bookkeeping.

---

# Phase 3 — Event Store

**Status: COMPLETED — 2026-09-03**

## Objective

Introduce immutable financial history.

## Deliverables

- Event entity
- Event persistence
- Event recording
- Event retrieval
- Event replay foundation

## Success Criteria

Every financial action generates immutable events.

---

# Phase 4 — Deposit & Withdrawal Engine

**Status: COMPLETED — 2026-09-06**

## Objective

Implement basic monetary operations.

## Deliverables

- Deposit workflow
- Withdrawal workflow
- Double-entry ledger generation (SYS-CASH contra-account)
- Withdrawal balance validation from ledger history
- Per-account pessimistic row locking
- Event creation (DEPOSIT / WITHDRAWAL)
- SYS-CASH system contra-account seeded and isolated from public APIs

## Success Criteria

Deposits and withdrawals update ledger history correctly, maintain double-entry
balance invariants, and are protected against concurrent overdrafts via
per-account pessimistic row locking.

`mvn clean test` — **85 tests, 0 failures, BUILD SUCCESS**

---

# Phase 5 — Transfer Engine

**Status: COMPLETED — 2026-09-07**

## Objective

Implement atomic account-to-account transfers.

## Deliverables

- Transfer workflow (`POST /transfers`, `TransferController`, `TransferRequest`, `TransferResponse`)
- Debit generation (source account receives DEBIT)
- Credit generation (destination account receives equal CREDIT)
- Customer-to-customer double-entry ledger generation (no SYS-CASH participation)
- Business validation (existence, eligibility, SYS-CASH isolation, same-account rejection)
- Derived balance validation for source account
- Deterministic ascending account-ID pessimistic row locking and role restoration
- Event creation (`TRANSFER_DEBIT` and `TRANSFER_CREDIT` with null payload)
- Atomic transaction management with full rollback on failure

## Success Criteria

Transfers satisfy all double-entry accounting rules, execute atomically, eliminate
deadlocks under concurrent opposite-direction operations, and protect against
concurrent double-spending.

`mvn clean test` — **108 tests, 0 failures, BUILD SUCCESS**

---

# Phase 6 — Balance Reconstruction

**Status: COMPLETED — 2026-09-08**

## Objective

Derive account balances from financial history.

## Deliverables

- Event replay
- Ledger replay
- Balance calculation
- Historical balance computation

## Success Criteria

Balances can always be reconstructed from stored history.

`mvn clean test` — **126 tests, 0 failures, BUILD SUCCESS**

---

# Phase 7 — Audit Module

**Status: COMPLETED — 2026-09-13**

## Objective

Provide complete financial traceability.

## Deliverables

- Audit REST endpoints (`/accounts/{accountId}/audit/*`)
- Account event history timeline
- Account transaction history (event-derived ordering)
- Account ledger entry history
- Current and historical balance reconstruction (`asOf` parameter)
- Account audit trail with per-event financial effect and cumulative running balance
- Public API boundary enforcement with consistent `SYS-CASH` isolation (404)
- Constant-query batch loading ($O(1)$ relative to history length)

## Success Criteria

Every balance can be fully explained through historical events.

`mvn clean test` — **153 tests, 0 failures, BUILD SUCCESS**

---

# Phase 8 — API Refinement

**Status: COMPLETED — 2026-09-19**

## Objective

Improve API quality, predictability, and safety through deterministic pagination, safe sorting, dynamic filtering, and centralized validation.

## Deliverables

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

## Success Criteria

All collection endpoints support deterministic, drift-free pagination, bounded sorting, and filtering while preserving double-entry accounting invariants and event-derived reconstruction.

`mvn clean test` — **209 tests, 0 failures, BUILD SUCCESS**

---

# Phase 9 — Testing & Hardening

**Status: COMPLETED — 2026-09-21**

## Objective

Improve reliability, financial correctness, defensive validation, and concurrency safety.

## Deliverables

- P0: Core financial invariant verification (double-entry equilibrium, value conservation, deposit/withdrawal symmetry, replay parity)
- P1: REST API validation & business rule hardening (fractional cents rejection, error mapping uniformity, strict SYS-CASH isolation)
- Defensive validation at `LedgerService` boundary (transaction nullity, collection integrity, element reference match, debit/credit presence and balance)
- P2: Concurrency & thread safety verification (concurrent withdrawals with overdraft prevention, concurrent deposits, bidirectional deadlock-free transfers, mixed operations)
- Integration test suite expansion (`AccountServiceIntegrationTest`, `LedgerServiceIntegrationTest`, `AuditServiceIntegrationTest`, `TransactionServiceSysCashIntegrationTest`)
- Technical documentation updates

## Success Criteria

All critical financial workflows, accounting invariants, defensive service boundaries, and concurrent transaction execution are comprehensively tested against real PostgreSQL persistence.

`mvn clean test` — **244 tests, 0 failures, BUILD SUCCESS**

---

# Phase 10 — Backend v1.0 Release

**Status: COMPLETED — 2026-09-21**

## Objective

Prepare the first stable backend release.

## Deliverables

- Release-readiness audit completed across architecture, schema, APIs, and docs
- Code-quality cleanup (pom.xml version 1.0.0, OpenAPI version v1.0, centralized pagination constants, Transaction Swagger docs, dead setStatus removal, service indentation standardization)
- Database migration verification (Flyway V1–V5 verified, ddl-auto=validate compliant)
- Release-readiness verification completed
- Backend v1.0 release preparation completed

## Success Criteria

Backend reaches production-quality standards.

`mvn clean test` — **244 tests, 0 failures, BUILD SUCCESS**

---

# 5. Backend Milestones

| Milestone | Outcome |
|-----------|---------|
| M1 | Project Foundation Complete |
| M2 | Account Module Complete |
| M3 | Ledger Engine Complete |
| M4 | Event Store Complete |
| M5 | Monetary Operations Complete |
| M6 | Transfer Engine Complete |
| M7 | Balance Replay Complete |
| M8 | Audit Module Complete |
| M9 | Stable REST API Complete |
| M10 | Backend v1.0 |

---

# 6. Frontend Roadmap

Frontend implementation is intentionally deferred.

The frontend will begin only after:

- Backend APIs are stable.
- Business rules are finalized.
- Database schema has stabilized.
- API contracts are complete.

This minimizes rework and ensures the UI is built upon a reliable backend.

A dedicated frontend roadmap will be introduced after Backend v1.0.

---

# 7. Future Enhancements

After Backend v1.0, future phases may include:

- JWT Authentication
- Role-Based Authorization
- React Frontend
- Dashboard
- Transaction Visualization
- Ledger Explorer
- Snapshotting
- Optimistic Locking
- Idempotency Keys
- Multi-Currency Support
- CQRS
- Kafka Integration
- Docker
- CI/CD Pipeline
- Monitoring & Metrics

These enhancements will be planned separately to maintain focus on the core financial engine.

---

# 8. Roadmap Maintenance

This roadmap is a living document.

As the project evolves:

- Completed phases should be marked accordingly.
- New milestones may be added.
- Future enhancements may be reprioritized.
- Documentation should remain synchronized with implementation.

---

# 9. Definition of Backend Completion

Backend v1.0 is considered complete when:

- All core financial operations are implemented.
- Event sourcing functions correctly.
- Double-entry accounting is enforced.
- Balances are derived from historical events.
- Audit capabilities are available.
- APIs are stable.
- Database migrations are complete.
- Critical workflows are tested.
- Documentation is fully synchronized.

---

# 10. Guiding Philosophy

> **"Build the foundation before the interface."**

The backend is the source of truth for the entire application.

Only after the financial engine is complete, validated, and stable should frontend development begin.

Every subsequent phase builds upon the correctness established by the previous one.

The roadmap prioritizes reliability, maintainability, and incremental progress over rapid feature accumulation.