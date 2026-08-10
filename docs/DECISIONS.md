# Architecture Decision Record (ADR)

**Project Name:** Event-Sourced Ledger (Double-Entry Bank Core)

**Document:** Architecture Decision Record (ADR)

**Version:** 1.0
---

# 1. Purpose

This document records significant architectural and technical decisions made throughout the lifecycle of the Event-Sourced Ledger project.

Unlike implementation documentation, an ADR explains:

- What decision was made.
- Why the decision was made.
- What alternatives were considered.
- What trade-offs were accepted.

The objective is to preserve engineering context so future contributors understand the reasoning behind the system rather than only its implementation.

This document is a living record and should be updated whenever a significant architectural decision is made.

---

# ADR-001

## Title

Backend-First Development Strategy

### Status

Accepted

### Context

The project contains both backend and frontend components.

Beginning both simultaneously would introduce unnecessary complexity before the financial engine has been validated.

### Decision

Develop the backend completely before beginning frontend implementation.

### Rationale

The backend defines:

- Business rules
- Financial invariants
- Database schema
- API contracts

The frontend should consume stable APIs rather than influence backend design.

### Consequences

Positive

- Stable API contracts
- Less frontend rework
- Better architectural separation

Negative

- No user interface during initial development

---

# ADR-002

## Title

Use Event Sourcing

### Status

Accepted

### Context

Traditional CRUD applications overwrite account balances.

Financial systems require complete historical traceability.

### Decision

Represent every financial operation as an immutable event.

Current state will be derived from event history.

### Alternatives Considered

- CRUD balance updates
- Mutable account records

### Rationale

Event sourcing provides:

- Complete history
- Auditability
- State reconstruction
- Better financial traceability

### Consequences

Positive

- Complete audit trail
- Historical replay
- Immutable history

Negative

- Increased implementation complexity
- Additional storage requirements

---

# ADR-003

## Title

Adopt Double-Entry Accounting

### Status

Accepted

### Context

Financial transactions must preserve accounting integrity.

### Decision

Every transaction must generate matching debit and credit ledger entries.

### Alternatives Considered

- Single balance updates

### Rationale

Double-entry accounting ensures financial correctness.

Every transaction remains balanced.

### Consequences

Positive

- Accounting integrity
- Easier auditing
- Financial correctness

Negative

- Additional implementation effort

---

# ADR-004

## Title

Balances Are Derived

### Status

Accepted

### Context

Many applications store account balances directly.

This introduces synchronization risks.

### Decision

Balances will always be computed from ledger history.

Stored balances are not considered the source of truth.

### Alternatives Considered

- Store current balance
- Update balance after each transaction

### Rationale

Derived balances eliminate synchronization issues.

The ledger remains the authoritative financial record.

### Consequences

Positive

- Single source of truth
- Replay capability
- Historical reconstruction

Negative

- Balance calculation may become slower as history grows

Future optimization:

- Snapshotting

---

# ADR-005

## Title

Use PostgreSQL

### Status

Accepted

### Context

The project requires a relational database.

### Decision

Use PostgreSQL.

### Alternatives Considered

- MySQL
- MariaDB

### Rationale

PostgreSQL offers:

- Strong ACID guarantees
- Excellent transactional support
- Mature ecosystem
- Industry adoption in financial systems

### Consequences

Positive

- Reliable transactions
- Better concurrency support

Negative

- Slight learning curve compared to previous projects

---

# ADR-006

## Title

Database Schema Managed with Flyway

### Status

Accepted

### Context

Schema evolution should remain version controlled.

### Decision

Manage schema changes through Flyway migrations.

### Alternatives Considered

- Hibernate automatic schema generation

### Rationale

Flyway provides:

- Version-controlled migrations
- Reproducible environments
- Better production practices

### Consequences

Positive

- Controlled schema evolution
- Easier deployments

Negative

- Additional migration scripts must be maintained

---

# ADR-007

## Title

Layered Architecture

### Status

Accepted

### Context

The application requires clear separation of responsibilities.

### Decision

Adopt a layered architecture consisting of:

- Presentation
- Application
- Domain
- Persistence

### Alternatives Considered

- Transaction Script
- Monolithic Service Classes

### Rationale

Layered architecture improves:

- Maintainability
- Testability
- Separation of concerns

### Consequences

Positive

- Cleaner codebase
- Easier testing
- Better modularity

Negative

- More project structure

---

# ADR-008

## Title

Business Logic Resides in the Domain

### Status

Accepted

### Context

Business rules should remain independent of infrastructure.

### Decision

Place financial rules inside the domain/service layer.

Controllers and repositories remain orchestration and persistence components respectively.

### Rationale

Separating business logic improves maintainability and reduces coupling.

### Consequences

Positive

- Easier testing
- Cleaner architecture

Negative

- Slightly more abstraction

---

# ADR-009

## Title

REST API Design

### Status

Accepted

### Context

