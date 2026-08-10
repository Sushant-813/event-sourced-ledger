# Database Design Document

**Project Name:** Event-Sourced Ledger (Double-Entry Bank Core)

**Version:** 1.0

---

# 1. Purpose

This document defines the logical and physical database design for the Event-Sourced Ledger project.

It serves as the authoritative reference for:

- Database schema
- Entity relationships
- Primary and foreign keys
- Constraints
- Data integrity rules
- Indexing strategy
- Future schema evolution

The database is designed to preserve complete financial history while maintaining transactional consistency and auditability.

---

# 2. Database Philosophy

Unlike traditional CRUD systems that treat the current balance as the primary source of truth, this project stores financial history as immutable records.

The database is built around the following principles.

## Immutable History

Financial events are append-only.

Existing historical records must never be modified or deleted.

---

## Derived State

Account balances are computed from historical records.

Balances are never considered the authoritative source of truth.

---

## Referential Integrity

Relationships between entities must always remain valid.

Foreign key constraints are mandatory wherever appropriate.

---

## Financial Correctness

Database constraints should help enforce accounting rules whenever possible.

---

# 3. Database Technology

| Component | Technology |
|------------|------------|
| Database | PostgreSQL |
| ORM | Spring Data JPA |
| Migration Tool | Flyway |

---

# 4. High-Level Entity Relationship

```
                +----------------+
                |    Account     |
                +----------------+
                        |
                        |
                  owns many
                        |
                        ▼
                +----------------+
                |     Event      |
                +----------------+
                        |
                        |
          belongs to transaction
                        |
                        ▼
               +------------------+
               |   Transaction    |
               +------------------+
                        |
               creates multiple
                        |
                        ▼
               +------------------+
               |  Ledger Entry    |
               +------------------+
```

---

# 5. Entity Overview

The system consists of the following primary entities.

| Entity | Purpose |
|----------|----------|
| Account | Represents a financial account. |
| Transaction | Represents a complete financial operation. |
| Ledger Entry | Represents a debit or credit entry. |
| Event | Represents immutable business history. |

---

# 6. Entity Definitions

---

## Account

Represents an owner of financial activity.

### Responsibilities

- Own financial history
- Participate in transactions
- Maintain account status

### Suggested Fields

| Field | Description |
|---------|------------|
| id | Primary Key |
| account_number | Unique account identifier |
| account_name | Human-readable account name |
| account_type | Savings, Current, etc. |
| status | Active / Frozen / Closed |
| created_at | Creation timestamp |
| updated_at | Last modification timestamp |

---

## Transaction

Represents a complete business operation.

Examples:

- Deposit
- Withdrawal
- Transfer

### Responsibilities

- Group ledger entries
- Ensure atomicity
- Maintain transaction metadata

### Suggested Fields

| Field | Description |
|---------|------------|
| id | Primary Key |
| reference_number | Unique transaction reference |
| transaction_type | Deposit / Withdrawal / Transfer |
| status | Pending / Completed / Failed |
| created_at | Timestamp |

---

## Ledger Entry

Represents a single accounting entry.

Every transaction generates one or more ledger entries.

### Responsibilities

- Debit accounting
- Credit accounting
- Financial balancing

### Suggested Fields

| Field | Description |
|---------|------------|
| id | Primary Key |
| transaction_id | FK → Transaction |
| account_id | FK → Account |
| entry_type | Debit / Credit |
| amount | Monetary value |
| created_at | Timestamp |

---

## Event

Represents an immutable business event.

Examples include:

- Account Created
- Deposit Recorded
- Withdrawal Recorded
- Transfer Completed

### Responsibilities

- Preserve historical actions
- Enable replay
- Enable auditing

### Suggested Fields

| Field | Description |
|---------|------------|
| id | Primary Key |
| account_id | FK → Account |
| transaction_id | FK → Transaction (nullable where appropriate) |
| event_type | Event classification |
| payload | Event-specific data |
| occurred_at | Event timestamp |

