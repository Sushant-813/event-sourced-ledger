# Frontend Technical Requirements Document (Frontend TRD)

## 1. Document Metadata

| Field | Value |
|---|---|
| **Project** | Event-Sourced Ledger (Double-Entry Bank Core) — Frontend |
| **Document** | FRONTEND_TRD.md |
| **Version** | 0.1 (Draft) |
| **Status** | Draft — pending review |
| **Scope** | Technical requirements and constraints for Frontend v1.0 only. This document defines *what technical conditions* the implementation must satisfy. It does not define *how* the frontend is structurally organized — that belongs to a future `FRONTEND_ARCHITECTURE.md`, which is explicitly out of scope here. |
| **Relationship to `FRONTEND_PRD.md`** | `FRONTEND_PRD.md` (v1.0, Approved) defines *what* the frontend must do. This TRD translates those product requirements into technical requirements and constraints. It introduces no new product scope, view, or capability beyond what `FRONTEND_PRD.md` already authorizes. |
| **Relationship to backend v1.0** | The backend REST API (`API_GUIDELINES.md`) is complete, tested, and released as v1.0.0 (`PROJECT_ROADMAP.md` Phase 10, `PROJECT_LOG.md` 2026-09-21) and is treated as frozen and authoritative. This TRD introduces no new endpoints, fields, filters, sort keys, or business rules. |
| **Related Documents** | `FRONTEND_PRD.md`, `DESIGN.md` (v1.1), `API_GUIDELINES.md`, `TRD.md`, `ARCHITECTURE.md`, `DATABASE_DESIGN.md`, `CODING_STANDARDS.md`, `DECISIONS.md`, `PROJECT_ROADMAP.md`, `PROJECT_LOG.md`, `docs/ai/AI_DEVELOPMENT_ENVIRONMENT.md` |

---

## 2. Purpose

This document establishes the **technical requirements and constraints** that any Frontend v1.0 implementation must satisfy, given:

- the product requirements already fixed in `FRONTEND_PRD.md`,
- the visual/product-language contract already fixed in `DESIGN.md`, and
- the frozen backend REST contract defined in `API_GUIDELINES.md`.

It answers questions such as: *what runtime and language baseline is required, what categories of dependency are needed and why, how must the API be consumed correctly and safely, what precision and timestamp rules must be preserved, what must be tested, and what quality gates must a build satisfy.*

It deliberately does **not** answer: *what folders exist, what the component tree looks like, what the exact state-management module structure is, or what the final route tree is.* Those are structural/organizational decisions reserved for `FRONTEND_ARCHITECTURE.md`, which does not yet exist and is not created by this document.

Where this document recommends a technology, that recommendation is scoped strictly to a **technical requirement or baseline** (e.g. "TypeScript is required for compile-time type safety against the API contract"), not to a structural design choice.

---

## 3. Technical Scope

### 3.1 Frontend Responsibilities

- Consuming the existing backend REST API exactly as documented in `API_GUIDELINES.md`.
- Rendering all views enumerated in `FRONTEND_PRD.md` §4–§14 (Dashboard, Accounts, Account Overview, lifecycle actions, monetary operations, Transactions, Ledger, Events, Audit Trail, historical `asOf` queries).
- Presenting server-authoritative data accurately, including reconstructed balances, running balances, and financial deltas, without re-deriving them independently.
- Enforcing the visual and interaction contract defined in `DESIGN.md`.
- Providing client-side UX validation that mirrors (but never replaces) backend validation.
- Handling all documented error and empty states.

### 3.2 Backend Responsibilities (Not Frontend Responsibilities)

- All business-rule enforcement (double-entry balance, `SYS-CASH` isolation, account eligibility, insufficient funds, etc.).
- All balance reconstruction and event replay.
- Pagination, sorting, filtering execution and metadata.
- Authoritative timestamp generation (`occurredAt`, `createdAt`).
- Data persistence and transactional integrity.

### 3.3 Explicitly Deferred / Out of Technical Scope for v1.0

Per `FRONTEND_PRD.md` §20 and §21, the following remain outside v1.0 and are therefore outside this TRD as well:

- Authentication, sessions, and RBAC.
- A global (non-account-scoped) transaction/ledger/event explorer.
- System-wide statistics/metrics endpoints.
- Real-time/streaming updates (WebSockets, SSE, push).
- Idempotency-key-driven request deduplication (not yet implemented server-side — `API_GUIDELINES.md` §15).
- Multi-currency handling.

---

## 4. Technology Baseline

The backend TRD (`TRD.md`) does not define a frontend technology stack — Frontend v1.0 is a new baseline decision. The following are **proposed** technical decisions requiring approval, not established facts, except where marked otherwise.

