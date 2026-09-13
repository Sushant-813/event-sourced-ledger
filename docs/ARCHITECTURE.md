# Architecture Document

**Project Name:** Event-Sourced Ledger (Double-Entry Bank Core)

**Version:** 1.0
---

# 1. Purpose

This document defines the logical architecture of the Event-Sourced Ledger system.

Unlike the Product Requirements Document (PRD), which explains **what** the system should accomplish, and the Technical Requirements Document (TRD), which specifies **which technologies** will be used, this document explains **how the system is structured** and how its components collaborate to achieve the project's objectives.

The architecture is intentionally designed around financial correctness, auditability, maintainability, and future extensibility.

This document serves as the primary architectural reference for developers and AI agents throughout the project's lifecycle.

---

# 2. Architectural Goals

The architecture has been designed with the following primary goals.

## Financial Correctness

The system must always maintain accounting integrity.

No architectural decision should compromise the correctness of financial data.

---

## Immutable History

Every financial action is permanently preserved.

Historical records must never be modified or deleted.

---

## Auditability

Every balance should be explainable.

The system should always be capable of reconstructing the complete sequence of events that produced the current state.

---

## Separation of Concerns

Each component has a clearly defined responsibility.

Business logic, persistence, validation, and presentation remain isolated from one another.

---

## Maintainability

The system should be easy to understand, modify, and extend without introducing unnecessary complexity.

---

## Extensibility

The architecture should support future enhancements without requiring fundamental redesign.

---

# 3. High-Level System Overview

The system follows a layered architecture centered around the financial domain.

```
                 Client
                    │
                    ▼
             REST API Layer
                    │
                    ▼
          Application Layer
                    │
                    ▼
             Domain Layer
          ┌─────────┴─────────┐
          ▼                   ▼
     Ledger Engine      Event Store
          └─────────┬─────────┘
                    ▼
            Persistence Layer
```

Each layer communicates only with the layer directly beneath it.

The Domain Layer contains the core business rules and remains independent of infrastructure concerns.

---

# 4. Architectural Principles

## Principle 1 — Event First

Every meaningful financial operation is represented as an immutable event.

The system models business activities rather than mutable state.

---

## Principle 2 — Immutable Data

Historical records are append-only.

Corrections are represented by new events rather than modifying existing ones.

---

## Principle 3 — Derived State

Current account balances are derived from historical events.

Balance is never considered the primary source of truth.

---

## Principle 4 — Financial Integrity

Every financial transaction must preserve accounting correctness.

Business rules always take precedence over convenience or performance.

---

## Principle 5 — Layer Independence

Business logic must not depend on transport protocols, databases, or frameworks.

The domain should remain independent of infrastructure.

---

## Principle 6 — Explicit Business Rules

Business constraints should be implemented explicitly within the domain rather than being scattered throughout the application.

---

# 5. Layered Architecture

## Presentation Layer

Responsibilities:

- Receive client requests
- Validate request format
- Return responses
- Translate exceptions into HTTP responses

This layer contains no business logic.

---

## Application Layer

Responsibilities:

- Coordinate application workflows
- Invoke domain operations
- Manage transactions
- Orchestrate use cases

This layer coordinates business activities but does not implement business rules.

---

## Domain Layer

Responsibilities:

- Financial rules
- Account behavior
- Transaction validation
- Event creation
- Ledger integrity
- Balance calculation

This is the heart of the application.

Every business rule belongs here.

---

## Persistence Layer

Responsibilities:

- Store domain data
- Retrieve domain data
- Persist immutable events
- Manage database interaction

This layer contains no financial business logic.

---

# 6. Core Domain Model

The following concepts define the language of the system.

---

## Account

Represents an entity capable of holding monetary value.

Responsibilities:

- Own financial history
- Participate in transactions
- Produce derived balances

---

## Event

Represents an immutable historical fact.

Examples include:

- Account Created
- Money Deposited
- Money Withdrawn
- Transfer Completed

