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

## Objective

Implement basic monetary operations.

## Deliverables

- Deposit workflow
- Withdrawal workflow
- Validation rules
- Ledger generation
- Event creation

## Success Criteria

Deposits and withdrawals update ledger history correctly.

---

# Phase 5 — Transfer Engine

## Objective

Implement atomic account-to-account transfers.

## Deliverables

- Transfer workflow
- Debit generation
- Credit generation
- Atomic transactions
- Business validation

## Success Criteria

Transfers satisfy all accounting rules and remain atomic.

---

# Phase 6 — Balance Reconstruction

## Objective

Derive account balances from financial history.

## Deliverables

- Event replay
- Ledger replay
- Balance calculation
- Historical balance computation

## Success Criteria

Balances can always be reconstructed from stored history.

---

# Phase 7 — Audit Module

## Objective

Provide complete financial traceability.

## Deliverables

- Audit APIs
- Event timeline
- Transaction history
- Ledger history
- Historical reconstruction

## Success Criteria

Every balance can be fully explained through historical events.

---

# Phase 8 — API Refinement

## Objective

Improve API quality.

## Deliverables

- Pagination
- Sorting
- Filtering
- Consistent responses
- Validation improvements
- API documentation review

## Success Criteria

REST APIs are stable, consistent, and production-ready.

---

# Phase 9 — Testing & Hardening

## Objective

Improve reliability and code quality.

## Deliverables

- Unit tests
- Integration tests
- Business rule validation
- Error handling verification
- Performance review
- Documentation updates

## Success Criteria

Critical financial workflows are fully tested.

---

# Phase 10 — Backend v1.0 Release

## Objective

Prepare the first stable backend release.

## Deliverables

- Documentation review
- Code cleanup
- Migration verification
- Final testing
- Release tagging

## Success Criteria

Backend reaches production-quality standards.

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
| M9 | Stable REST API |
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