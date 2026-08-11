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

Phase 1 — Account Module

---

## 2026-08-12

### Phase 1 — Account Module: COMPLETED

The Account domain has been fully implemented and verified following the approved Phase 1
implementation plan.

#### What Was Implemented

**Database**

- `V1__Create_Accounts.sql` applied successfully; `accounts` table created with seven columns,
  `NOT NULL` and `CHECK` constraints, and the `UK_accounts_account_number` unique constraint
- `spring.jpa.hibernate.ddl-auto` changed from `none` to `validate`; Hibernate now verifies
  the `Account` entity mapping against the live schema on every startup (see ADR-019)

**Domain**

- `Account` JPA entity (`com.ledger.account.entity`) with `@PreUpdate`-managed `updatedAt`
  and `@Column(updatable = false)` on `createdAt`
- `AccountType` enum (`SAVINGS`, `CURRENT`) with `@JsonCreator` for clean Jackson
  deserialization error messages
- `AccountStatus` enum (`ACTIVE`, `FROZEN`, `CLOSED`)
- `AccountRepository` extending `JpaRepository` with `findByAccountNumber` and
  `existsByAccountNumber` derived query methods

**Application / Service**

- `AccountService` interface defining the seven-method contract
- `AccountServiceImpl` enforcing all business rules:
  - Duplicate `account_number` prevention (pre-check + `DataIntegrityViolationException`
    translation for concurrency safety)
  - Account existence checks on all lookup and lifecycle operations
  - Status-transition rules: `ACTIVE → FROZEN`, `ACTIVE → CLOSED`, `FROZEN → ACTIVE`,
    `FROZEN → CLOSED`; `CLOSED` is terminal — all transitions from `CLOSED` are rejected

**Presentation**

- `AccountController` exposing seven endpoints:
  - `POST /accounts` — create account (201)
  - `GET /accounts` — paginated list (200)
  - `GET /accounts/{id}` — get by internal ID (200)
  - `GET /accounts/by-number/{accountNumber}` — get by business account number (200)
  - `PATCH /accounts/{id}/freeze` — freeze account (200)
  - `PATCH /accounts/{id}/activate` — activate account (200)
  - `PATCH /accounts/{id}/close` — close account (200)
- `CreateAccountRequest` record with Jakarta Validation constraints (`@NotBlank`, `@Size`,
  `@NotNull`)
- `AccountResponse` Java 21 record (immutable DTO)
- `AccountMapper` for entity-to-response translation (manual; no MapStruct)

**Exception Handling**

- Three new business exception classes in `com.ledger.account.exception`:
  - `AccountNotFoundException` → 404
  - `DuplicateAccountNumberException` → 409
  - `InvalidAccountStatusTransitionException` → 422
- `GlobalExceptionHandler` extended with three corresponding `@ExceptionHandler` methods
- `DataIntegrityViolationException` from concurrent duplicate inserts is caught in
  `AccountServiceImpl.createAccount` and translated to `DuplicateAccountNumberException`
  (409), not a 500

**OpenAPI / Swagger**

- All seven account endpoints documented in `AccountController` with `@Tag`, `@Operation`,
  `@ApiResponse`, and `@Parameter` annotations
- Endpoints visible in Swagger UI at `/swagger-ui.html`
- `OpenApiConfig.java` version string unchanged (`v0.1`); version bump deferred to Phase 10

**Testing**

- `AccountServiceImplTest` — 17 unit tests (Mockito, no Spring context, no database) covering
  all service methods including status-transition branches and concurrent-duplicate translation
- `AccountControllerTest` — 14 API-layer tests (MockMvc standalone setup + `GlobalExceptionHandler`
  advice) covering all seven endpoints and all error scenarios
- `LedgerApplicationTests` — context smoke test continues to pass; Flyway V1 migration verified
  at startup; `ddl-auto=validate` confirms entity-to-schema mapping

#### Verification

`mvn clean test` — **32 tests run, 0 failures, 0 errors, 0 skipped** — BUILD SUCCESS

#### New ADRs Recorded

- ADR-019: Hibernate Schema Validation Enabled (`ddl-auto=none` → `ddl-auto=validate`)

Next Milestone

Phase 2 — Ledger Foundation