---

# 7. Relationships

## Account → Event

One account may own many events.

```
Account (1)

↓

Event (N)
```

---

## Transaction → Ledger Entry

One transaction creates multiple ledger entries.

```
Transaction (1)

↓

Ledger Entry (N)
```

---

## Account → Ledger Entry

One account may contain many ledger entries.

```
Account (1)

↓

Ledger Entry (N)
```

---

## Transaction → Event

One transaction may produce multiple business events.

```
Transaction (1)

↓

Event (N)
```

---

# 8. Double-Entry Accounting Model

Every financial transaction must generate balanced ledger entries.

Example:

```
Transfer ₹500

Transaction

↓

Debit

Account A

₹500

+

Credit

Account B

₹500
```

The accounting invariant is

```
Total Debits == Total Credits
```

A transaction violating this rule must never be committed.

---

# 9. Balance Calculation

Current balances are derived.

Example:

```
Deposit +1000

Withdrawal -300

Deposit +200

↓

Balance = 900
```

The balance is computed from ledger history.

It is never treated as the primary source of truth.

---

# 10. Referential Integrity Rules

The database must enforce:

- Every ledger entry belongs to exactly one transaction.
- Every ledger entry belongs to exactly one account.
- Every event references a valid account.
- Transactions cannot exist without ledger entries.
- Orphan records are prohibited.

---

# 11. Primary Keys

Every entity uses a surrogate primary key.

| Entity | Primary Key |
|----------|-------------|
| Account | id |
| Transaction | id |
| Ledger Entry | id |
| Event | id |

---

# 12. Foreign Keys

| Child | Parent |
|---------|---------|
| Ledger Entry | Transaction |
| Ledger Entry | Account |
| Event | Account |
| Event | Transaction |

---

# 13. Constraints

Examples include:

### Unique Constraints

- account_number
- reference_number

---

### Not Null Constraints

- account_id
- amount
- transaction_type
- entry_type
- event_type

---

### Check Constraints

Examples:

```
Amount > 0
```

```
Entry Type IN (Debit, Credit)
```

```
Status IN (ACTIVE, CLOSED, FROZEN)
```

---

# 14. Indexing Strategy

Indexes should be created for frequently queried columns.

Recommended indexes include:

| Column | Purpose |
|----------|----------|
| account_number | Fast account lookup |
| transaction_id | Ledger lookup |
| account_id | Account history |
| occurred_at | Event replay |
| created_at | Sorting |
| reference_number | Transaction lookup |

Additional indexes should be introduced only after performance analysis.

---

# 15. Database Transactions

Financial operations must execute atomically.

Example workflow:

```
Begin Transaction

↓

Create Transaction

↓

Create Debit Entry

↓

Create Credit Entry

↓

Create Event(s)

↓

Commit
```

If any step fails:

```
Rollback Entire Transaction
```

Partial financial updates are never permitted.

---

# 16. Migration Strategy

Database schema changes are managed using Flyway.

Example migration sequence:

```
V1__Create_Accounts.sql

V2__Create_Transactions.sql

V3__Create_Ledger_Entries.sql

V4__Create_Events.sql
```

Schema changes must never rely on automatic ORM generation in production.

---

# 17. Future Schema Evolution

Future versions may introduce additional entities such as:

- Snapshot
- Currency
- Exchange Rate
- Audit Report
- User
- Role
- Permission
- Notification

The schema is intentionally designed to accommodate future expansion without breaking existing data.

---

# 18. Database Design Principles

The schema follows these principles.

- Normalize business data.
- Preserve complete financial history.
- Avoid redundant information.
- Prefer explicit relationships.
- Maintain referential integrity.
- Support deterministic event replay.
- Prioritize correctness over storage optimization.

---

# 19. Guiding Philosophy

> **"The database is not a storage of balances; it is a storage of financial history."**

Every table exists to answer one question:

**What happened?**

Current balances, audit reports, and historical state are all derived from the immutable records stored within the database.