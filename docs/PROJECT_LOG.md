# Project Log

**Project Name:** Event-Sourced Ledger

**Status:** v1.0 Released

**Current Version:** v1.0

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