# Project Log

**Project Name:** Event-Sourced Ledger

**Status:** In Progress (Phase D — Production Deployment)

**Current Version:** v1.1.0 (Full-Stack Source Checkpoint)

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

---

## 2026-09-07

### Phase 5 — Transfer Engine: COMPLETED

The Transfer Engine has been fully implemented and verified following the approved
Phase 5 implementation plan.

#### What Was Implemented

**Database & Schema**

- No new Flyway migration required; existing schema fully supports customer-to-customer
  transfers:
  - `transactions.transaction_type` CHECK constraint already permits `TRANSFER` (Phase 2)
  - `ledger_entries.entry_type` CHECK constraint permits `DEBIT` and `CREDIT` (Phase 2)
  - `events.event_type` CHECK constraint permits `TRANSFER_DEBIT` and `TRANSFER_CREDIT` (Phase 3)
- Schema version remains 5; `spring.jpa.hibernate.ddl-auto=validate` validates entity
  mappings successfully at application startup

**Transfer Engine**

- `TransactionService` interface extended with `transfer(TransferRequest request)` method
  contract
- `TransactionServiceImpl` implements `transfer`, annotated
  `@Transactional(rollbackFor = Exception.class)`:
  - Deterministic ascending account-ID pessimistic locking using `AccountRepository.findByIdForUpdate`:
    locks `lowerAccountId = Math.min(...)` first, then `higherAccountId = Math.max(...)`
  - Clean role restoration maps locked `Account` entities back to `sourceAccount` and
    `destinationAccount`
  - Rejection of same-account transfers (`sourceAccountId.equals(destinationAccountId)`) with
    `InvalidTransferException` (422)
  - Completed transactions created with `TransactionType.TRANSFER`, `TransactionStatus.COMPLETED`,
    and a `UUID`-generated reference number

**Accounting Model**

- Customer-to-customer double-entry:
  - Source account receives one `DEBIT` ledger entry
  - Destination account receives one equal `CREDIT` ledger entry
- Both entries belong to the same `Transaction` instance and share the same UTC timestamp
- Delegated to `LedgerService.recordTransaction` for double-entry balance validation and
  atomic persistence
- `SYS-CASH` contra-account does NOT participate in customer-to-customer transfers;
  transfers are direct customer-to-customer balance movements

**Business Validation & Isolation**

- Existence checks: both source and destination accounts must exist (`AccountNotFoundException` 404)
- Exact `SYS-CASH` isolation: if either source or destination account resolves to `SYS-CASH`,
  rejected with `AccountNotFoundException` (404)
- Account eligibility: both accounts must have status `AccountStatus.ACTIVE`; `FROZEN` or `CLOSED`
  accounts rejected with `AccountNotEligibleForTransactionException` (422)
- Same-account transfer: source and destination cannot be identical (`InvalidTransferException` 422)
- Monetary amount validation: Jakarta Bean Validation enforces `@NotNull`, `@DecimalMin("0.01")`,
  and `@Digits(integer = 17, fraction = 2)`
- Derived balance check: source account balance derived at runtime via
  `LedgerEntryRepository.computeBalanceByAccountId(sourceAccountId)`; rejected with
  `InsufficientFundsException` (422) if `sourceBalance < requestedAmount`

**Concurrency & Deadlock Prevention**

- Both accounts row-locked with `PESSIMISTIC_WRITE` in ascending account-ID order
  (`Math.min` then `Math.max`)
- Ascending-ID lock ordering eliminates lock-order inversion deadlocks when concurrent transfers
  operate in opposite directions (`Account A → Account B` vs `Account B → Account A`)
- Locks held for the entire duration of the outer transaction (validation, balance check,
  transaction persistence, ledger entries, and events)
- Serializes competing transfers or withdrawals from the same source account, preventing
  concurrent double-spending / overdrafts
- Concurrency protections verified by multi-threaded integration tests

**Events**

- Two immutable events recorded in the same transaction context:
  - `EventType.TRANSFER_DEBIT` for the source account
  - `EventType.TRANSFER_CREDIT` for the destination account
- Both events carry `payload = null` and share the caller-supplied UTC timestamp
- Both events linked to the same `Transaction` entity
- If event recording fails, the entire transaction (including transaction record and ledger
  entries) rolls back atomically

**API & Web Layer**

- `TransferController` exposing `POST /transfers` returning HTTP 201 Created on success
- `TransferRequest` record: `sourceAccountId` (`@NotNull @Positive`), `destinationAccountId`
  (`@NotNull @Positive`), `amount` (`@NotNull @DecimalMin("0.01") @Digits(integer=17, fraction=2)`)
- `TransferResponse` record returned on success: `transactionId`, `referenceNumber`,
  `transactionType`, `status`, `sourceAccountId`, `destinationAccountId`, `amount`, `createdAt`
- OpenAPI 3 / Swagger annotations providing complete endpoint and error documentation

**Exception Handling**

- `InvalidTransferException` — HTTP 422 Unprocessable Entity (same source and destination account)
- `GlobalExceptionHandler` extended with `handleInvalidTransfer` handler
- Existing handlers reused for `AccountNotFoundException` (404),
  `AccountNotEligibleForTransactionException` (422), and `InsufficientFundsException` (422)

**Testing**

- Test suite expanded from 85 to 108 passing tests (+23 new tests):
- `TransactionServiceImplTest` — 12 new unit tests (22 total) covering:
  - Transfer success with `ArgumentCaptor` verification of transaction, matching debit/credit
    ledger entries, and two transaction-linked events
  - Same-source and destination rejection (`InvalidTransferException`)
  - Missing source account (`AccountNotFoundException`)
  - Missing destination account (`AccountNotFoundException`)
  - `SYS-CASH` as source rejection (`AccountNotFoundException`)
  - Inactive / frozen source account (`AccountNotEligibleForTransactionException`)
  - Inactive / frozen destination account (`AccountNotEligibleForTransactionException`)
  - Insufficient funds rejection (`InsufficientFundsException`)
  - Exact balance transfer success leaving balance at zero
  - InOrder verification of ascending account-ID lock acquisition order
- `TransferControllerTest` — 8 new API-layer tests (`@WebMvcTest`, MockMvc) covering:
  - 201 Created transfer success response structure and JSON fields
  - 400 Bad Request for zero or negative amounts
  - 400 Bad Request for invalid source account ID (<= 0)
  - 400 Bad Request for invalid destination account ID (<= 0)
  - 422 Unprocessable Entity for same source and destination account
  - 404 Not Found for missing account
  - 422 Unprocessable Entity for insufficient funds
  - 422 Unprocessable Entity for ineligible / frozen account
- `TransactionServiceIntegrationTest` — 5 new integration tests (9 total) covering:
  - Full transfer persistence: transaction, exactly 2 ledger entries (source DEBIT, destination
    CREDIT), 2 events (`TRANSFER_DEBIT`, `TRANSFER_CREDIT` with null payload), and correct
    derived balances
  - Rollback on simulated event persistence failure: all transaction records, ledger entries,
    and events revert atomically
  - Exact balance transfer: leaves source balance at exactly 0.00 and credits destination
  - Concurrent opposite-direction transfers: both succeed without deadlocks; final balances
    remain correct
  - Concurrent transfers from same source: only one succeeds, second fails with
    `InsufficientFundsException`; prevents double-spending

#### Verification

`mvn clean test` — **108 tests run, 0 failures, 0 errors, 0 skipped** — BUILD SUCCESS

Spring Boot startup verified against PostgreSQL: Flyway validates V1 through V5; Hibernate
validates all entity mappings at startup.

#### Architectural Boundary

Phase 5 intentionally does NOT contain:

- Event replay or balance reconstruction from event history (Phase 6)
- Historical balance computation (Phase 6)
- Event retrieval REST APIs or audit timeline (Phase 7)
- Pagination, sorting, or filtering of transactions (Phase 8)
- Multi-currency transfers
- Idempotency keys
- Authentication or authorization

#### New ADRs Recorded

- ADR-026: Deterministic Ascending-ID Pessimistic Locking and Role Restoration for Account Transfers

---

## 2026-09-08

### Phase 6 — Balance Reconstruction: COMPLETED

The internal Balance Reconstruction Engine has been fully implemented and verified
following the approved Phase 6 implementation plan.

#### What Was Implemented

**Service Layer & Contract**

- `BalanceReconstructionService` interface created in `com.ledger.balance.service`:
  - `reconstructCurrentBalance(Long accountId)` — derives current balance from account event history
  - `reconstructBalanceAt(Long accountId, OffsetDateTime asOf)` — derives historical point-in-time balance
  - Both methods return `BigDecimal`
- `BalanceReconstructionServiceImpl` implements `BalanceReconstructionService`, annotated
  `@Transactional(readOnly = true)`:
  - Validates account existence via `AccountRepository.findById(accountId)`, throwing `AccountNotFoundException`
    if the account does not exist
  - Strictly guards against `SYS-CASH` balance reconstruction, throwing `IllegalStateException`
    with message `"Balance reconstruction is not supported for the SYS-CASH account"`
  - Replays events chronologically using deterministic order (`occurredAt ASC, id ASC`)
  - Treats `ACCOUNT_CREATED` as a non-monetary lifecycle event with zero balance impact and bypasses
    transaction loading for it; returns `BigDecimal.ZERO` if an account has no monetary events
  - Derives financial balance effects from ledger entries: `CREDIT` entries increase balance (positive) and
    `DEBIT` entries decrease balance (negative / `negate()`)
  - Aggregates multiple matching ledger entries for the same account within a single transaction
  - Reconstructs historical balances using an inclusive `occurredAt <= asOf` boundary; returns
    `BigDecimal.ZERO` when no events exist prior to `asOf`

**Batch Loading Strategy (N+1 Query Prevention)**

- Avoids per-event database queries inside the replay iteration loop:
  - Collects monetary event transaction IDs into a distinct `Set<Long>`
  - Batch-loads all referenced transactions via `transactionRepository.findAllById(transactionIds)`
  - Batch-loads all relevant ledger entries via `ledgerEntryRepository.findByTransactionIdIn(transactionIds)`
  - Groups loaded transactions and ledger entries in memory before executing the sequential replay

**Data Integrity Invariants**

- Fails fast with `IllegalStateException` when historical data exhibits structural corruption:
  - Monetary event missing an associated transaction
  - Referenced transaction ID not found in database
  - Transaction contains no ledger entries
  - Transaction contains no ledger entry for the subject account

**Repository Enhancements**

- `EventRepository` enhanced with:
  - `findByAccountIdOrderByOccurredAtAscIdAsc(Long accountId)`
  - `findByAccountIdAndOccurredAtLessThanEqualOrderByOccurredAtAscIdAsc(Long accountId, OffsetDateTime asOf)`
- `LedgerEntryRepository` enhanced with batch transaction lookup:
  - `findByTransactionIdIn(Collection<Long> transactionIds)`

#### Testing & Verification

- `BalanceReconstructionServiceImplTest` — 13 unit tests (`@ExtendWith(MockitoExtension.class)`) covering:
  - `AccountNotFoundException` when account does not exist
  - Zero balance returned when valid account has no events
  - `SYS-CASH` reconstruction rejection throwing `IllegalStateException`
  - Zero balance returned for `ACCOUNT_CREATED` event
  - Balance increase for `CREDIT` ledger entry
  - Balance decrease for `DEBIT` ledger entry
  - Cumulative balance reconstruction across multiple events
  - Correct summation of multiple ledger entries for the same account and transaction
  - Inclusive event inclusion at historical `asOf` boundary
  - Zero balance for historical query timestamp before monetary events
  - Integrity failure when monetary event has null transaction
  - Integrity failure when referenced transaction is missing
  - Integrity failure when transaction lacks a ledger entry for the account
- `BalanceReconstructionServiceIntegrationTest` — 5 integration tests (`@SpringBootTest`) covering:
  - End-to-end current balance reconstruction after deposit against PostgreSQL
  - Current balance reconstruction after deposit and withdrawal
  - Balance reconstruction for both source and destination accounts after transfer
  - Historical balance reconstruction at event timestamp boundary
  - `SYS-CASH` balance reconstruction rejection against real database instance

#### Verification

`mvn clean test` — **126 tests run, 0 failures, 0 errors, 0 skipped** — BUILD SUCCESS

Spring Boot startup verified against PostgreSQL: Flyway validates migrations V1 through V5; Hibernate validates entity mappings at startup.

#### Architectural Boundary

Phase 6 intentionally does NOT contain:

- REST endpoints or controllers (remains an internal service capability)
- Request or Response DTOs
- OpenAPI / Swagger documentation
- Public API surface
- Database schema changes or new Flyway migrations
- Transaction processing modifications
- Event generation modifications
- Multi-currency balance calculations
- Balance caching or materialized snapshots

#### New ADRs Recorded

- ADR-027: Internal Balance Reconstruction Engine and Deterministic History Replay

---

## 2026-09-13

### Phase 7 — Audit Module: COMPLETED

The Audit Module has been implemented and verified. The module delivers complete financial
traceability, enabling customers and auditors to inspect account event history, transaction
history, ledger entries, reconstructed current/historical balances, and an event-by-event audit
trail explaining balance evolution.

#### What Was Implemented

**REST API Layer (`com.ledger.audit.controller`)**

- `AuditController` mapped to `/accounts/{accountId}/audit` exposing five read-only endpoints:
  - `GET /accounts/{accountId}/audit/events` — returns chronological event history for an account
  - `GET /accounts/{accountId}/audit/transactions` — returns all financial transactions involving the account
  - `GET /accounts/{accountId}/audit/ledger` — returns all ledger entries affecting the account
  - `GET /accounts/{accountId}/audit/balance` — returns current balance or historical balance at `asOf` timestamp
  - `GET /accounts/{accountId}/audit/trail` — returns event-by-event audit trail with running balance accumulation