Events are never modified once recorded.

---

## Transaction

Represents a complete financial operation.

A transaction groups together one or more ledger entries that must succeed or fail as a single unit.

---

## Ledger Entry

Represents an individual debit or credit.

Ledger entries collectively satisfy double-entry accounting rules.

---

## Ledger

Represents the complete financial history of the system.

It acts as the authoritative source of all monetary activity.

---

## Audit Trail

Represents the reconstructed explanation of how the current financial state was reached.

---

# 7. Request Lifecycle

Every incoming request follows a predictable lifecycle.

```
Client Request
       │
       ▼
Request Validation
       │
       ▼
Application Workflow
       │
       ▼
Business Rule Validation
       │
       ▼
Financial Transaction
       │
       ▼
Event Creation
       │
       ▼
Persistence
       │
       ▼
Response Generation
```

Each stage has a single responsibility.

---

# 8. Event Flow

Every financial action produces one or more immutable events.

```
Deposit Request
       │
       ▼
Validate Rules
       │
       ▼
Create Event
       │
       ▼
Persist Event
       │
       ▼
Update Ledger History
       │
       ▼
Derived Balance
```

The balance is always the consequence of recorded events.

---

# 9. Transaction Flow

A transfer operation illustrates the complete financial workflow.

```
Transfer Request
        │
        ▼
Validate Accounts
        │
        ▼
Validate Business Rules
        │
        ▼
Create Transaction
        │
        ▼
Create Debit Entry
        │
        ▼
Create Credit Entry
        │
        ▼
Persist Events
        │
        ▼
Commit Transaction
```

If any step fails, the entire transaction is rolled back.

---

# 10. Data Flow

Information moves through the application in a single direction.

```
Client
   │
   ▼
Presentation Layer
   │
   ▼
Application Layer
   │
   ▼
Domain Layer
   │
   ▼
Persistence Layer
   │
   ▼
Database
```

Responses follow the reverse path.

The direction of dependencies always points inward toward the domain.

---

# 11. Module Responsibilities

The system is organized into cohesive modules.

---

## Account Module

Responsible for:

- Account lifecycle
- Account information
- Account history

---

## Transaction Module

Responsible for:

- Money movement
- Transfer coordination
- Transaction validation

---

## Ledger Module

Responsible for:

- Double-entry bookkeeping
- Debit/Credit generation
- Ledger consistency

---

## Event Module

Responsible for:

- Event creation
- Event storage
- Event replay

---

## Audit Module

Responsible for:

- Historical reconstruction
- Financial traceability
- Balance explanation

---

## Common Module

Responsible for:

- Shared utilities
- Exceptions
- Validation
- Common abstractions

---

# 12. Dependency Rules

The architecture follows strict dependency rules.

Allowed dependencies:

```
Presentation
      │
      ▼
Application
      │
      ▼
Domain
      │
      ▼
Persistence
```

Forbidden dependencies include:

- Persistence depending on Presentation
- Domain depending on REST APIs
- Domain depending on database implementation
- Controllers accessing repositories directly
- Business rules inside controllers

Maintaining these boundaries keeps the architecture clean and maintainable.

---

# 13. Error Handling Flow

Errors follow a centralized processing pipeline.

```
Request
    │
    ▼
Validation
    │
    ▼
Business Exception
    │
    ▼
Central Exception Handler
    │
    ▼
Standard Error Response
```

This ensures consistency across the application.

---

# 14. Architectural Constraints

The following constraints must always be respected.

- Events are immutable.
- Financial history cannot be deleted.
- Every transaction must remain balanced.
- Partial transfers are prohibited.
- Business rules remain inside the domain.
- Layers must not violate dependency rules.
- Historical reconstruction must always be possible.

These constraints are considered architectural invariants.

---

# 15. Phase 4 Monetary Operation Workflow

Phase 4 implements deposit and withdrawal as the first real monetary operations.
Each follows the same orchestration pattern, owned entirely by `TransactionServiceImpl`.

