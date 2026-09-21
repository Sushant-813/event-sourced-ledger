**# Frontend Product Requirements Document (Frontend PRD)**

**\*\*Project Name:\*\*** Event-Sourced Ledger (Double-Entry Bank Core) — Frontend

**\*\*Document Name:\*\*** FRONTEND_PRD.md

**\*\*Version:\*\*** 1.0

**\*\*Status:\*\*** Approved

**\*\*Scope:\*\*** Frontend v1.0 product requirements only. This document defines *\*what\** the frontend

must do. It does not define frontend architecture, component design, state management, routing,

or any other implementation detail. Those belong to a future \`FRONTEND_TRD.md\` and

\`FRONTEND_ARCHITECTURE.md\`, which are explicitly out of scope here.

**\*\*Relationship to Backend:\*\*** The backend (\`Event-Sourced Ledger\` REST API) is complete, tested,

and released as **\*\*v1.0.0\*\*** (see \`PROJECT_ROADMAP.md\` Phase 10 and \`PROJECT_LOG.md\`,

2026-09-21). The frontend is a pure consumer of the existing backend REST API as documented in

\`API_GUIDELINES.md\`. This PRD introduces \*\*no new backend endpoints, fields, filters, sort

keys, or business rules\*\*. Every capability described below is traceable to an existing,

documented backend capability. Where the backend does not support something, this document

either omits it or explicitly marks it as a **\*\*Non-Goal\*\*** (Section 20) or **\*\*Future Scope\*\***

(Section 21).

**\*\*Design Authority:\*\*** \`docs/DESIGN.md\` (v1.1) is the sole visual and product-language source of

truth for the frontend. This PRD translates \`DESIGN.md\`'s product-level intent into functional

requirements; it does not redefine, reinterpret, or extend the design system itself.

**\*\*Related Documents:\*\***

\| Document | Relationship |

\|---|---|

\| \`PRD.md\` | Backend product vision and business principles; the frontend exists to expose this domain to users. |

\| \`API_GUIDELINES.md\` | Authoritative REST contract this PRD is derived from. |

\| \`ARCHITECTURE.md\` / \`DECISIONS.md\` | Authoritative source for domain behavior (event sourcing, double-entry accounting, reconstruction semantics) referenced throughout. |

\| \`DESIGN.md\` | Authoritative visual/product-language contract. |

\| \`PROJECT_ROADMAP.md\` | Confirms backend v1.0.0 completion and defers frontend planning to this phase. |

\---

**# 1. Document Metadata**

Covered above.

\---

**# 2. Product Vision**

The Event-Sourced Ledger backend does not store account balances as mutable state. Every

financial fact is recorded as an immutable event, paired with balanced double-entry ledger

records, and current or historical balances are **\*\*reconstructed\*\*** from that history on demand

(\`PRD.md\` Principle 2; \`ARCHITECTURE.md\` Principle 3).

The frontend's purpose is to make this model legible and usable to a human operator, without

hiding or contradicting it. Specifically, the frontend must let a user:

\- **\*\*Manage accounts\*\*** — create accounts, look them up, and transition their lifecycle status.

\- **\*\*Perform the supported monetary operations\*\*** — deposit, withdrawal, and transfer — and

  understand their outcome.

\- **\*\*Inspect transactions\*\*** — the discrete financial operations that occurred, in the order they

  affected an account.

\- **\*\*Inspect ledger entries\*\*** — the individual debit/credit accounting records that back every

  transaction.

\- **\*\*Inspect immutable events\*\*** — the raw, unchangeable historical facts the system replays to

  derive state.

\- **\*\*Understand reconstructed balances\*\*** — both the current balance and, where supported, a

  balance reconstructed as of a historical point in time.

\- **\*\*Inspect the audit trail\*\*** — the connective explanation that ties events, ledger entries, and

  running balances together into one coherent narrative.

The guiding product idea, carried directly from \`DESIGN.md\`, is:

\> **\*\*A balance is the result of financial history.\*\***

The frontend succeeds if, at every point, a user can trace *\*why\** a balance is what it is back to

the specific events and ledger entries that produced it — never presenting a balance as an

opaque, directly-editable number.

\---

**# 3. Target User**

\`PRD.md\` Section 5 defines three user types for the system: **\*\*Customer\*\***, **\*\*Auditor\*\***, and

**\*\*System Administrator\*\***. Authentication and authorization are explicitly deferred

(\`ADR-011\`, \`TRD.md\` §16, \`API_GUIDELINES.md\` §19) and remain out of scope for both the backend

and this frontend (see Section 20, Non-Goals).

Because no authentication or role separation exists in the backend v1.0.0 contract, \*\*frontend

v1.0 does not present role-differentiated experiences\*\*. Any user of the application has access

to the full set of capabilities described in this document — account management, monetary

operations, and audit/traceability views — corresponding to the union of the Customer and

Auditor capabilities defined in \`PRD.md\`. The System Administrator's operational-monitoring

capabilities (ledger health, operational metrics — \`PRD.md\` §5.3) are **\*\*not\*\*** exposed, because no

backend endpoint provides them.

This is a single, unified operator experience, not a multi-tenant or role-gated product.

\---

**# 4. Frontend v1.0 Scope**

Frontend v1.0 is **\*\*account-centric\*\***: every meaningful view is either the account list/creation

surface or a view scoped to one specific account, mirroring the backend's own resource model

(\`/accounts\`, \`/accounts/{id}\`, \`/accounts/{accountId}/audit/\*\`).

In scope for v1.0:

\- Dashboard (account-derived metrics and quick actions only)

\- Account list, creation, and lookup

\- Account overview (detail page)

\- Account lifecycle actions (freeze, activate, close)

\- Deposit, withdrawal, and transfer workflows

\- Account-scoped transaction history

\- Account-scoped ledger history

\- Account-scoped event history

\- Account-scoped audit trail (event-by-event balance explanation)

\- Current and historical (\`asOf\`) balance reconstruction, where the backend supports it

\- Pagination, filtering, and sorting exactly where the backend contract supports them

\- Loading, empty, and error states for every data-driven view

\- Success feedback for every mutating action

\- Responsive behavior across desktop, tablet, and mobile

\- Accessibility conformance per \`DESIGN.md\` §27

Explicitly **\*\*not\*\*** in scope for v1.0: anything requiring a backend capability that does not

exist today (see Section 20).

\---

**# 5. Dashboard**

**## 5.1 Purpose**

The dashboard is an account-portfolio landing page. It is deliberately limited to what

\`GET /accounts\` can support, consistent with \`DESIGN.md\` §22.

**## 5.2 Supported Metrics**

The dashboard may display account counts derived from \`GET /accounts\` pagination metadata

(\`totalElements\`), using the \`status\` filter:

\- **\*\*Total Accounts\*\*** — \`totalElements\` from an unfiltered query (excluding \`SYS-CASH\`, which the

  backend already excludes automatically).

\- **\*\*Active Accounts\*\*** — \`totalElements\` with \`status=ACTIVE\`.

\- **\*\*Frozen Accounts\*\*** — \`totalElements\` with \`status=FROZEN\`.

These three metrics match \`DESIGN.md\` §22's dashboard wireframe exactly; no additional metric

card may be introduced.

**## 5.3 Supported Quick Actions**

\- **\*\*Create Account\*\*** — navigates to / opens account creation.

\- **\*\*Find Account by Number\*\*** — navigates to / opens account lookup by business account number

  (\`GET /accounts/by-number/{accountNumber}\`).

\- **\*\*Initiate Transfer\*\*** — opens the transfer workflow (Section 9).

**## 5.4 Explicit Exclusions**

The dashboard must **\*\*not\*\*** display:

\- System-wide transaction counts or volume

\- A global "recent activity" feed

\- Total money held / aggregate ledger balances

\- Any metric requiring a backend aggregation endpoint that does not exist

These are explicitly deferred in \`DESIGN.md\` §22 pending a future backend \`/stats\` or

\`/metrics\` capability, and are listed again in Section 21 (Future Scope) of this document.

\---

**# 6. Accounts**

**## 6.1 Account List**

Backed by \`GET /accounts\`.

**\*\*Data displayed per account\*\*** (from \`AccountResponse\`): \`accountNumber\`, \`accountName\`,

\`accountType\`, \`status\`, \`createdAt\`, \`updatedAt\`, internal \`id\` (used for navigation, not

necessarily displayed). **\*\*\`AccountResponse\` contains no balance field\*\*** — the account list must

never display, imply, or lazily backfill a balance value. Balances are only ever shown on the

Account Overview page (Section 7), sourced from the audit balance endpoint.

**\*\*Pagination:\*\*** \`page\` (default 0), \`size\` (default 20, max 100), plus response metadata

(\`totalPages\`, \`totalElements\`).

**\*\*Sorting:\*\*** \`sortBy\` restricted to \`createdAt\` (default), \`accountName\`, or \`accountNumber\`;

\`direction\` \`asc\`/\`desc\`. No other field may be offered as a sort option.

**\*\*Filtering:\*\*** \`status\` (\`ACTIVE\`, \`FROZEN\`, \`CLOSED\`) and \`accountType\` (\`SAVINGS\`, \`CURRENT\`),

independently or combined. These are filters only — the frontend must not offer them as sort

options (the backend rejects that with HTTP 400).

\`SYS-CASH\` never appears in this list; no frontend handling for it is required.

**\*\*States:\*\*** loading skeleton while fetching; explicit empty state when a filtered/paginated query

returns zero accounts; error state (with retry) on request failure.

**## 6.2 Account Creation**

Backed by \`POST /accounts\` (\`CreateAccountRequest\`).

**\*\*Required inputs:\*\*** \`accountNumber\` (business identifier, unique), \`accountName\`,

\`accountType\` (\`SAVINGS\` or \`CURRENT\`).

**\*\*Validation expectations (client-side, mirroring backend constraints):\*\*** required-field

validation on all three inputs before submission is allowed; \`accountType\` restricted to the two

supported enum values.

**\*\*Success behavior:\*\*** \`201 Created\` → navigate to the new account's Overview page (Section 7) and

show success confirmation.

**\*\*Failure behavior:\*\***

\- \`400\` (validation failure, e.g. blank fields) → inline field-level errors.

\- \`409 Conflict\` (duplicate \`accountNumber\`) → a clear, specific message indicating the account

  number is already in use; do not present this as a generic error.

**## 6.3 Account Lookup**

Two supported lookup paths, both backed by existing endpoints:

\- **\*\*By business account number\*\*** — \`GET /accounts/by-number/{accountNumber}\`. This is the

  primary, user-facing lookup mechanism (e.g. the dashboard's "Find Account by Number" action).

\- **\*\*By internal ID\*\*** — \`GET /accounts/{id}\`. Used when navigating from a context that already

  has the internal ID (e.g. clicking an account row), not as a user-typed search field.

A lookup that returns \`404\` (not found, or resolves to \`SYS-CASH\`, which the frontend never

exposes as a valid target) must present a clear "account not found" state rather than a generic

error.

\---

**# 7. Account Overview**

The Account Overview is the hub for a single account, matching \`DESIGN.md\` §10.1(B) and the

Account Context Navigation (\`DESIGN.md\` §24, Level 2).

**## 7.1 Content**

\- **\*\*Account identity:\*\*** \`accountNumber\`, \`accountName\`.

\- **\*\*Account metadata:\*\*** \`accountType\`, \`status\` (via the status badge, \`DESIGN.md\` §10.2),

  \`createdAt\`.

\- **\*\*Current reconstructed balance:\*\*** sourced from

  \`GET /accounts/{accountId}/audit/balance\` (no \`asOf\` parameter). The balance must be presented

  as a derived/reconstructed value, not as a stored field of the account (\`DESIGN.md\` §11.1,

  §28.2).

\- **\*\*Available lifecycle actions:\*\*** contextual to current \`status\` (Section 8).

\- **\*\*Monetary action entry points:\*\*** Deposit, Withdraw, Transfer (Section 9), available only when

  the account is eligible (\`status = ACTIVE\`; see Section 8 and Section 9 for FROZEN/CLOSED

  handling).

**## 7.2 Account-Scoped Sub-Navigation**

Per \`DESIGN.md\` §18 and §24:

\- **\*\*Overview\*\*** — the content above.

\- **\*\*Transactions\*\*** — Section 10.

\- **\*\*Ledger\*\*** — Section 11.

\- **\*\*Events\*\*** — Section 12.

\- **\*\*Audit Trail\*\*** — Section 13.

No other account-level information may be introduced beyond what these five views and the

underlying endpoints support.

\---

**# 8. Account Lifecycle**

Backed by \`PATCH /accounts/{id}/freeze\`, \`PATCH /accounts/{id}/activate\`, \`PATCH

/accounts/{id}/close\`.

**## 8.1 Supported Transitions**

Exactly the transitions the backend enforces (\`API_GUIDELINES.md\` §21, \`AccountServiceImpl\`):

\- \`ACTIVE → FROZEN\` (Freeze)

\- \`FROZEN → ACTIVE\` (Activate)

\- \`ACTIVE → FROZEN → CLOSED\` or \`ACTIVE → CLOSED\` (Close)

\- \`CLOSED\` is **\*\*terminal\*\*** — no action may be offered from a \`CLOSED\` account.

**## 8.2 Action Availability**

The frontend must only present the action(s) valid for the account's current status:

\| Current Status | Available Actions |

\|---|---|

\| \`ACTIVE\` | Freeze, Close |

\| \`FROZEN\` | Activate, Close |

\| \`CLOSED\` | None |

**## 8.3 Confirmation, Feedback, and Errors**

\- **\*\*Freeze / Activate:\*\*** lightweight confirmation is acceptable given reversibility.

\- **\*\*Close:\*\*** requires explicit confirmation before submission (\`DESIGN.md\` §16 lists "Close

  Account Confirmation" as a modal use case; §9 reserves the destructive button style strictly

  for this kind of irreversible administrative action).

\- **\*\*Success:\*\*** update the displayed status badge immediately and show success feedback.

\- **\*\*Failure:\*\*** a \`422\` (\`InvalidAccountStatusTransitionException\`) must be surfaced as a business

  rule rejection, not a generic error — e.g. "This account is already closed and cannot be

  reopened," not "Something went wrong."

\- A \`404\` on a lifecycle action (missing account, or an attempt against \`SYS-CASH\`, which the

  frontend never exposes) is treated as an account-not-found state.

\---

**# 9. Monetary Operations**

Deposit, Withdrawal, and Transfer are distinct backend operations (\`POST

/accounts/{accountId}/deposit\`, \`POST /accounts/{accountId}/withdrawal\`, \`POST /transfers\`) and

must remain distinct, clearly-labeled workflows in the frontend — never merged into one generic

"move money" form, since their inputs, eligibility rules, and accounting effects differ.

**## 9.1 Deposit**

**\*\*Inputs:\*\*** \`amount\` only (target account is the current account context).

**\*\*Validation:\*\*** amount is required; minimum value is \`0.01\`; maximum 17 integer digits
and 2 fractional digits. Amounts such as \`100.001\` must be rejected client-side before
submission, matching the backend's \`@Digits(integer = 17, fraction = 2)\` and
\`@DecimalMin(value = "0.01")\` constraints.

**\*\*Confirmation:\*\*** a lightweight confirmation showing the amount and target account before

submission is appropriate given this is a routine, non-destructive financial action

(\`DESIGN.md\` §2.4, §9).

**\*\*Success:\*\*** \`201 Created\` (\`TransactionResponse\`) → success feedback showing the resulting

transaction's reference number. The newly recorded transaction and its resulting derived

balance must be reflected in the relevant account views without requiring the user to perform a

separate manual action.

**\*\*Failure:\*\***

\- \`404\` — account not found (or resolves to \`SYS-CASH\`, never reachable from the UI).

\- \`422\` (\`AccountNotEligibleForTransactionException\`) — account is \`FROZEN\` or \`CLOSED\`; the

  frontend should proactively disable/hide the Deposit action for ineligible accounts (Section

  7.1) and still handle the error gracefully if it occurs.

\- \`400\` — invalid amount.

**## 9.2 Withdrawal**

**\*\*Inputs:\*\*** \`amount\` only.

**\*\*Validation:\*\*** same amount constraints as Deposit: required, minimum \`0.01\`, maximum 17 integer digits, and maximum 2 fractional digits.

**\*\*Confirmation:\*\*** same pattern as Deposit. A withdrawal is a routine financial operation, **\*\*not\*\***

a destructive UI action, and must not use destructive (red) button styling (\`DESIGN.md\` §9,

§28.2).

**\*\*Success:\*\*** same pattern as Deposit.

**\*\*Failure:\*\*** same \`404\`/\`422\` cases as Deposit, plus:

\- \`422\` (\`InsufficientFundsException\`) — the withdrawal amount exceeds the account's current

  derived balance. This must be presented as a clear, specific business-rule message (e.g.

  "Insufficient funds for this withdrawal"), not a generic error.

**## 9.3 Transfer**

**\*\*Inputs:\*\*** source account (defaults to current account context when initiated from an Account

Overview; may be entered when initiated from the dashboard's "Initiate Transfer" quick action),

destination account number, \`amount\`.

**\*\*Validation:\*\***

- Same amount constraints as Deposit/Withdrawal: required, minimum \`0.01\`, maximum 17 integer digits, and maximum 2 fractional digits.

- Source and destination must be different accounts (mirrors \`InvalidTransferException\`); the frontend should prevent submission of an identical source/destination pair where feasible.

**\*\*Confirmation:\*\*** required before submission, showing source, destination, and amount

(\`DESIGN.md\` §16 shows the Transfer Funds modal as the reference structure).

**\*\*Success:\*\*** \`201 Created\` (\`TransferResponse\`) → success feedback with the transaction reference

number. The source account's newly recorded transfer and resulting derived balance must be

reflected when the user views the relevant account information. If the destination account is

also visited, the same requirement applies to it once viewed.

**\*\*Failure:\*\***

\- \`404\` — source or destination account not found, or either resolves to \`SYS-CASH\`.

\- \`422\` (\`InvalidTransferException\`) — identical source and destination.

\- \`422\` (\`AccountNotEligibleForTransactionException\`) — source or destination is \`FROZEN\` or

  \`CLOSED\`.

\- \`422\` (\`InsufficientFundsException\`) — source balance insufficient.

\- \`400\` — invalid amount or invalid account identifiers.

**## 9.4 Cross-Cutting Requirement**

None of these three workflows may imply that the account balance is a field being directly

edited. All success messaging should reinforce that a new transaction/event was recorded and the

balance is derived from it — consistent with \`DESIGN.md\` §28.2 and the product vision (Section

2\).

\---

**# 10. Transactions**

Backed by \`GET /accounts/{accountId}/audit/transactions\`.

**## 10.1 Data Contract**

\`AccountTransactionResponse\` fields: \`transactionId\`, \`referenceNumber\`, \`transactionType\`

(\`DEPOSIT\`, \`WITHDRAWAL\`, \`TRANSFER\`), \`status\` (\`COMPLETED\`, \`PENDING\`, \`FAILED\`), \`createdAt\`.

The frontend must be able to represent all three \`status\` values, since they are all valid

\`TransactionStatus\` enum values. In the current backend v1.0.0 implementation, every persisted

transaction is created with \`status = COMPLETED\` (a failed operation rolls back entirely rather

than persisting a \`FAILED\` or \`PENDING\` row) — \`PENDING\` and \`FAILED\` should be treated as

defensive, not actively exercised, states in v1.0.

**\*\*This response does not include an amount field.\*\*** The Transactions table must not display or

fabricate an amount column; amounts are only available through the Ledger view (Section 11),

which is the correct place to inspect the monetary effect of a transaction. This is an

intentional backend design decision (\`DESIGN.md\` §12.2), not an omission to work around.

**## 10.2 Table Columns**

Per \`DESIGN.md\` §12.2: **\*\*Date | Reference # | Type | Status | Actions\*\***.

**## 10.3 Ordering, Pagination**

\- Ordering is **\*\*event-derived\*\*** (first-occurrence order in the account's canonical event

  timeline), not independently sortable — the backend does not expose a \`sortBy\`/\`direction\`

  parameter for this endpoint, and the frontend must not offer one.

\- **\*\*Pagination:\*\*** \`page\`, \`size\` only, with standard \`PagedResponse\<T>\` metadata.

\- **\*\*No filtering parameters\*\*** are supported by this endpoint; none may be offered.

**## 10.4 Transaction Detail**

A "View Details" row action (per \`DESIGN.md\` §12.2 example) may open a detail view for a single

transaction, but this detail view is necessarily \*\*assembled from data already available

through this account's own paginated views\*\*, most usefully by cross-referencing the

transaction's \`referenceNumber\` against the account's Ledger entries (Section 11) that share

that reference number. There is no dedicated single-transaction retrieval endpoint. Full cross-account

double-entry detail (e.g. seeing the counterparty leg of a transfer) is **\*\*not obtainable\*\*** from

any account-scoped endpoint and must not be fabricated (see Section 20).

**## 10.5 States**

Standard loading/empty/error states (Section 16). An account with no transactions (e.g.

immediately after creation) must show a clear empty state rather than an empty table with no

explanation.

\---

**# 11. Ledger**

Backed by \`GET /accounts/{accountId}/audit/ledger\`.

**## 11.1 Data Contract**

\`AccountLedgerEntryResponse\` fields: \`ledgerEntryId\`, \`transactionId\`, \`referenceNumber\`,

\`entryType\` (\`DEBIT\`, \`CREDIT\`), \`amount\`, \`createdAt\`.

**## 11.2 Table Columns**

Per \`DESIGN.md\` §12.3: **\*\*Date | Reference # | Entry Type | Debit (₹) | Credit (₹)\*\***.

**## 11.3 Accounting Semantics (Hard Requirement)**

\- \`DEBIT\` and \`CREDIT\` are neutral accounting entries, not success/failure signals. Both columns

  use neutral financial typography (\`--color-ink\`); neither is colored red or green

  (\`DESIGN.md\` §2.4, §12.3, §29 "Don't color Debit columns red or Credit columns green").

\- Amounts use tabular/monospace numerical typography (\`DESIGN.md\` §2.3, §4.1).

**## 11.4 Pagination, Sorting, Filtering**

\- **\*\*Pagination:\*\*** \`page\`, \`size\`.

\- **\*\*Sorting:\*\*** \`sortBy\` restricted to \`createdAt\` only; \`direction\` \`asc\`/\`desc\`.

\- **\*\*Filtering:\*\*** optional \`entryType\` filter (\`CREDIT\` or \`DEBIT\`), applied server-side before

  pagination. No other filter may be offered.

**## 11.5 States**

Standard loading/empty/error states. An account with no ledger activity shows a clear empty

state.

\---

**# 12. Events**

Backed by \`GET /accounts/{accountId}/audit/events\`.

**## 12.1 Data Contract**

\`AccountEventResponse\` fields: \`eventId\`, \`eventType\` (\`ACCOUNT_CREATED\`, \`DEPOSIT\`,

\`WITHDRAWAL\`, \`TRANSFER_DEBIT\`, \`TRANSFER_CREDIT\`), \`transactionId\` (nullable —

\`null\` for \`ACCOUNT_CREATED\`), \`payload\` (nullable, opaque), \`occurredAt\`.

**## 12.2 Table Columns**

Per \`DESIGN.md\` §12.4: **\*\*Occurred At | Event Type | Event ID | Transaction ID\*\***.

**## 12.3 Product Requirement: Immutability Communication**

The Events view exists specifically to communicate that these are permanent, unchangeable

historical facts (\`DESIGN.md\` §2.7, §14). The frontend must:

\- Never present edit, delete, or "correct" affordances on any event.

\- Never imply an event stores or carries a resulting/running balance — an event's \`payload\`

  field is opaque metadata, not a balance. Any balance-related interpretation of an event belongs

  exclusively to the Audit Trail view (Section 13), which explicitly derives it.

**## 12.4 Pagination, Sorting, Filtering**

\- **\*\*Pagination:\*\*** \`page\`, \`size\`.

\- **\*\*Sorting:\*\*** \`sortBy\` restricted to \`occurredAt\` only; \`direction\` \`asc\`/\`desc\`. Note that this

  sort affects presentation only — it never alters the account's canonical replay order used

  internally for balance reconstruction (\`API_GUIDELINES.md\` §12, "Presentation Sorting vs.

  Canonical History").

\- **\*\*No \`eventType\` filter\*\*** is supported — the backend deliberately preserves a complete,

  unbroken event timeline (\`API_GUIDELINES.md\` §13, \`ARCHITECTURE.md\` §18). The frontend must not

  offer an event-type filter control.

**## 12.5 Event Detail**

An event detail panel (\`DESIGN.md\` §14) may show the full record for a single event: ID, type,

occurred timestamp (both raw ISO-8601 UTC and a formatted local time), associated transaction

ID/reference (if applicable), account ID, and payload. It must not display a balance field.

\---

**# 13. Audit Trail**

This is the frontend's central differentiating experience, directly expressing the product

vision (Section 2) and DESIGN.md's core wireframe (\`DESIGN.md\` §13):

$$\text{Events} \longrightarrow \text{Ledger Entries} \longrightarrow \text{Reconstruction} \longrightarrow \text{Balance}$$

Backed by \`GET /accounts/{accountId}/audit/trail\`.

**## 13.1 Data Contract**

\`AuditTrailResponse\`: \`accountId\`, \`finalBalance\`, \`asOf\` (\`null\` unless a historical query was

made), \`items\` (list of \`AuditTrailItemResponse\`), plus pagination metadata (\`page\`, \`size\`,

\`totalPages\`, \`totalElements\`).

\`AuditTrailItemResponse\`: \`eventId\`, \`eventType\`, \`transactionId\` (nullable), \`referenceNumber\`

(nullable), \`balanceChange\`, \`runningBalance\`, \`occurredAt\`.

**## 13.2 Required Distinctions**

The frontend must preserve — never blur — the following four concepts, each visually and

textually distinct:

1\. **\*\*Immutable events\*\*** — what happened and when (\`eventType\`, \`occurredAt\`).

2\. **\*\*Ledger entries\*\*** — the accounting effect behind a monetary event (surfaced here as

   \`balanceChange\`, which the backend derives from ledger entries, never from \`eventType\`

   alone — \`ARCHITECTURE.md\` §17 Decision 1).

3\. **\*\*Reconstructed balance\*\*** — the account's derived state at a point in the sequence.

4\. **\*\*Running balance\*\*** — the cumulative, absolute value carried forward item by item

   (\`runningBalance\`), distinct from any single item's delta (\`balanceChange\`).

**## 13.3 Timeline Presentation**

Per \`DESIGN.md\` §13: a vertical timeline with a marker per item, each showing timestamp, event

type, reference number (if any), the signed delta (\`balanceChange\`, with explicit \`+\`/\`-\` sign —

never color alone, \`DESIGN.md\` §28.1), and the cumulative \`runningBalance\`.

For a lifecycle item (\`ACCOUNT_CREATED\`): \`balanceChange = 0.00\` and \`runningBalance\` is

unchanged from the prior value (\`0.00\` at inception) — this must render as an explicit zero, not

be hidden or treated as a null/empty state.

**## 13.4 Pagination Behavior — Reconstruction Precedes Slicing (Hard Requirement)**

This is a specific, non-negotiable backend behavior (\`API_GUIDELINES.md\` §21 "Get Account Audit

Trail", \`ARCHITECTURE.md\` §18, \`ADR-029\`) that the frontend must represent faithfully rather than

reinterpret:

\- The **\*\*complete\*\*** event history (up to \`asOf\`, if provided) is replayed and running balances

  are computed **\*\*before\*\*** any page slicing occurs.

\- \`finalBalance\` always reflects the **\*\*complete\*\*** reconstructed history — it is **\*\*not\*\***

  recalculated per page and does not change as the user pages through \`items\`.

\- Running balances shown in \`items\` are **\*\*absolute\*\***, account-inception-relative values — never

  relative to the start of the currently displayed page.

\- An out-of-range page request returns HTTP 200 with an empty \`items\` array while \`finalBalance\`,

  \`totalPages\`, and \`totalElements\` remain accurate — the frontend must render this as a valid

  empty page (Section 16), not as an error.

\- The frontend must **\*\*not\*\*** attempt to sort or filter the audit trail — the backend does not

  support arbitrary sorting/filtering here, by design, to protect chronological accounting

  integrity.

The frontend's job is to make this comprehensible to the user (e.g., prominently displaying

\`finalBalance\` as a stable summary figure independent of the currently viewed page), not to

recompute or second-guess any of it client-side.

\---

**# 14. Historical / As-Of Balance**

Two endpoints support this, and the frontend must use exactly the semantics they document:

\- \`GET /accounts/{accountId}/audit/balance?asOf={timestamp}\` — a single reconstructed balance

  figure at a point in time.

\- \`GET /accounts/{accountId}/audit/trail?asOf={timestamp}\` — the full event-by-event

  explanation bounded by that same timestamp (Section 13).

**## 14.1 What the User Can Request**

A single \`asOf\` boundary: an ISO-8601 timestamp. The frontend must accept a date/time input from

the user and serialize it to a valid ISO-8601 string before calling either endpoint.

**## 14.2 Boundary Semantics (Must Be Represented Accurately)**

For \`GET /accounts/{accountId}/audit/balance?asOf=\`, the boundary is explicitly documented as

**\*\*inclusive\*\***: \`API_GUIDELINES.md\` §21 states reconstruction "includes all events where

\`occurredAt <= asOf\`," consistent with \`ADR-027\` Decision 7. If no events exist at or before the

requested timestamp, the reconstructed balance is \`0.00\`.

For \`GET /accounts/{accountId}/audit/trail?asOf=\`, the current backend implementation uses
the same inclusive event boundary: \`occurredAt <= asOf\`. The audit-trail reconstruction and
the balance reconstruction both use \`findByAccountIdAndOccurredAtLessThanEqualOrderByOccurredAtAscIdAsc\`.
Therefore, events at the exact \`asOf\` timestamp are included in both reconstructions, and both
endpoints use the same deterministic event ordering.

**\*\*Same-timestamp behavior:\*\*** the \`asOf\` boundary is timestamp-only. When one or more events share

an \`occurredAt\` exactly equal to the requested \`asOf\`, they are included or excluded \*\*as a

group\*\* by that timestamp comparison — there is no event-ID-aware sub-timestamp boundary. The

deterministic \`id ASC\` tie-breaker (\`ADR-023\`) governs only the *\*sequencing\** of events already

included in the reconstruction, never which events are admitted at the boundary. The frontend

must not imply that a user can select or exclude an individual event among several sharing the

exact \`asOf\` timestamp.

All timestamps are stored and computed in UTC; the frontend converts to local time only for

display (\`API_GUIDELINES.md\` §16), while the underlying query still uses the UTC-normalized

value the user selected.

**## 14.3 Presentation**

Per \`DESIGN.md\` §23: a labeled "Reconstruct Balance As Of" control, a clearly displayed

reconstructed balance result, and copy that explicitly communicates the value is derived from

historical event replay — not looked up from a stored table. Omitting the \`asOf\` parameter

returns the *\*current\** reconstructed balance with \`asOf = null\` in the response; the frontend

should treat this as the default/un-set state of the historical control.

\`AuditBalanceResponse\` (the response for \`.../audit/balance\`) carries no event count, so a

standalone historical-balance panel sourced only from that endpoint must not fabricate or

request an event count solely to annotate the result. Where the user reaches an \`asOf\`

reconstruction through the Audit Trail view instead (Section 13), that view's response already

carries \`totalElements\` for the same history — in that context only, the frontend may

communicate the number of historical events represented, without any additional backend

request.

**## 14.4 What Is Not Supported**

There is no backend capability for a *\*range\** query (e.g. "balance between two dates") or for

comparing two \`asOf\` balances server-side. If a range or comparison view is desired, it is

Future Scope (Section 21), not v1.0.

\---

**# 15. Pagination, Filtering, and Sorting**

This section consolidates the capability matrix already detailed per-view in Sections 6, 10, 11,

12, and 13, so the constraint is visible in one place.

\| Endpoint | Paginated | Sortable Fields | Filterable Fields |

\|---|---|---|---|

\| \`GET /accounts\` | Yes | \`createdAt\` (default), \`accountName\`, \`accountNumber\` | \`status\`, \`accountType\` |

\| \`GET /audit/events\` | Yes | \`occurredAt\` (default) | *\*none\** |

\| \`GET /audit/transactions\` | Yes | *\*none — event-derived order only\** | *\*none\** |

\| \`GET /audit/ledger\` | Yes | \`createdAt\` (default) | \`entryType\` |

\| \`GET /audit/trail\` | Yes | *\*none — canonical order only\** | *\*none\** |

**\*\*Common rules across every paginated view:\*\***

\- Default \`page = 0\`, default \`size = 20\`, maximum \`size = 100\`.

\- The frontend must expose \`page\`/\`size\` controls and the standard \`PagedResponse\<T>\` metadata

  (\`totalPages\`, \`totalElements\`) wherever a \`PagedResponse\<T>\` is returned; the Audit Trail uses

  its own specialized response but the same page/size controls apply.

\- Sort and filter controls are limited to **\*\*exactly\*\*** the fields in the table above — never more.

\- Requesting an out-of-range page returns HTTP 200 with an empty content/items array and correct

  metadata (not an error) — see Section 16.

\- An invalid page/size (\`page < 0\`, \`size < 1\`, \`size > 100\`) or invalid sort field/direction is

  a client-correctable \`400\` error (\`InvalidPageParameterException\` /

  \`InvalidSortFieldException\`) and should be prevented client-side wherever practical (e.g. by

  only exposing valid controls), with a graceful fallback if it occurs anyway.

\---

**# 16. Loading, Empty, and Error States**

Every data-driven view in this document must define behavior for the following states,

consistent with the standard \`ApiError\` shape (\`timestamp\`, \`status\`, \`error\`, \`message\`, \`path\`)

returned by the backend (\`API_GUIDELINES.md\` §10):

\- **\*\*Initial loading\*\*** — a visible loading indicator while the first page of data is fetched.

\- **\*\*Table/list loading\*\*** — a loading indicator scoped to the table region when paging, sorting,

  or filtering (not a full-page reload).

\- **\*\*Mutation in progress\*\*** — the triggering action (button) reflects a busy/disabled state while

  a create/lifecycle/monetary request is in flight, preventing duplicate submission.

\- **\*\*Empty collection\*\*** — a clear, specific "no data" message appropriate to the view (e.g. "No

  transactions yet" vs. "No accounts match these filters"), distinct from an error.

\- **\*\*Resource not found (\`404\`)\*\*** — a specific not-found state (e.g. account lookup, deep link to

  a missing account), not a generic error screen.

\- **\*\*Validation error (\`400\`)\*\*** — inline, field-level feedback wherever the error originates from

  user input; a general message otherwise.

\- **\*\*Business rule rejection (\`422\`)\*\*** — the specific \`message\` from \`ApiError\` surfaced clearly

  (e.g. insufficient funds, ineligible account status, invalid transfer, unbalanced/invalid

  ledger conditions) — never presented as a generic failure.

\- **\*\*Duplicate conflict (\`409\`)\*\*** — specific to account creation (duplicate account number).

\- **\*\*Server error (\`500\`)\*\*** — a generic, non-technical failure message; the backend's \`ApiError\`

  contract guarantees no stack traces or internal details are ever present to show (or hide).

\- **\*\*Network failure\*\*** — distinguishable from a server error, with a retry affordance where

  appropriate.

\- **\*\*Successful mutation\*\*** — explicit, visible confirmation for every create/lifecycle/monetary

  action (Sections 6.2, 8.3, 9).

\---

**# 17. Responsive Requirements**

Per \`DESIGN.md\` §26, the same product experience adapts across breakpoints; there is no separate

mobile product:

\- **\*\*Mobile (\`<640px\`):\*\*** single column, stacked cards, top bar navigation drawer, tables scroll

  horizontally rather than truncating or shrinking financial values.

\- **\*\*Tablet (\`640–1024px\`):\*\*** compressed sidebar, two-column card layouts, compact tables.

\- **\*\*Desktop (\`1024–1280px\`):\*\*** full application shell (sidebar + main content) with full tables.

\- **\*\*Wide (\`>1280px\`):\*\*** content capped at the 1200px max width defined in \`DESIGN.md\` §6.1.

**\*\*Dense financial tables\*\*** (Ledger, Transactions, Events, Audit Trail) must never truncate,

abbreviate, or reduce precision of a financial value to fit a smaller viewport. Per \`DESIGN.md\`

§26: horizontally-scrollable containers, a sticky header row, and a sticky primary column (date

or identifier) during horizontal scroll.

\---

**# 18. Accessibility Requirements**

Per \`DESIGN.md\` §27, all of the following are hard requirements, not aspirational goals:

\- **\*\*WCAG AA contrast\*\*** on all readable text (the color tokens in \`DESIGN.md\` §3 are already

  selected to satisfy this — the frontend must use them as specified, not substitute

  lower-contrast alternatives).

\- **\*\*Color-independent meaning:\*\*** transaction direction (\`+\`/\`-\` sign, Section 13.3), account

  status (always paired with a text label, Section 8 / \`DESIGN.md\` §10.2), and validation states

  always carry explicit text/iconography alongside color.

\- **\*\*Full keyboard operability:\*\*** all buttons, tabs, inputs, and modals operable via \`Tab\`,

  \`Enter\`, \`Space\`, and \`Escape\`.

\- **\*\*Visible focus indicators:\*\*** a \`2px solid\` primary-color focus ring with offset, on every

  interactive element.

\- **\*\*Semantic HTML:\*\*** native \`\<button>\`, \`\<input>\`, \`\<dialog>\`, and proper \`\<table>\` markup

  (\`\<th>\`, \`\<td>\`, \`\<caption>\`) for all data tables.

\- **\*\*Accessible dialogs:\*\*** modal dialogs (deposit, withdrawal, transfer, close-account

  confirmation, etc.) trap keyboard focus and close on \`Escape\`, per \`DESIGN.md\` §16.

\- **\*\*Accessible feedback:\*\*** toasts/alerts (\`DESIGN.md\` §17) must be perceivable by assistive

  technology, not conveyed by color/position alone.

\---

**# 19. User Experience Principles**

The following principles from \`DESIGN.md\` §2 govern every requirement in this document and are

restated here at the product level (not duplicated as a design spec — see \`DESIGN.md\` for the

full system):

\- **\*\*Data first\*\*** — financial data (balances, amounts, timestamps, identifiers) receives stronger

  visual priority than decorative chrome, in every view this PRD defines.

\- **\*\*Blue is the action color\*\*** — reserved for primary actions, active navigation, and

  interactive states; never a decorative fill.

\- **\*\*Numbers are first-class UI\*\*** — every balance, amount, count, and technical identifier

  (reference numbers, account numbers, UUIDs) this PRD specifies must render in the tabular

  numerical typeface.

\- **\*\*Accounting semantics are distinct from operational status\*\*** — reiterated as a hard

  requirement in Section 11.3; debits and credits are never colored as good/bad, while

  operational states (\`COMPLETED\`/\`PENDING\`/\`FAILED\`, account status) do use semantic color.

\- **\*\*Calm hierarchy\*\*** — size, whitespace, and alignment establish structure before heavy font

  weight, across dashboard, list, and detail views alike.

\- **\*\*Minimal depth\*\*** — flat surfaces with hairline borders; elevation reserved for modals/popovers

  only (Sections 9 and 8.3 confirmation modals).

\- **\*\*History must feel immutable\*\*** — no edit/delete affordance is ever offered on an event, ledger

  entry, or completed transaction (Sections 11, 12, 13).

\---

**# 20. Frontend v1.0 Non-Goals**

The following are explicitly **\*\*not\*\*** part of frontend v1.0, because the backend does not support

them:

\- **\*\*Authentication and session management\*\*** — deferred per \`ADR-011\`; the backend has no login,

  token, or session concept (\`TRD.md\` §16).

\- **\*\*Role-Based Authorization (RBAC) / user management\*\*** — no user or role concept exists in the

  backend; Section 3 already reflects this by not offering role-gated views.

\- **\*\*A global transaction, ledger, or event explorer\*\*** (i.e. system-wide, not account-scoped) —

  the backend exposes only account-scoped audit endpoints; a global explorer requires backend

  endpoints that do not exist (\`DESIGN.md\` §9.2, §22).

\- **\*\*System-wide statistics/metrics\*\*** (total volume, total transactions, total money held) — no

  \`/stats\` or \`/metrics\` endpoint exists (Section 5.4).

\- **\*\*Cross-account/full double-entry transaction detail\*\*** (e.g. viewing both legs of a transfer,

  including the counterparty account's ledger entry, from a single view) — no endpoint returns a

  transaction's full ledger-entry set across accounts; each ledger/audit endpoint is scoped to

  one account (Section 10.4).

\- **\*\*Cryptocurrency, wallet, or blockchain functionality\*\*** — not part of the domain (\`PRD.md\` §9,

  Out of Scope).

\- **\*\*Payment-provider or external banking integrations\*\*** — not part of the domain (\`PRD.md\` §9).

\- **\*\*Real-time/streaming updates\*\*** (WebSockets, server push) — the backend exposes only

  synchronous REST endpoints; any "live" feel must come from explicit user-triggered refreshes

  (Section 9's post-mutation refresh behavior), not a push mechanism.

\- **\*\*Idempotency-key-driven request deduplication\*\*** — the backend has not yet implemented

  idempotency keys (\`API_GUIDELINES.md\` §15 marks this as a future version); the frontend cannot

  rely on one.

\- **\*\*Multi-currency support\*\*** — the backend is single-currency (\`DECISIONS.md\` \`ADR-020\`).

\- **\*\*Bulk operations, exports, or reporting\*\*** — no such backend endpoints exist (\`API_GUIDELINES.md\`

  §22, Future Enhancements).

\---

**# 21. Future Scope**

The following are recognized as plausible future directions but are \*\*explicitly excluded from

v1.0\*\* and must not be treated as implicit requirements. They are listed here only because they

are already named in the project's own roadmap and design documents, pending future backend

capability:

\- JWT authentication and role-based authorization (\`PROJECT_ROADMAP.md\` §7)

\- A global transaction/ledger explorer and richer transaction visualization

  (\`PROJECT_ROADMAP.md\` §7; \`DESIGN.md\` §22 "Future Milestones")

\- System-wide dashboard metrics (total transaction volume, global recent-activity feed) once a

  backend aggregation endpoint exists (\`DESIGN.md\` §22)

\- Multi-currency ledger support and exchange-rate handling (\`PRD.md\` §11, \`ADR-020\`)

\- Idempotency-key-based request submission once the backend implements it

  (\`API_GUIDELINES.md\` §15)

\- Any UI implications of backend-side CQRS, event streaming, or snapshotting, should those be

  adopted (\`ARCHITECTURE.md\` §19, \`PROJECT_ROADMAP.md\` §7) — these are backend-internal

  performance concerns and should have no v1.0 frontend impact regardless

\---

**# 22. Acceptance Criteria**

Frontend v1.0 is considered to meet this PRD when the following are demonstrably true:

1\. Every view in this document is backed by a real, documented backend endpoint, and no view

   displays a field, filter, sort option, or action that endpoint does not support.

2\. A user can create an account, look it up by number or ID, and see it reflected in the account

   list without inconsistency.

3\. A user can deposit into, withdraw from, and transfer between eligible (\`ACTIVE\`) accounts, and

   the resulting transaction, ledger entries, events, and updated balance are all visible through

   their respective views after the operation completes.

4\. A user cannot perform a monetary or lifecycle operation the backend would reject

   (\`FROZEN\`/\`CLOSED\` ineligibility, insufficient funds, same-account transfer, duplicate account

   number) without receiving a clear, specific explanation — never a generic failure message —

   for every one of these cases.

5\. The Account List never displays a balance; the Account Overview's balance is always presented

   as reconstructed, sourced from the audit balance endpoint.

6\. The Transactions view never displays or implies an amount field.

7\. The Ledger view displays Debit and Credit with neutral typography, never red/green semantic

   coloring.

8\. The Events view never offers edit/delete affordances and never implies an event stores a

   balance.

9\. The Audit Trail view correctly reflects that \`finalBalance\` and all \`runningBalance\` values

   are computed from the complete history before pagination, and remains stable and correct

   across every page, including out-of-range pages.

10\. Historical (\`asOf\`) balance and audit trail queries correctly communicate the inclusive

    boundary semantics and clearly label results as reconstructed-as-of a point in time.

11\. Every collection view's pagination, sorting, and filtering controls are limited exactly to

    the fields enumerated in Section 15 — no additional controls are present.

12\. Every data-driven view has defined, distinguishable loading, empty, and error behavior per

    Section 16.

13\. The application is fully usable at each breakpoint defined in Section 17 without loss of

    financial-value precision or legibility.

14\. The application satisfies every accessibility requirement in Section 18 (contrast,

    color-independent meaning, keyboard operability, focus visibility, semantic markup,

    accessible dialogs and feedback).

15\. No view, action, or piece of copy in the frontend references a capability listed in Section

    20 (Non-Goals) as though it exists today.

16\. All visual treatment (color, typography, spacing, radius, elevation, component structure)

    conforms to \`DESIGN.md\` as written, with no ad-hoc deviation.

\---

\*This document defines product requirements only. Frontend architecture, technology choices,

component design, and implementation details are deferred to a future \`FRONTEND_TRD.md\` and

\`FRONTEND_ARCHITECTURE.md\`.\*