- Path validation via Jakarta Validation (`@Positive(message = "accountId must be greater than 0")`)
- Query parameter validation for optional ISO-8601 `asOf` timestamp (`@DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)`)
- Comprehensive OpenAPI 3 / Swagger annotations (`@Operation`, `@ApiResponses`, `@Parameter`) on all endpoints

**Audit Service Layer (`com.ledger.audit.service`)**

- `AuditService` interface and `AuditServiceImpl` implementing all audit capabilities
- **Event History:** Queries events by account ID ordered deterministically by `occurred_at ASC, id ASC`
- **Transaction History:** Collects distinct transaction IDs from monetary events preserving their first
  occurrence order, batch-loads transactions via `transactionRepository.findAllById`, and reconstructs
  the response in event-derived chronological sequence
- **Ledger History:** Retrieves ledger entries affecting the account, batch-loads referenced transactions
  for reference numbers, and returns entries in order
- **Balance Reconstruction:** Reuses `BalanceReconstructionService`:
  - Without `asOf`: calls `reconstructCurrentBalance(accountId)` and returns `asOf = null`
  - With `asOf`: calls `reconstructBalanceAt(accountId, asOf)` and returns requested timestamp
- **Audit Trail Engine:**
  - Loads ordered events (optionally bounded by `occurred_at <= asOf`)
  - Batch-loads transactions and ledger entries in bulk ($O(1)$ queries relative to event count)
  - For `ACCOUNT_CREATED`: records `balanceChange = BigDecimal.ZERO`, preserves `runningBalance = 0.00`
  - For monetary events: computes signed financial effect from the account's ledger entries
    (`CREDIT` adds positive amount, `DEBIT` subtracts amount / `negate()`)
  - Handles multiple ledger entries for the same account within a single transaction by summation
  - Accumulates running balance forward sequentially
  - Fails fast with `IllegalStateException` on structural data corruption (missing transaction, missing
    ledger entries, missing account leg)

**Public API Boundary & SYS-CASH Isolation**

- Private `validatePublicAccount(Long accountId)` helper enforced across all audit methods:
  - Account not found in `AccountRepository` → throws `AccountNotFoundException` (404)
  - Account matches `SYS-CASH` (`SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER`) → throws `AccountNotFoundException` (404)
- Guarantees uniform 404 behavior across all five public endpoints and protects against internal 500
  leaks from lower-layer services

**DTO Records (`com.ledger.audit.dto`)**

- Six Java 21 records implementing immutable audit contracts:
  - `AccountEventResponse(Long eventId, EventType eventType, Long transactionId, String payload, OffsetDateTime occurredAt)`
  - `AccountTransactionResponse(Long transactionId, String referenceNumber, TransactionType transactionType, TransactionStatus status, OffsetDateTime createdAt)`
  - `AccountLedgerEntryResponse(Long ledgerEntryId, Long transactionId, String referenceNumber, EntryType entryType, BigDecimal amount, OffsetDateTime createdAt)`
  - `AuditBalanceResponse(Long accountId, BigDecimal balance, OffsetDateTime asOf)`
  - `AuditTrailItemResponse(Long eventId, EventType eventType, Long transactionId, String referenceNumber, BigDecimal balanceChange, BigDecimal runningBalance, OffsetDateTime occurredAt)`
  - `AuditTrailResponse(Long accountId, BigDecimal finalBalance, OffsetDateTime asOf, List<AuditTrailItemResponse> items)`

**Error Handling & Validation (`com.ledger.common.exception`)**

- Extended `GlobalExceptionHandler` with `@ExceptionHandler(MethodArgumentTypeMismatchException.class)`
  returning `400 Bad Request` with standard `ApiError` JSON when parameters (such as `asOf`) fail type conversion

**Persistence Enhancements (`com.ledger.ledger.repository`)**

- Added `findByAccountIdOrderByCreatedAtAscIdAsc(Long accountId)` to `LedgerEntryRepository`

#### Testing & Verification

- `AuditServiceImplTest` — 17 unit tests (`@ExtendWith(MockitoExtension.class)`) covering:
  - Event history retrieval for public account
  - `AccountNotFoundException` on missing account and `SYS-CASH` for event history
  - Transaction history in event order with deduplication
  - Empty transaction history when no monetary events exist
  - Ledger history in deterministic order (`createdAt ASC, id ASC`) with matched transaction reference numbers
  - Empty ledger history when account has no entries
  - Current balance (`asOf = null`) and historical balance (`asOf` provided)
  - Audit trail running balance calculation for deposit and withdrawal sequence
  - Audit trail with historical `asOf` filter
  - Integrity failures: monetary event with null transaction, missing transaction in batch,
    missing ledger entries, missing account entry in transaction
  - Empty audit trail for account with no events
- `AuditControllerTest` — 10 web-tier tests (`MockMvc` standalone setup with `GlobalExceptionHandler`) covering:
  - `GET /events` returning 200 with JSON array
  - `GET /transactions` returning 200 with JSON array
  - `GET /ledger` returning 200 with JSON array
  - `GET /balance` returning 200 for current and historical queries
  - `GET /trail` returning 200 for current and historical queries with structured audit items and running balances
  - 404 response with `ApiError` when account not found on `/events`
  - 400 response with `ApiError` when `asOf` query parameter is malformed on `/balance` and `/trail`

#### Verification Result

```
mvn clean test
Tests run: 153, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

Full suite passing: 126 existing tests + 27 new audit tests = **153 total tests**.

#### Architectural Boundary

Phase 7 intentionally does NOT contain:

- Mutation endpoints (audit module is strictly read-only)
- Pagination, sorting, or custom filter parameters (deferred to Phase 8)
- Database schema changes or new Flyway migrations (zero DDL required)
- Materialized views, caching, snapshotting, or CQRS projections
- Multi-currency audit support

#### New ADRs Recorded

- ADR-028: Account Audit Module, Historical Replay APIs, and Financial Traceability

Next Milestone

Phase 8 — API Refinement

---

## 2026-09-19

### Phase 8 — API Refinement: COMPLETED

Phase 8 has been implemented and verified. This phase introduces production-grade pagination,
sorting, and filtering across all collection endpoints in the system, enforces deterministic
drift-free sorting, centralizes request parameter validation, and refines response structures
while maintaining accounting invariants and event-derived ordering.

#### What Was Implemented

**Generic Pagination Framework (`com.ledger.common`)**

- `PagedResponse<T>` record (`com.ledger.common.dto`):
  - Standardized immutable response container: `content` (`List<T>`), `page` (`int`), `size` (`int`),
    `totalPages` (`int`), `totalElements` (`long`).
  - Used across all collection endpoints (excluding the specialized audit trail response).
- `PaginationConstants` (`com.ledger.common.pagination`):
  - Centralized defaults: `DEFAULT_PAGE = 0`, `DEFAULT_SIZE = 20`, `MAX_SIZE = 100`.
- `PaginationValidator` (`com.ledger.common.validation`):
  - Enforces `page >= 0`, `size >= 1`, `size <= 100`. Throws `InvalidPageParameterException` on violation.
- `SortValidator` (`com.ledger.common.validation`):
  - Enforces allowlisted sort field sets and valid sort directions (`asc`, `desc`, case-insensitive).
  - Throws `InvalidSortFieldException` on violation.
  - Automatically appends a secondary deterministic tie-breaker on `id` using the identical requested
    sort direction (`Sort.by(direction, sortBy).and(Sort.by(direction, "id"))`).

**Account Module Refinement (`com.ledger.account`)**

- `AccountController.getAllAccounts` updated to support:
  - Pagination parameters: `page` (default 0), `size` (default 20, max 100).
  - Sorting parameters: `sortBy` (default `createdAt`), `direction` (default `asc`).
  - Strict sort allowlist: `createdAt`, `accountName`, `accountNumber` ONLY. (`status` and `accountType`
    are rejected if supplied as sort fields).
  - Filtering parameters: optional `status` (`AccountStatus`), optional `accountType` (`AccountType`).
  - Validation executed at controller boundary before service delegation.
  - Returns `PagedResponse<AccountResponse>`.
- `AccountServiceImpl.getAllAccounts` updated to execute pagination, sorting, and filtering:
  - Filters are applied in SQL before counting, sorting, and pagination.
  - Excludes `SYS-CASH` across all queries.
- `AccountRepository` extended with four explicit derived query methods:
  - `findAllByAccountNumberNot(String accountNumber, Pageable pageable)`
  - `findAllByAccountNumberNotAndStatus(String accountNumber, AccountStatus status, Pageable pageable)`
  - `findAllByAccountNumberNotAndAccountType(String accountNumber, AccountType accountType, Pageable pageable)`
  - `findAllByAccountNumberNotAndStatusAndAccountType(String accountNumber, AccountStatus status, AccountType accountType, Pageable pageable)`
  - No `JpaSpecificationExecutor` used; queries remain compile-time verified and predictable.

**Audit Module Refinement (`com.ledger.audit`)**

- `AuditController` and `AuditServiceImpl` updated across all collection endpoints:
  - **Event History (`GET /accounts/{accountId}/audit/events`):**
    - Paginated via `page` and `size`.
    - Sorting strictly allowlisted to `occurredAt` (`asc`/`desc`) with deterministic `id` tie-breaker.
    - No `eventType` filter (preserves complete event timeline).
    - Presentation sorting does not affect canonical event reconstruction order.
    - Returns `PagedResponse<AccountEventResponse>`.
  - **Transaction History (`GET /accounts/{accountId}/audit/transactions`):**
    - Paginated via `page` and `size`.
    - Loads canonical events first (`occurredAt ASC, id ASC`).
    - Derives unique transaction IDs preserving first-occurrence order into a `LinkedHashSet`.
    - Total elements reflects count of unique transactions.
    - Slices transaction IDs for the requested page in memory; batch-loads only the requested slice via
      `transactionRepository.findAllById`.
    - Restores chronological first-occurrence ordering.
    - Returns `PagedResponse<AccountTransactionResponse>`.
  - **Ledger History (`GET /accounts/{accountId}/audit/ledger`):**
    - Paginated via `page` and `size`.
    - Sorting strictly allowlisted to `createdAt` (`asc`/`desc`) with deterministic `id` tie-breaker.
    - Optional `entryType` filter (`CREDIT`, `DEBIT`) applied before counting/sorting/pagination.
    - Batch-loads associated transactions via `findAllById` ($O(1)$ queries, no N+1).
    - Returns `PagedResponse<AccountLedgerEntryResponse>`.
  - **Audit Trail (`GET /accounts/{accountId}/audit/trail`):**
    - Paginated via `page` and `size` alongside optional `asOf` timestamp.
    - Retains specialized `AuditTrailResponse` (`accountId`, `finalBalance`, `asOf`, `items`, `page`,
      `size`, `totalPages`, `totalElements`).
    - Canonical event history up to `asOf` is fully replayed and reconstructed in memory first.
    - Running balances are absolute cumulative values, not page-relative.
    - `finalBalance` is computed over the full reconstructed history.
    - Page slicing occurs AFTER complete reconstruction.
    - Out-of-range page requests return HTTP 200 with empty `items`, while retaining correct
      `finalBalance`, `totalPages`, and `totalElements`.
    - Arbitrary sorting and filtering are rejected to protect chronological accounting integrity.
    - Batch loading of transactions and ledger entries avoids N+1 database queries.

**Centralized Exception Handling & Validation (`com.ledger.common.exception`)**

- Introduced `InvalidPageParameterException` and `InvalidSortFieldException`.
- Extended `GlobalExceptionHandler` with handlers for both exceptions, returning standard `400 Bad Request`
  `ApiError` JSON.
- Valid out-of-range page requests (e.g. `page = 999`) return HTTP 200 with empty content/items list,
  conforming to standard REST pagination semantics.

**Repository Layer Enhancements**

- `AccountRepository`: Added 4 derived query methods supporting pagination and filtering while excluding `SYS-CASH`.
- `EventRepository`: Added `Page<Event> findByAccountId(Long accountId, Pageable pageable)`.
- `LedgerEntryRepository`: Added `Page<LedgerEntry> findByAccountId(Long accountId, Pageable pageable)` and
  `Page<LedgerEntry> findByAccountIdAndEntryType(Long accountId, EntryType entryType, Pageable pageable)`.

#### Testing & Verification

Comprehensive unit, controller, and integration tests were added and expanded across all modified modules:
- `AccountServiceImplTest` expanded from 17 to **22 tests** (added pagination, status filtering, accountType filtering, combined filtering, invalid sort/page validation).
- `AccountControllerTest` expanded from 14 to **27 tests** (added MockMvc tests for pagination defaults, custom page/size, sort field/direction validation, status/type filters, 400 Bad Request on invalid page/size/sort).
- `AuditServiceImplTest` expanded from 17 to **33 tests** (added pagination and sorting for event history, transaction history in-memory pagination with batch loading, ledger history pagination/sorting/filtering, audit trail reconstruction with pagination slicing, out-of-range page handling, and validation error propagation).
- `AuditControllerTest` expanded from 10 to **32 tests** (added MockMvc tests for paginated `/events`, `/transactions`, `/ledger`, `/trail`, invalid page parameter errors, invalid sort field/direction errors, ledger entryType filtering, out-of-range page responses).

#### Verification Result

```
mvn clean test
Tests run: 209, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

Full suite passing: 153 existing tests + 56 new Phase 8 tests = **209 total tests**.

#### Architectural Boundary

Phase 8 intentionally does NOT contain:

- Global API response envelopes (no `{ data: ..., meta: ... }` wrappers; resource-oriented records maintained)
- Database schema changes or new Flyway migrations (zero DDL required; schema remains at version 5)
- Spring Data JPA `JpaSpecificationExecutor` (relies on explicit, compile-time verified repository methods)
- Event-type filtering on event history (event stream completeness preserved)
- Arbitrary sorting or filtering on audit trail (chronological running balance invariant preserved)
- Modifications to core transaction processing or balance reconstruction algorithms

#### New ADRs Recorded

- ADR-029: Deterministic Pagination, Safe Sorting, Dynamic Filtering, and Specialized Audit Serialization

---

## 2026-09-21

### Phase 9 — Testing & Hardening: COMPLETED

Phase 9 focused on comprehensive hardening, edge-case coverage, financial invariant validation, defensive service boundary checks, and concurrent transaction safety across the entire backend.

#### What Was Hardened & Verified

**P0: Core Financial Correctness & Accounting Invariants**
- **Double-Entry Equilibrium:** Verified across all transactions that sum of debits equals sum of credits (`debitTotal == creditTotal`). Added database-level aggregation assertions confirming the global invariant across the entire `ledger_entries` table.
- **Value Conservation:** Verified that funds transferred between accounts conserve value precisely without leakage or creation (`sourceBalanceAfter + targetBalanceAfter == sourceBalanceBefore + targetBalanceBefore`).
- **Deposit / Withdrawal Symmetry:** Verified that deposits credit customer accounts and debit `SYS-CASH`, while withdrawals debit customer accounts and credit `SYS-CASH`, preserving exact net zero system-wide balance.
- **Balance Reconstruction vs. Event Stream Replay:** Verified that balance reconstruction derived from ledger entries matches independent event stream replay.
- **Deterministic Historical Reconstruction:** Verified boundary semantics for point-in-time balance reconstruction (`asOf`) with deterministic ordering (`occurred_at ASC, id ASC`).

**P1: API & Business-Rule Hardening**
- **Monetary Precision & Boundary Enforcement:** Verified that fractional-cent amounts (`100.001`, `50.005`, `25.999`) and zero or negative amounts are rejected at the REST API boundary via Jakarta Validation (`@Digits(integer = 12, fraction = 2)`, `@Positive`) with HTTP 400 Bad Request.
- **System Account (`SYS-CASH`) Isolation:** Rigorously verified that `SYS-CASH` is strictly isolated across all public endpoints and services:
  - Cannot be used as transfer source or destination (rejected with HTTP 422 `InvalidAccountStatusException` / `AccountNotEligibleException`).
  - Cannot be queried via `GET /accounts/{id}` or audit endpoints (`/events`, `/transactions`, `/ledger`, `/balance`, `/trail`), returning HTTP 404 Not Found.
  - Excluded from all paginated and filtered account listings.
  - Excluded from public balance reconstruction (`reconstructCurrentBalance` and `reconstructBalanceAt` reject `SYS-CASH` ID with `AccountNotEligibleException`).
- **Business Rule Rejections:** Tested rejections for non-existent accounts (404), transfers between the same account (422), transfers/withdrawals with insufficient funds (422), and transactions against `FROZEN` or `CLOSED` accounts (422).
- **Error Response Uniformity:** Verified that malformed JSON payloads, type mismatches, missing fields, and custom business exceptions consistently return the standardized `ApiError` format.

**LedgerService Defensive Hardening (`com.ledger.ledger.service.LedgerServiceImpl`)**
- Defensive validation was strengthened at the service boundary to strictly reject corrupt or mismatched inputs before database interaction:
  - `null` transaction rejected with `IllegalArgumentException`.
  - `null` or empty ledger entry collections rejected with `IllegalArgumentException`.
  - `null` elements within the ledger entry collection rejected with `InvalidLedgerEntryException`.
  - Entries referencing a different transaction than the transaction parameter rejected with `InvalidLedgerEntryException`.
  - `null` entry types or non-positive amounts (`amount <= 0`) rejected with `InvalidLedgerEntryException`.
  - Missing debit or missing credit entries rejected with `UnbalancedLedgerException`.
  - Imbalanced debit and credit totals rejected with `UnbalancedLedgerException`.
- Verified with 17 dedicated unit tests (`LedgerServiceImplTest`) and 5 integration tests against PostgreSQL (`LedgerServiceIntegrationTest`).

**P2: Concurrency & Thread-Safety Hardening**
- Validated pessimistic locking (`SELECT ... FOR UPDATE`) and deterministic lock ordering (`min(id)` then `max(id)`) under high thread concurrency using real PostgreSQL transactions via `CompletableFuture` and `CountDownLatch`:
  - **Concurrent Withdrawals:** Multiple threads competing for limited balance on a single account; correctly serialized, allowing valid withdrawals up to available balance and failing subsequent attempts with `InsufficientFundsException` without negative balance anomalies.
  - **Concurrent Deposits:** Multiple concurrent deposits correctly accumulate with exact final balance conservation.
  - **Concurrent Mixed Deposits and Withdrawals:** Interleaved deposits and withdrawals executed concurrently verify exact conservation: `finalBalance == initialBalance + totalSuccessfulDeposits - totalSuccessfulWithdrawals`.
  - **Concurrent Bidirectional Transfers:** Opposite-direction transfers between two accounts (A→B and B→A) executed simultaneously without deadlocks due to consistent ascending ID lock acquisition.
  - **Concurrent Competing Transfers:** Multiple threads transferring from a single source account correctly serialize and prevent overdrafts.
  - **Concurrent Account Creation:** Verified database uniqueness constraints and clean domain exception translation when duplicate account numbers are submitted concurrently.

**Integration Test Suite Expansion**
- Added dedicated integration tests operating against PostgreSQL and Flyway schema:
  - `com.ledger.account.service.AccountServiceIntegrationTest` (10 tests)
  - `com.ledger.ledger.service.LedgerServiceIntegrationTest` (5 tests)
  - `com.ledger.audit.service.AuditServiceIntegrationTest` (10 tests)
  - `com.ledger.transaction.service.TransactionServiceSysCashIntegrationTest` (5 tests)
  - Expanded `TransactionServiceIntegrationTest` with 5 financial invariant and concurrency tests.
  - Expanded `BalanceReconstructionServiceIntegrationTest` with tie-breaker and event-stream replay parity tests.

#### Verification Result

```
mvn clean test
Tests run: 244, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

Full suite passing: 209 existing tests + 35 new Phase 9 tests = **244 total tests**.

#### Architectural Boundary & Deferred Concerns

Phase 9 intentionally does NOT contain:
- Unnecessary modifications to production code; production changes were strictly limited to defensive validation in `LedgerServiceImpl`.
- Database schema changes or new Flyway migrations (Flyway schema remains at version 5).
- Performance optimizations for historical reconstruction or audit loading: loading full history remains $O(\text{history size})$; snapshotting and read-model caching remain deferred to post-v1.0 enhancements as correctness takes precedence over optimization.

---

## 2026-09-21

### Phase 10 — Backend v1.0 Release: COMPLETED

Phase 10 completed the release-readiness audit, code-quality cleanup, and release metadata preparation for the Backend v1.0 release.

#### What Was Completed & Verified

- **Release-Readiness Audit:** Completed a comprehensive audit covering the entire source tree, test suite, architecture compliance, API contracts, Flyway migrations, database schema, configuration files, Maven build setup, and technical documentation. Zero functional or blocking defects were identified.
- **Code-Quality Cleanup:**
  - **Version Metadata:** Promoted Maven project version in `backend/pom.xml` from `0.1.0-SNAPSHOT` to `1.0.0`. Promoted OpenAPI specification version in `OpenApiConfig.java` from `v0.1` to `v1.0`.
  - **Pagination Constants Centralization:** Removed duplicate `DEFAULT_PAGE`, `DEFAULT_SIZE`, and `MAX_SIZE` constants from `PaginationValidator.java`, centralizing `PaginationConstants.MAX_SIZE` as the single source of truth while preserving all existing validation behavior.
  - **OpenAPI Documentation:** Added curated Swagger/OpenAPI annotations (`@Tag`, `@Operation`, `@ApiResponses`, `@ApiResponse`, `@Parameter`) to `TransactionController` for `/accounts/{accountId}/deposit` and `/accounts/{accountId}/withdrawal`, bringing transaction documentation up to parity with `AccountController`, `TransferController`, and `AuditController`.
  - **Entity Immutability:** Removed the unused `setStatus(TransactionStatus status)` setter from `Transaction.java` after verifying zero usages across production and test code, ensuring transactions remain strictly immutable after construction.
  - **Indentation Standardization:** Standardized `TransactionServiceImpl.java` from inconsistent double-tab / 8-space indentation to the project's standard 4-space indentation with zero logic or behavior changes.
- **Database & Migration Integrity:** Flyway migrations (`V1`–`V5`) were intentionally left unchanged to protect schema immutability and checksum stability; `spring.jpa.hibernate.ddl-auto=validate` confirmed full entity/schema compatibility.
- **Release Verification:** Executed full verification via `mvn clean test`.

#### Verification Result

```
mvn clean test
Tests run: 244, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

Full suite passing: **244 total tests, 0 failures, 0 errors**.

#### Architectural Boundary

Phase 10 intentionally does NOT contain:
- New features or business logic changes
- Architectural refactoring or new dependencies
- Database schema changes or new Flyway migrations
- Roadmap features (authentication, RBAC, idempotency, CQRS, Kafka, Docker, CI/CD, multicurrency, snapshotting, optimistic locking)
- Git commit or tag creation (release tagging will be performed after final metadata verification)

Backend v1.0 release readiness confirmed.

---

## 2026-09-23

### Frontend Phase F0 — Frontend Foundation: COMPLETED

Phase F0 delivered the complete frontend application foundation, tooling, design system tokens, layout shell, routing skeleton, centralized API client, and arbitrary-precision decimal value object, strictly aligned with `FRONTEND_PRD.md`, `FRONTEND_TRD.md`, `DESIGN.md`, `FRONTEND_ARCHITECTURE.md`, `API_GUIDELINES.md`, and the approved Revision 2 Implementation Plan.

#### What Was Completed & Verified

**Tooling & Dependency Alignment**
- Aligned project dependencies with the approved F0 baseline: `react ^19.1.0` (19.3.0), `react-dom ^19.1.0` (19.3.0), `react-router-dom ^7.6.3`, `@tanstack/react-query ^5.81.5`, `decimal.js ^10.5.0`, `vite ^6.3.5` (6.4.3), `@vitejs/plugin-react ^4.5.2` (4.7.0), `typescript ~5.8.3` (5.8.3), and `vitest ^3.2.4` (3.2.7).
- Corrected dependency drift from initial accidental Vite 8 / TypeScript 6 scaffolding.
- Separated test runner configuration into a dedicated `vitest.config.ts`, keeping `vite.config.ts` purely focused on build and dev proxy configuration, completely eliminating typing conflicts.

**Design System & Layout Architecture**
- Implemented all CSS custom properties in `src/styles/tokens.css` copied verbatim from `DESIGN.md §30` (colors, surfaces, borders, radius, spacing, layout dimensions, shadows, transitions).
- Configured typography in `src/styles/typography.css` loading Inter for UI copy and JetBrains Mono with tabular numbers for all monetary amounts, account numbers, timestamps, and reference IDs.
- Implemented modern CSS reset in `src/styles/reset.css` with 2px solid primary focus ring (`#0052ff`) and skip navigation link.
- Implemented `AppShell` layout component composing `TopBar` (60px fixed header), `Sidebar` (240px desktop, off-canvas mobile with hamburger menu toggle), `PageContainer` (1200px max-width cap), and polite `aria-live` announcer.
- Implemented responsive shell behavior verified at 1280×900 (desktop) and 390×844 (mobile).

**Routing & Views**
- Implemented declarative route tree in `src/routes/AppRoutes.tsx` using React Router v7 `createBrowserRouter` and `RouterProvider`.
- Implemented `RootLayout` with programmatic focus management shifting focus to `<main id="main-content">` on route navigation per `FRONTEND_ARCHITECTURE.md §16.2`.
- Implemented `AccountLayout` shell providing route nesting for `/accounts/:accountId` sub-views.
- Implemented minimal placeholder views: `DashboardPage` (`/dashboard`), `Accounts` (`/accounts`), and `NotFoundPage` (404 catch-all with return link).

**API Client & Error Normalization**
- Implemented centralized `apiClient` in `src/api/client.ts` using native `fetch`, consuming `VITE_API_BASE_URL` (empty in dev, routing through Vite proxy to `http://localhost:8080`).
- Implemented query parameter serialization automatically skipping `null` and `undefined` entries.
- Handled HTTP 204 No Content returning `undefined`.
- Normalized all 4xx/5xx responses into `ApiError` using backend `BackendErrorBody` shape (`timestamp`, `status`, `error`, `message`, `path`).
- Mapped network failures to `ApiError { status: 0, isNetworkError: true }`.
- Implemented type guards: `isApiError`, `isNotFound`, `isConflict`, `isBusinessRuleViolation`, `isBadRequest`.
- Implemented centralized `ENDPOINTS` registry in `src/api/endpoints.ts` matching backend `@RequestMapping` annotations with zero `/api/v1` prefix.

**Monetary Value Object (`Money`) & Date Utilities**
- Implemented `Money` value object in `src/utils/money.ts` backed by `decimal.js` (configured with 20 decimal digits of precision, `ROUND_HALF_UP` rounding, and `toExpPos: 21`).
- Implemented arbitrary-precision arithmetic and comparison methods (`isZero`, `isPositive`, `isNegative`, `gte`, `gt`, `abs`).
- Implemented wire serialization `toWireString()` guaranteeing exactly 2 decimal places for outbound requests.
- Implemented display formatting `format()` with thousands separators, preserving `"0.00"` for zero and supporting optional `+` prefix.
- Implemented `src/utils/date.ts` providing local presentation formatting (`formatTimestamp`, `formatDate`) and `asOf` UTC ISO-8601 normalization (`normalizeAsOf`, `nowUtcIso`).