| Concern | Proposal | Status |
|---|---|---|
| UI library | React | Proposed |
| Language | TypeScript (strict mode) | Proposed |
| Build tool | Vite | Proposed |
| Runtime | Node.js (current LTS at implementation time) | Proposed |
| Package manager | npm (matches Maven's "no unnecessary tooling" philosophy stated in `TRD.md` §13) | Proposed |
| Module format | ES Modules | Proposed |

**Rationale for TypeScript (required, not merely preferred):** The backend API returns strongly-typed JSON contracts (`AccountResponse`, `PagedResponse<T>`, `AuditTrailResponse`, etc., per `API_GUIDELINES.md` §21). A statically typed frontend language is necessary to keep the frontend's model of these contracts verifiably in sync with the documented backend DTOs, reducing the risk of silently consuming a field, filter, or sort key the backend does not actually support — a hard constraint stated repeatedly in `FRONTEND_PRD.md`.

**Rationale for React:** No project document establishes a UI framework. React is proposed because it is the most common counterpart to the Vite/TypeScript toolchain and has the largest ecosystem of accessible component primitives, but this is a **proposal**, not a decision derived from an authoritative document, and must be confirmed before `FRONTEND_ARCHITECTURE.md` is written.

Exact version pinning (React version, TypeScript version, Node LTS line, Vite version) is deferred — the appropriate approach is to pin versions only once concrete decisions are made and recorded, as established by the project's ADR discipline (`DECISIONS.md`).

### 4.1 Browser Support Baseline

No project document specifies a browser support matrix. Proposed baseline (Open Technical Decision, §24): the current major version and one prior major version of evergreen browsers (Chromium-based browsers, Firefox, Safari). No legacy/IE support, consistent with `DESIGN.md`'s modern institutional-console character and the absence of any stated legacy requirement.

---

## 5. Dependency Requirements

No dependency in this section is an established project decision. Each is evaluated by the technical requirement it would satisfy; final selection is an Open Technical Decision (§24). The dependency surface must remain minimal — one library per concern, no overlapping libraries for the same responsibility (per this task's constraint and general `CODING_STANDARDS.md` §17/§24 "avoid unnecessary complexity" philosophy).

| Category | Technical Requirement | Notes |
|---|---|---|
| Routing | Client-side route matching for the views in `FRONTEND_PRD.md` §4 (Dashboard, Account List, Account Overview + 4 sub-views), with URL-addressable account context (`accountId`) | A single routing library is required; deep-linking to an account and its sub-views is a hard requirement (§12). |
| HTTP/API client | A typed HTTP layer capable of: base-URL configuration, JSON serialization/deserialization, timeout handling, and surfacing the `ApiError` shape (`API_GUIDELINES.md` §10) distinctly from network failures | Native `fetch` may suffice; a thin wrapper library is acceptable but not required by any document. |
| Server-state / data fetching | A mechanism providing: request de-duplication, loading/error/success state, cache invalidation after mutation (§11), and pagination-aware caching | Required because every view in `FRONTEND_PRD.md` is a paginated, server-derived read. No specific library is established by any project document. |
| Forms | A mechanism for controlled inputs, submit-state (busy/disabled per `FRONTEND_PRD.md` §16), and field-level error mapping from `400` `ApiError` responses | Required for account creation and the three monetary workflows (`FRONTEND_PRD.md` §6.2, §9). |
| Schema/runtime validation | Client-side validation matching the backend's documented constraints exactly: `@Digits(integer=17, fraction=2)`, `@DecimalMin("0.01")`, required fields (§9 of this document) | Must not diverge from documented backend constraints; whether this is hand-written or library-driven is an Open Technical Decision. |
| UI/component primitives | Accessible primitives for modal dialogs (focus trap, `Escape` close per `DESIGN.md` §16), toasts (`DESIGN.md` §17), and data tables | Must satisfy the accessibility requirements in §13 without being assumed to be any specific named library. |
| Date/time handling | UTC-safe ISO-8601 parsing/formatting with local-time display conversion (§8) | Native `Intl`/`Date` may suffice; a library is only justified if it materially simplifies UTC-safe formatting. |
| Monetary formatting | Decimal-safe (non-floating-point) parsing and formatting of `NUMERIC(19,2)`-sourced string/decimal values (§7) | This is a hard technical requirement; the specific implementation (library vs. hand-written) is an Open Technical Decision. |
| Icons | A minimal, geometric icon set consistent with `DESIGN.md` §25 | Any library satisfying the described icon set is acceptable. |
| Testing | Component/unit testing framework, plus an accessibility-assertion mechanism (§16) | No project document names a specific framework. |

No dependency listed here has been installed, and none should be treated as approved until confirmed (§24).

---

## 6. API Integration Requirements

### 6.1 Base URL & Environment Configuration

- The backend API base URL **must** be externally configurable (environment variable / build-time config), never hardcoded, consistent with the backend's own externalized-configuration principle (`TRD.md` §14).
- No API credentials or secrets exist to configure, since authentication is out of scope (`ADR-011`); no such configuration should be introduced.

### 6.2 HTTP Communication

- All requests/responses are JSON, matching `API_GUIDELINES.md` §3.
- The backend controllers expose endpoints at the following paths (no `/api/v1` version prefix is present in the current implementation; `API_GUIDELINES.md` §14 explicitly defers URI versioning to a future version): `POST /accounts`, `GET /accounts`, `GET /accounts/{id}`, `GET /accounts/by-number/{accountNumber}`, `PATCH /accounts/{id}/freeze|activate|close`, `POST /accounts/{accountId}/deposit`, `POST /accounts/{accountId}/withdrawal`, `POST /transfers`, and the five `GET /accounts/{accountId}/audit/*` endpoints.
- No endpoint, field, filter, or sort parameter may be introduced beyond what `API_GUIDELINES.md` documents (per `FRONTEND_PRD.md` §22, acceptance criterion 1).

### 6.3 Request Serialization

- Request bodies must match the documented DTOs exactly: `CreateAccountRequest`, `DepositRequest`, `WithdrawalRequest`, `TransferRequest` (`API_GUIDELINES.md` §21).
- Monetary amounts must be serialized as decimal-safe values (§7). See §24 (Open Technical Decisions) regarding the exact JSON representation of `amount` in request bodies.

### 6.4 Response Parsing & Typing

- Response typing must mirror the documented response DTOs exactly, including nullable fields (e.g. `AccountEventResponse.payload`, `AccountEventResponse.transactionId` for `ACCOUNT_CREATED` events, `AuditTrailItemResponse.transactionId`, `AuditTrailItemResponse.referenceNumber`, `AuditTrailResponse.asOf`, `AuditTrailResponse` items' `transactionId` and `referenceNumber`).
- **Mutation responses vs. audit read responses:** `TransactionResponse` (returned by deposit and withdrawal `201 Created`) and `TransferResponse` (returned by transfer `201 Created`) both include an `amount` field. `AccountTransactionResponse` (returned by the paginated `GET /accounts/{accountId}/audit/transactions` endpoint) intentionally does **not** include an amount field — this is a deliberate backend design decision, not an omission (`FRONTEND_PRD.md` §10.1). The frontend must not display or fabricate an amount on the transaction history table.
- `PagedResponse<T>` (`content`, `page`, `size`, `totalPages`, `totalElements`) is the generic pagination envelope for all standard collection endpoints; `AuditTrailResponse` is its own specialized, non-generic envelope (`API_GUIDELINES.md` §11) and must not be coerced into the generic shape.
- See §24 regarding the open question of the exact JSON type of monetary fields in API responses.

### 6.5 Error Handling at the API Layer

- Every non-2xx response must be parsed as `ApiError` (`timestamp`, `status`, `error`, `message`, `path`) per `API_GUIDELINES.md` §10, and distinguished by status code (§10 of this document).
- Network failures (no response received) must be distinguished from HTTP error responses (a response with an error status was received).

### 6.6 Pagination, Sorting, Filtering

- Requirements per endpoint are fixed exactly as the capability matrix in `FRONTEND_PRD.md` §15 states; the frontend integration layer must not expose a sort/filter parameter for an endpoint the table marks as unsupported (e.g. no `eventType` filter, no sorting on `/audit/transactions` or `/audit/trail`).
- Defaults: `page = 0`, `size = 20`, `size <= 100` (`API_GUIDELINES.md` §11).
- An out-of-range page must be treated as a valid `200` empty response, not an error (`API_GUIDELINES.md` §11, `FRONTEND_PRD.md` §16).

### 6.7 ISO-8601 Timestamps & Nullability

- All timestamps are transmitted and stored in UTC (`API_GUIDELINES.md` §16); see §8 of this document.
- Nullable response fields (documented above) must be modeled as nullable in the frontend's type layer, not defaulted to a sentinel value.

### 6.8 Monetary Values

- See §7. Monetary fields must never be parsed into native binary floating-point types for calculation or display purposes.

---

## 7. Financial Data and Precision

This is a financial application; precision requirements are non-negotiable.

- The backend stores monetary amounts as `NUMERIC(19,2)` (`DATABASE_DESIGN.md` §6, `ADR-020`) and validates request amounts with `@DecimalMin("0.01")` and `@Digits(integer=17, fraction=2)` (`API_GUIDELINES.md` §21).
- **Wire format of monetary values (open question — see §24):** `API_GUIDELINES.md` §17 states that amounts use "precise decimal types" and all JSON examples in §21 represent monetary values as **JSON string literals** (e.g. `"amount": "100.00"`, `"balance": "1500.00"`). However, the backend Java source uses plain `BigDecimal` record fields with no custom `@JsonSerialize` annotation and no Jackson `ObjectMapper` customization. Spring Boot's default Jackson behavior serializes `BigDecimal` as a **JSON number** (e.g. `"amount": 100.00`), not a quoted string. The actual wire format must be confirmed against the running API before implementation. This is documented as an open question in §24.
- **Regardless of wire format, decimal-safe parsing is mandatory.** Whether monetary fields arrive as JSON strings or JSON numbers, the frontend must never assign them to a native JavaScript `number` for storage, calculation, or re-submission. IEEE 754 double-precision floating-point cannot exactly represent most base-10 decimal fractions — silent rounding drift would be unacceptable in a system whose entire premise (`PRD.md` §6, Principle 3) is exact double-entry balance.
- Monetary values must be handled as strings or a decimal-safe representation from the moment they are received from the API until the moment they are either displayed or re-serialized into a request body.
- Formatting requirements (derived from `DESIGN.md` §11):
  - Always exactly two decimal places.
  - Currency symbol (`₹`) visually separated from the numeral.
  - Tabular/monospace numeral rendering (`DESIGN.md` §2.3, §4.1).
  - Zero values render as `0.00`, never blank or omitted (`FRONTEND_PRD.md` §13.3 — a lifecycle event's `balanceChange = 0.00` must render explicitly).
- Signed values: `balanceChange` in the Audit Trail must always render with an explicit leading sign (`+`/`-`), never relying on color alone (`DESIGN.md` §11.2, §28.1).
- Debit/Credit ledger values use neutral typography — never red/green — per `DESIGN.md` §2.4 and `FRONTEND_PRD.md` §11.3; this is a rendering requirement, not merely a stylistic preference.
- **The frontend must never independently compute, cache as authoritative, or optimistically mutate an account balance.** Every balance and running balance shown must originate from the backend's `audit/balance` or `audit/trail` response for that request. The frontend is a display and input surface, never a source of financial truth (`PRD.md` §6, Principle 2; `FRONTEND_PRD.md` §2, §9.4).

---

## 8. Date and Time Requirements

- All timestamps exchanged with the API are ISO-8601 in UTC (`API_GUIDELINES.md` §16).
- The frontend must convert to local time **only at presentation** (`API_GUIDELINES.md` §16); the value sent back to the API (e.g. an `asOf` query parameter) must be normalized to a valid UTC ISO-8601 string regardless of the timezone the user entered it in (`FRONTEND_PRD.md` §14.1, §14.2).
- The inclusive boundary semantics of `asOf` (`occurredAt <= asOf`) documented in `API_GUIDELINES.md` §21 ("Get Reconstructed Account Balance") and `ADR-027` Decision 7 must be preserved exactly and must not be reinterpreted as exclusive or approximate by the frontend.
- The frontend must not imply event-ID-level sub-timestamp resolution at the `asOf` boundary — events sharing an exact `occurredAt` are included or excluded as a group, per `FRONTEND_PRD.md` §14.2. Any UI copy or control implying finer-grained selection is a technical defect.
- Presentation must be deterministic: the same stored UTC timestamp must render identically for identical viewer timezone/locale settings, with no timezone ambiguity in the displayed string (e.g. include a UTC offset or explicit timezone label where local time is shown, consistent with `DESIGN.md` §23's example "10 Sep 2026, 12:00 UTC").

---

## 9. Client-Side Validation

Client-side validation exists **only** to give immediate UX feedback and reduce round-trips for input the backend would reject anyway. It is never authoritative and must never be treated as a substitute for backend validation or business-rule enforcement.

| Workflow | Client-side checks (mirror backend constraints exactly) | Backend authority |
|---|---|---|
| Account creation | Required `accountNumber`, `accountName`; `accountType` restricted to `SAVINGS`/`CURRENT` (`FRONTEND_PRD.md` §6.2) | `400` structural validation; `409` duplicate `accountNumber` |
| Deposit / Withdrawal | Required amount; `>= 0.01`; max 17 integer digits, 2 fractional digits (`API_GUIDELINES.md` §21) | `400` invalid amount; `404` account/`SYS-CASH`; `422` ineligible status; `422` insufficient funds (withdrawal only) |
| Transfer | Same amount checks; source ≠ destination (`FRONTEND_PRD.md` §9.3) | `400`/`404`/`422` as documented in `API_GUIDELINES.md` §21 |
| Pagination controls | Only expose `page >= 0`, `1 <= size <= 100` | `400 InvalidPageParameterException` is the backstop |
| Sorting controls | Only expose the allowlisted field set per endpoint (§6.6) | `400 InvalidSortFieldException` is the backstop |
| Filtering controls | Only expose the documented filter fields per endpoint (§6.6) | `400`/business rule is the backstop |
| Historical `asOf` input | Must serialize to a syntactically valid ISO-8601 string before submission | `400` on malformed `asOf` (`MethodArgumentTypeMismatchException` handling, `ADR-028` Decision 7) |

The frontend must **not** duplicate backend business logic (e.g. it must not attempt to independently compute whether a withdrawal would exceed the derived balance) — such logic remains exclusively a backend concern (`ARCHITECTURE.md` §12, "business rules remain inside the domain"). Client-side checks are limited to structural/format validation the backend also enforces at the request-validation layer (`API_GUIDELINES.md` §9).

---

## 10. Error Handling

All error handling must be built around the single documented `ApiError` contract (`API_GUIDELINES.md` §10; `ADR-018`) — `timestamp`, `status`, `error`, `message`, `path` — with no assumption of any additional field.

| Status | Technical handling requirement |
|---|---|
| `400` | Field-level inline error where the error originates from a specific input; general message otherwise (`FRONTEND_PRD.md` §16). |
| `404` | Rendered as a specific "not found" state (account lookup, deep link, `SYS-CASH`-resolved target), never a generic error (`FRONTEND_PRD.md` §6.3, §8.3, §16). |
| `409` | Specific to account creation (`FRONTEND_PRD.md` §6.2) — rendered as "account number already in use," not a generic conflict message. |
| `422` | The `ApiError.message` **must** be surfaced verbatim/near-verbatim as the specific business-rule explanation (insufficient funds, ineligible status, invalid transfer, unbalanced ledger) — never flattened into a generic failure message (`FRONTEND_PRD.md` §9, §16). |
| `500` | Rendered as a generic, non-technical failure message. The backend contract guarantees no stack traces or internals are ever present (`API_GUIDELINES.md` §10) — the frontend must not attempt to surface anything beyond `message` and must never display raw response bodies that could theoretically contain implementation detail. |
| Network failure (no response) | Must be distinguishable from a `500`, with a retry affordance where appropriate (`FRONTEND_PRD.md` §16). |
| Unexpected/unparseable response | Must fail safely into a generic error state rather than throwing an unhandled exception into the UI. |

---

## 11. Data and UI State Requirements

- **Server state** (accounts, transactions, ledger entries, events, audit trail, balances) must be modeled as request-scoped, revalidatable data — not held as frontend-owned mutable state.
- **UI state** (modal open/closed, active tab, selected filter values) is local and ephemeral.
- **Form state** (in-progress input, validation errors, submit-in-progress) is local to the form until a successful mutation response is received.
- **Loading state** must be represented at two granularities: initial full-view load, and scoped table/list load during paging/sorting/filtering, per `FRONTEND_PRD.md` §16.
- **Mutation state**: the triggering control must reflect a busy/disabled state for the duration of a create/lifecycle/monetary request, preventing duplicate submission (`FRONTEND_PRD.md` §16) — this is required specifically because no idempotency-key mechanism exists yet (`API_GUIDELINES.md` §15, `FRONTEND_PRD.md` §20) to protect against accidental duplicate financial requests at the backend.
- **Post-mutation synchronization (hard requirement):** after any successful account creation, lifecycle transition, deposit, withdrawal, or transfer, every affected view (balance, transactions, ledger, events, audit trail) must be refetched from the backend rather than patched from client-held assumptions, so that the displayed state always reflects a real backend read (`FRONTEND_PRD.md` §9.1–§9.3).
- **No optimistic balance mutation:** balances, running balances, and `finalBalance` must never be locally incremented/decremented in anticipation of a mutation's result. The frontend must wait for and render the authoritative server response (§7).
- **Audit Trail pagination caching**, if any caching layer is used, must preserve the reconstruction-precedes-slicing invariant (§12 below and `FRONTEND_PRD.md` §13.4) — `finalBalance` and `totalElements` must be treated as stable across page navigation within the same query, not recomputed or approximated client-side.
- This section defines state *requirements*, not a state-management architecture; the specific mechanism is deferred to `FRONTEND_ARCHITECTURE.md`.

---

## 12. Routing and Navigation Requirements

- The application requires addressable routes for: Dashboard, Account List, Account Creation, Account Overview (by internal `id`), and the four account-scoped sub-views (Transactions, Ledger, Events, Audit Trail), per `FRONTEND_PRD.md` §4, §7.2, §24.
- Account context must be carried via a route parameter (internal `accountId`), enabling deep-linking directly into a specific account's Overview or any sub-view.
- A route requesting an account `id` that resolves to `404` (missing, or resolves to `SYS-CASH`, which is never a valid frontend target — `DATABASE_DESIGN.md` §17) must render the account-not-found state defined in `FRONTEND_PRD.md` §6.3/§8.3, not a raw error or blank page.
- A browser refresh on any account-scoped route must reproduce the same view by re-fetching from the `accountId` in the URL — no reliance on in-memory-only navigation state to reconstruct the view.
- Navigating away from and back to a paginated/sorted/filtered view may either preserve or reset query-string state (page/size/sort/filter as URL parameters is one acceptable technical approach); the exact mechanism is deferred to `FRONTEND_ARCHITECTURE.md`. If query parameters are used to encode pagination/sort/filter state, they must only ever encode the fields the capability matrix (`FRONTEND_PRD.md` §15) actually allows for that endpoint.
- An invalid/unroutable path must render a not-found route state, distinct from an account-not-found state.

This section defines routing *requirements*; the final route tree and file/module organization are deferred to `FRONTEND_ARCHITECTURE.md`.

---

## 13. Accessibility Requirements

Derived from `DESIGN.md` §27 and `FRONTEND_PRD.md` §18, both of which state these as hard requirements, not aspirational goals.

- **WCAG AA contrast**: use only the color tokens defined in `DESIGN.md` §3/§30 as specified; no lower-contrast substitution.
- **Color-independent meaning**: transaction direction (`+`/`-`), account status, and validation states must always pair color with explicit text or iconography (§7, §10).
- **Keyboard operability**: all buttons, tabs, inputs, and modals operable via `Tab`, `Enter`, `Space`, `Escape`.
- **Focus management**: visible `2px solid` primary-color focus ring with offset on every interactive element; modal dialogs must trap focus and restore it on close.
- **Semantic HTML**: native `<button>`, `<input>`, `<dialog>` (or an equivalent accessible dialog pattern), and proper `<table>` markup (`<th>`, `<td>`, `<caption>`) for every data table (Transactions, Ledger, Events).
- **Accessible forms**: labeled inputs, field-level error association (e.g. `aria-describedby`), and error announcement to assistive technology.
- **Accessible loading states**: loading indicators must be perceivable by assistive technology (not purely visual), consistent with `FRONTEND_PRD.md` §16.
- **Accessible feedback**: toasts/alerts (`DESIGN.md` §17) must be announced to assistive technology, not conveyed by color/position alone.
- Automated accessibility assertions are required as part of the testing strategy (§16).

---

## 14. Responsive Requirements

Breakpoints are fixed by `DESIGN.md` §26 and must be preserved exactly, not reinterpreted:

| Viewport | Width | Required behavior |
|---|---:|---|
| Mobile | `<640px` | Single column, drawer navigation, stacked cards, horizontally scrolling tables |
| Tablet | `640–1024px` | Compressed sidebar, 2-column card layouts, compact tables |
| Desktop | `1024–1280px` | Full application shell, full tables |
| Wide | `>1280px` | Content capped at 1200px max width |

- Dense financial tables (Ledger, Transactions, Events, Audit Trail) must never truncate, abbreviate, or reduce the precision of a financial value at any viewport (`FRONTEND_PRD.md` §17).
- Wide tables require: horizontal `overflow-x: auto` scrolling, a sticky header row, and a sticky primary column (date or identifier) during horizontal scroll (`DESIGN.md` §26, `FRONTEND_PRD.md` §17).

---

## 15. Security Requirements

Authentication and RBAC remain explicitly out of scope (`ADR-011`, `FRONTEND_PRD.md` §20) and must not be introduced. Within that constraint:

- No secrets, credentials, or environment-specific connection details may be committed to source control.
- The API base URL and any other environment-specific configuration must be externally configurable, not hardcoded (§6.1).
- Error rendering must never surface raw response bodies, stack traces, or internal implementation details — the backend contract already guarantees these are never present (`API_GUIDELINES.md` §10), and the frontend must not defeat that guarantee by logging or displaying full raw payloads in production.
- User-supplied or API-sourced text (e.g. `accountName`, `Event.payload`) must never be rendered via unsafe HTML injection; all dynamic content must be rendered through safe, auto-escaping rendering paths.
- Production builds must not emit verbose diagnostic/debug logging that could leak request/response payloads (see §19).
- Dependencies must be kept current and free of known vulnerabilities as a standing hygiene requirement; this does not itself introduce a specific tool, which is an Open Technical Decision.
- The frontend must make no client-side authorization assumptions (e.g. hiding a button is a UX convenience only; it must never be treated as a security boundary), since no authorization model exists in the backend.

---

## 16. Testing Requirements

Testing categories required at the technical-requirement level (exact tooling and file organization deferred):

- **Unit testing** — pure logic: monetary formatting/parsing (§7), timestamp normalization (§8), client-side validation rules (§9).
- **Component testing** — individual UI components render correctly across documented states (loading, empty, error, populated), including the neutral debit/credit styling rule (§7) and signed-delta rule (§7).
- **Integration/API interaction testing** — verifying that a component correctly calls the documented endpoint/parameters and correctly maps a representative `ApiError` response for each status class in §10.
- **Accessibility testing** — automated assertions for the requirements in §13 (e.g. no missing labels, adequate contrast where testable, keyboard reachability) on key views (forms, tables, modals).
- **Routing testing** — deep-linking into an account and its sub-views resolves correctly; an invalid `accountId` yields the not-found state (§12).
- **Form validation testing** — for account creation and each monetary workflow, confirming rejected inputs match documented backend constraints (§9).
- **Pagination/sorting/filtering testing** — confirming only the allowlisted fields per endpoint (§6.6) are ever offered or submitted, and that an out-of-range page renders as a valid empty state, not an error.
- **Audit Trail testing** — confirming `finalBalance` and `totalElements` remain stable and correct across pages, including the out-of-range case (§11, `FRONTEND_PRD.md` §13.4).
- **Historical `asOf` testing** — confirming inclusive boundary semantics (§8) are represented correctly in both the balance panel and the Audit Trail view.
- **Error-state testing** — one representative test per documented status class (§10), not an exhaustive enumeration of every possible message.

This section defines coverage *categories*; it does not prescribe an exact test count or file structure.

---

## 17. Build and Quality Requirements

- A development build must support fast local iteration (hot reload/dev server) — mirrors the backend's `mvn spring-boot:run` local-development expectation (`README.md` "Local Development").
- A production build must produce a static, deployable artifact.
- TypeScript type-checking must run as a distinct, CI-suitable step (analogous to Hibernate's `ddl-auto=validate` acting as a startup-time contract check on the backend — `ADR-019`).
- Linting and formatting must be enforced as automated, CI-suitable steps.
- The test suite (§16) must be runnable via a single reproducible command, analogous to `mvn clean test` on the backend.
- Dependency installation must be reproducible (lockfile committed), mirroring the backend's Maven-managed, version-pinned dependency philosophy (`TRD.md` §13).
- All of the above must be executable in a CI environment without manual/interactive steps, consistent with the backend's existing `mvn clean test` CI-suitability.
- Environment-specific configuration (API base URL, §6.1) must be injectable at build or runtime without modifying source.

---

## 18. Performance Requirements

No project document establishes numeric performance benchmarks; the following are qualitative technical requirements, not arbitrary SLAs:

- Initial load of the Dashboard and Account List must not require more requests than the documented endpoints necessitate (`GET /accounts` calls per metric card, per `FRONTEND_PRD.md` §5.2 — three filtered counts, one per status value used).
- Paginated views (Account List, Transactions, Ledger, Events, Audit Trail) must request only the current page's data — the frontend must never fetch an entire collection client-side to page through it locally, which would contradict the backend's own bounded-pagination design intent (`API_GUIDELINES.md` §11).
- The frontend must not introduce N+1 request patterns — e.g. it must not issue a per-row follow-up request to assemble a list view when the list endpoint's documented response is already sufficient (consistent with the backend's own O(1)-query batch-loading design, `ARCHITECTURE.md` §17–§18).
- Navigating between an account's sub-views (Overview/Transactions/Ledger/Events/Audit Trail) should reuse already-fetched account identity/metadata where still valid, rather than re-requesting unrelated data unnecessarily.
- Dense tables must remain responsive to paging/sorting/filtering interactions without a full-page reload (scoped loading state per §11).

---

## 19. Observability and Debugging

- **Development diagnostics**: verbose request/response logging and error detail may be enabled in development builds only.
- **Production logging restrictions**: production builds must not log full request/response payloads (which could include account numbers or amounts) to the browser console or any third-party service; this is a security requirement as well (§15).
- **API failure diagnostics**: when an API call fails, the frontend must retain enough information (endpoint, status, `ApiError.timestamp`/`path`) to support debugging without exposing it in end-user-facing UI copy.
- **Correlation identifiers**: `API_GUIDELINES.md` §10 does not document a request/trace correlation ID field on `ApiError`; the frontend must not assume or fabricate one. If needed, this is a candidate for a future backend enhancement, not a frontend workaround.
- No observability/monitoring platform is introduced by this document, as none is established by any project document (`PROJECT_ROADMAP.md` §7 lists "Monitoring & Metrics" only as a future backend enhancement, not a frontend v1.0 requirement).

---

## 20. Browser and Platform Support

Per the proposed baseline in §4.1: current and previous major versions of evergreen, Chromium-based browsers, Firefox, and Safari. No legacy browser support. No native mobile app target — "mobile" refers exclusively to the responsive web breakpoint defined in `DESIGN.md` §26 / §14 of this document, not a separate platform build.

---

## 21. Dependency and Change Control

- Every dependency added must be justified against a specific requirement in §5 or elsewhere in this document; popularity alone is not sufficient justification.
- No two dependencies may be added to serve the same responsibility (e.g. two data-fetching libraries, two form libraries).
- A backend limitation (e.g. a missing filter, missing field, missing endpoint) must never be worked around by frontend-side computation that fabricates data the backend does not provide (`FRONTEND_PRD.md` §22, criterion 1) — the correct path is a documented backend change request, not a frontend workaround.
- Any material technical decision made during implementation that deviates from or resolves an item in §24 must be recorded (e.g. as an entry in this document's revision history or a project ADR, mirroring `DECISIONS.md`'s ADR discipline).
- Structural/architectural decisions (folder layout, component boundaries, state-management module design) belong exclusively in `FRONTEND_ARCHITECTURE.md`, not as ad-hoc additions to this TRD.

---

## 22. Non-Functional Requirements

| Quality | Requirement summary |
|---|---|
| Correctness | Frontend must faithfully reflect backend-computed state; no independent business-rule logic (§9, §11). |
| Financial precision | No binary floating-point arithmetic on monetary values; decimal-safe handling end to end (§7). |
| Accessibility | WCAG AA, full keyboard operability, semantic markup (§13). |
| Responsiveness | Correct behavior at all four `DESIGN.md` breakpoints without loss of financial precision (§14). |
| Maintainability | Minimal, non-overlapping dependency surface (§5, §21); typed API layer (§4, §6). |
| Testability | Coverage across the categories in §16. |
| Security | No secrets, no unsafe rendering, no fabricated authorization (§15). |
| Performance | Bounded, non-redundant API usage (§18). |
| Reliability | Defined behavior for every documented error/empty/loading state (§10, §11). |
| API contract fidelity | Zero invented endpoints, fields, filters, sort keys, or business rules (§6). |

---

## 23. Traceability

| Technical Requirement | Source |
|---|---|
| No balance field on Account List; balance only via audit endpoint | `FRONTEND_PRD.md` §6.1, §7.1; `DESIGN.md` §10.1(A)–(B) |
| Sort allowlist per endpoint | `FRONTEND_PRD.md` §15; `API_GUIDELINES.md` §12, §21 |
| Filter allowlist per endpoint | `FRONTEND_PRD.md` §15; `API_GUIDELINES.md` §13, §21 |
| `PagedResponse<T>` vs. specialized `AuditTrailResponse` | `API_GUIDELINES.md` §11; `ADR-029` |
| Out-of-range page = `200` empty, not error | `API_GUIDELINES.md` §11; `FRONTEND_PRD.md` §13.4, §15, §16 |
| Monetary precision constraints (`17,2`, min `0.01`) | `API_GUIDELINES.md` §21 (`DepositRequest`/`WithdrawalRequest`/`TransferRequest`); `FRONTEND_PRD.md` §9.1–§9.3 |
| `NUMERIC(19,2)` monetary storage rationale | `DATABASE_DESIGN.md` §6; `ADR-020` |
| Debit/Credit neutral typography | `DESIGN.md` §2.4, §12.3; `FRONTEND_PRD.md` §11.3 |
| Signed `balanceChange` with explicit sign | `DESIGN.md` §11.2, §28.1; `FRONTEND_PRD.md` §13.3 |
| `asOf` inclusive boundary (`occurredAt <= asOf`) | `API_GUIDELINES.md` §21; `ADR-027` Decision 7; `FRONTEND_PRD.md` §14.2 |
| UTC storage, local-time display only | `API_GUIDELINES.md` §16; `FRONTEND_PRD.md` §14.2 |
| `SYS-CASH` never a valid frontend target | `DATABASE_DESIGN.md` §17; `ADR-024`; `FRONTEND_PRD.md` §6.1, §6.3 |
| `ApiError` shape and handling | `API_GUIDELINES.md` §10; `ADR-018`; `FRONTEND_PRD.md` §16 |
| Loading/empty/error state catalog | `FRONTEND_PRD.md` §16 |
| Responsive breakpoints | `DESIGN.md` §26; `FRONTEND_PRD.md` §17 |
| Accessibility requirements | `DESIGN.md` §27; `FRONTEND_PRD.md` §18 |
| No authentication/RBAC | `ADR-011`; `TRD.md` §16; `FRONTEND_PRD.md` §3, §20 |
| Idempotency keys not yet available | `API_GUIDELINES.md` §15; `FRONTEND_PRD.md` §20 |
| No `/stats` or global explorer endpoints | `DESIGN.md` §22; `FRONTEND_PRD.md` §5.4, §20 |

---

## 24. Open Technical Decisions

**Established project decisions (not open):**
- Backend v1.0.0 REST contract is frozen (`PROJECT_ROADMAP.md` Phase 10).
- `DESIGN.md` v1.1 visual system is frozen.
- `FRONTEND_PRD.md` v1.0 product scope is frozen.
- No authentication/RBAC in v1.0 (`ADR-011`).
- No URI versioning prefix (`/api/v1`) in the current backend implementation (`API_GUIDELINES.md` §14; confirmed from backend controller source).

**Proposed technical choices (require approval before `FRONTEND_ARCHITECTURE.md`):**
- React as the UI library (§4) — no project document establishes this.
- TypeScript, Vite, npm, and the Node.js LTS baseline (§4).
- Browser support matrix (§4.1, §20).
- Specific libraries for: routing, HTTP client, server-state/data fetching, forms, schema validation, UI/component primitives, date/time handling, monetary formatting, icons, and testing (§5) — no specific library for any of these categories is established by any project document.
- Whether pagination/sort/filter state is encoded in the URL query string or elsewhere (§12).

**Deferred architectural decisions (explicitly belong to `FRONTEND_ARCHITECTURE.md`, not this TRD):**
- Folder/module structure, component hierarchy, exact state-management design, exact route tree, hook structure.

**Unresolved questions:**
- Exact version pins for React/TypeScript/Vite/Node once the baseline in §4 is approved.
- Whether a dedicated monetary-formatting/decimal library is justified or whether hand-written decimal-safe utilities suffice (§5, §7).
- CI platform specifics (not established by any project document beyond "must be CI-suitable," §17).
- **Monetary wire format (§7):** `API_GUIDELINES.md` §17 and all §21 JSON examples show BigDecimal monetary values as JSON **string literals** (quoted: `"amount": "100.00"`). The backend Java source uses plain `BigDecimal` record fields with no custom Jackson serializer or `WRITE_BIGDECIMAL_AS_PLAIN` configuration. Spring Boot's default Jackson behavior serializes `BigDecimal` as a **JSON number** (unquoted). The actual wire format must be confirmed against the running API before the frontend's parsing and serialization strategy is finalized. **Regardless of which format the API uses, the frontend must not parse monetary values using `parseFloat`, `Number()`, or any other IEEE 754 floating-point mechanism** (§7). If the wire format is confirmed to be JSON numbers, the frontend must use a decimal-safe library or routine that accepts a JavaScript `number` only as a string-coerced intermediate step, and must never perform arithmetic on raw JavaScript `number` monetary values.

---

## 25. Out of Scope

Reiterated only where it constrains this TRD (full detail in `FRONTEND_PRD.md` §20):

- Authentication, sessions, RBAC.
- Global (non-account-scoped) transaction/ledger/event views.
- System-wide statistics/metrics.
- Real-time/streaming updates.
- Idempotency-key-based deduplication.
- Multi-currency support.
- Cross-account/full double-entry transaction detail views.
- `FRONTEND_ARCHITECTURE.md` content (folder structure, component design, state architecture, route tree).

---

## 26. Acceptance / Technical Readiness Criteria

Frontend v1.0 is technically ready for `FRONTEND_ARCHITECTURE.md` to begin when:

1. The Open Technical Decisions in §24 (technology baseline and dependency categories) have been resolved and approved.
2. Every API integration requirement in §6 has been validated against the current `API_GUIDELINES.md` with no assumed endpoints, fields, filters, or sort keys.
3. A decimal-safe approach to monetary handling (§7) has been confirmed and is free of binary floating-point arithmetic on amounts.
4. UTC/`asOf` boundary handling (§8) has been confirmed to preserve inclusive semantics exactly.
5. The error-handling matrix (§10) covers every documented `ApiError`-producing status code in `API_GUIDELINES.md` §8/§21.
6. The accessibility requirements (§13) and responsive breakpoints (§14) are confirmed as testable acceptance criteria, not aspirational notes.
7. A build pipeline satisfying §17 (type-check, lint, test, reproducible install) is technically specified.
8. No item in this document contradicts `FRONTEND_PRD.md` or `DESIGN.md`.

This document itself does not certify implementation readiness — it defines the conditions implementation must satisfy.