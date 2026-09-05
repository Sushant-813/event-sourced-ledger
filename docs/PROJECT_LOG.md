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

---

## 2026-08-13

### Phase 2 — Ledger Foundation: COMPLETED

The Transaction and LedgerEntry domains have been fully implemented and verified.
The accounting foundation for double-entry bookkeeping is operational.

#### What Was Implemented

**Database**

- `V2__Create_Transactions.sql` applied successfully; `transactions` table created with five
  columns, `NOT NULL` constraints, a `UK_transactions_reference_number` unique constraint,
  and `CHECK` constraints on `transaction_type` (`DEPOSIT`, `WITHDRAWAL`, `TRANSFER`) and
  `status` (`PENDING`, `COMPLETED`, `FAILED`)
- `V3__Create_Ledger_Entries.sql` applied successfully; `ledger_entries` table created with
  six columns, `NUMERIC(19,2)` precision for monetary amounts, `FK_ledger_entries_transaction`
  and `FK_ledger_entries_account` foreign keys (both `ON DELETE RESTRICT`), a
  `CK_ledger_entries_entry_type` check constraint (`DEBIT`, `CREDIT`), a
  `CK_ledger_entries_amount` check constraint (`amount > 0`), and two indexes:
  `IDX_ledger_entries_transaction_id` and `IDX_ledger_entries_account_id`
- `spring.jpa.hibernate.ddl-auto=validate` remains in effect; Hibernate validates `Transaction`
  and `LedgerEntry` entity mappings against the Flyway-managed schema on every startup
- PostgreSQL schema version is now 3; Flyway validates V1, V2, and V3 successfully at startup

**Domain**

- `Transaction` JPA entity (`com.ledger.transaction.entity`) with fields: `id`, `referenceNumber`,
  `transactionType`, `status`, `createdAt`; `createdAt` is non-updatable
- `TransactionType` enum: `DEPOSIT`, `WITHDRAWAL`, `TRANSFER`
- `TransactionStatus` enum: `PENDING`, `COMPLETED`, `FAILED`
- `LedgerEntry` JPA entity (`com.ledger.ledger.entity`) with fields: `id`, `transaction`,
  `account`, `entryType`, `amount`, `createdAt`; intentionally immutable — no setters,
  no update lifecycle; `createdAt` is non-updatable
- `EntryType` enum: `DEBIT`, `CREDIT`

**Persistence**

- `TransactionRepository` extending `JpaRepository<Transaction, Long>` with derived query
  methods: `findByReferenceNumber(String)` and `existsByReferenceNumber(String)`
- `LedgerEntryRepository` extending `JpaRepository<LedgerEntry, Long>` with derived query
  methods: `findByTransactionId(Long)` and `findByAccountId(Long)`

**Application / Service**

- `LedgerService` interface defining the `recordTransaction(Transaction, List<LedgerEntry>)` contract
- `LedgerServiceImpl` implementing double-entry validation and persistence:
  - Null or empty ledger entry collections are rejected with `IllegalArgumentException`
  - Invalid amounts (null, zero, or negative) are rejected with `InvalidLedgerEntryException`
  - Missing at least one DEBIT entry is rejected with `UnbalancedLedgerException`
  - Missing at least one CREDIT entry is rejected with `UnbalancedLedgerException`
  - Debit/credit imbalance (total debits ≠ total credits) is rejected with `UnbalancedLedgerException`
  - Transaction is persisted via `TransactionRepository.save()` before ledger entries
  - Ledger entries are persisted via `LedgerEntryRepository.saveAll()`
  - The entire operation is `@Transactional`

**Exception Handling**

- Two new business exception classes in `com.ledger.ledger.exception`:
  - `InvalidLedgerEntryException` → 422 Unprocessable Entity (individual entry data invalid)
  - `UnbalancedLedgerException` → 422 Unprocessable Entity (double-entry balance invariant violated)
- `GlobalExceptionHandler` extended with two corresponding `@ExceptionHandler` methods:
  `handleInvalidLedgerEntry` and `handleUnbalancedLedger`

**Testing**

- `LedgerServiceImplTest` — 13 unit tests (Mockito, no Spring context, no database) covering:
  - Successful transaction recording with balanced entries
  - Null and empty entry collection rejection (`IllegalArgumentException`)
  - Invalid amount rejection (`InvalidLedgerEntryException`)
  - Missing DEBIT rejection (`UnbalancedLedgerException`)
  - Missing CREDIT rejection (`UnbalancedLedgerException`)
  - Debit/credit imbalance rejection (`UnbalancedLedgerException`)
  - Persistence ordering: transaction saved before ledger entries (InOrder verification)
  - No repository calls on validation failure

