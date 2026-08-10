# Product Requirements Document (PRD)

**Project Name:** Event-Sourced Ledger (Double-Entry Bank Core)  
**Version:** 1.0  
---

# 1. Project Overview

## Purpose

The Event-Sourced Ledger is a backend application that models the core accounting engine used in financial systems. Unlike traditional CRUD applications that directly modify account balances, this system records every financial action as an immutable event and derives the current state from historical events.

The project is intended to demonstrate production-oriented backend engineering practices including event sourcing, double-entry bookkeeping, transactional consistency, auditability, and financial correctness.

Although inspired by banking systems, the architecture is applicable to many domains requiring complete historical traceability, including fintech, accounting platforms, payment processors, digital wallets, insurance systems, and enterprise audit systems.

---

# 2. Problem Statement

Traditional CRUD-based financial applications typically maintain an account balance as a mutable database field.

Example:

```
Account
-------
Balance = ₹12,500
```

Whenever money is deposited or withdrawn, the balance is updated directly.

While simple, this approach introduces several problems:

- Historical balances are lost.
- Complete audit trails become difficult.
- Bugs can silently corrupt balances.
- It becomes impossible to reconstruct previous states.
- Financial investigations become expensive.
- Concurrent updates increase the risk of inconsistent balances.

Financial systems require a fundamentally different approach.

Instead of storing only the latest balance, they store every financial event that has occurred.

Current balances are derived from those historical events rather than being treated as the primary source of truth.

---

# 3. Vision

Build a reliable financial ledger that prioritizes correctness over convenience.

The application should ensure that:

- Every financial action is permanently recorded.
- Historical data is never destroyed.
- Every balance can be reconstructed from history.
- Every transfer satisfies double-entry accounting rules.
- Every transaction is fully auditable.
- Data integrity is maintained even under concurrent operations.

---

# 4. Objectives

The primary objectives of this project are:

- Implement an immutable event store.
- Learn and apply Event Sourcing architecture.
- Implement proper Double-Entry Accounting.
- Maintain transactional consistency.
- Support balance reconstruction through event replay.
- Build a complete audit trail.
- Prevent invalid financial operations.
- Demonstrate production-quality backend architecture.

---

# 5. Target Users

Although this is an educational project, it models software intended for several user types.

## 5.1 Customer

Responsible for managing their own accounts.

Capabilities:

- View account details
- Deposit money
- Withdraw money
- Transfer funds
- View account history
- View current balance

---

## 5.2 Auditor

Responsible for verifying financial correctness.

Capabilities:

- Inspect complete event history
- Reconstruct balances
- Verify transaction integrity
- Investigate historical account state
- Generate audit reports

---

## 5.3 System Administrator

Responsible for operational monitoring.

Capabilities:

- View ledger health
- Monitor transactions
- Inspect failed operations
- Review system metrics
- Maintain operational integrity

---

# 6. Core Business Principles

The following principles define the system and must never be violated.

---

## Principle 1 — Events are Immutable

Once recorded, an event can never be modified or deleted.

Corrections are represented by creating new compensating events rather than editing historical records.

---

## Principle 2 — Balance is Derived

Current account balance is never treated as the source of truth.

The balance is computed from historical events.

---

## Principle 3 — Double-Entry Accounting

Every financial transaction must contain matching debit and credit entries.

For every transaction:

```
Total Debits = Total Credits
```

If this condition is not satisfied, the transaction must be rejected.

---

## Principle 4 — Complete Auditability

Every financial action must be traceable.

The system should always be able to answer:

- What happened?
- When did it happen?
- Why did it happen?
- Which accounts were involved?
- Which transaction produced this balance?

---

## Principle 5 — Financial Correctness

The system must prioritize correctness over performance.

No operation should ever compromise accounting integrity.

---

# 7. Functional Requirements

## Account Management

The system shall support:

- Account creation
- Account lookup
- Account status retrieval
- Account history retrieval

---

## Money Deposit

