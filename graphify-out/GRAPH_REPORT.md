# Graph Report - .  (2026-08-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 274 nodes · 789 edges · 10 communities (8 shown, 2 thin omitted)
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 168 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d42d5995`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9

## God Nodes (most connected - your core abstractions)
1. `Account` - 44 edges
2. `AccountResponse` - 43 edges
3. `LedgerEntry` - 24 edges
4. `Transaction` - 24 edges
5. `AccountServiceImplTest` - 23 edges
6. `AccountControllerTest` - 21 edges
7. `AccountServiceImpl` - 18 edges
8. `GlobalExceptionHandler` - 18 edges
9. `LedgerServiceImplTest` - 18 edges
10. `AccountController` - 15 edges

## Surprising Connections (you probably didn't know these)
- `CreateAccountRequest` --references--> `AccountType`  [EXTRACTED]
  backend/src/main/java/com/ledger/account/dto/CreateAccountRequest.java → backend/src/main/java/com/ledger/account/entity/AccountType.java
- `Account` --references--> `AccountStatus`  [EXTRACTED]
  backend/src/main/java/com/ledger/account/entity/Account.java → backend/src/main/java/com/ledger/account/entity/AccountStatus.java
- `Account` --references--> `AccountType`  [EXTRACTED]
  backend/src/main/java/com/ledger/account/entity/Account.java → backend/src/main/java/com/ledger/account/entity/AccountType.java
- `AccountRepository` --references--> `Account`  [EXTRACTED]
  backend/src/main/java/com/ledger/account/repository/AccountRepository.java → backend/src/main/java/com/ledger/account/entity/Account.java
- `LedgerEntry` --references--> `Account`  [EXTRACTED]
  backend/src/main/java/com/ledger/ledger/entity/LedgerEntry.java → backend/src/main/java/com/ledger/account/entity/Account.java

## Import Cycles
- None detected.

## Communities (10 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (28): AccountRepository, EntryType, CREDIT, DEBIT, Entity, Table, LedgerEntry, InvalidLedgerEntryException (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (23): ApiResponses, AccountController, Page, Pageable, DuplicateAccountNumberException, AccountService, Page, Pageable (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (20): AccountResponse, AccountStatus, ACTIVE, CLOSED, FROZEN, AccountType, CURRENT, SAVINGS (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.19
Nodes (7): CreateAccountRequest, Account, Entity, Table, AccountServiceImplTest, Test, PreUpdate

### Community 4 - "Community 4"
Cohesion: 0.20
Nodes (17): ApiError, GlobalExceptionHandler, Override, ConstraintViolationException, ExceptionHandler, HttpHeaders, HttpMessageNotReadableException, HttpRequestMethodNotSupportedException (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (3): Override, Test, LedgerServiceImplTest

### Community 6 - "Community 6"
Cohesion: 0.53
Nodes (4): OpenApiConfig, Bean, Configuration, OpenAPI

### Community 7 - "Community 7"
Cohesion: 0.60
Nodes (3): Test, LedgerApplicationTests, SpringBootTest

## Knowledge Gaps
- **14 isolated node(s):** `com.ledger:event-sourced-ledger`, `ACTIVE`, `FROZEN`, `CLOSED`, `SAVINGS` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Account` connect `Community 3` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.276) - this node is a cross-community bridge._
- **Why does `AccountResponse` connect `Community 2` to `Community 1`, `Community 3`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **Why does `LedgerEntry` connect `Community 0` to `Community 3`, `Community 5`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `Account` (e.g. with `.createAccount()` and `.activateAccount_fromActive_throws()`) actually correct?**
  _`Account` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `AccountResponse` (e.g. with `.activateAccount_fromFrozen_success()` and `.closeAccount_fromActive_success()`) actually correct?**
  _`AccountResponse` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `com.ledger:event-sourced-ledger`, `ACTIVE`, `FROZEN` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05501165501165501 - nodes in this community are weakly interconnected._