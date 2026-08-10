# Event-Sourced Ledger

A production-oriented backend implementation of a **double-entry financial ledger** built on event sourcing principles.

Rather than storing account balances as mutable fields, this system is designed so that every financial action is recorded as an immutable event. Current state will always be derived from that historical record — never stored as the source of truth. This design prioritises correctness, complete auditability, and the ability to reconstruct any past state from history alone.

---

## Project Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Project Foundation | **COMPLETED** (2026-08-10) |
| Phase 1 | Account Module | **NEXT ACTIVE PHASE** |
| Phase 2 | Ledger Foundation | Pending |
| Phase 3 | Event Store | Pending |
| Phase 4 | Deposit & Withdrawal Engine | Pending |
| Phase 5 | Transfer Engine | Pending |
| Phase 6 | Balance Reconstruction | Pending |
| Phase 7 | Audit Module | Pending |
| Phase 8 | API Refinement | Pending |
| Phase 9 | Testing & Hardening | Pending |
| Phase 10 | Backend v1.0 Release | Pending |

See [Project Roadmap](docs/PROJECT_ROADMAP.md) for the full phased plan.

---

## Core Concepts

The following principles define the project's architecture and are progressively implemented across the development phases.

**Event Sourcing** — Every financial action is persisted as an immutable event. No event is ever updated or deleted. Current account state is derived by replaying the event history.

**Double-Entry Accounting** — Every transaction generates matching debit and credit ledger entries. The ledger remains balanced at all times.

**Immutable History** — Financial records are append-only. Historical data is preserved indefinitely and can be replayed to reconstruct any past state.

**Derived Balances** — Account balances are never stored as a primary value. They are computed from the accumulated ledger history on demand.

**Schema Versioning** — All database schema changes are managed exclusively through Flyway migration scripts. Hibernate auto-DDL is disabled.

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
| API Documentation | Swagger / OpenAPI 3 | — |
| Logging | SLF4J / Logback | — |
| Testing | JUnit 5 / Spring Boot Test | — |

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
| [Project Log](docs/PROJECT_LOG.md) | Chronological record of completed milestones |
| [Architecture Decisions](docs/DECISIONS.md) | Architecture Decision Records (ADR-001 through ADR-018) |
| [Documentation Index](docs/README.md) | Documentation directory guide and reading order |

---

## Development Status

**Phase 0 — Project Foundation** established the complete technical skeleton:

- Spring Boot application starts successfully with PostgreSQL and Flyway
- `flyway_schema_history` initialised; zero application migrations exist (first real migration, `V1__Create_Accounts.sql`, belongs to Phase 1)
- `GlobalExceptionHandler` is registered for infrastructure-level error handling and returns `ApiError` JSON; 404 missing-route handling was manually verified to return `ApiError` rather than the Whitelabel Error Page
- Swagger UI available at `/swagger-ui.html`; OpenAPI 3 spec at `/v3/api-docs`
- Spring application context smoke test passes

No business-domain entities, services, controllers, or database tables exist yet. All business implementation begins in Phase 1.

---

## Local Development

### Prerequisites

- Java 21
- Maven
- PostgreSQL (running locally or via Docker)

### Environment Variables

This project reads database credentials exclusively from environment variables. Set the following before starting the application:

```bash
LEDGER_DB_URL=jdbc:postgresql://localhost:5432/ledger_db
LEDGER_DB_USERNAME=<your-db-username>
LEDGER_DB_PASSWORD=<your-db-password>
```

The `LEDGER_DB_*` prefix is intentional — it avoids conflicts with environment variables used by other local projects (see [ADR-017](docs/DECISIONS.md)).

### Build

```bash
cd backend
mvn clean package -DskipTests
```

### Run

```bash
cd backend
mvn spring-boot:run
```

### Test

```bash
cd backend
mvn clean test
```

---

## Testing

The current test suite contains one test: the Spring application context smoke test (`LedgerApplicationTests`), which verifies that the full Spring context assembles correctly at startup.

**Current status:** 1 test, 0 failures (`mvn clean test` passes).

Business logic tests, integration tests, and financial invariant tests are planned for Phase 9 — Testing & Hardening.

---

## AI-Assisted Development

This project uses an AI-assisted development workflow. The configuration and guidelines for AI agents operating within this repository are documented in [ai/AI_DEVELOPMENT_ENVIRONMENT.md](ai/AI_DEVELOPMENT_ENVIRONMENT.md).
