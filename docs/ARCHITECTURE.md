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

# 15. Future Architecture Evolution

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

# 16. Guiding Philosophy

> **"Financial systems should preserve history, not overwrite it."**

The architecture is designed around immutable financial events instead of mutable balances.

Every component exists to support one fundamental objective:

**Ensure that every financial state can always be explained, reconstructed, and verified from its complete history.**

Correctness takes priority over convenience.

Auditability takes priority over optimization.

History is the system's single source of truth.