**Live Monetary Wire-Format Verification & ADR-030**
- Started the backend and executed raw `curl` commands against running endpoints (`POST /accounts/{id}/deposit`, `GET /accounts/{id}/audit/balance`, `GET /accounts/{id}/audit/ledger`, `GET /accounts/{id}/audit/trail`).
- Determined that the backend currently emits `BigDecimal` monetary values as **unquoted JSON numbers** (e.g. `"amount": 100.50`).
- Documented that while `Money` internally provides arbitrary-precision arithmetic and exact string parsing via `fromWire(string)`, the browser runtime's `JSON.parse` engine converts unquoted JSON numbers to IEEE-754 64-bit floats before `Money.fromWire(number)` receives them. Calling `String(number)` prevents further arithmetic drift but cannot recover precision already lost at the JSON parse boundary for values exceeding 53 bits (>15–17 decimal digits).
- Recorded **ADR-030** in `docs/DECISIONS.md` documenting the precision risk and recommending backend serialization hardening (`@JsonSerialize(using = ToStringSerializer.class)`) for a future backend release.
- Confirmed backend remains untouched in F0.

**Chrome DevTools MCP Browser Verification**
- Executed all 17 browser verification checks (**B-01 through B-17**) via `chrome-devtools-mcp` against running frontend (`http://localhost:5173`):
  - B-01: Vite dev server booted without connection error; `/` redirected to `/dashboard`.
  - B-02: Non-blank document render confirmed.
  - B-03: Accessibility landmarks (`<header>`, `<nav>`, `<main id="main-content">`) verified.
  - B-04: TopBar rendered at 60px height with logo and title.
  - B-05: Sidebar rendered with Dashboard and Accounts links.
  - B-06: Main content container rendered with 1200px max-width constraint.
  - B-07: `/dashboard` rendered `DashboardPage` placeholder.
  - B-08: `/accounts` rendered `Accounts` placeholder; SPA HTML bypass verified.
  - B-09: `/accounts/999` redirected to `/accounts/999/overview` rendering `AccountLayout` shell.
  - B-10: `/totally-unknown-path` rendered `NotFoundPage` (404).
  - B-11: Console messages inspected: 0 uncaught errors, 0 warnings.
  - B-12: Network requests inspected: fonts and modules loaded.
  - B-13: Network URLs inspected: 0 occurrences of `/api/v1`.
  - B-14: Desktop layout (1280×900) verified with persistent sidebar.
  - B-15: Mobile layout (390×844) verified with off-canvas sidebar and hamburger toggle.
  - B-16: Accessibility landmarks and skip link verified in a11y tree.
  - B-17: Tab key focus ring verified (2px solid `#0052ff` with 2px offset).

#### Verification Result

```text
npm run test       → 64/64 passed (Money: 34, Date: 18, API client: 12)
npm run typecheck  → PASS (0 errors)
npm run lint       → PASS (0 errors, 0 warnings)
npm run build      → PASS (optimized static bundle in 2.06s via Vite 6.4.3)
```

#### Architectural Boundary

Phase F0 intentionally does NOT contain:
- Account management, creation, or lifecycle UI (Phase F1)
- Deposit, withdrawal, or transfer UI (Phase F2)
- Transaction, ledger, event stream, or audit trail UI (Phases F3 & F4)
- Dashboard metrics or business queries (Phase F1 / F5)
- Feature-specific DTOs or validation stubs (`validation.ts`)
- Backend code modifications (`git diff -- backend/` is completely empty)
- Git commit creation

Phase F0 accepted and complete. Phase F1 ready for execution.

---

## 2026-09-23

### Frontend Phase F1 — Account Experience: COMPLETED

Phase F1 implemented the complete Account Experience feature set, including the server-paginated accounts directory, account creation modal, deep-linkable account layout context shell, account overview, authoritative current balance integration, and account lifecycle mutations with confirmation dialogs. All implementations strictly observe `FRONTEND_PRD.md`, `FRONTEND_TRD.md`, `DESIGN.md`, `FRONTEND_ARCHITECTURE.md`, `API_GUIDELINES.md`, and the approved Revision 2 Implementation Plan.

#### What Was Completed & Verified

**Accounts Directory (`/accounts`)**
- Implemented `AccountsPage` at `/accounts` composing `AccountsTable`, `AccountFilters`, `AccountSortControl`, and `TablePagination`.
- Implemented `AccountsTable` consuming `PagedResponse<AccountResponse>` using generic `DataTable<T>`.
- Verified strict avoidance of N+1 balance queries: `GET /accounts` returns metadata only; directory table displays zero balances.
- Implemented server-paginated controls using `TablePagination` with 1-based display index derived from zero-based server parameters.
- Implemented URL search parameter synchronization via `useSearchParams` for `page`, `size`, `sortBy`, `direction`, `status`, and `accountType`. Filter/sort modifications reset page index to 0.
- Implemented empty states distinguishing between empty directory (no accounts created yet) and filtered empty state (no matches with clear-filters affordance).

**Account Creation (`CreateAccountModal`)**
- Implemented `CreateAccountModal` form dialog invoking `POST /accounts` via `useCreateAccount` mutation hook.
- Enforced non-blank validation for `accountNumber` and `accountName`, and enum validation for `accountType` (`SAVINGS`, `CURRENT`).
- Preserved backend authority: regex hint (`^[A-Za-z0-9-_]{3,30}$`) is displayed as format guidance only and is not enforced as a false-blocking client validation rule.
- Handled HTTP 409 Conflict gracefully by displaying an inline field error on `accountNumber` ("This account number is already in use").
- Handled submission state: form controls and button disabled with spinner during `isPending` state, preventing duplicate submissions.
- On HTTP 201 Created: automatically invalidated `['accounts', 'list']` React Query cache, triggered success toast notification, and navigated to the newly created account's overview.

**Account Context Layout Shell (`AccountLayout`)**
- Implemented `AccountLayout` routing shell mapping `/accounts/:accountId/*` sub-routes.
- Rendered persistent account identification banner showing account name, `TechnicalIdBadge` with clipboard copy action for `accountNumber`, account type, and dual-encoded `StatusBadge`.
- Rendered authoritative current balance loaded exclusively from `GET /accounts/{accountId}/audit/balance` formatted through `Money.fromWire()`.
- Implemented `TabNav` with deep-linkable `NavLink` tabs: Overview (F1), Transactions (F3 placeholder), Ledger (F3 placeholder), Events (F3 placeholder), and Audit Trail (F4 placeholder).
- Implemented accessible error boundary: missing or system-restricted accounts (HTTP 404 / `SYS-CASH`) render `AccountNotFoundView` with return link, preventing unhandled exceptions.
- Provided shared `AccountOutletContext` (`account`, `balanceString`, `isBalanceLoading`, `refetchBalance`, `refetchAccount`) to child routes via React Router `useOutletContext`.

**Account Overview & Lifecycle State Management (`AccountOverviewPage`)**
- Implemented `AccountOverviewPage` at `/accounts/:accountId/overview` displaying comprehensive account identity metadata, database ID chip, and timestamps (`createdAt`, `updatedAt`).
- Implemented authoritative balance display with dedicated server re-fetch control.
- Implemented status-gated lifecycle controls:
  - `ACTIVE`: Displays "Freeze Account" and "Close Account" action buttons.
  - `FROZEN`: Displays "Reactivate Account" (primary) and "Close Account" (destructive) buttons, along with a warning notice banner.
  - `CLOSED`: Displays permanent terminal closure notice banner; all operational action buttons are suppressed.
- Implemented lifecycle mutation hooks in `src/features/accounts/api/accountMutations.ts`:
  - `useFreezeAccount` (`PATCH /accounts/{id}/freeze`)
  - `useActivateAccount` (`PATCH /accounts/{id}/activate`)
  - `useCloseAccount` (`PATCH /accounts/{id}/close`)
- Implemented accessible confirmation modals: `FreezeConfirmDialog` (explaining operational suspension) and `CloseConfirmDialog` (destructive red confirmation explaining permanent terminal closure per `DESIGN.md §9.3`).
- Enforced strict server authority for business rule validation: `InvalidAccountStatusTransitionException` (HTTP 422) surfaces specific backend `serverMessage` in toast and dialog banners.
- Prevented double submission through mutation `isPending` state gating.
- Successful mutations invalidate both account detail (`['accounts', id]`), account list (`['accounts', 'list']`), and audit balance (`['accounts', id, 'balance']`) query caches.

**Shared Presentational Infrastructure**
- `src/components/typography/StatusBadge.tsx`: Dual-encoded status badge (`ACTIVE`, `FROZEN`, `CLOSED`) using token colors and labels from `DESIGN.md §10.2`.
- `src/components/typography/TechnicalIdBadge.tsx`: Monospace identifier chip (`JetBrains Mono`, 13px) with hover-activated copy-to-clipboard button and success feedback.
- `src/components/feedback/EmptyState.tsx`: Presentational container for empty lists and search results with icon, title, description, and primary action slot.
- `src/components/feedback/ErrorDisplay.tsx`: Normalized error banner rendering `ApiError` network failures, 404, 409, and 422 messages with retry callback.
- `src/components/data-display/DataTable.tsx` & `TablePagination.tsx`: Accessible generic table and pagination controls per `DESIGN.md §12.1` and `§21`.
- `src/components/overlay/ModalDialog.tsx` & `ConfirmDialog.tsx`: Portal-based dialogs with focus trapping, `Escape` key listeners, backdrop blur, and body scroll lock.
- `src/components/feedback/Toast.tsx`, `ToastViewport.tsx`, `ToastProvider.tsx`, `src/hooks/useToast.ts`: Toast notification system with 5s auto-dismiss and aria-live polite announcements per `DESIGN.md §17`.
- `src/components/navigation/TabNav.tsx`: Horizontal account sub-view navigation tabs with active link highlight.

**Financial Correctness Guarantees Maintained**
- Zero client-side balance calculations, running balance derivations, or financial arithmetic.
- Zero optimistic balance or lifecycle state mutations.
- The backend remains the sole authority for all balance and accounting invariants.
- Monetary display values formatted strictly through `Money.fromWire()`.
- Untouched F0 foundation: `DashboardPage.tsx` preserved as F0 placeholder (deferred to F5).
- Zero `/api/v1` prefix occurrences.

#### Verification Result

```text
Typecheck:         PASS (tsc --noEmit, 0 errors)
Automated Tests:   64/64 passed (3 test files: money, date, api client)
Production Build:  PASS (tsc -b && vite build — optimized static bundle)
Manual F1 Testing: PASS across all 18 test areas (directory, filters, sorting,
                   pagination, creation, validation, duplicate 409, overview,
                   authoritative balance, navigation, deep linking, 404/SYS-CASH,
                   freeze, activate, close, closed persistence, browser history,
                   and dashboard preservation)
```

#### Architectural Boundary

Phase F1 intentionally does NOT contain:
- Deposit, withdrawal, or transfer workflows (Phase F2)
- Transaction history, ledger history, or event stream tabs (Phase F3)
- Audit trail view or historical balance reconstruction (`asOf`) (Phase F4)
- Dashboard aggregation metrics or quick actions (Phase F5)
- Authentication or user management (out of scope for v1.0)
- Backend code modifications (`git diff -- backend/` is completely empty)

Phase F1 accepted and complete. Phase F2 ready for execution.

---

## 2026-09-27

### Frontend Phase F2 — Monetary Operations: COMPLETED

Phase F2 implemented the complete monetary operations feature set, including the Deposit, Withdrawal, and Account Transfer workflows, pre-flight monetary input validation, transaction mutation hooks, integration into the Account Overview page, accessible modal dialogs, and authoritative balance cache invalidation. All implementations strictly observe `FRONTEND_PRD.md`, `FRONTEND_TRD.md`, `DESIGN.md`, `FRONTEND_ARCHITECTURE.md`, `API_GUIDELINES.md`, and the approved Phase F2 Implementation Plan.

#### What Was Completed & Verified

**Deposit Workflow (`DepositModal`)**
- Implemented `DepositModal` at `src/features/transactions/components/DepositModal.tsx` invoking `POST /accounts/{accountId}/deposit` via `useDeposit` mutation hook.
- Enforced pre-flight client-side monetary validation via `validateMonetaryAmount()`.
- Implemented duplicate submission protection (inputs and buttons disabled during `isPending`, keyboard form submission lock).
- Handled backend error responses (400 validation, 404 account not found, 422 business rules, 500 server error, network errors) via normalized `ErrorDisplay`, preserving modal and input state for user correction.
- On success: closed modal, triggered success toast displaying the authoritative transaction reference number and formatted amount, and invalidated the authoritative balance query cache.

**Withdrawal Workflow (`WithdrawalModal`)**
- Implemented `WithdrawalModal` at `src/features/transactions/components/WithdrawalModal.tsx` invoking `POST /accounts/{accountId}/withdrawal` via `useWithdrawal` mutation hook.
- Standard primary action styling enforced per `DESIGN.md §9, §28.2`: withdrawal is a standard financial operation and does NOT use destructive red button styling.
- Preserved server authority: the frontend does NOT compare the withdrawal amount against cached balances; the backend database lock and balance computation is the sole financial authority.
- Handled backend 422 business rule violations (`InsufficientFundsException`, `AccountNotEligibleForTransactionException`) cleanly in an inline error banner without exposing technical stack traces.
- On success: closed modal, announced success toast with transaction reference number and formatted amount, and invalidated authoritative balance query cache.

