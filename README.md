# Event-Sourced Ledger

> An event-sourced, double-entry financial ledger built with Spring Boot, PostgreSQL, and React.

[![Java](https://img.shields.io/badge/Java-21%20LTS-orange?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.16-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue?logo=postgresql)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ed?logo=docker)](https://www.docker.com/)
[![Render](https://img.shields.io/badge/Render-Backend%20%26%20DB-black?logo=render)](https://render.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Frontend%20Edge-black?logo=vercel)](https://vercel.com/)
[![Backend Tests](https://img.shields.io/badge/Backend%20Tests-251%20Passing-success)](#testing)

A full-stack banking core implementation where account balances are never stored as mutable fields. Every financial action is recorded as an immutable domain event and balanced double-entry ledger pair, with current and historical state derived server-side via deterministic replay.

This project was developed as a portfolio engineering study demonstrating event sourcing, double-entry bookkeeping, concurrency control under transactional workloads, and cloud deployment across Vercel and Render.

---

## Live Demo

- **Web Application:** [https://event-sourced-ledger.vercel.app](https://event-sourced-ledger.vercel.app)
- **Backend API:** [https://event-sourced-ledger-backend.onrender.com](https://event-sourced-ledger-backend.onrender.com)
- **Swagger / OpenAPI Documentation:** [https://event-sourced-ledger-backend.onrender.com/swagger-ui.html](https://event-sourced-ledger-backend.onrender.com/swagger-ui.html)

---

## Overview

Traditional financial systems often store account balances as mutable columns updated by ad-hoc queries, making retroactive audits and historical state reconstruction fragile and error-prone.

This system models financial operations from first principles:
- **Accounts:** Manage savings and current accounts governed by strict lifecycle transitions (`ACTIVE`, `FROZEN`, `CLOSED`).
- **Monetary Operations:** Deposits, withdrawals, and account-to-account transfers record balanced double-entry ledger pairs. External monetary flows transact against an isolated system contra-account (`SYS-CASH`), while internal transfers exchange value directly between accounts.
- **Event Store & Ledger:** Every business transaction emits immutable domain events alongside atomic debit and credit ledger entries.
- **Derived Balances & Temporal Audit:** Balances are never updated in place. Current balances and point-in-time historical balances are computed on demand by replaying ledger history, providing complete financial traceability.

---

## Core Design Principles

- **Backend Financial Authority:** The Spring Boot backend is the sole source of truth for balance calculation, double-entry verification, and audit trail reconstruction.
- **Reconstructed Balances:** Balances are derived from immutable historical records rather than mutable database state.
- **Double-Entry Equilibrium:** Every transaction generates balanced debit and credit entries ($\sum \text{Debits} = \sum \text{Credits}$); unbalanced entries are rejected at the service boundary.
- **Exact Decimal Precision:** Binary floating-point arithmetic is prohibited. Monetary amounts use exact 2-decimal arbitrary-precision arithmetic (`BigDecimal` on backend, `decimal.js` on client).
- **Append-Only Immutability:** Financial events and ledger lines are immutable and permanently preserved. Records are never updated or deleted.
- **Concurrency & Overdraft Protection:** Row-level pessimistic write locking (`PESSIMISTIC_WRITE`) guarantees serialized account access, while deterministic lock ordering prevents deadlocks during transfers.
- **System Contra-Account Isolation:** `SYS-CASH` (Account ID 1) is isolated at database and service layers, permanently hidden from customer-facing APIs and directories.
- **Zero Client Calculation:** The React frontend operates exclusively as a presentation and command-dispatch interface, performing zero client-side balance synthesis or optimistic mutations.

---

## Architecture

```text
   Users & Browsers
          │
          ▼
   Vercel Global Edge Network
   React 19 / TypeScript / Vite Single-Page Application
   - Deployed at: https://event-sourced-ledger.vercel.app
   - Client-side routing with edge SPA rewrites (vercel.json)
   - Decimal-safe monetary presentation via decimal.js
          │
          │ HTTPS REST (TLS)
          │ Centralized Spring MVC CORS Preflight & Allowlist
          ▼
   Render Cloud Platform
   Dockerized Spring Boot 3.5.16 / Java 21 LTS
   - Deployed at: https://event-sourced-ledger-backend.onrender.com
   - Alpine JRE runtime running as unprivileged non-root user
   - Dynamic port binding (${PORT:8080})
   - Authoritative source of financial truth and invariant enforcement
          │
          │ JDBC over SSL (sslmode=require)
          │ Pessimistic Row Locking (PESSIMISTIC_WRITE)
          ▼
   Render Cloud Platform
   Managed PostgreSQL Database
   - Durable ACID relational persistence
   - Append-only event store & double-entry ledger entries
   - Flyway automated schema migrations (V1–V5)
   - Hibernate schema validation (ddl-auto=validate)
```

### Layer Responsibilities

1. **Presentation Tier (Vercel):** Single-page React application hosted on Vercel. Handles user workflows, displays server-authoritative balances, and synchronizes URL state without performing client-side financial arithmetic.
2. **Application Tier (Render):** Containerized Spring Boot service running Java 21. Manages transactional boundaries, pessimistic locking, double-entry validation, and event persistence.
3. **Persistence Tier (Render PostgreSQL):** Relational datastore enforcing foreign keys, check constraints, unique business keys, and append-only event streams.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Backend Core** | Java 21 (LTS), Spring Boot 3.5.16, Maven | Modular domain service & REST API |
| **API & Contracts** | Spring Web MVC, Jakarta Validation, OpenAPI 3 / Swagger UI | Contract-first REST endpoints & live docs |
| **Persistence & ORM** | Spring Data JPA, Hibernate 6 (`ddl-auto=validate`) | Schema validation & transactional queries |
| **Database** | PostgreSQL | Relational persistence & row locking |
| **Database Migrations** | Flyway (`V1`–`V5`) | Automated, repeatable schema versioning |
| **Frontend Framework** | React 19, TypeScript 5.8, Vite 6 | Type-safe single-page application |
| **Routing** | React Router v7 | Declarative nested routing & deep linking |
| **Server State** | TanStack React Query v5 | Cache invalidation, query deduplication, & loading states |
| **Decimal Precision** | `decimal.js` | Precision-safe client monetary handling |
| **Styling & Theme** | Vanilla CSS, Tokenized Custom Properties | Tokenized responsive UI with persistent Light/Dark themes |
| **Containerization** | Docker (Multi-stage build) | Reproducible Alpine JRE 21 runtime running as non-root user |
| **Hosting** | Render (Backend & DB), Vercel (Frontend) | Production cloud infrastructure |

---

## Key Features

### Financial Operations
- **Account Governance:** Create savings or current accounts with unique account numbers and manage lifecycle transitions (`ACTIVE`, `FROZEN`, `CLOSED`).
- **Deposits:** Credit customer accounts against the `SYS-CASH` contra-account with balance validation.
- **Withdrawals:** Debit customer accounts against `SYS-CASH` with real-time balance validation preventing overdrafts.
- **Account-to-Account Transfers:** Atomically move funds between customer accounts with zero system contra-account involvement and automatic rollback on failure.
- **Double-Entry Ledger Generation:** Automatically generate balanced debit and credit entries for every transaction.

### Event Sourcing & Audit Engine
- **Append-Only Event Store:** Record immutable domain events (`ACCOUNT_CREATED`, `DEPOSIT`, `WITHDRAWAL`, `TRANSFER_DEBIT`, `TRANSFER_CREDIT`).
- **Deterministic Balance Reconstruction:** Calculate exact balances on demand from genesis or at any point in history (`asOf` timestamp queries).
- **Traceable Audit Trail:** Inspect chronologically ordered audit logs pairing every transaction with its balance delta and cumulative running balance.
- **Ledger Journal & Raw Event Stream:** Explore debit/credit line items and view raw JSON event payloads in an inspection drawer.

### Web Application Experience
- **Portfolio Dashboard:** High-level metrics tracking active, frozen, and total accounts, with modal quick actions for financial operations.
- **Account Directory:** Server-paginated, filterable, and sortable account catalog.
- **Workflow Modals:** Guarded forms for deposits, withdrawals, transfers, and account creation with positive decimal validation and duplicate submission locking.
- **Persistent Workspace Customization:** Application-wide light/dark theme toggle and collapsible desktop sidebar (240px / 64px) persisted across browser sessions.
- **Public Showcase Page:** Dedicated architectural product landing page at `/` illustrating core domain principles.

---

## Engineering Highlights

- **Pessimistic Row Locking:** Prevents race conditions and concurrent overdrafts by acquiring `PESSIMISTIC_WRITE` locks on account records before balance checks and mutations.
- **Deadlock-Free Transfer Locking:** When executing transfers between accounts A and B, locks are acquired in deterministic ascending primary-key order (`min(A, B)` then `max(A, B)`), eliminating deadlocks during concurrent opposite-direction transfers.
- **Transactional Atomicity:** All monetary operations execute within a single `@Transactional` boundary; failures roll back ledger entries, transactions, and event records uniformly.
- **Constant-Query Batch Loading:** Paginated audit history and ledger queries batch-load associated transactions via `findAllById` ($O(1)$ database trips), preventing N+1 query degradation.
- **Flyway Migrations & Hibernate Validation:** All schema changes are versioned via SQL scripts (`V1` through `V5`), while Hibernate verifies schema alignment on startup (`ddl-auto=validate`).
- **Centralized Exception Handling:** Uniform `ApiError` responses across all REST controllers, translating validation failures (400), missing entities (404), conflicts (409), and business rule rejections (422).
- **Multi-Stage Docker Packaging:** Builds the executable JAR in a Maven builder stage and runs it in an unprivileged Alpine JRE container with dynamic port injection (`server.port=${PORT:8080}`).
- **Centralized Spring MVC CORS:** Fully tested `WebMvcConfigurer` policy supporting authorized cross-origin methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`), enabling browser preflight for partial state transitions (`PATCH`).
- **Edge SPA Routing:** Clean client-side routing on Vercel via edge rewrites (`vercel.json`) ensuring deep links and browser refreshes resolve cleanly without 404 errors.

---

## Testing

### Backend
- **251 automated tests passing** (`mvn clean test`) across unit, slice, and integration tiers.
- **Domain Invariant Tests:** Double-entry equilibrium, deposit/withdrawal value conservation, zero fractional-cent leakage, and immutable event integrity.
- **Concurrency & Thread-Safety Tests:** Multi-threaded stress tests verifying concurrent overdraft prevention, concurrent deposits, and deadlock-free bidirectional transfers against real PostgreSQL storage.
- **CORS Slice Tests:** Verification of allowed origins, preflight `OPTIONS` handling for `PATCH`/`POST`/`GET`, and rejection of unauthorized origins.

### Frontend
- **Unit & Component Testing:** 210+ Vitest tests covering arbitrary-precision `Money` math, date normalization, API client error mapping, and UI components.
- **Type Safety:** Strict compilation check via `tsc --noEmit` with zero type errors.
- **Linting:** ESLint verification with zero errors or warnings.
- **End-to-End Browser Automation:** Playwright test suites verifying critical user journeys (account creation -> deposit -> transfer -> audit trail) and responsive layout behavior.
- **Production Build Validation:** Clean static bundle generation via Vite with zero warnings.

---

## Project Structure

```text
event-sourced-ledger/
├── backend/                       # Spring Boot Application Core
│   ├── pom.xml                    # Maven build descriptor (Java 21, Spring Boot 3.5.16)
│   ├── Dockerfile                 # Multi-stage Alpine container packaging
│   └── src/
│       ├── main/java/com/ledger/  # Domain modules: account, ledger, event, transaction, audit
│       ├── main/resources/        # application.properties, Flyway migrations (V1–V5), logback
│       └── test/                  # Unit, integration, concurrency, and MockMvc test suites
├── frontend/                      # React 19 Single-Page Application
│   ├── package.json               # NPM descriptor (React 19, TypeScript, Vite, TanStack Query)
│   ├── vercel.json                # Vercel edge SPA rewrite rules
│   ├── vite.config.ts             # Vite build & local development proxy configuration
│   ├── src/                       # Components, feature modules, routes, tokens, and utilities
│   └── e2e/                       # Playwright browser end-to-end test suites
└── docs/                          # Comprehensive Architectural & Engineering Documentation
    ├── ARCHITECTURE.md            # System architecture, layers, and cloud topology
    ├── FRONTEND_ARCHITECTURE.md   # Component hierarchy, state models, and design systems
    ├── DATABASE_DESIGN.md         # Relational schema, indices, and Flyway migration plan
    ├── API_GUIDELINES.md          # REST API standards, DTO contracts, and error structures
    ├── DECISIONS.md               # Architecture Decision Records (ADR-001 through ADR-038)
    ├── PROJECT_ROADMAP.md         # Master implementation roadmap and milestone records
    └── PROJECT_LOG.md             # Complete chronological implementation log
```

---

## Running Locally

### Prerequisites
- **Java 21 LTS** (OpenJDK / Eclipse Temurin)
- **Maven 3.9+**
- **Node.js 20+** and **npm**
- **PostgreSQL 15+** running locally

### 1. Database Setup
Create a local PostgreSQL database:
```sql
CREATE DATABASE ledger_db;
```

### 2. Backend Setup
Set the required environment variables and run the Spring Boot application:

```bash
cd backend

# Windows PowerShell:
$env:LEDGER_DB_URL="jdbc:postgresql://localhost:5432/ledger_db"
$env:LEDGER_DB_USERNAME="postgres"
$env:LEDGER_DB_PASSWORD="your_password"

# Linux / macOS:
export LEDGER_DB_URL="jdbc:postgresql://localhost:5432/ledger_db"
export LEDGER_DB_USERNAME="postgres"
export LEDGER_DB_PASSWORD="your_password"

# Run tests:
mvn clean test

# Start backend server (binds to http://localhost:8080):
mvn spring-boot:run
```
Flyway automatically applies migrations `V1` through `V5` on startup. Swagger UI is accessible at `http://localhost:8080/swagger-ui.html`.

### 3. Frontend Setup
In a separate terminal, install dependencies and start the Vite development server:

```bash
cd frontend

# Install dependencies:
npm install

# Start development server (binds to http://localhost:5173):
npm run dev
```

During local development, Vite proxies API requests directly to `http://localhost:8080`.

---

## Documentation Index

The system's requirements, design decisions, and domain rules are preserved in dedicated specifications:

| Document | Focus Area |
|---|---|
| [Product Requirements Document (PRD)](docs/PRD.md) | Business requirements, account lifecycle, and financial invariants |
| [Technical Requirements Document (TRD)](docs/TRD.md) | Architectural constraints, technology selections, and non-functional goals |
| [Architecture Specification](docs/ARCHITECTURE.md) | Layered design, domain boundaries, and production cloud topology |
| [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md) | Client component hierarchy, TanStack Query models, and routing |
| [Database Design](docs/DATABASE_DESIGN.md) | Schema definitions, constraints, indices, and Flyway strategy |
| [API Guidelines](docs/API_GUIDELINES.md) | REST conventions, wire formats, DTO contracts, and error structures |
| [Design System](docs/DESIGN.md) | Tokenized color palettes, typography, spacing, and accessible components |
| [Architecture Decisions (ADRs)](docs/DECISIONS.md) | Complete record of architectural decisions (ADR-001 through ADR-038) |
| [Project Roadmap](docs/PROJECT_ROADMAP.md) | Milestone verification records and deliverables across all phases |
| [Project Log](docs/PROJECT_LOG.md) | Chronological development and deployment history |

---

## Project Status

> **Status:** Full-stack implementation deployed and verified on Vercel + Render.

---

## Future Scope

The following enterprise capabilities were intentionally deferred from the current release and remain candidates for future milestones:
- User Authentication & Role-Based Access Control (JWT / RBAC)
- CQRS & Distributed Event Streaming (Apache Kafka)
- Snapshot Engine for high-frequency balance reconstruction
- Multi-Currency Support (ISO-4217 currency conversions)
- Distributed Idempotency Keys (`Idempotency-Key` headers)
- Global Cross-Account Search & Advanced Financial Analytics