#### Verification

`mvn test` — **45 tests run, 0 failures, 0 errors, 0 skipped** — BUILD SUCCESS

Spring Boot startup verified against PostgreSQL: Flyway applies and validates V1, V2, and V3;
Hibernate validates `Account`, `Transaction`, and `LedgerEntry` entity mappings at startup.

#### Architectural Boundary

Phase 2 intentionally does NOT contain:

- REST controllers or endpoints for transactions or ledger entries
- Request/response DTOs for transactions or ledger entries
- Multi-currency support (monetary amounts are single-currency `NUMERIC(19,2)`)
- LedgerEntry mutability: entries are immutable by design; no setters or update workflows exist

#### New ADRs Recorded

- ADR-020: Monetary Amount Precision — `NUMERIC(19,2)`
- ADR-021: LedgerEntry Immutability
- ADR-022: Double-Entry Validation Exception Semantics

Next Milestone

Phase 3 — Event Store

---

## 2026-09-03

### Phase 3 — Event Store: COMPLETED

The Event Store domain has been fully implemented and verified following the approved Phase 3
implementation plan.

#### What Was Implemented

**Database**

- `V4__Create_Events.sql` applied successfully; `events` table created with six columns:
  `id` (`BIGSERIAL` primary key), `account_id` (`BIGINT NOT NULL`), `transaction_id`
  (`BIGINT`, nullable), `event_type` (`VARCHAR(50) NOT NULL`), `payload` (`TEXT`, nullable),
  `occurred_at` (`TIMESTAMP WITH TIME ZONE NOT NULL`)
- `FK_events_account` foreign key → `accounts(id)` `ON DELETE RESTRICT`
- `FK_events_transaction` foreign key → `transactions(id)` `ON DELETE RESTRICT`
  (nullable; not enforced when `transaction_id` is `NULL`, as required for `ACCOUNT_CREATED`)
- `CK_events_event_type` CHECK constraint enforcing exactly five approved values:
  `ACCOUNT_CREATED`, `DEPOSIT`, `WITHDRAWAL`, `TRANSFER_DEBIT`, `TRANSFER_CREDIT`
- Composite index `IDX_events_account_id_occurred_at_id` on `(account_id, occurred_at, id)`
  supporting deterministic chronological account event retrieval
- Index `IDX_events_transaction_id` on `(transaction_id)` supporting transaction event lookup
- `spring.jpa.hibernate.ddl-auto=validate` remains in effect; Hibernate validates the `Event`
  entity mapping against the Flyway-managed schema on every startup
- PostgreSQL schema version is now 4; Flyway validates V1, V2, V3, and V4 successfully at startup

**Domain**

- `Event` JPA entity (`com.ledger.event.entity`) — intentionally immutable: no setters,
  no `@PreUpdate` lifecycle callback; all fields set via constructor; all `@Column` and
  `@JoinColumn` annotations include `updatable = false`
- `EventType` enum: exactly five values — `ACCOUNT_CREATED`, `DEPOSIT`, `WITHDRAWAL`,
  `TRANSFER_DEBIT`, `TRANSFER_CREDIT`
- `Event` does not carry a monetary amount; monetary data remains exclusively in `LedgerEntry`,
  accessible via `Event.transaction_id → Transaction → LedgerEntry`

**Persistence**

- `EventRepository` extending `JpaRepository<Event, Long>` with two derived query methods:
  - `findByAccountIdOrderByOccurredAtAscIdAsc(Long accountId)` — account event history,
    deterministically ordered by `occurred_at ASC, id ASC`
  - `findByTransactionIdOrderByOccurredAtAscIdAsc(Long transactionId)` — transaction event
    retrieval, deterministically ordered by `occurred_at ASC, id ASC`
  - `findById` inherited from `JpaRepository` for single-event lookup

**Application / Service**

- `EventService` interface defining the four-method contract:
  `recordEvent`, `getEventsByAccount`, `getEventsByTransaction`, `getEventById`
- `EventServiceImpl` implementing the contract:
  - Explicit null validation before any repository call:
    `account == null` → `IllegalArgumentException`;
    `eventType == null` → `IllegalArgumentException`;
    `occurredAt == null` → `IllegalArgumentException`
  - `transaction` and `payload` are nullable; no validation applied to them
  - `occurredAt` is caller-supplied; the service does not call `OffsetDateTime.now()` internally
  - `getEventsByAccount` and `getEventsByTransaction` return empty lists when no events exist;
    no exception is thrown for empty collections
  - `getEventById` throws `EventNotFoundException` when the requested event ID does not exist
  - Individual event persistence is logged at `DEBUG` level; payloads are never logged