The system shall:

- Accept deposits
- Record immutable events
- Update derived balance
- Produce ledger entries

---

## Money Withdrawal

The system shall:

- Validate available balance
- Reject insufficient funds
- Record withdrawal events
- Produce ledger entries

---

## Fund Transfer

The system shall:

- Transfer funds between accounts
- Create debit and credit entries
- Execute atomically
- Reject partial transfers

---

## Event History

The system shall provide:

- Complete event timeline
- Chronological event ordering
- Event metadata
- Historical reconstruction

---

## Balance Calculation

The system shall:

- Compute balances from event history
- Support event replay
- Support historical balance reconstruction

---

## Audit Trail

The system shall provide:

- Complete transaction history
- Ledger explanation
- Event sequence
- Financial traceability

---

# 8. Non-Functional Requirements

## Reliability

The system must ensure:

- No lost financial events
- Atomic transactions
- Consistent data
- Reliable persistence

---

## Consistency

Financial invariants must always be maintained.

Examples include:

- No partial transfers
- Balanced ledger entries
- Valid account references
- Correct transaction state

---

## Performance

Initial implementation should prioritize correctness over optimization.

Performance improvements may be introduced later through techniques such as snapshotting.

---

## Maintainability

The architecture should support:

- Modular design
- Clear separation of responsibilities
- Testability
- Future extensibility

---

## Scalability

The architecture should allow future support for:

- Larger event stores
- Higher transaction volume
- Distributed processing
- Multiple currencies

---

# 9. Scope

## Included

Phase 1 focuses on:

- Event storage
- Account management
- Deposits
- Withdrawals
- Transfers
- Double-entry accounting
- Event replay
- Balance calculation
- Audit trail
- REST APIs
- PostgreSQL persistence

---

## Out of Scope

The following are intentionally excluded from the initial implementation:

- Authentication & Authorization
- Frontend application
- Kafka
- CQRS
- Distributed microservices
- Message brokers
- Notifications
- Currency conversion
- Scheduled jobs
- Interest calculations
- Fraud detection

These features may be introduced in future iterations.

---

# 10. Success Criteria

The project will be considered successful when it satisfies the following conditions.

## Functional Success

- Accounts can be created successfully.
- Deposits function correctly.
- Withdrawals enforce business rules.
- Transfers remain atomic.
- Every transaction produces balanced ledger entries.
- Event replay reconstructs balances accurately.
- Historical balances can be retrieved.
- Complete audit history is available.

---

## Technical Success

- REST APIs follow clean design principles.
- Database schema maintains integrity.
- Codebase follows layered architecture.
- Business rules remain isolated from infrastructure concerns.
- System is thoroughly testable.

---

## Learning Success

Upon completion, the project should demonstrate understanding of:

- Event Sourcing
- Double-Entry Accounting
- Financial Domain Modeling
- Transaction Management
- Data Integrity
- Event Replay
- Auditability
- Production-Oriented Backend Design

---

# 11. Future Roadmap

Future versions may include:

- Snapshotting
- Optimistic Locking
- Idempotent Requests
- Multi-Currency Ledger
- Exchange Rate Support
- JWT Authentication
- Role-Based Authorization
- CQRS
- Kafka Event Publishing
- Read Models
- Reporting Engine
- Docker Deployment
- Integration Testing
- Performance Benchmarking

---

# 12. Definition of Done

The project is considered complete when:

- All core business requirements are implemented.
- All financial invariants are enforced.
- Every transaction is fully auditable.
- Historical state reconstruction is accurate.
- Event replay produces deterministic balances.
- Documentation is complete.
- APIs are documented.
- Database migrations are version controlled.
- Code follows project standards.
- Tests validate critical business behavior.

---

# 13. Guiding Philosophy

> **"Money is not state. Money is history."**

The ledger does not remember *what the balance is*.

It remembers **everything that happened**.

The balance is simply the result of replaying that history.

This philosophy drives every architectural and implementation decision within the project.