**Transfer Workflow (`TransferModal`)**
- Implemented `TransferModal` at `src/features/transactions/components/TransferModal.tsx` invoking `POST /transfers` via `useTransfer` mutation hook.
- Source account fixed from current account context (`account.accountNumber`, `account.accountName`).
- Destination selector populated from `useAccounts({ status: AccountStatus.ACTIVE })` query.
- Strict account filtering:
  - `SYS-CASH` is strictly excluded from destination options (`acc.accountNumber !== 'SYS-CASH'`).
  - Source account is strictly excluded from destination options (`acc.id !== account.id`).
  - Only `ACTIVE` customer accounts are selectable.
- UI displays user-friendly account label (`{accountNumber} — {accountName}`) while submitting the numeric backend account ID.
- Counterparty and amount validation: validates destination selection, blocks same-account transfers, and enforces monetary bounds.
- Dual balance cache invalidation: on success, invalidates authoritative balance queries for BOTH source and destination accounts (`auditKeys.balance(sourceAccountId, null)` and `auditKeys.balance(destinationAccountId, null)`).
- Handled backend 422 responses (`InsufficientFundsException`, `InvalidTransferException`, `AccountNotEligibleForTransactionException`).

**Monetary Input Validation (`validateMonetaryAmount`)**
- Implemented `src/utils/validation.ts` with `MONETARY_REGEX = /^\d+(\.\d{1,2})?$/`.
- Enforces backend `@DecimalMin("0.01")` and `@Digits(integer = 17, fraction = 2)` rules:
  - Rejects empty, whitespace-only, zero (`0`, `0.00`), negative values, alphabetic characters, currency symbols (`₹`, `$`), scientific notation, multiple decimal points, >2 decimal places, and >17 integer digits (with proper leading-zero handling).
  - Accepts positive integers, 1- or 2-decimal numbers, minimum boundary `0.01`, and maximum 17-integer-digit boundaries.
- Zero floating-point conversions or arithmetic; parses validated input into a precision-safe `Money` value object.

**Account Overview Integration (`AccountOverviewPage`)**
- Added "Monetary Operations" card to the right-hand column of `AccountOverviewPage`.
- Action buttons ("Deposit Funds", "Withdraw Funds", "Transfer Funds") enabled strictly when `account.status === AccountStatus.ACTIVE`.
- Status-gated for non-active accounts: monetary operations are suspended with an informative message when `FROZEN`, and marked unavailable when `CLOSED`.
- Integrated modal state management cleanly without altering unrelated F1 account overview logic.

**Financial Correctness & Architectural Invariants Maintained**
- Zero client-side balance calculations, running balance derivations, or double-entry arithmetic.
- Zero optimistic balance updates (`queryClient.setQueryData()` is never called for financial state).
- Targeted cache invalidation: monetary mutations invalidate strictly `auditKeys.balance` queries; `accountKeys.detail()` and `accountKeys.lists()` are not unnecessarily invalidated because `AccountResponse` contains no financial state.
- Exact monetary wire handling preserved: request amounts serialized via `Money.toWireString()`; response amounts ingested via `Money.fromWire(response.amount).format()`.
- Strict decimal precision: zero usage of `Number()`, `parseFloat()`, or JavaScript floating-point arithmetic on monetary values.
- Zero `/api/v1` prefix occurrences.
- Backend code remained completely untouched (`git diff -- backend/` is 100% empty).

#### Verification Result

```text
Automated Tests:   123/123 passed across 9 test files (0 failures)
                   - src/utils/__tests__/date.test.ts (18 tests)
                   - src/utils/__tests__/validation.test.ts (23 tests)
                   - src/utils/__tests__/money.test.ts (34 tests)
                   - src/api/__tests__/client.test.ts (12 tests)
                   - src/features/transactions/api/__tests__/transactionMutations.test.tsx (6 tests)
                   - src/features/accounts/pages/__tests__/AccountOverviewPage.test.tsx (6 tests)
                   - src/features/transactions/components/__tests__/WithdrawalModal.test.tsx (9 tests)
                   - src/features/transactions/components/__tests__/DepositModal.test.tsx (9 tests)
                   - src/features/transactions/components/__tests__/TransferModal.test.tsx (6 tests)
TypeScript:        PASS (tsc --noEmit, 0 errors)
ESLint:            PASS on F2 files (0 errors, 0 warnings)
Production Build:  PASS (tsc -b && vite build — optimized static bundle in 2.38s)
Manual E2E:        PASS in running browser:
                   - Accounts page loads correctly
                   - Active account overview displays balance and monetary action buttons
                   - Deposit modal validates amount and submits successfully
                   - Withdrawal modal validates amount, uses primary styling, and submits successfully
                   - Transfer modal lists active accounts, excludes SYS-CASH and source account, and submits successfully
                   - Authoritative balances refresh automatically following successful mutations
                   - Success toasts display formatted amounts and reference numbers
                   - Pre-flight validation rejects invalid monetary inputs (0, negative, >2 decimals, empty)
                   - Backend errors (422 Insufficient Funds, 422 Ineligible Account) display cleanly and preserve input state
                   - Frozen and closed accounts disallow monetary operations
Backend Diff:      Completely clean / untouched (0 modifications)
```

#### Architectural Boundary

Phase F2 intentionally does NOT contain:
- Transaction history, ledger entry journal, or event stream tabs (Phase F3)
- Audit trail view or historical balance reconstruction (`asOf`) (Phase F4)
- Dashboard aggregation metrics or quick actions (Phase F5)
- Authentication or user management (out of scope for v1.0)
- Backend code modifications (`git diff -- backend/` is completely empty)

Phase F2 accepted and complete. Phase F3 ready for execution.

---

## 2026-09-28

### Phase F3 — Financial History: COMPLETED

Phase F3 has been implemented, thoroughly tested, and verified against the frozen backend v1.0.0 REST API.
All financial history inspection tabs (Transactions, Ledger, Events) are operational with server-driven pagination, sorting, drawer inspection, zero fabricated amounts, and double-entry presentation standards.

#### What Was Implemented

**DTO Types & Query Interfaces (`frontend/src/features/audit/types/audit.ts`)**
- Added exact types matching frozen backend v1.0.0:
  - `AccountTransactionResponse` (`transactionId`, `transactionType`, `description`, `referenceNumber`, `createdAt`) — explicitly zero amount field.
  - `AccountLedgerEntryResponse` (`entryId`, `accountNumber`, `entryType`, `amount`, `referenceNumber`, `createdAt`).
  - `AccountEventResponse` (`eventId`, `eventType`, `occurredAt`, `transactionId`, `payload`).
  - Parameter interfaces with server-driven pagination (`page`, `size`) and validated sort fields: `AccountTransactionParams`, `AccountLedgerParams` (with `entryType`), `AccountEventParams`.
- Re-exported relevant types via `frontend/src/features/transactions/types/transaction.ts`.

**Accessible Overlay Primitives (`frontend/src/components/overlay/SlideOver.tsx`)**
- Created accessible slide-over drawer primitive using React Portals (`#modal-root` fallback to `document.body`).
- Features focus trapping, Escape key dismissal, body scroll-locking, accessible ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`), and smooth CSS slide-in transitions.

**Query Hooks & Targeted Cache Invalidation (`frontend/src/features/audit/api/auditQueries.ts`)**
- Implemented hierarchical query key factories: `auditKeys.transactionsRoot()`, `auditKeys.ledgerRoot()`, `auditKeys.eventsRoot()`, and `auditKeys.all(accountId)`.
- Implemented React Query hooks: `useAccountTransactions`, `useAccountLedger`, and `useAccountEvents`.
- Updated monetary mutations in `transactionMutations.ts` using centralized `auditKeys` factories:
  - Post-mutation invalidations automatically purge transactions, ledger entries, events, and balance queries.
  - Transfer mutations invalidate financial history and balance queries for **both source and destination accounts**.

**Account Transactions History Tab (`frontend/src/features/transactions/`)**
- Implemented `TransactionsTable` rendering `Date`, `Type`, `Description`, `Reference #`, and `Actions`.
- Strictly zero amount column or derived financial figures.
- Implemented `TransactionDetailModal` providing modal view of transaction properties without fabricating an amount or misrepresenting `accountId` as a response field.
- Implemented `AccountTransactionsPage` with full server-driven pagination and accessible empty states.

**Account Ledger History Tab (`frontend/src/features/audit/`)**
- Implemented `LedgerControls` supporting `entryType` filtering (`ALL`, `DEBIT`, `CREDIT`) and sort order toggling on `createdAt`.
- Implemented `LedgerTable` separating debits and credits into distinct columns.
- Enforced neutral typography (`var(--color-ink)`) with `font-variant-numeric: tabular-nums`: Debit is NEVER styled red, Credit is NEVER styled green.
- Implemented `AccountLedgerPage` with URL query param synchronization and empty states.

**Account Events Stream Tab & Inspection Drawer (`frontend/src/features/audit/`)**
- Implemented `EventsControls` supporting chronological sort ordering on `occurredAt` (strictly NO `eventType` filter per frozen backend API).
- Implemented `EventsTable` displaying `Occurred At`, `Event Type`, `Event ID`, `Transaction ID`, and `Inspect` action.
- Implemented `EventPayloadDrawer` displaying safely formatted, syntax-styled JSON payloads, payload copy button, immutability audit banner, and metadata summary with zero balance derivation.
- Implemented `AccountEventsPage` with server-driven pagination.

**Routing Integration (`frontend/src/routes/AppRoutes.tsx`)**
- Replaced F0/F1 placeholder routes with real historical views:
  - `/accounts/:accountId/transactions` -> `AccountTransactionsPage`
  - `/accounts/:accountId/ledger` -> `AccountLedgerPage`
  - `/accounts/:accountId/events` -> `AccountEventsPage`
  - `/accounts/:accountId/audit` preserved as placeholder for Phase F4.

**Financial Correctness & Architectural Invariants Maintained**
- Zero client-side balance calculations or running balance derivations.
- Zero JavaScript `Number` or `parseFloat` used for monetary amounts (rendered safely via `Money.fromWire()`).
- Zero fabricated transaction amounts.
- Debit and Credit formatted using neutral styling.
- Backend code remained completely untouched (`git diff -- backend/` is 100% empty).

#### Verification Result

```text
Automated Tests:   146/146 passed across 14 test files (0 failures)
                   - src/utils/__tests__/date.test.ts (18 tests)
                   - src/utils/__tests__/validation.test.ts (23 tests)
                   - src/utils/__tests__/money.test.ts (34 tests)
                   - src/api/__tests__/client.test.ts (12 tests)
                   - src/features/transactions/api/__tests__/transactionMutations.test.tsx (6 tests)
                   - src/features/audit/api/__tests__/auditQueries.test.tsx (6 tests)
                   - src/features/accounts/pages/__tests__/AccountOverviewPage.test.tsx (6 tests)
                   - src/features/transactions/pages/__tests__/AccountTransactionsPage.test.tsx (4 tests)
                   - src/features/transactions/components/__tests__/TransactionDetailModal / Table (included in page suite)
                   - src/features/audit/pages/__tests__/AccountLedgerPage.test.tsx (5 tests)
                   - src/features/audit/pages/__tests__/AccountEventsPage.test.tsx (5 tests)
                   - src/features/audit/components/__tests__/EventPayloadDrawer.test.tsx (3 tests)
                   - src/features/transactions/components/__tests__/WithdrawalModal.test.tsx (9 tests)
                   - src/features/transactions/components/__tests__/DepositModal.test.tsx (9 tests)
                   - src/features/transactions/components/__tests__/TransferModal.test.tsx (6 tests)
TypeScript:        PASS (tsc -b, 0 errors)
ESLint:            PASS on all F3 files (0 errors, 0 warnings)
Production Build:  PASS (tsc -b && vite build — optimized static bundle in 2.46s)
Backend Diff:      Completely clean / untouched (0 modifications)
```

#### Architectural Boundary

Phase F3 intentionally does NOT contain:
- Audit trail view or historical balance reconstruction (`asOf`) (Phase F4)
- Dashboard aggregation metrics or portfolio quick actions (Phase F5)
- User authentication or RBAC (out of scope for v1.0)
- Backend code modifications (`git diff -- backend/` is completely empty)

Phase F3 accepted and complete. Phase F4 ready for execution.

---

## 2026-09-29

### Phase F4 — Audit Experience: COMPLETED

Phase F4 delivered the signature audit experience of the event-sourced ledger, implementing the chronological audit trail and point-in-time balance reconstruction view.

#### What Was Implemented & Verified

**Audit Trail DTOs & Query Layer (`frontend/src/features/audit/`)**
- Added `AuditTrailItemResponse`, `AuditTrailResponse`, and `AccountAuditTrailParams` to `types/audit.ts` preserving strict backend nullability (`transactionId: number | null`, `referenceNumber: string | null`, `asOf: string | null`).
- Implemented hierarchical query key factories: `auditKeys.trailRoot()` and `auditKeys.trail(accountId, params)`.
- Implemented `useAuditTrail` React Query hook consuming `GET /accounts/{accountId}/audit/trail` with `page`, `size`, and `asOf` parameters.
- Preserved single-query architecture: the view issues zero secondary balance requests and relies solely on `AuditTrailResponse`.

**Date / Time Normalization Utilities (`frontend/src/utils/date.ts`)**
- Implemented `toLocalDatetimeInputString(isoString)` to convert UTC ISO-8601 strings into local browser `YYYY-MM-DDTHH:mm` format for `<input type="datetime-local" />` hydration.
- Utilized existing `normalizeAsOf(localDatetimeString)` to strictly convert user local datetime inputs to UTC ISO-8601 before API submission.