## Request Lifecycle

```
Customer Request (POST /accounts/{accountId}/deposit or /withdrawal)
        │
        ▼
Request Validation (@Valid DepositRequest / WithdrawalRequest, @Positive accountId)
        │
        ▼
Acquire customer Account row with PESSIMISTIC_WRITE lock
(AccountRepository.findByIdForUpdate)
        │
        ▼
Business Validation
 - Reject SYS-CASH target → AccountNotFoundException (404)
 - Reject FROZEN / CLOSED account → AccountNotEligibleForTransactionException (422)
        │
        ▼
Withdrawal only: Derive balance from LedgerEntry aggregation
 - Reject if balance < amount → InsufficientFundsException (422)
        │
        ▼
Retrieve SYS-CASH contra-account (findByAccountNumber)
 - Absent → IllegalStateException (500)
        │
        ▼
Create Transaction (UUID reference number, COMPLETED status)
        │
        ▼
Construct balanced LedgerEntry pair
 Deposit:    SYS-CASH DEBIT  /  Customer CREDIT
 Withdrawal: Customer DEBIT  /  SYS-CASH CREDIT
        │
        ▼
Persist via LedgerService.recordTransaction
(validates double-entry invariants; saves Transaction + LedgerEntries)
        │
        ▼
Record DEPOSIT / WITHDRAWAL Event via EventService.recordEvent
(payload = null; occurred_at caller-supplied)
        │
        ▼
Commit atomically
(PESSIMISTIC_WRITE lock released; all writes visible or none)
        │
        ▼
Return TransactionResponse (201 Created)
```

## Transaction Boundary

`TransactionServiceImpl` owns the outer `@Transactional(rollbackFor = Exception.class)`
boundary. `LedgerService` and `EventService` participate in this same transaction —
they do not open independent transactions. Any unchecked exception thrown at any step
causes a full rollback, preserving the atomicity of the entire deposit or withdrawal.

## Concurrency Model

The customer `Account` row is locked with `PESSIMISTIC_WRITE` before any financial
state is read or written. This provides per-account serialization of concurrent
monetary operations targeting the same account, preventing concurrent overdrafts.

This is not database-wide SERIALIZABLE isolation. Only the single customer account
row is serialized; unrelated accounts proceed concurrently.

See ADR-025 for the full rationale.

## SYS-CASH

`SYS-CASH` is an internal contra-account used to satisfy double-entry accounting
for single-account monetary operations. It is not visible through any public API
(see ADR-024 and `docs/DATABASE_DESIGN.md` §17).

Domain financial rules — including account eligibility, balance calculation, and
the double-entry invariant — remain entirely within the service layer. The controller
handles only HTTP concerns.

---

# 16. Phase 5 Transfer Workflow

Phase 5 implements customer-to-customer transfers as an atomic double-entry operation
between two distinct active accounts, owned entirely by `TransactionServiceImpl`.

## Request Lifecycle

```
Customer Request (POST /transfers)
        │
        ▼
Request Validation (@Valid TransferRequest: positive IDs, valid amount)
        │
        ▼
Validate same-account rejection
 - Reject if sourceAccountId == destinationAccountId → InvalidTransferException (422)
        │
        ▼
Acquire pessimistic row locks in ascending account-ID order
 - lowerId = min(sourceAccountId, destinationAccountId)
 - higherId = max(sourceAccountId, destinationAccountId)
 - AccountRepository.findByIdForUpdate(lowerId)
 - AccountRepository.findByIdForUpdate(higherId)
        │
        ▼
Restore account roles
 - Map lower/higher entity instances back to sourceAccount and destinationAccount
        │
        ▼
Business Validation
 - Missing account → AccountNotFoundException (404)
 - Reject if source or destination resolves to SYS-CASH → AccountNotFoundException (404)
 - Reject if source or destination status != ACTIVE → AccountNotEligibleForTransactionException (422)
        │
        ▼
Derive source balance from LedgerEntry aggregation
 (LedgerEntryRepository.computeBalanceByAccountId)
 - Reject if sourceBalance < amount → InsufficientFundsException (422)
        │
        ▼
Create Transaction (UUID reference number, TRANSFER type, COMPLETED status)
        │
        ▼
Construct balanced LedgerEntry pair (direct customer-to-customer; no SYS-CASH)
 - Source Account:      DEBIT  amount
 - Destination Account: CREDIT amount
        │
        ▼
Persist via LedgerService.recordTransaction
 (validates double-entry invariants; saves Transaction + LedgerEntries)
        │
        ▼
Record immutable Events via EventService.recordEvent
 - Source Account:      TRANSFER_DEBIT  (payload = null)
 - Destination Account: TRANSFER_CREDIT (payload = null)
        │
        ▼
Commit atomically
 (both PESSIMISTIC_WRITE locks released; all writes visible or none)
        │
        ▼
Return TransferResponse (201 Created)
```

