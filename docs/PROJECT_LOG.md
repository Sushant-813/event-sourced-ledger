# Project Log

**Project Name:** Event-Sourced Ledger

**Status:** In Development

**Current Version:** v0.1

---

# Project Timeline

## YYYY-MM-DD

### Project Initialized

Completed

- Created repository
- Established documentation structure
- Completed PRD
- Completed TRD
- Completed Architecture
- Completed Database Design
- Completed API Guidelines
- Completed Coding Standards
- Completed Project Roadmap
- Completed ADR

Next Milestone

Phase 0 – Project Foundation

---

## 2026-08-10

### Phase 0 — Project Foundation: COMPLETED

The technical application foundation has been implemented and manually verified.
The development environment is fully operational.

#### What Was Implemented

**Spring Boot / Maven / Java**

- Spring Boot 3.5.16 application is operational
- Maven build succeeds (`mvn clean test`)
- Java 21 (LTS) in use

**Database**

- PostgreSQL 18.4 connectivity established and verified
- Flyway configured and operational
- `flyway_schema_history` table created by Flyway on first startup
- Zero application migrations exist (intentionally); the first real migration, `V1__Create_Accounts.sql`, belongs to Phase 1
- `spring.jpa.hibernate.ddl-auto=none`; Hibernate does not manage schema
- Hibernate SQL logging disabled

**Configuration**

- Database credentials externalized using project-specific environment variables:
  - `LEDGER_DB_URL`
  - `LEDGER_DB_USERNAME`
  - `LEDGER_DB_PASSWORD`
- Logback configuration present and active

**Exception Handling**

- `ApiError` implemented as a Java 21 record with fields: `timestamp`, `status`, `error`, `message`, `path`
- `GlobalExceptionHandler` implemented as `@RestControllerAdvice` extending `ResponseEntityExceptionHandler`
- Handlers registered for: `NoResourceFoundException` (404), `MethodArgumentNotValidException` (400), `HttpMessageNotReadableException` (400), `HttpRequestMethodNotSupportedException` (405), `ConstraintViolationException` (400), and a catch-all 500 handler

**OpenAPI / Swagger**

- `OpenApiConfig` bean present
- Swagger UI loads successfully at `/swagger-ui.html`
- `/v3/api-docs` returns valid OpenAPI 3 JSON
- Swagger correctly shows no business operations (none exist yet)

**Testing**

- Spring application context smoke test passes (`LedgerApplicationTests`)
- `mvn clean test`: 1 test run, 0 failures

#### Manual Verification Performed

- `GET /nonexistent-endpoint` → HTTP 404 with `ApiError` JSON (not Whitelabel Error Page)
- `POST /v3/api-docs` → HTTP 405 Method Not Allowed with `ApiError` JSON
- Swagger UI loaded and confirmed no business endpoints present
- `/v3/api-docs` confirmed to return valid OpenAPI 3 JSON

#### Architectural Boundary

Phase 0 intentionally does NOT contain:

- Account entity, repository, service, or controller
- Business DTOs
- Transaction, Ledger Entry, or Event entities
- Business Flyway migrations
- Any business logic

Validation handlers (`MethodArgumentNotValidException`, `ConstraintViolationException`) are registered as part of the infrastructure foundation but have not been HTTP-tested independently; meaningful request-validation testing belongs to Phase 1 when the first validated DTO and controller are introduced.

#### New ADRs Recorded

- ADR-012: Backend Base Package
- ADR-013: Flyway V1-First Strategy
- ADR-014: Hibernate Schema Management (`ddl-auto=none`)
- ADR-015: Centralized Global Exception Handling
- ADR-016: Spring Boot Version Selection (3.5.16)
- ADR-017: Database Credential Environment Variable Names

Next Milestone

Phase 1 — Account Module