**Authoritative Balance Card (`frontend/src/features/audit/components/AuditBalanceCard.tsx`)**
- Consumes `finalBalance` directly from `AuditTrailResponse.finalBalance` via `Money.fromWire()`.
- Visually distinguishes Current Reconstructed Balance vs Historical Reconstructed Balance As Of [Formatted Local Timestamp] (UTC).
- Annotated with event count (`Derived from X historical event(s) up to selected cutoff point`) and copy confirming server-authoritative derivation from full event replay prior to pagination.
- Explicitly renders `0.00` for zero balances (e.g. pre-creation cutoff).

**Audit Trail Controls (`frontend/src/features/audit/components/AuditTrailControls.tsx`)**
- Scoped strictly to: datetime-local cutoff input, Reconstruct action button, and Reset to Current Balance button (when `asOf` is active).
- Displays inclusive boundary notice: `Includes all events where occurredAt <= asOf. Events sharing the identical boundary timestamp are included together.`
- Zero unapproved quick actions ("Set to Current Time" intentionally excluded per PRD/Design specs).

**Audit Trail Table (`frontend/src/features/audit/components/AuditTrailTable.tsx`)**
- Implemented 7 columns matching the authoritative presentation order in DESIGN.md §12–13:
  `Occurred At | Event Type | Event ID | Reference # | Transaction ID | Balance Change (₹) | Running Balance (₹)`
- Applies tabular numeric typography (`font-variant-numeric: tabular-nums`) on all monetary values.
- Formats signed deltas with explicit `+` or `-` via `Money.format({ showPositiveSign: true })`.
- Explicitly renders `0.00` for genesis event (`ACCOUNT_CREATED`) delta.
- Renders `—` for null identifiers (`transactionId`, `referenceNumber`).
- Preserves accounting neutrality: neither debit nor credit is styled red or green.
- Preserves absolute immutability: zero edit, delete, rollback, or mutation affordances.

**Audit Trail Page Route Controller (`frontend/src/features/audit/pages/AuditTrailPage.tsx`)**
- Wired to `/accounts/:accountId/audit` in `AppRoutes.tsx`, replacing the F0 placeholder and removing obsolete `Placeholder` helper.
- URL search parameters own `page`, `size`, and `asOf` state.
- Preserves `asOf` and `size` across pagination page transitions.
- Handles out-of-range pagination (HTTP 200 with empty items) as a valid empty-page state while retaining stable `finalBalance` and a "Return to Page 1" action.
- Handles pre-creation cutoff as a valid financial state ($0.00 balance) with clear historical empty state and a "Reset to Current Balance" action.

**Financial Correctness & Architectural Invariants Maintained**
- Zero client-side balance calculations, event replay, or delta summation.
- `finalBalance`, `runningBalance`, and `balanceChange` are server-authoritative.
- Backend code remained completely untouched (`git diff -- backend/` is 100% empty).
- No new dependencies added.

#### Verification Result

```text
Automated Tests:   175/175 passed across 18 test files (0 failures)
                   - src/features/audit/api/__tests__/auditQueries.test.tsx (8 tests, +2 new)
                   - src/features/audit/components/__tests__/AuditTrailTable.test.tsx (6 tests, NEW)
                   - src/features/audit/components/__tests__/AuditTrailControls.test.tsx (5 tests, NEW)
                   - src/features/audit/components/__tests__/AuditBalanceCard.test.tsx (4 tests, NEW)
                   - src/features/audit/pages/__tests__/AuditTrailPage.test.tsx (7 tests, NEW)
                   - src/utils/__tests__/date.test.ts (23 tests, +5 new)
                   - 12 existing test suites (118 tests) untouched and passing
TypeScript:        PASS (tsc --noEmit & tsc -b, 0 errors)
ESLint:            PASS on all 14 F4 files (0 errors, 0 warnings)
                   * Note: 4 pre-existing errors and 6 pre-existing warnings in untouched F0/F1 files
                     remain in repo-wide lint and are scheduled for Phase F5 cross-cutting polish.
Production Build:  PASS (tsc -b && vite build — optimized static bundle generated cleanly)
Backend Diff:      Completely clean / untouched (0 modifications)
```

#### Architectural Boundary

Phase F4 intentionally does NOT contain:
- Portfolio Dashboard metrics or summary aggregations (Phase F5)
- Cross-cutting accessibility polish or global quality gate cleanups (Phase F5)
- User authentication or RBAC (out of scope for v1.0)
- Backend code modifications (`git diff -- backend/` is completely empty)

#### New ADRs Recorded

- ADR-033: Frontend Audit Experience Architecture: Single-Query Audit Projection, URL-Owned Temporal Reconstruction, Strict Boundary Normalization, and Server-Authoritative Running Balances

Phase F4 accepted and complete. Phase F5 (Dashboard & Release Readiness) ready for execution.

---

## 2026-09-30

### Phase F5 — Dashboard & Release Readiness: COMPLETED

Phase F5 completed the planned frontend implementation (Phases F0–F5), delivering the portfolio Dashboard, global accessibility hardening, responsive validation across all four breakpoints, automated Playwright browser E2E testing for the critical financial journey, and production release readiness.

#### What Was Implemented & Verified

**Portfolio Dashboard (`/dashboard`)**
- Implemented `DashboardPage` at `src/features/dashboard/pages/DashboardPage.tsx` displaying **exactly three portfolio metrics**:
  - Total Accounts
  - Active Accounts
  - Frozen Accounts
- Backed by `useDashboardQueries` issuing 3 concurrent, lightweight queries to `GET /accounts` with `size=1` and reading `totalElements`:
  - Total Accounts: unfiltered query (`status=null`)
  - Active Accounts: `status=ACTIVE`
  - Frozen Accounts: `status=FROZEN`
- Strictly zero client-side financial calculations; the frontend derives no synthetic totals and computes no balances.
- Implemented four Quick Actions in `DashboardQuickActions.tsx`:
  - **Create Account**: triggers `CreateAccountModal`
  - **Deposit**: triggers `DepositModal` with active customer account selection
  - **Withdrawal**: triggers `WithdrawalModal` with active customer account selection
  - **Transfer**: triggers `TransferModal` with active customer source and destination selection
- All existing monetary operation invariants, business-rule validation, and server-authoritative balance cache invalidations were preserved intact.
- Transfer modal constraints maintained: active accounts only, `SYS-CASH` excluded, source and destination accounts must differ, zero optimistic updates.

**Accessibility (WCAG 2.1 AA) & Responsive Polish**
- Enforced complete keyboard navigation: focus traps in modals and drawers, Escape key dismissals, visible 2px primary focus indicators (`:focus-visible`), and proper heading hierarchies.
- Polite `aria-live` region announcements in `ToastViewport` for transaction feedback.
- Color-independent state badges pairing explicit text labels with unique geometry (`StatusBadge`).
- Layout responsiveness verified across all four documented viewports (<640px mobile, 640–1024px tablet, 1024–1280px desktop, and >1280px wide displays with 1200px container cap).
- Dense financial tables feature horizontal scroll containers with sticky headers.

**Automated Testing & Release Readiness**
- Added `@playwright/test` dev dependency and established Playwright configuration (`playwright.config.ts`).
- Created automated browser E2E test `frontend/e2e/critical-journey.spec.ts` executing the complete financial journey against the live backend:
  1. Creates two customer accounts (Account A and Account B).
  2. Submits a ₹10,000.00 deposit into Account A and verifies authoritative balance.
  3. Executes a ₹2,500.00 transfer from Account A to Account B.
  4. Verifies derived balances on both accounts (Account A: ₹7,500.00; Account B: ₹2,500.00).
  5. Inspects Account A Audit Trail verifying chronological event stream (`ACCOUNT_CREATED`, `DEPOSIT`, `TRANSFER_DEBIT`) and exact cumulative running balances.
- Expanded Vitest test coverage to 205 tests across 23 test files.
- Verified zero TypeScript compiler errors (`npm run typecheck`).
- Fixed all pre-existing ESLint warnings and errors across the repository (`npm run lint` — 0 errors, 0 warnings).
- Production build validation (`npm run build`) generates clean static distribution bundle.

#### Verification Result (at F5 completion)

```text
Automated Tests:   205/205 passed across 23 test files (0 failures)
TypeScript:        PASS (tsc -b, 0 errors)
ESLint:            PASS repo-wide (0 errors, 0 warnings)
Playwright E2E:    PASS (critical-journey.spec.ts passed in real Chromium browser)
Production Build:  PASS (tsc -b && vite build — optimized static bundle)
Backend Diff:      Completely clean / untouched (0 modifications)
```

#### Architectural Boundary

Phase F5 intentionally does NOT contain:
- Unverified global financial metrics (e.g. system-wide money held or transaction volumes not provided by backend).
- User authentication, login screens, or RBAC (deferred post-v1.0).
- Backend code modifications (`git diff -- backend/` is completely empty).

---

## 2026-09-30

### Post-F5 Enhancement — Collapsible Desktop Sidebar: COMPLETED

Following the completion of Phase F5, an enhancement was implemented to maximize workspace width for data-dense financial tables on desktop viewports.

#### What Was Implemented

- Added collapsible state to `Sidebar.tsx`:
  - **Expanded state**: 240px width with icon and navigation labels.
  - **Collapsed state**: 64px width displaying centered icons with accessible tooltips on hover and focus.
- Accessible collapse toggle button with `aria-expanded` and `aria-label` attributes.
- Smooth CSS width and opacity transitions (0.2s ease).
- State persistence: user's collapsed/expanded choice is persisted to `localStorage` under the key `esl_sidebar_collapsed` and restored on page load.
- Desktop collapse behavior is strictly decoupled from mobile off-canvas drawer behavior (<1024px).
- Respects `prefers-reduced-motion` media queries.
- Zero impact on backend, API contracts, or financial logic.

---

## 2026-09-30

### Post-F5 Enhancement — Application-Wide Dark Mode Integration: COMPLETED

An application-wide theme architecture was implemented to provide user-controlled light and dark modes with complete visual consistency and zero flash of unstyled content.

#### What Was Implemented

- Created `ThemeContext` and `ThemeProvider` in `src/features/theme/` managing `'light' | 'dark'` theme state.
- Custom hook `useTheme()` for accessing and updating active theme.
- `ThemeToggle` component with accessible button semantics, SVG sun/moon icons, and keyboard operability.
- Added dark mode tokens in `src/styles/tokens.css` under `[data-theme="dark"]`, establishing accessible dark surfaces (`--surface-canvas`, `--surface-card`), inverted text inks (`--color-ink`, `--color-body`), and softened dark borders (`--border-hairline`).
- Added inline anti-flash script in `index.html` head to read `localStorage` (`esl_theme`) and immediately set `data-theme` on `<html>` before stylesheet evaluation.
- Migrated hardcoded colors in AppShell, TopBar, Sidebar, modals, tables, and cards to semantic design tokens.
- WCAG AA contrast maintained in both themes across all views.
- Theme transitions respect `prefers-reduced-motion`.

---

## 2026-09-30

### Post-F5 Enhancement — Public Product Landing Page & Ledger Brand Navigation: COMPLETED

To provide a clear public architectural showcase and separate public exploration from the internal application console, a public landing page and connected brand navigation were implemented.

#### What Was Implemented

**Public Landing Page (`/`)**
- Wired `/` in `AppRoutes.tsx` to `LandingPage.tsx` within a dedicated `LandingLayout.tsx` (completely separate from `AppShell` and sidebar).
- Shifted internal application dashboard entry point to `/dashboard`.
- Landing page sections:
  - **Public Header**: Ledger branding, GitHub repository link, theme toggle, and "Open Console" action navigating to `/dashboard`.
  - **Hero Section**: Architectural headline ("Immutable Financial Ledger"), sub-copy explaining double-entry and event sourcing, primary CTA ("Launch Application"), and secondary documentation link.
  - **Core Capabilities Grid**: Double-entry bookkeeping, append-only event sourcing, server-authoritative state, and point-in-time reconstruction cards.
  - **Architecture Overview**: ASCII/SVG visual pipeline of event persistence, double-entry ledger allocation, and deterministic balance reconstruction.
  - **Technology Stack**: Backend (Java 21, Spring Boot 3.5, PostgreSQL 18, Flyway) and Frontend (React 19, TypeScript 5.8, TanStack Query, Vite) specifications.
  - **Product Preview & Final CTA**: Interactive feature summary card and direct link to `/dashboard`.
  - **Footer**: Institutional copyright and documentation links.
- Strictly authentic technical claims: no marketing fluff, fake statistics, testimonials, or pricing.
- Responsive across mobile, tablet, and desktop viewports.

**Internal Header Brand Navigation Fix**
- Updated the top-left "Ledger" logo and title in `TopBar.tsx` to a semantic React Router `<Link to="/">` with accessible label `Event-Sourced Ledger Home`.
- Preserved exact visual styling while adding accessible hover and focus-visible indicators.
- Enables seamless navigation from any internal console page back to the public landing page.

#### Final Verification State (Milestone Complete)

```text
TypeScript Typecheck: PASS (tsc -b, 0 errors)
ESLint:               PASS (0 errors, 0 warnings across all files)
Vitest Suite:         PASS (210/210 passed across 24 test files)
Playwright E2E:       PASS (7/7 passed in Chromium across 3 test specs:
                            critical-journey.spec.ts: 1 test
                            landing-page.spec.ts: 4 tests
                            theme-and-sidebar.spec.ts: 2 tests)
Production Build:     PASS (npm run build — optimized static bundle in /dist)
Backend Diff:         Completely clean / untouched (0 modifications)
```

#### New ADRs Recorded

- ADR-034: Public Landing Page and Internal Application Shell Routing Boundary: Dedicated Public Layout, Internal `/dashboard` Entry Point, and Brand Navigation
- ADR-035: Application-Wide Theme Architecture: Semantic Token Inversion, Anti-Flash Inline Initialization, and Preference Persistence
- ADR-036: Collapsible Desktop Navigation Shell: Persistent Drawer State, Isolated Breakpoint Context, and Accessible Iconography