## Transaction Boundary

`TransactionServiceImpl.transfer` owns the outer `@Transactional(rollbackFor = Exception.class)`
boundary. Locking, account validation, balance verification, transaction creation, ledger
entry persistence, and event generation all occur within this single database transaction.
If any step fails or throws an exception, the entire transaction rolls back atomically.

## Deadlock Prevention & Concurrency Model

Customer transfers lock two account rows within a single transaction. To prevent cyclic
deadlocks (Coffman's circular wait condition) between concurrent transfers in opposite
directions (`Account A → Account B` vs `Account B → Account A`), locks are strictly acquired
in ascending numerical order of account IDs (`min` then `max`).

After both locks are acquired, domain roles (`sourceAccount` and `destinationAccount`) are
restored. Holding write locks on both accounts for the duration of the transaction prevents
concurrent double-spending and ensures that the source account's derived balance check
remains authoritative.

See ADR-026 for the full architectural rationale.

## Accounting & Event Semantics

- **No SYS-CASH participation:** Customer transfers represent a direct transfer of funds
  between two customer accounts; `SYS-CASH` is reserved for single-account deposits and
  withdrawals.
- **Balanced ledger entries:** One `DEBIT` entry on the source account and one equal `CREDIT`
  entry on the destination account satisfy the double-entry accounting invariant.
- **Dual events:** Two events are recorded (`TRANSFER_DEBIT` and `TRANSFER_CREDIT`), each linked
  to the respective account, sharing the same transaction ID and timestamp, with null payloads.

---

# 17. Phase 7 — Audit Module & Financial Traceability Architecture

Phase 7 introduces the public audit and financial traceability layer. Built strictly as a read-only
query surface over the immutable records established in Phases 1–6, the Audit Module fulfills the
project's guiding philosophy: every balance must be explainable from historical events.

```
Client Request
      │
      ▼
Presentation Layer: AuditController (/accounts/{accountId}/audit/*)
 - Validates @Positive accountId path variable
 - Parses optional ISO-8601 OffsetDateTime asOf query parameter
 - Returns standard DTO records; delegates all logic to AuditService
      │
      ▼
Application Layer: AuditServiceImpl
 - Step 1: validatePublicAccount(accountId)
     • Checks account existence in AccountRepository (throws 404 if absent)
     • Rejects SYS-CASH system account (throws 404 to preserve public boundary)
 - Step 2: Query Execution & Batch Loading (O(1) queries relative to history)
     • Queries events via EventRepository (occurred_at ASC, id ASC)
     • Batch-loads transactions via TransactionRepository.findAllById
     • Batch-loads ledger entries via LedgerEntryRepository.findByTransactionIdIn
     • Queries ledger entries via LedgerEntryRepository.findByAccountId
 - Step 3: Reconstruction & Transformation
     • Delegates balance calculation to BalanceReconstructionService
     • Orders transactions by event first-occurrence sequence
     • Calculates signed financial effects from ledger entries (CREDIT - DEBIT)
     • Computes sequential running balances for the audit trail
      │
      ▼
Persistence Layer & Repositories
 - AccountRepository, EventRepository, TransactionRepository, LedgerEntryRepository
 - BalanceReconstructionService
      │
      ▼
Response DTO Records (200 OK)
 - AccountEventResponse, AccountTransactionResponse, AccountLedgerEntryResponse
 - AuditBalanceResponse, AuditTrailResponse
```

## Core Architectural Decisions

### 1. Separation of Event Chronology and Ledger Financial Effect

The audit trail unites two distinct dimensions of the system:
- **Events** describe *what happened and when* (business event metadata, timestamps).
- **Ledger Entries** describe the *exact financial effect* (monetary amounts, entry types).

The monetary effect of an event is **never inferred from its `EventType`**. Instead, for each
monetary event, the service locates the account's matching ledger entries in the associated
transaction and derives the signed balance change:
$$\text{balanceChange} = \sum \text{CREDIT amounts for account} - \sum \text{DEBIT amounts for account}$$

Multiple ledger entries for the same account within a single transaction are summed.

### 2. Lifecycle Event Representation

Non-monetary lifecycle events (`ACCOUNT_CREATED`) do not move funds. In the audit trail:
- `balanceChange = BigDecimal.ZERO`
- `runningBalance = previousRunningBalance` (initiates at `0.00` for initial account creation)
- `transactionId = null` and `referenceNumber = null`

This guarantees a consistent numeric structure for API consumers without requiring null-checking.

### 3. Event-Derived Transaction History Ordering

The `Transaction` entity does not contain an account foreign key; the association is indirect
through events and ledger entries. Sorting transactions merely by `Transaction.createdAt` could
misalign with the account's actual event timeline.

Therefore, transaction history ordering is derived from the account's monetary event sequence:
1. Events are retrieved ordered by `occurred_at ASC, id ASC`.
2. Distinct transaction IDs are collected preserving their first occurrence order.
3. Transactions are batch-loaded via `transactionRepository.findAllById(transactionIds)`.
4. The response list is reconstructed in the exact order of first occurrence.

### 4. Public Account Boundary & SYS-CASH Invariance

All public audit endpoints enforce a strict account boundary through `validatePublicAccount(Long accountId)`:
- Non-existent account IDs throw `AccountNotFoundException` (404).
- Lookups resolving to `SYS-CASH` throw `AccountNotFoundException` (404).

This boundary check occurs at the service entry point before executing queries or delegating to
`BalanceReconstructionService`, ensuring consistent 404 responses and shielding callers from internal
`IllegalStateException` exceptions.

### 5. Constant-Query Batch Loading (O(1) Queries)

All audit endpoints execute in a constant number of database queries regardless of historical record
count. No database queries occur inside per-record iteration loops:
- **Event History:** 2 queries (account validation + event lookup)
- **Transaction History:** 3 queries (account validation + event lookup + batch transaction lookup)
- **Ledger History:** 3 queries (account validation + ledger lookup + batch transaction lookup)
- **Balance Query:** 2 queries (account validation + `BalanceReconstructionService`)
- **Audit Trail:** 4 queries (account validation + event lookup + batch transaction lookup + batch ledger lookup)

---

# 18. Future Architecture Evolution

The current architecture intentionally focuses on a single-service implementation.

Future iterations may introduce:

- Snapshotting
- Optimistic Locking
- Idempotency
- Read Models
- CQRS
- Event Streaming
- Distributed Messaging
- Multi-Currency Support
- Reporting Services
- Monitoring & Metrics

These enhancements should extend the existing architecture rather than replace it.

---

# 19. Guiding Philosophy

> **\"Financial systems should preserve history, not overwrite it.\"**

The architecture is designed around immutable financial events instead of mutable balances.

Every component exists to support one fundamental objective:

**Ensure that every financial state can always be explained, reconstructed, and verified from its complete history.**

Correctness takes priority over convenience.

Auditability takes priority over optimization.

History is the system's single source of truth.