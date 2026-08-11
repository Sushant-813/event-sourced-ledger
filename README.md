# Event-Sourced Ledger

A learning and portfolio backend implementation of a **double-entry financial ledger** built
on event sourcing principles.

Rather than storing account balances as mutable fields, this system is designed so that every
financial action is recorded as an immutable event. Current state will always be derived from
that historical record — never stored as the source of truth. This design prioritises
correctness, complete auditability, and the ability to reconstruct any past state from history
alone.

> **Development is incremental.** Event sourcing, ledger processing, deposits, withdrawals,
> transfers, and balance reconstruction are later roadmap phases. See the
> [Development Roadmap](#development-roadmap) below for what is currently complete.

---

## Current Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Project Foundation | **COMPLETED** (2026-08-10) |
| Phase 1 | Account Module | **COMPLETED** (2026-08-12) |
| Phase 2 | Ledger Foundation | **NEXT** |
| Phase 3 | Event Store | Pending |
| Phase 4 | Deposit & Withdrawal Engine | Pending |
| Phase 5 | Transfer Engine | Pending |
| Phase 6 | Balance Reconstruction | Pending |
| Phase 7 | Audit Module | Pending |
| Phase 8 | API Refinement | Pending |
| Phase 9 | Testing & Hardening | Pending |
| Phase 10 | Backend v1.0 Release | Pending |

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
Tests run: 32, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

---

## Architecture

The backend follows a strict four-layer architecture:

```
Presentation  →  AccountController
Application   →  AccountService / AccountServiceImpl
Domain        →  Account entity, enums, DTOs, exceptions
Persistence   →  AccountRepository
Database      →  PostgreSQL (schema managed by Flyway)
```

- **No business logic in controllers.** Controllers handle HTTP concerns only.
- **No persistence logic in services.** Services delegate all database access to repositories.
- **Entities are never exposed directly** through the REST layer; all responses use DTOs.
- **Constructor injection** is used throughout.

The long-term design is event-sourced: financial history is intended to be immutable and
authoritative, with current state derived by replaying that history. Event sourcing
infrastructure is planned for Phase 3.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the complete architectural specification.

---

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Language | Java | 21 (LTS) |
| Framework | Spring Boot | 3.5.16 |
| Build Tool | Maven | — |
| Database | PostgreSQL | — |
| ORM | Spring Data JPA / Hibernate | — |
| Schema Migration | Flyway | — |
| Validation | Jakarta Validation | — |
| API Documentation | Swagger / OpenAPI 3 (springdoc) | 2.8.13 |
| Logging | SLF4J / Logback | — |
| Testing | JUnit 5 / Mockito / Spring Boot Test | — |

---

## Current API

Phase 1 implements the following Account endpoints. All responses conform to the standard
`ApiError` error structure on failure.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/accounts` | Create a new account (returns 201) |
| `GET` | `/accounts` | Paginated list of all accounts |
| `GET` | `/accounts/{id}` | Get a single account by internal ID |
| `GET` | `/accounts/by-number/{accountNumber}` | Get a single account by business account number |
| `PATCH` | `/accounts/{id}/freeze` | Transition account from `ACTIVE` to `FROZEN` |
| `PATCH` | `/accounts/{id}/activate` | Transition account from `FROZEN` to `ACTIVE` |
| `PATCH` | `/accounts/{id}/close` | Transition account to `CLOSED` (terminal state) |

Interactive API documentation is available at `/swagger-ui.html` when the application is
running.

---

## Database

- **PostgreSQL** is the relational database.
- **Flyway** is the sole schema authority. Hibernate does not create, modify, or drop schema
  objects.
- **Phase 1 migration:** `V1__Create_Accounts.sql` — creates the `accounts` table with
  `NOT NULL` constraints, `CHECK` constraints on `account_type` and `status`, and the
  `UK_accounts_account_number` unique constraint.
- `spring.jpa.hibernate.ddl-auto=validate` — Hibernate validates the `Account` entity mapping
  against the live schema on every startup.

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

---

## Testing

Phase 1 test suite (`mvn clean test`):

| Test class | Type | Tests |
|---|---|---|
| `AccountServiceImplTest` | Unit (Mockito, no DB) | 17 |
| `AccountControllerTest` | API layer (MockMvc + `GlobalExceptionHandler`) | 14 |
| `LedgerApplicationTests` | Context smoke test (full Spring Boot, PostgreSQL required) | 1 |

**Verified result:**

```
Tests run: 32, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

---

## Repository Structure

```
event-sourced-ledger/
├── ai/
│   └── AI_DEVELOPMENT_ENVIRONMENT.md   # AI-assisted development configuration
├── backend/
│   ├── pom.xml                          # Maven project descriptor
│   └── src/
│       ├── main/
│       │   ├── java/com/ledger/         # Application source
│       │   └── resources/
│       │       ├── application.properties
│       │       ├── logback-spring.xml
│       │       └── db/migration/        # Flyway SQL migrations
│       └── test/
│           └── java/com/ledger/         # Test source
├── docs/                                # Project documentation
├── .gitignore
└── README.md                            # This file
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [PRD](docs/PRD.md) | Business objectives, problem statement, and success criteria |
| [TRD](docs/TRD.md) | Technology stack, dependencies, and technical requirements |
| [Architecture](docs/ARCHITECTURE.md) | System architecture, layers, and design principles |
| [Database Design](docs/DATABASE_DESIGN.md) | Schema design, entities, constraints, and migration strategy |
| [API Guidelines](docs/API_GUIDELINES.md) | REST conventions, request/response format, and error handling |
| [Coding Standards](docs/CODING_STANDARDS.md) | Code style, structure, and implementation guidelines |
| [Project Roadmap](docs/PROJECT_ROADMAP.md) | Phased implementation plan and milestones |
| [Architecture Decisions](docs/DECISIONS.md) | Architecture Decision Records (ADR-001 through ADR-019) |
| [Project Log](docs/PROJECT_LOG.md) | Chronological record of completed milestones |

---

## Development Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Project Foundation | **COMPLETED** |
| Phase 1 | Account Module | **COMPLETED** |
| Phase 2 | Ledger Foundation | **NEXT** |
| Phase 3 | Event Store | Pending |
| Phase 4 | Deposit & Withdrawal Engine | Pending |
| Phase 5 | Transfer Engine | Pending |
| Phase 6 | Balance Reconstruction | Pending |
| Phase 7 | Audit Module | Pending |
| Phase 8 | API Refinement | Pending |
| Phase 9 | Testing & Hardening | Pending |
| Phase 10 | Backend v1.0 Release | Pending |

See [docs/PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md) for the full phased plan and
deliverables.

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
[ai/AI_DEVELOPMENT_ENVIRONMENT.md](ai/AI_DEVELOPMENT_ENVIRONMENT.md).