---

## 2026-09-30

### Phase D0 — Deployment Planning & Readiness: COMPLETED

**Phase:** D0 — Deployment Planning & Readiness  
**Status:** COMPLETED  
**Date:** 2026-09-30  
**Baseline:** `v1.1.0` — Full-Stack Source Checkpoint (`ef3f96a`)  
**Purpose:** Deployment readiness audit and gap identification before provisioning production infrastructure.

Following the completion of the full-stack implementation milestone and the tagging of Git checkpoint `v1.1.0`, a comprehensive deployment readiness audit was conducted across the codebase, configuration properties, build tools, secret boundaries, and cloud hosting architecture.

#### Key Verified Findings

1. **Repository / Git Readiness**
   - The `main` branch is clean, verified, and synchronized with `origin/main`.
   - Git tag `v1.1.0` points to commit `ef3f96a` and strictly represents the pre-deployment full-stack source baseline.
   - Clean structural separation maintained between `backend/`, `frontend/`, and `docs/`.
   - Zero premature deployment artifacts existed prior to deployment planning (no `Dockerfile`, `.dockerignore`, `render.yaml`, or `vercel.json`).

2. **Backend Production Configuration**
   - **Framework:** Spring Boot `3.5.16` on **Java 21** (LTS).
   - **Persistence:** Relational PostgreSQL configuration is fully externalized via environment variables: `LEDGER_DB_URL`, `LEDGER_DB_USERNAME`, `LEDGER_DB_PASSWORD`.
   - **Database Migrations:** Flyway is enabled and configured for classpath migrations (`V1` through `V5`), executing automatically on startup.
   - **Schema Validation:** Hibernate `ddl-auto=validate` is active, strictly preventing runtime schema modifications.
   - **Port Configuration:** Server port is currently hardcoded to `server.port=8080` in `application.properties`. Render dynamically injects a `PORT` environment variable; this must be updated to `server.port=${PORT:8080}` in Phase D2.
   - **Logging Profiles:** `logback-spring.xml` includes an active production profile (`<springProfile name="prod">`) that will activate when `SPRING_PROFILES_ACTIVE=prod`.

3. **Frontend Production Configuration**
   - **Stack:** React 19, TypeScript 5.8, TanStack Query 5, Vite 6.4.3.
   - **API Client:** `src/api/client.ts` uses `VITE_API_BASE_URL` as the centralized endpoint prefix.
   - **Proxy Bypass:** In production builds, the Vite development proxy (`vite.config.ts`) is automatically bypassed, constructing absolute HTTPS URLs against the backend when `VITE_API_BASE_URL` is set.
   - **SPA Routing:** React Router v7 uses client-side HTML5 history routing (`/`, `/dashboard`, `/accounts`, `/accounts/:id/overview`, etc.). Vercel requires a SPA rewrite configuration (`vercel.json`) to redirect deep links and page refreshes to `/index.html` to avoid 404s.

4. **Environment & Secret Hygiene Audit**
   - Database credentials (`LEDGER_DB_URL`, `LEDGER_DB_USERNAME`, `LEDGER_DB_PASSWORD`) are strictly isolated to backend runtime properties and never enter frontend code.
   - Zero private credentials, secrets, or certificates are committed to Git.
   - `VITE_API_BASE_URL` is public and client-facing (injected into client JavaScript at build time).
   - Production environment variables will be securely configured in Render and Vercel cloud dashboards during their respective phases.

5. **CORS Analysis**
   - The Spring Boot backend currently has **no CORS configuration** (no `@CrossOrigin`, no `WebMvcConfigurer`, and no `CorsFilter`).
   - Development functioned without CORS because the Vite dev server acted as a same-origin reverse proxy.
   - Production cross-origin requests from the Vercel domain (`https://<app>.vercel.app`) to the Render service (`https://<service>.onrender.com`) will be blocked by browsers unless CORS is configured.
   - A centralized `CorsConfig` WebMvc configuration supporting `cors.allowed-origins` must be implemented before deploying the backend.

6. **Docker Readiness**
   - No `Dockerfile` or `.dockerignore` currently exists in the repository.
   - A multi-stage Docker build architecture targeting Java 21 (`eclipse-temurin:21-jdk-jammy` builder and `eclipse-temurin:21-jre-jammy` runtime) was established.
   - Concrete Dockerization and local container verification are intentionally deferred to Phase D2.

7. **Production Build Verification**
   - **Backend:** `mvn clean package -DskipTests` executed cleanly in 9.7 seconds, producing repackaged executable JAR `target/event-sourced-ledger-1.0.0.jar`.
   - **Frontend Typecheck:** `npm run typecheck` (`tsc --noEmit`) passed with 0 compiler errors.
   - **Frontend Linter:** `npm run lint` (`eslint . --max-warnings 0`) passed with 0 errors and 0 warnings.
   - **Frontend Build:** `npm run build` (`tsc -b && vite build`) executed in 4.37 seconds, generating an optimized static bundle in `frontend/dist/`.

8. **Deployment Gaps Identified**
   - `server.port` must be updated to `${PORT:8080}` to bind to Render's dynamically assigned port.
   - Centralized backend CORS configuration (`CorsConfig.java`) must be created to permit requests from Vercel.
   - Production multi-stage `Dockerfile` and `.dockerignore` must be authored for containerized backend execution.
   - Frontend `vercel.json` must be created to configure SPA route fallbacks.
   - Cloud provider environment variables must be defined across Render and Vercel dashboards.

9. **Phase D0 Transition & Next Phase**
   - Phase D0 has **zero blockers**.
   - The repository is in an ideal, fully audited state to proceed directly to **Phase D1 — Production PostgreSQL on Render**.
   - Phase D1 consists of external cloud provisioning (Render PostgreSQL) and requires zero repository source code changes.

#### Milestone Scope Boundary: Completed vs. Deferred

| Category | Item | Status / Target Phase |
| :--- | :--- | :--- |
| **COMPLETED NOW** | Repository & Git readiness audit | **COMPLETED** (Phase D0) |
| **COMPLETED NOW** | Backend & frontend configuration audit | **COMPLETED** (Phase D0) |
| **COMPLETED NOW** | Secret boundary & environment variable audit | **COMPLETED** (Phase D0) |
| **COMPLETED NOW** | CORS requirements analysis & design | **COMPLETED** (Phase D0) |
| **COMPLETED NOW** | Docker multi-stage build architecture design | **COMPLETED** (Phase D0) |
| **COMPLETED NOW** | Non-destructive local build verifications (`mvn`, `npm`) | **COMPLETED** (Phase D0) |
| **COMPLETED NOW** | Deployment gap report & transition roadmap | **COMPLETED** (Phase D0) |
| **DEFERRED TO LATER** | Provision Render PostgreSQL instance | **Phase D1** |
| **DEFERRED TO LATER** | Implement backend PORT & CORS configuration | **Phase D2** |
| **DEFERRED TO LATER** | Create Dockerfile & test local container | **Phase D2** |
| **DEFERRED TO LATER** | Deploy Dockerized backend Web Service to Render | **Phase D3** |
| **DEFERRED TO LATER** | Backend production smoke & invariant verification | **Phase D4** |
| **DEFERRED TO LATER** | Frontend production config (`VITE_API_BASE_URL`, `vercel.json`) | **Phase D5** |
| **DEFERRED TO LATER** | Deploy frontend static bundle to Vercel | **Phase D6** |
| **DEFERRED TO LATER** | Full-stack cloud integration & Playwright E2E verification | **Phase D7** |
| **DEFERRED TO LATER** | Production hardening, runbooks, and final release tagging | **Phase D8** |

#### New ADRs Recorded

- ADR-037: Production Cloud Deployment Topology: Render (Managed PostgreSQL & Dockerized Spring Boot) + Vercel (React SPA)

---

## 2026-09-30

### Phase D1 — Production PostgreSQL on Render: COMPLETED

**Phase:** D1 — Production PostgreSQL on Render  
**Status:** COMPLETED  
**Date:** 2026-09-30  
**Baseline:** `v1.1.0` — Full-Stack Source Checkpoint (`ef3f96a`)  
**Purpose:** Provision and verify the cloud managed PostgreSQL database on Render as the authoritative persistence store for the event-sourced ledger.

Following the deployment planning and gap analysis in Phase D0, the production managed database instance was provisioned on Render.

#### Infrastructure & Provisioning Metadata

- **Provider:** Render Managed PostgreSQL
- **Service Name:** `event-sourced-ledger-db`
- **Environment:** Production
- **Region:** Oregon (US West)
- **PostgreSQL Version:** 18
- **Service Tier / Plan:** Free tier
- **Operational Status:** `Available`
- **Assigned Database Name:** `ledger_db_6isw`
- **Database User:** `ledger_user`
- **Port:** `5432`
- **SSL Mode:** Enforced (`sslmode=require`)

#### Credential Hygiene & Connection Security

- Production connection credentials have been securely provisioned and rotated following setup.
- Internal network and external network connection details are securely stored in the Render dashboard.
- Zero secrets, raw passwords, or credential-bearing URLs are recorded in repository source or Git history.
- Backend datasource mapping confirmed:
  - `LEDGER_DB_URL`: Formatted as JDBC URL (`jdbc:postgresql://...`) with SSL enforcement.
  - `LEDGER_DB_USERNAME`: Set to `ledger_user`.
  - `LEDGER_DB_PASSWORD`: Set to the rotated Render password.

#### Schema State & Architectural Invariant Preservation

- **Untouched Clean Schema:** The provisioned database is verified to be completely clean and empty of application schema.
- **Zero Manual DDL:** No tables, indexes, constraints, or seeds were manually created.
- **Flyway Authority:** The database intentionally awaits the deployment of the Dockerized Spring Boot backend in Phase D3, where Flyway migrations (`V1` through `V5`) will execute automatically on container startup.
- **Backend & Frontend Isolation:** No backend deployment and no frontend deployment occurred during Phase D1.
- **Source Code Integrity:** Zero application code, test code, or build configuration was modified.

#### Milestone Scope Boundary: Completed vs. Deferred

| Category | Item | Status / Target Phase |
| :--- | :--- | :--- |
| **COMPLETED NOW** | Render PostgreSQL database provisioning (`event-sourced-ledger-db`) | **COMPLETED** (Phase D1) |
| **COMPLETED NOW** | Credential generation, rotation, and external connection verification | **COMPLETED** (Phase D1) |
| **COMPLETED NOW** | Clean schema validation (awaiting automated Flyway execution) | **COMPLETED** (Phase D1) |
| **DEFERRED TO LATER** | Backend containerization (Dockerfile & .dockerignore) | **Phase D2** |
| **DEFERRED TO LATER** | Backend PORT & CORS configuration | **Phase D2** |
| **DEFERRED TO LATER** | Deploy Dockerized backend to Render Web Service | **Phase D3** |
| **DEFERRED TO LATER** | Automated Flyway migration execution on cloud DB | **Phase D3 / D4** |
| **DEFERRED TO LATER** | Backend production smoke & invariant verification | **Phase D4** |
| **DEFERRED TO LATER** | Frontend production config (`VITE_API_BASE_URL`, `vercel.json`) | **Phase D5** |
| **DEFERRED TO LATER** | Deploy frontend static bundle to Vercel | **Phase D6** |
| **DEFERRED TO LATER** | Full-stack cloud integration & Playwright E2E verification | **Phase D7** |
| **DEFERRED TO LATER** | Production hardening, runbooks, and final release tagging | **Phase D8** |

#### Transition to Next Phase

Phase D1 is complete with zero blockers. The project is ready to proceed to **Phase D2 — Dockerize Spring Boot Backend**, which will introduce the multi-stage `Dockerfile`, `.dockerignore`, dynamic `server.port` binding, and centralized CORS configuration for local container verification.

---

## 2026-10-01

### Phase D2 — Dockerize Spring Boot Backend: COMPLETED

**Phase:** D2 — Dockerize Spring Boot Backend  
**Status:** COMPLETED  
**Date:** 2026-10-01  
**Baseline:** `v1.1.0` / Phase D1 (`2f808e4`)  
**Implementation Commit:** `699bd04` (`feat(backend): dockerize backend with dynamic port and cors`)  
**Purpose:** Package the Spring Boot backend into a hardened, production-ready multi-stage Docker container with dynamic port assignment, property-driven CORS origin configuration, and verify execution and environment variable injection against an isolated database without modifying or contacting the production Render database.

#### What Was Implemented

1. **Multi-Stage Docker Packaging (`backend/Dockerfile`):**
   - **Builder Stage:** Uses `maven:3.9.9-eclipse-temurin-21-alpine`. Employs layer caching by isolating `pom.xml` dependency pre-fetching (`mvn dependency:go-offline -B`) before source compilation. Builds the fat executable JAR hermetically (`mvn clean package -DskipTests -B`) in 11.885 seconds without requiring an external database connection at image build time.
   - **Runtime Stage:** Uses `eclipse-temurin:21-jre-alpine` providing the verified OpenJDK 21 LTS runtime.
   - **Alpine Adoption Note:** During local container execution testing on the host WSL2 Linux engine (`6.6.114.1-microsoft-standard-WSL2`), Ubuntu Jammy base images (`eclipse-temurin:21-jre-jammy`, `ubuntu:22.04`) failed with `exec /bin/sh: exec format error` (exit code 255) due to glibc/binfmt host conflicts. Alpine-based images (`musl` libc) executed natively and reliably with zero kernel conflicts while reducing the total image footprint by more than 50% (396 MB uncompressed, 126 MB compressed). The Alpine JRE 21 image is fully compatible with Render's Linux x86_64 deployment environment.
   - **Security Hardening (Non-Root Execution):** Creates a dedicated unprivileged system group and user (`ledgergroup:ledgeruser`, UID/GID `10001:10001`). The application runs under `USER ledgeruser` with ownership restricted to `/app/app.jar`.
   - **Runtime Entrypoint:** Configured with `ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]`.