The application exposes REST endpoints.

### Decision

Adopt resource-oriented REST APIs.

### Rationale

REST provides predictable, widely understood communication patterns.

### Consequences

Positive

- Familiar developer experience
- Easy integration

Negative

- None significant

---

# ADR-010

## Title

Financial Correctness Over Performance

### Status

Accepted

### Context

Performance optimizations can complicate financial systems.

### Decision

Prioritize correctness before optimization.

### Rationale

Incorrect financial data is unacceptable.

Optimization can be introduced later once correctness is established.

### Consequences

Positive

- Simpler implementation
- Reliable behavior

Negative

- Some operations may initially be slower

---

# ADR-011

## Title

Authentication Deferred

### Status

Accepted

### Context

The project's primary learning objective is financial domain modeling.

### Decision

Authentication and authorization are postponed until after Backend v1.0.

### Rationale

Separating concerns allows focus on:

- Event sourcing
- Ledger implementation
- Double-entry accounting
- Auditability

### Consequences

Positive

- Faster progress on core objectives
- Reduced complexity

Negative

- APIs are initially unsecured

---

# ADR-012

## Title

Backend Base Package

### Status

Accepted

### Context

The backend Java source requires a stable root package name.

Renaming the base package after development has begun is a project-wide refactoring operation affecting every Java file.

### Decision

Use `com.ledger` as the permanent backend Java base package.

### Alternatives Considered

- `com.example.ledger`
- `com.project.ledger`

### Rationale

`com.ledger` is concise, clearly identifies the project domain, and is consistent with the existing implementation established in Phase 0.

### Consequences

Positive

- Simple and readable
- Stable package identity throughout the project lifecycle

Negative

- Not a registered domain; acceptable for an educational project

---

# ADR-013

## Title

Flyway V1-First Strategy — No Artificial V0 Baseline

### Status

Accepted

### Context

Flyway can start with an empty migration set or with a V0 baseline migration.

An artificial V0 migration would create a permanent record in `flyway_schema_history` with no actual schema content.

### Decision

Do not create `V0__Baseline.sql`.

Flyway initializes in Phase 0 with an empty `db/migration/` directory.

The first real application migration will be `V1__Create_Accounts.sql`, introduced in Phase 1 when the Account entity is implemented.

### Alternatives Considered

- Create an empty `V0__Baseline.sql` to prove Flyway operational

### Rationale

Phase 0 introduces infrastructure only; business schema begins with the Account domain in Phase 1.

An empty V0 migration would be an artificial artifact with no schema content, permanently polluting migration history with a semantically meaningless entry.

Flyway successfully initializes its `flyway_schema_history` table and confirms zero pending migrations without any migration file present.

### Consequences

Positive

- Migration history remains clean and self-documenting
- V1 clearly signals the start of business schema evolution

Negative

- None

---

# ADR-014

## Title

Hibernate Schema Management Disabled

### Status

Accepted

### Context

Hibernate can automatically create, update, validate, or drop the database schema via the `ddl-auto` property.

All schema changes are managed through Flyway migrations (ADR-006).

### Decision

Set `spring.jpa.hibernate.ddl-auto=none` in all environments.

Hibernate must not create, update, validate, or drop the schema.

### Alternatives Considered

- `ddl-auto=validate`: validates entity mappings against the schema at startup; deferred to Phase 1 once entities exist
- `ddl-auto=update`: rejected; would allow Hibernate to modify schema outside version control

### Rationale

All schema changes must be controlled exclusively through Flyway migrations.

In Phase 0, no JPA entities exist, making `validate` semantically incorrect.

When the first entity is introduced in Phase 1, this decision should be revisited and `validate` adopted to detect mapping errors at startup.

### Consequences

Positive

- Schema remains exclusively under Flyway control
- No risk of unintended schema modifications

Negative

- Mapping errors between entities and schema will not be caught at startup until `ddl-auto=validate` is adopted in Phase 1

---

# ADR-015

## Title

Centralized Global Exception Handling

### Status

Accepted

### Context

Spring Boot applications require consistent error response formatting across all endpoints.