**Exception Handling**

- `EventNotFoundException` — plain `RuntimeException` subclass in `com.ledger.event.exception`;
  single `String message` constructor
- `GlobalExceptionHandler` extended with `handleEventNotFound` — returns HTTP 404 with
  `ApiError` JSON, following the established pattern of `handleAccountNotFound`

**Testing**

- `EventServiceImplTest` — 16 unit tests (Mockito, JUnit 5, no Spring context, no database)
  covering all service methods including recording variants, three null-validation guards
  (account, eventType, occurredAt), account and transaction retrieval (ordered delegation,
  unchanged list, empty list), and single-event lookup (found and not-found paths)

#### Verification

`mvn test` — **61 tests run, 0 failures, 0 errors, 0 skipped — BUILD SUCCESS**

Spring Boot startup verified against PostgreSQL: Flyway applies and validates V1, V2, V3,
and V4; Hibernate validates `Account`, `Transaction`, `LedgerEntry`, and `Event` entity
mappings at startup.

#### Architectural Boundary

Phase 3 intentionally does NOT contain:

- Deposit or withdrawal workflows (Phase 4)
- Transfer workflows (Phase 5)
- Balance reconstruction or event replay logic (Phase 6)
- REST controllers or endpoints for event retrieval (Phase 7)
- Historical balance calculation
- Pagination of event results (Phase 8)

Phase 3 establishes the event-store and retrieval infrastructure that future financial-operation
phases will use to record events. Actual monetary event generation occurs in Phases 4 and 5,
not Phase 3.

#### New ADRs Recorded

- ADR-023: Event Ordering Strategy — `occurred_at ASC, id ASC`

Next Milestone

Phase 4 — Deposit & Withdrawal Engine

---

## 2026-09-06

### Phase 4 — Deposit & Withdrawal Engine: COMPLETED

The Deposit & Withdrawal Engine has been fully implemented and verified following the
approved Phase 4 implementation plan.

#### What Was Implemented

**Database**

- `V5__Seed_System_Account.sql` applied successfully; inserts the internal `SYS-CASH`
  system contra-account with account number `SYS-CASH`, account type `CURRENT`, and
  status `ACTIVE`
- No DDL changes introduced; `spring.jpa.hibernate.ddl-auto=validate` compatibility
  remains intact
- PostgreSQL schema version is now 5; Flyway validates V1 through V5 successfully at startup

**Transaction Engine**

- `TransactionService` interface defining `deposit(Long accountId, DepositRequest)` and
  `withdraw(Long accountId, WithdrawalRequest)` method contracts
- `TransactionServiceImpl` implementing both workflows, annotated
  `@Transactional(rollbackFor = Exception.class)`:
  - Both methods acquire a `PESSIMISTIC_WRITE` lock on the customer `Account` row as the
    first operation, providing per-account serialization
  - Completed transactions are created with `TransactionStatus.COMPLETED` and a
    `UUID`-generated reference number
- `SystemAccountConstants` — centralized constant holding `SYSTEM_CASH_ACCOUNT_NUMBER = "SYS-CASH"`

**Accounting Model**

- Deposit double-entry: `SYS-CASH` DEBIT / Customer CREDIT
- Withdrawal double-entry: Customer DEBIT / `SYS-CASH` CREDIT
- Both entry pairs delegated to `LedgerService.recordTransaction` for double-entry
  validation and persistence
- `LedgerEntry.amount` remains the sole authoritative monetary source; no mutable balance
  column was introduced

**Balance Calculation**

- Withdrawal balance derived at runtime via `LedgerEntryRepository.computeBalanceByAccountId`:
  `COALESCE(SUM(CASE WHEN entry_type = 'CREDIT' THEN amount WHEN entry_type = 'DEBIT' THEN -amount END), 0)`
- Balance check performed before retrieving the system account; `InsufficientFundsException`
  thrown when `balance < requestedAmount`
- Event replay/balance reconstruction remains Phase 6

**Concurrency**

- Customer `Account` row locked with `PESSIMISTIC_WRITE` via `AccountRepository.findByIdForUpdate`
- Lock held throughout the outer transaction (validation, balance check, ledger persistence,
  event persistence)
- Per-account serialization prevents concurrent overdrafts
- Concurrent withdrawal protection verified by integration test:
  - Initial balance: $100.00
  - Two concurrent $80.00 withdrawal attempts
  - Result: one success, one `InsufficientFundsException`
  - Final balance: $20.00