2. **Docker Context Hygiene (`backend/.dockerignore`):**
   - Targeted strictly to the `backend/` build context, excluding `target/`, `*.log`, `.idea/`, `*.iml`, `.vscode/`, `.DS_Store`, and `Thumbs.db`.
   - Leaves essential build inputs (`pom.xml`, `src/`) intact while preventing local caches or secrets from entering Docker build layers.

3. **Dynamic Port Binding (`server.port=${PORT:8080}`):**
   - Modified `backend/src/main/resources/application.properties` to replace hardcoded `server.port=8080` with `server.port=${PORT:8080}`.
   - Preserves local development default of `8080` while enabling Render's runtime port injection (or local Docker override) without custom command-line arguments.

4. **Centralized & Configurable CORS Configuration (`CorsConfig.java`):**
   - Implemented `com.ledger.config.CorsConfig` as a Spring MVC `WebMvcConfigurer` bean.
   - Bound to property `cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:5173,http://localhost:3000}`.
   - Splits comma-separated values, trims whitespace, and ignores empty entries.
   - Allows HTTP methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`, `HEAD`.
   - Configures `allowedHeaders("*")` and preflight `maxAge(3600)` applying to `/**`.
   - Avoids hardcoding the future production Vercel domain; production origins will be injected via Render environment variables during Phase D3.

5. **Behavioral CORS Testing (`CorsConfigTest.java`):**
   - Created `@WebMvcTest`-based behavioral test suite exercising the Spring MVC CORS interceptor chain with a minimal test controller:
     - Preflight from allowed origin `http://localhost:5173` returns HTTP 200 OK + `Access-Control-Allow-Origin: http://localhost:5173` + allowed methods + max age.
     - Preflight from secondary allowed origin `http://localhost:3000` returns HTTP 200 OK + `Access-Control-Allow-Origin: http://localhost:3000`.
     - Preflight from unauthorized origin `http://unauthorized-domain.com` is rejected with HTTP 403 Forbidden and zero allow-origin headers.
     - Actual request from allowed origin returns HTTP 200 OK + allow-origin header.
     - Actual request from unauthorized origin is rejected with HTTP 403 Forbidden and zero allow-origin headers.

#### Technical Verification & Validation Gates Passed

1. **Host Maven Build & Test Suite:**
   - Command: `mvn clean test` in `backend/`
   - Outcome: `BUILD SUCCESS` (total time: 23.746 s)
   - Results: **249 tests run, 0 failures, 0 errors, 0 skipped** (all 244 existing domain tests preserved + 5 new CORS behavioral tests passed).

2. **Docker Image Build:**
   - Image built cleanly from `backend/`: `event-sourced-ledger-backend:latest` (ID: `1eb374fcc12b`).
   - Image size: 396 MB uncompressed / 126 MB compressed.

3. **Isolated PostgreSQL 18 Verification:**
   - Verified that the remote Render PostgreSQL database `ledger_db_6isw` was **never contacted** and zero production credentials were used.
   - Created isolated Docker bridge network `ledger-test-net` and started ephemeral PostgreSQL 18 container `ledger-test-db` (`ledger_test_db`, `ledger_user`, `test_password`).
   - Started backend container `ledger-backend-test` with runtime-injected environment variables (`LEDGER_DB_URL`, `LEDGER_DB_USERNAME`, `LEDGER_DB_PASSWORD`, `PORT=8080`).

4. **Flyway Migration & Hibernate Schema Validation:**
   - Flyway automatically detected clean schema and applied migrations `V1` through `V5` sequentially, successfully seeding the `SYS-CASH` contra-account (ID 1).
   - Hibernate schema validation (`spring.jpa.hibernate.ddl-auto=validate`) passed without schema mismatch or mapping errors.
   - Spring Boot context initialized in 10.42 seconds under active profile `prod`.

5. **Non-Root Execution:**
   - Confirmed via `docker exec ledger-backend-test id`: UID/GID `10001:10001` (`ledgeruser:ledgergroup`).

6. **Live REST Smoke Testing:**
   - `GET /v3/api-docs`: Returned valid OpenAPI 3 JSON definition.
   - `GET /accounts`: Returned empty paged collection (`totalElements: 0`), confirming `SYS-CASH` is strictly isolated.
   - `POST /accounts`: Successfully created account `DOCKER-TEST-001` (assigned ID `2`).
   - `GET /accounts`: Confirmed `DOCKER-TEST-001` retrieved from database (`totalElements: 1`).

7. **Dynamic PORT Override Verification:**
   - Restarted backend container as `ledger-backend-test-port` with `-e PORT=10000 -p 10000:10000`.
   - Verified Tomcat bound and started on port `10000`: `Tomcat started on port 10000 (http) with context path '/'`.
   - Verified `http://localhost:10000/accounts` served HTTP 200 with persisted account data.

8. **Live Container CORS Verification:**
   - `OPTIONS /accounts` with `Origin: http://localhost:5173` returned HTTP 200 + `Access-Control-Allow-Origin: http://localhost:5173`.
   - `OPTIONS /accounts` with `Origin: http://localhost:3000` returned HTTP 200 + `Access-Control-Allow-Origin: http://localhost:3000`.
   - `OPTIONS /accounts` with `Origin: http://unauthorized-domain.com` returned HTTP 403 Forbidden with zero allow-origin headers.

9. **Secret Hygiene & Clean Teardown:**
   - Inspected `docker history event-sourced-ledger-backend`: confirmed only `app.jar` is copied into `/app/`; zero passwords, secrets, or `.env` files baked in.
   - Cleanly stopped and removed all temporary verification containers (`ledger-backend-test-port`, `ledger-test-db`) and network `ledger-test-net`.

#### Milestone Scope Boundary: Completed vs. Deferred

| Category | Item | Status / Target Phase |
| :--- | :--- | :--- |
| **COMPLETED NOW** | Backend Dockerfile multi-stage build & .dockerignore | **COMPLETED** (Phase D2) |
| **COMPLETED NOW** | Dynamic PORT configuration (`server.port=${PORT:8080}`) | **COMPLETED** (Phase D2) |
| **COMPLETED NOW** | Configurable Spring MVC CORS (`CorsConfig.java`) | **COMPLETED** (Phase D2) |
| **COMPLETED NOW** | Behavioral CORS unit/slice testing (249 total tests) | **COMPLETED** (Phase D2) |
| **COMPLETED NOW** | Isolated container verification (PostgreSQL 18 + Flyway V1–V5) | **COMPLETED** (Phase D2) |
| **COMPLETED NOW** | Non-root container security & secret-hygiene audit | **COMPLETED** (Phase D2) |
| **COMPLETED NOW** | Implementation committed to main (`699bd04`) | **COMPLETED** (Phase D2) |
| **DEFERRED TO LATER** | Deploy Dockerized backend Web Service to Render | **Phase D3** |
| **DEFERRED TO LATER** | Automated Flyway migration execution on Render cloud DB | **Phase D3 / D4** |
| **DEFERRED TO LATER** | Backend production smoke & invariant verification | **Phase D4** |
| **DEFERRED TO LATER** | Frontend production config (`VITE_API_BASE_URL`, `vercel.json`) | **Phase D5** |
| **DEFERRED TO LATER** | Deploy frontend static bundle to Vercel | **Phase D6** |
| **DEFERRED TO LATER** | Full-stack cloud integration & Playwright E2E verification | **Phase D7** |
| **DEFERRED TO LATER** | Production hardening, runbooks, and final release tagging | **Phase D8** |

#### Transition to Next Phase

Phase D2 is complete with zero blockers. The backend container packaging, dynamic port binding, and CORS configuration are fully verified and committed. The project is ready to proceed to **Phase D3 — Deploy Backend to Render**, which will configure the Render Web Service referencing the GitHub repository, inject production PostgreSQL credentials, bind `PORT`, configure production CORS allowed origins, and deploy the service live.

---

### Entry: 2026-10-01 — Phase D5: Configure Frontend for Production Completed

#### Context & Objectives

With the backend containerized, deployed, and verified live on Render (`https://event-sourced-ledger-backend.onrender.com`), Phase D5 prepared the Vite/React frontend for production deployment targeting Vercel edge hosting. The objectives were to establish production API configuration, implement Vercel SPA routing rewrites, verify production builds and test suites, perform secret-exposure audits, and validate the compiled bundle locally against the live Render backend without altering application behavior or domain logic.

#### Implementation Scope & Configuration

1. **Vercel SPA Fallback Configuration (`frontend/vercel.json`):**
   - Created `frontend/vercel.json` configuring Vercel's edge router to rewrite all non-asset paths (`/(.*)`) to `/index.html`.
   - Ensures that client-side React Router deep links and direct browser refreshes on routes such as `/accounts`, `/accounts/:accountId/overview`, and `/accounts/:accountId/audit` resolve correctly rather than returning Vercel 404 errors, while static assets (`/assets/*`, `.js`, `.css`, `.svg`) continue to be served directly.

2. **Production API Endpoint Configuration (`frontend/.env.production` & `frontend/.env.example`):**
   - Created `frontend/.env.production` containing:
     ```properties
     VITE_API_BASE_URL=https://event-sourced-ledger-backend.onrender.com
     ```
   - Updated `frontend/.env.example` to document local dev proxy conventions (leaving `VITE_API_BASE_URL` empty for local proxying) versus production cloud deployment (pointing to Render).
   - In `frontend/src/api/client.ts`, the absolute URL causes all browser `fetch` calls to target the live Render backend directly, bypassing Vite's development proxy.

#### Verification & Quality Gates

1. **TypeScript Typecheck:**
   - Executed `npm run typecheck` (`tsc --noEmit`).
   - Result: 0 errors.

2. **Unit Test Suite:**
   - Executed `npm test` (`vitest run`).
   - Result: 24/24 test files passed; 210/210 unit tests passed (duration: 28.99s).

3. **Production Static Build:**
   - Executed `npm run build` (`tsc -b && vite build`).
   - Successfully generated:
     - `dist/index.html` (1.50 kB)
     - `dist/assets/index-C835hktC.css` (4.74 kB)
     - `dist/assets/index-Bzr3McuW.js` (646.07 kB)
   - Verified compiled bundle bakes in `https://event-sourced-ledger-backend.onrender.com` as the API base URL and contains zero occurrences of `localhost:8080`.

4. **Production Artifact Secret-Exposure Audit:**
   - Ran automated pattern search across all files in `frontend/dist/` scanning for database connection strings (`jdbc:postgresql:`, `postgres://`, `postgresql://`), passwords, private keys, and Render API/internal tokens.
   - Result: Clean. Zero sensitive credentials or backend secrets are exposed in client bundles.

5. **Local Vite Preview & Route Verification:**
   - Served production build locally via `npx vite preview --port 5173` (matching Render backend's allowed CORS origins).
   - Tested deep links and browser navigation via headless Playwright automation across:
     - `/` (Root redirect / landing) — HTTP 200
     - `/dashboard` — HTTP 200, successfully loaded active/frozen account metrics from Render
     - `/accounts` — HTTP 200, successfully loaded account list from Render
     - `/accounts/2/overview` — HTTP 200, successfully loaded account details and balance
     - `/accounts/2/audit` — HTTP 200, successfully loaded audit trail events
   - Confirmed all outbound API requests target `https://event-sourced-ledger-backend.onrender.com` and zero target local proxies.

6. **Live Render Backend End-to-End Smoke Test:**
   - Executed real account creation in preview UI against the live Render database: created account `ACC-432303` (`Production D5 Test 432303`).
   - Verified automated redirect to `/accounts/2/overview` with accurate balance cards and zero financial calculation performed on the client.

#### Boundary & Invariant Assessment

- **Backend Authority:** Unchanged. All monetary operations, account state transitions, and balance reconstructions remain 100% server-authoritative.
- **Backend Code & Migrations:** 0 backend files modified.
- **Frontend Application Source Code:** 0 source files modified; only deployment configuration and environment documentation were changed.
- **CORS & Preflight Compliance:** Verified against Render backend CORS policy.

#### Completed Deliverables vs. Next Phase

| Milestone / Deliverable | Status | Phase |
| :--- | :--- | :--- |
| **COMPLETED NOW** | Vercel SPA routing rewrite (`frontend/vercel.json`) | **COMPLETED** (Phase D5) |
| **COMPLETED NOW** | Production backend API environment (`.env.production`, `.env.example`) | **COMPLETED** (Phase D5) |
| **COMPLETED NOW** | Frontend typecheck & test suite pass (210/210 tests) | **COMPLETED** (Phase D5) |
| **COMPLETED NOW** | Production build & secret-exposure audit clean | **COMPLETED** (Phase D5) |
| **COMPLETED NOW** | Local Vite preview verification against live Render backend | **COMPLETED** (Phase D5) |
| **COMPLETED NOW** | Live cloud account creation smoke test | **COMPLETED** (Phase D5) |
| **DEFERRED TO LATER** | Deploy frontend static bundle to Vercel | **Phase D6** |
| **DEFERRED TO LATER** | Full-stack cloud integration & Playwright E2E verification | **Phase D7** |
| **DEFERRED TO LATER** | Production hardening, runbooks, and final release tagging | **Phase D8** |

#### Transition to Next Phase

Phase D5 is complete. The frontend static build is fully verified, secrets-clean, and integrated with the live Render backend. The project is ready to proceed to **Phase D6 — Deploy Frontend to Vercel**, which will import the repository in Vercel, configure build settings and environment variables, deploy to Vercel's global edge network, and verify live domain and SSL provisioning.