Without centralized handling, different exception types return different response structures (Whitelabel Error Page, Spring's default JSON error format, etc.), violating the API contract defined in API_GUIDELINES.md.

### Decision

Implement a single `GlobalExceptionHandler` annotated with `@RestControllerAdvice` that extends `ResponseEntityExceptionHandler`.

All infrastructure-level HTTP exceptions are handled in this class and return the project's standard `ApiError` JSON structure.

### Alternatives Considered

- Bare `@RestControllerAdvice` without extending `ResponseEntityExceptionHandler`
- Per-controller error handling

### Rationale

`ResponseEntityExceptionHandler` is Spring MVC's built-in base class that already handles standard framework exceptions, including `NoResourceFoundException` (the Spring Framework 6 replacement for the legacy `NoHandlerFoundException`).

Extending it ensures that 404 responses for missing routes return `ApiError` JSON rather than the Whitelabel Error Page, without requiring additional `application.properties` configuration.

A single centralized handler enforces a consistent API error contract across the entire application.

### Consequences

Positive

- Consistent `ApiError` JSON for all error conditions
- No Whitelabel Error Pages returned to API clients
- Correct 404 handling for missing routes under Spring Boot 3.x

Negative

- All exception handling logic is concentrated in one class; must be maintained as the application grows

---

# ADR-016

## Title

Spring Boot Version Selection

### Status

Accepted

### Context

The TRD mandates Spring Boot 3.x.

As of August 2026, Spring Boot 3.5.x reached its OSS End-of-Life on June 30, 2026, and is no longer receiving free security patches.

The current actively maintained Spring Boot generations are 4.0.x and 4.1.x.

The TRD does not permit moving to Spring Boot 4.x without a TRD amendment.

### Decision

Use Spring Boot 3.5.16, the final release of the 3.5.x line, as the most current release within the TRD's mandated 3.x generation.

### Alternatives Considered

- Spring Boot 4.0.x: supported through December 2026, but requires TRD amendment
- Spring Boot 4.1.x: current stable release as of June 2026, but requires TRD amendment

### Rationale

This is a learning and portfolio project rather than a production deployment.

Maintaining the TRD's stated 3.x constraint without amendment keeps the decision log consistent with the existing documented technical requirements.

The EOL status is acknowledged and accepted for the scope of this project.

If the project transitions toward production use, the TRD should be amended and the version upgraded.

### Consequences

Positive

- Consistent with the TRD's stated Spring Boot 3.x requirement
- No TRD amendment required

Negative

- 3.5.x no longer receives OSS security patches; acceptable for an educational project

---

# ADR-017

## Title

Database Credential Environment Variable Names

### Status

Accepted

### Context

Standard Spring Boot environment variable names for database credentials are `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.

Another project running in the same local development environment already uses those variable names, creating a conflict.

### Decision

Use project-specific environment variable names for all database credentials:

- `LEDGER_DB_URL`
- `LEDGER_DB_USERNAME`
- `LEDGER_DB_PASSWORD`

These are the only environment variables that this project reads for database connectivity.

No database connection strings, usernames, passwords, or secret values are stored in version-controlled files.

### Alternatives Considered

- Standard `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` names: rejected due to collision with an existing local project

### Rationale

The `LEDGER_` prefix namespaces the variables to this project, eliminating environment variable collisions when multiple projects run on the same development machine.

### Consequences

Positive

- No environment variable conflicts with other local projects
- Self-documenting: variable names identify the owning project

Negative

- Developers must configure `LEDGER_DB_*` variables rather than the more common default names

---

# ADR-018

## Title

Standard API Error Representation

### Status

Accepted

### Context

The API requires a consistent error response body structure across all endpoints.

API_GUIDELINES.md defines the standard error fields that every error response must include.

An error response object must be immutable; its fields are set at the moment of error construction and never modified.

### Decision

Represent the standard API error response body as a Java 21 record, `ApiError`, in the `com.ledger.common.exception` package.

`ApiError` contains the following fields, matching the API_GUIDELINES.md error contract:

- `timestamp` — ISO-8601 UTC instant when the error occurred
- `status` — HTTP status code
- `error` — HTTP reason phrase
- `message` — Human-readable description of the error
- `path` — Request URI that produced the error

`ApiError` is used by `GlobalExceptionHandler` as the single error response type returned for all handled exceptions.

### Alternatives Considered

- A mutable class with getters and setters
- A generic `Map<String, Object>` response

### Rationale

A Java record is an immutable data carrier by design, which matches the nature of an error response.

Records provide concise syntax and eliminate boilerplate without introducing external dependencies such as Lombok.

Using `ApiError` as the sole error response type enforces consistency across the API, ensuring every error condition returns the same structure.

### Consequences

Positive

- Error responses are structurally consistent across the entire API
- Immutability prevents accidental mutation of error state
- Fields directly map to the API_GUIDELINES.md error contract

Negative

- None

---

# Future Decisions

This document will continue to evolve.

Future ADRs may include:

- Optimistic Locking
- Snapshot Strategy
- Idempotency Keys
- Multi-Currency Support
- CQRS
- Kafka Integration
- Docker Strategy
- Testing Strategy
- Deployment Strategy
- Monitoring & Metrics

---

# ADR Guidelines

Every new decision should include:

- Title
- Status
- Context
- Decision
- Alternatives Considered
- Rationale
- Consequences

This ensures architectural decisions remain transparent, traceable, and understandable throughout the project's lifetime.

---

# Guiding Philosophy

> **"Code explains how the system works. Architecture decisions explain why it works that way."**

Every significant technical choice should be documented before it becomes institutional knowledge.

A well-maintained ADR log reduces ambiguity, preserves engineering intent, and helps the project evolve without losing its architectural direction.