- `SYS-CASH` is not explicitly row-locked (see ADR-025)

**Events**

- `EventType.DEPOSIT` recorded per successful deposit operation
- `EventType.WITHDRAWAL` recorded per successful withdrawal operation
- `Event.payload` remains `null` for both operation types
- `LedgerEntry.amount` remains the monetary source of truth; events carry no monetary fields

**API**

- `TransactionController` exposing two endpoints:
  - `POST /accounts/{accountId}/deposit` — 201 Created on success
  - `POST /accounts/{accountId}/withdrawal` — 201 Created on success
- `DepositRequest` record with `@NotNull @DecimalMin("0.01") @Digits(integer=17, fraction=2)` on `amount`
- `WithdrawalRequest` record with same validation constraints
- `TransactionResponse` record returned on success: `transactionId`, `referenceNumber`,
  `transactionType`, `status`, `accountId`, `amount`, `createdAt`
- Path variable `accountId` validated `@Positive` at the controller layer

**SYS-CASH Public API Isolation**

- `GET /accounts` excludes `SYS-CASH` via `findAllByAccountNumberNot`
- `GET /accounts/{id}` — returns 404 when target resolves to `SYS-CASH`
- `GET /accounts/by-number/{accountNumber}` — returns 404 for `SYS-CASH`
- Account status mutation endpoints (freeze/activate/close) — return 404 for `SYS-CASH`
- `POST /accounts/{accountId}/deposit` — returns 404 when `accountId` resolves to `SYS-CASH`
- `POST /accounts/{accountId}/withdrawal` — returns 404 when `accountId` resolves to `SYS-CASH`
- `POST /accounts` — duplicate creation rejected by existing `existsByAccountNumber` check (409)

**Exception Handling**

- `InsufficientFundsException` — 422 Unprocessable Entity (withdrawal amount exceeds balance)
- `AccountNotEligibleForTransactionException` — 422 Unprocessable Entity (account is FROZEN or CLOSED)
- `IllegalStateException` — 500 Internal Server Error (SYS-CASH missing from database; data integrity violation)
- `GlobalExceptionHandler` extended with `handleInsufficientFunds` and
  `handleAccountNotEligibleForTransaction` handlers

**Testing**

- `TransactionServiceImplTest` — 10 unit tests (Mockito, JUnit 5, no Spring context, no database)
  covering deposit success with `ArgumentCaptor` double-entry verification, account-not-found,
  frozen/closed account rejection, SYS-CASH target rejection, SYS-CASH missing from database,
  withdrawal success, withdrawal at exact balance, insufficient funds, frozen/closed account
  withdrawal rejection, and SYS-CASH withdrawal rejection
- `TransactionControllerTest` — 8 API-layer tests (`@WebMvcTest`, MockMvc auto-configured
  with `GlobalExceptionHandler`) covering 201 deposit success, 201 withdrawal success,
  400 for invalid amounts, 400 for invalid account ID, 422 for insufficient funds, and
  422 for frozen account
- `TransactionServiceIntegrationTest` — 4 integration tests (`@SpringBootTest`, PostgreSQL)
  covering:
  - Full deposit persistence: transaction, 2 ledger entries, DEPOSIT event, null payload,
    derived balance
  - Rollback after simulated event persistence failure: all writes reverted atomically
  - Concurrent withdrawal serialization: $100 balance, two concurrent $80 withdrawals,
    one success, one `InsufficientFundsException`, final balance $20
  - SYS-CASH migration verification: account is ACTIVE, CURRENT type

#### Verification

`mvn clean test` — **85 tests run, 0 failures, 0 errors, 0 skipped** — BUILD SUCCESS

Spring Boot startup verified against PostgreSQL: Flyway applies and validates V1 through V5;
Hibernate validates `Account`, `Transaction`, `LedgerEntry`, and `Event` entity mappings
at startup.

#### Architectural Boundary

Phase 4 intentionally does NOT contain:

- Account-to-account transfers (Phase 5)
- Event replay or balance reconstruction from event history (Phase 6)
- Event retrieval REST APIs (Phase 7)
- Idempotency keys
- Multi-currency support
- Authentication or authorization
- Tenant isolation

**New ADRs Recorded**

- ADR-024: System Contra-Account (`SYS-CASH`) and Public API Isolation
- ADR-025: Pessimistic Row Locking for Phase 4 Monetary Operations

Next Milestone

Phase 5 — Transfer Engine