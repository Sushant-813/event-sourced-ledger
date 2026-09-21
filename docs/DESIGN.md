---
version: 1.1
name: Event Sourced Ledger Design System
description: >
  Institutional-grade financial application design language for the Event Sourced Ledger.
  Derived from the selected Coinbase visual direction, but deliberately adapted for a
  data-dense, event-sourced double-entry ledger, audit, account, and transaction management
  console. The system emphasizes financial correctness, institutional trust, restrained use
  of blue, strict separation of accounting and error semantics, strong numerical typography,
  structured tables, clear state feedback, and minimal visual noise.

design_source:
  primary_reference: Coinbase DESIGN.md
  adaptation_policy:
    - Preserve the reference system's calm institutional character.
    - Preserve its restrained blue action color, numerical typography, pill actions, and generous hierarchy.
    - Adapt marketing-oriented patterns into dense application-oriented patterns.
    - Do not reproduce Coinbase branding, copy, logos, or crypto-specific UI.
    - Model event sourcing, double-entry ledger, accounts, transactions, audit trails, and derived balances.
---

# Event Sourced Ledger — Design System

## 1. Design Intent

The Event Sourced Ledger frontend is an institutional financial application, not a consumer banking app or marketing website.

Its visual language communicates:

- **Trust** — the interface feels stable, deliberate, and authoritative.
- **Precision** — financial values, timestamps, event sequences, and ledger allocations are immediately scannable.
- **Traceability** — users clearly understand that balances are derived from historical records.
- **Restraint** — functional content takes precedence over decorative styling.
- **Hierarchy** — primary operational actions and accounting records are cleanly differentiated.
- **Consistency** — uniform visual rules apply across accounts, transactions, ledger entries, events, and audit trails.

The central product idea is:

> **A balance is the result of financial history.**

The interface makes event history, ledger entries, balance reconstruction, and current account state equally understandable.

### Design Character

The visual character is:

- institutional
- financial
- minimal
- data-first
- calm
- precise
- modern
- responsive

It feels like a professional financial operations console.

---

# 2. Design Principles

## 2.1 Data First

Financial data is the primary visual content.

Tables, balances, ledger allocations, timestamps, account identifiers, and event chronologies receive stronger visual hierarchy than decorative containers.

## 2.2 Blue Is an Action Color

The primary blue is intentionally scarce.

Use it for:

- primary actions
- active navigation
- focused controls
- text links
- key interactive states

Do not use blue as a generic page background or decorative filler.

## 2.3 Numbers Are First-Class UI

Financial numbers use a dedicated monospace/tabular numerical typeface.

Use tabular numerals for:

- current and historical balances
- transaction amounts
- debit amounts
- credit amounts
- running balances
- transaction counts
- event counts
- pagination counts
- technical identifiers (UUIDs, reference numbers, account numbers)

## 2.4 Accounting Semantics vs. Operational Status

The visual system strictly decouples **accounting entry types** from **operational statuses and errors**:

### Accounting Entry Types (`DEBIT` and `CREDIT`)
- In double-entry bookkeeping, debits and credits are neutral accounting entries, not errors or failures.
- In ledger tables and detail views, `DEBIT` and `CREDIT` entries use **neutral financial typography** (`--color-ink` or `--color-body`).
- A debit is **never** colored red simply because it is a debit.
- A credit is **never** colored green simply because it is a credit.

### Operational Statuses
Semantic colors communicate the outcome of an operation:
- **COMPLETED / Success:** Green accent (`--color-positive-text`, `--surface-success-soft`)
- **PENDING / In Progress:** Amber accent (`--color-warning`, `--surface-warning-soft`)
- **FAILED / Error:** Red accent (`--color-negative`, `--surface-error-soft`)
- **FROZEN (Account):** Amber accent (`--color-warning`)
- **CLOSED (Account):** Neutral/muted accent (`--color-muted`)

### Directional Financial Movement (Activity Feeds & Audit Trail)
- Explicit signed positive deltas (`+₹10,000.00`) may use positive green emphasis.
- Explicit signed negative deltas (`-₹2,500.00`) use neutral typography or restrained negative text, but are clearly distinct from system errors.
- A normal withdrawal is a routine financial operation, **not** a destructive UI action.

## 2.5 Calm Hierarchy

Display typography remains light and restrained.

Use size, whitespace, contrast, and alignment to establish visual hierarchy before resorting to heavy font weights.

## 2.6 Minimal Depth

Most surfaces are flat.

Depth is achieved through:

1. whitespace
2. 1px hairlines
3. surface contrast
4. restrained modal/popover elevation

Avoid multi-layered drop shadows.

## 2.7 History Must Feel Immutable

Event, transaction, and ledger history visually communicates that it is permanent recorded history.

Avoid UI affordances (edit buttons, pencil icons, delete actions) that imply historical records can be directly modified.

---

# 3. Color System

## 3.1 Brand & Action

| Token | Value | Usage |
|---|---|---|
| `primary` | `#0052ff` | Primary actions, active links, focus indicators, active tab accents |
| `primary-active` | `#003ecc` | Pressed/active primary action |
| `primary-disabled` | `#a8b8cc` | Disabled primary action |
| `primary-soft` | `#e8efff` | Selected navigation items and subtle active surfaces |

The institutional blue provides a strong interactive accent without visually overwhelming data tables.

## 3.2 Text

All text tokens meet WCAG AA contrast standards (minimum 4.5:1 on white canvas) for their intended usage.

| Token | Value | Contrast on White | Usage |
|---|---|---:|---|
| `ink` | `#0a0b0d` | 18.8:1 | Primary headings, primary balances, important labels |
| `body` | `#404550` | 8.2:1 | Standard body text, descriptions, table cell text |
| `body-strong` | `#0a0b0d` | 18.8:1 | Emphasized body text |
| `muted` | `#595e68` | 5.1:1 | Secondary metadata, labels, timestamps, pagination info (WCAG AA compliant) |
| `muted-soft` | `#8c919a` | 3.1:1 | Disabled controls, inactive borders, placeholder text (not for readable body text) |

## 3.3 Surfaces

| Token | Value | Usage |
|---|---|---|
| `canvas` | `#ffffff` | Main application background |
| `surface-soft` | `#f7f8fa` | Page sections, table headers, sidebar, subtle grouping |
| `surface-card` | `#ffffff` | Cards, panels, modals |
| `surface-strong` | `#eef0f3` | Secondary buttons, control containers, input backgrounds |
| `surface-dark` | `#0a0b0d` | Featured dark panels |
| `surface-dark-elevated` | `#16181c` | Elevated dark panels |
| `surface-success-soft` | `#ecfdf5` | Positive badges, success alert backgrounds |
| `surface-error-soft` | `#fef2f2` | Error badges, validation alert backgrounds |
| `surface-warning-soft` | `#fffbeb` | Warning badges, pending status backgrounds |
| `surface-info-soft` | `#eff6ff` | Information badges, info alert backgrounds |

## 3.4 Borders

| Token | Value | Usage |
|---|---|---|
| `hairline` | `#dee1e6` | Standard 1px structural borders and card boundaries |
| `hairline-soft` | `#eef0f3` | Table row dividers and inner section separators |

## 3.5 Semantic States & Financial Indicators

| Token | Value | Contrast on White | Usage |
|---|---|---:|---|
| `color-positive-text` | `#047857` | 4.7:1 | Readable positive text, completed status text, positive deltas (WCAG AA) |
| `color-positive` | `#05b169` | 3.1:1 | Positive badge fills, non-text icons, chart elements |
| `color-negative` | `#cf202f` | 4.6:1 | Error messages, failed status text, destructive action buttons (WCAG AA) |
| `color-warning` | `#b77900` | 4.5:1 | Warning text, attention states, pending status text (WCAG AA) |
| `color-info` | `#0052ff` | 4.6:1 | Informational notices, link accents |
| `entry-neutral` | `#0a0b0d` | 18.8:1 | Standard ledger `DEBIT` and `CREDIT` values |

Semantic colors should be used as text/icon accents or inside neutralized soft-tint containers rather than raw vibrant backgrounds.

---

# 4. Typography

## 4.1 Font Strategy

### Display / UI Font
```text
Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
```

### Numerical / Monospace Font
```text
JetBrains Mono, "Geist Mono", Consolas, monospace
```

The numerical font is reserved for financial values, timestamps, and technical identifiers.

---

## 4.2 Typography Tokens

| Token | Size | Weight | Line Height | Usage |
|---|---:|---:|---:|---|
| `display-lg` | 32px | 400 | 1.15 | Page title, featured account balance |
| `title-lg` | 24px | 400 | 1.25 | Section and major panel title |
| `title-md` | 18px | 600 | 1.35 | Card and modal title |
| `title-sm` | 15px | 600 | 1.3 | Table and group header |
| `body-md` | 15px | 400 | 1.5 | Default body text |
| `body-strong` | 15px | 600 | 1.5 | Emphasized body text |
| `body-sm` | 14px | 400 | 1.5 | Secondary body, metadata |
| `caption` | 13px | 400 | 1.45 | Helper text, timestamps, technical IDs |
| `caption-strong` | 12px | 600 | 1.4 | Badges, table column labels |
| `number-display` | 15px | 500 | 1.4 | Table amounts, debit/credit values, ledger figures |
| `number-large` | 24px | 500 | 1.2 | Card balances |
| `number-xl` | 32px | 500 | 1.15 | Featured account balance heading |
| `button` | 14px | 600 | 1.15 | Action button labels |
| `nav-link` | 14px | 500 | 1.4 | Navigation items |

### Typography Rules

- Headings use weight `400` to maintain a calm, light visual weight.
- Financial numbers always use the numerical monospace font.
- Body text never uses negative letter spacing.
- Dense tables prioritize legibility over styling.

---

# 5. Spacing

Base unit: **4px**.

| Token | Value | Application Usage |
|---|---:|---|
| `xxs` | 4px | Micro padding, icon gaps |
| `xs` | 8px | Badge padding, compact row gaps |
| `sm` | 12px | Dense control gaps, table cell vertical padding |
| `base` | 16px | Standard element spacing, card inner padding (mobile) |
| `md` | 20px | Input group spacing, modal internal padding |
| `lg` | 24px | Card padding, section gaps |
| `xl` | 32px | Major component separation |
| `xxl` | 48px | Page section rhythm |

Application pages maintain a dense, scannable rhythm (`24–48px`), avoiding oversized marketing spacing.

---

# 6. Layout

## 6.1 Application Shell

Desktop layout structure:

```text
┌──────────────────────────────────────────────────────────┐
│ Header / Top Bar                                         │
├───────────────┬──────────────────────────────────────────┤
│ Sidebar       │ Main Content                             │
│               │                                          │
│ Dashboard     │ Page Header                              │
│ Accounts      │ ──────────────────────────────────────── │
│               │ Content Area                             │
│               │                                          │
└───────────────┴──────────────────────────────────────────┘
```

### Sidebar
- Width: approximately 240px.
- Surface: `surface-card` with 1px right `hairline` border.
- Navigation items: compact (36px height).
- Active item uses `primary-soft` background with `primary` text and icon.

### Main Content
- Max content width: 1200px.
- Padding: 24–32px desktop, 16–20px tablet, 16px mobile.

## 6.2 Grid

- Dashboard: 12-column responsive layout (cards span 3, 4, or 6 columns).
- Account Detail: 12-column layout (8 columns for history/tables, 4 columns for details/actions).
- Mobile: Single column with stacked components.

---

# 7. Border Radius

| Token | Value | Usage |
|---|---:|---|
| `none` | 0px | Tables, flat containers |
| `xs` | 4px | Compact tags, code badges, identifier chips |
| `sm` | 8px | Dense buttons, input dropdowns |
| `md` | 12px | Text inputs, alerts, toasts |
| `lg` | 16px | Cards, panels, modal dialogs |
| `pill` | 100px | Primary/secondary buttons, status badges |
| `full` | 9999px | Circular icons, avatar marks |

Actions use pill geometry (`100px`). Structural surfaces and cards use disciplined rounded rectangles (`12–16px`).

---

# 8. Elevation

| Level | Treatment | Usage |
|---|---|---|
| `flat` | No shadow | Default background surfaces |
| `bordered` | 1px hairline border | Cards, tables, panels |
| `elevated` | `0 4px 16px rgba(0, 0, 0, 0.06)` | Modal dialogs, dropdown popovers, toasts |

---

# 9. Application Components

## 9.1 Top Bar

`app-topbar`
- Height: 60px.
- Surface: `canvas` with 1px bottom `hairline` divider.
- Left: System logo / application brand title ("Event Sourced Ledger").
- Right: Quick status, active environment indicator, or utility actions.

## 9.2 Sidebar Navigation

`app-sidebar`

Backend v1.0 is account-scoped. Primary top-level navigation consists of:
- **Dashboard** (`/dashboard`)
- **Accounts** (`/accounts`)

```text
┌─────────────────────────┐
│ [Ledger Icon] Dashboard │
│ [Bank Icon]   Accounts  │
└─────────────────────────┘
```

Active item: `background: var(--color-primary-soft); color: var(--color-primary); font-weight: 600;`

*Note:* Global explorers for all transactions or ledger entries are reserved for future milestones pending global query endpoints.

## 9.3 Buttons

### Primary Button (`button-primary`)
```css
background: var(--color-primary);
color: #ffffff;
height: 40px;
padding: 10px 20px;
border-radius: var(--radius-pill);
font-size: 14px;
font-weight: 600;
border: none;
```
Use for:
- Create Account
- Deposit
- Withdrawal
- Transfer
- Form submission

### Secondary Button (`button-secondary`)
```css
background: var(--surface-strong);
color: var(--color-ink);
height: 40px;
padding: 10px 18px;
border-radius: var(--radius-pill);
font-size: 14px;
font-weight: 600;
border: none;
```
Use for secondary actions, cancel buttons, and filter toggles.

### Destructive Button (`button-destructive`)
```css
background: var(--color-negative);
color: #ffffff;
height: 40px;
padding: 10px 20px;
border-radius: var(--radius-pill);
font-size: 14px;
font-weight: 600;
border: none;
```
**Strictly reserved for irreversible administrative actions**, such as closing an account.

*Rule:* Never use destructive styling for ordinary withdrawals or transfers. A withdrawal is a legitimate financial operation, not an error or destructive UI action.

### Tertiary / Text Button (`button-tertiary`)
```css
background: transparent;
color: var(--color-primary);
padding: 8px 12px;
font-size: 14px;
font-weight: 600;
border: none;
```
Use for inline actions ("View Account", "View Audit Trail", "Copy ID").

---

# 10. Account Components

## 10.1 Account Card

The design system explicitly distinguishes between **Account List Cards** and **Account Detail Cards** to avoid N+1 query patterns.

### A. Account List Card (or Row)
In `GET /accounts`, the backend returns `AccountResponse`, which contains metadata but **no balance**.
List cards display only metadata:
```text
┌────────────────────────────────────────┐
│ Alice Savings                   ACTIVE │
│ ACC-1001                     SAVINGS   │
│                                        │
│ Created: 12 Aug 2026                   │
│                                        │
│ [View Account →]                       │
└────────────────────────────────────────┘
```

*Rule:* Account listing views must not assume balances are bundled with `AccountResponse`. Displaying balances on an account list requires an explicit lazy-load strategy and skeleton state, but metadata-only views are the v1.0 standard.

### B. Account Detail / Overview Card
Used on the single account detail page where `GET /accounts/{accountId}/audit/balance` is fetched for that specific account:
```text
┌────────────────────────────────────────────────────────┐
│ Alice Savings                                   ACTIVE │
│ ACC-1001 • SAVINGS                                     │
│                                                        │
│ Current Reconstructed Balance                          │
│ ₹ 24,500.00                                            │
│                                                        │
│ [Deposit]   [Withdraw]   [Transfer]   [Manage Status]  │
└────────────────────────────────────────────────────────┘
```
Balance is rendered using `number-large` or `number-xl`.

## 10.2 Account Status Badge

`status-badge`

Supported account states:
- **ACTIVE:** Neutral green soft tint (`background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;`)
- **FROZEN:** Amber soft tint (`background: #fffbeb; color: #b77900; border: 1px solid #fde68a;`)
- **CLOSED:** Neutral muted tint (`background: #f7f8fa; color: #595e68; border: 1px solid #dee1e6;`)

*Rule:* Badges must always include the text label (`ACTIVE`, `FROZEN`, `CLOSED`). Never rely on color alone.

---

# 11. Financial Value Components

## 11.1 Reconstructed Balance Display

`balance-display`

```text
₹ 24,500.00
```
- Uses tabular numerical font (`JetBrains Mono`).
- Currency symbol (`₹`) is clearly separated from numerals.
- Always displays exactly two decimal places.

## 11.2 Directional Financial Movement

In activity feeds, transaction receipts, and audit trails:

- **Net Inflow / Credit Effect:**
  `+₹10,000.00`
  Uses `--color-positive-text` (`#047857`) with leading `+` sign.

- **Net Outflow / Debit Effect:**
  `-₹2,500.00`
  Uses `--color-ink` or restrained negative emphasis with leading `-` sign.

*Rule:* Meaning must never depend on color alone. Always include the explicit sign (`+` or `-`) and entry type label.

---

# 12. Tables

Tables are the central UI surface for the ledger application.

## 12.1 General Table Design

`data-table`
- Background: `surface-card`.
- Headers: `surface-soft`, 12px uppercase font (`caption-strong`), letter-spacing 0.5px, bottom hairline.
- Rows: 44–48px height, 1px bottom `hairline-soft` divider.
- Hover: subtle background tint (`#f9fafb`).
- Numerical columns are right-aligned and use `number-display`.
- Text columns are left-aligned.
- Status and identifier columns are centered or left-aligned as appropriate.

## 12.2 Transaction Table (Account Scoped)

Consumes `GET /accounts/{accountId}/audit/transactions` (`AccountTransactionResponse`).

*Contract Note:* `AccountTransactionResponse` contains transaction metadata (`transactionId`, `referenceNumber`, `transactionType`, `status`, `createdAt`), but does **not** contain an amount.

Columns:
```text
Date | Reference # | Type | Status | Actions
```

Example:
```text
21 Sep 2026 10:32   550e8400...   DEPOSIT    COMPLETED   [View Details]
21 Sep 2026 11:04   662f9511...   TRANSFER   COMPLETED   [View Details]
```

Amounts are inspected either in the **Ledger Table** or **Audit Trail**.

## 12.3 Ledger Table (Account Scoped)

Consumes `GET /accounts/{accountId}/audit/ledger` (`AccountLedgerEntryResponse`).

Shows the double-entry accounting records affecting this account.

Columns:
```text
Date | Reference # | Entry Type | Debit (₹) | Credit (₹)
```

Example:
```text
21 Sep 2026 10:32   TXN-001   CREDIT         —         10,000.00
21 Sep 2026 11:04   TXN-002   DEBIT       2,500.00         —
21 Sep 2026 14:15   TXN-003   DEBIT       1,500.00         —
```

*Financial Rule:* Debit and Credit columns are formatted with neutral numerical typography (`--color-ink`). Neither column is colored red or green.

## 12.4 Event Table (Account Scoped)

Consumes `GET /accounts/{accountId}/audit/events` (`AccountEventResponse`).

Columns:
```text
Occurred At | Event Type | Event ID | Transaction ID
```

Example:
```text
21 Sep 2026 10:00   ACCOUNT_CREATED   EVT-0010         —
21 Sep 2026 10:32   DEPOSIT           EVT-0020      TXN-100
21 Sep 2026 11:04   TRANSFER_DEBIT    EVT-0030      TXN-101
```

---

# 13. Audit Trail

The audit trail is the core differentiating component that visualizes:
$$\text{Events} \longrightarrow \text{Ledger Entries} \longrightarrow \text{Reconstruction} \longrightarrow \text{Balance}$$

`audit-trail`

Consumes `GET /accounts/{accountId}/audit/trail` (`AuditTrailResponse`).

### Mathematically Valid Chronological Wireframe

```text
● 21 Sep 2026 10:00
│ Account Created
│ 0.00
│ Running Balance: ₹0.00
│
● 21 Sep 2026 10:32
│ Deposit (TXN-001)
│ +₹10,000.00
│ Running Balance: ₹10,000.00
│
● 21 Sep 2026 11:04
│ Transfer to ACC-1002 (TXN-002)
│ -₹2,500.00
│ Running Balance: ₹7,500.00
│
● 21 Sep 2026 14:15
│ Withdrawal (TXN-003)
│ -₹1,500.00
│ Running Balance: ₹6,000.00
```

Visual treatment:
- Vertical 2px hairline connects timeline nodes.
- Circular marker (`8px`) sits on the timeline line.
- Each item shows: Timestamp, Event Type, Reference Number, Delta (`balanceChange`), and Cumulative `runningBalance`.
- *Rule:* The running balance is projected dynamically by historical reconstruction; it is not a stored column on the event entity.

---

# 14. Event Detail Panel

`event-detail-panel`

Displays the immutable facts recorded for a single event:
- Event ID (`EVT-0010`)
- Event Type (`ACCOUNT_CREATED`, `DEPOSIT`, `WITHDRAWAL`, `TRANSFER_DEBIT`, `TRANSFER_CREDIT`)
- Occurred Timestamp (ISO-8601 UTC and formatted local time)
- Associated Transaction ID / Reference Number (if applicable)
- Account ID
- Payload / Event metadata

*Explicit Principle:* An event does not store a balance. Resulting and running balances are derived properties of the audit-trail projection, not stored attributes of an event entity.

---

# 15. Transaction Detail Panel

`transaction-detail-panel`

Displays the complete double-entry transaction record:
- Transaction ID and Reference Number (UUID)
- Transaction Type (`DEPOSIT`, `WITHDRAWAL`, `TRANSFER`)
- Status (`COMPLETED`, `PENDING`, `FAILED`)
- Timestamp (`createdAt`)
- Associated Ledger Entries:
  - Account Number & Name
  - Entry Type (`DEBIT` or `CREDIT`)
  - Amount
- Associated Events generated by this transaction

---

# 16. Modal Dialogs

`modal-dialog`

Used for monetary workflows and administrative confirmations:
- Deposit
- Withdrawal
- Transfer
- Freeze Account Confirmation
- Close Account Confirmation

### Structure

```text
┌────────────────────────────────────────────────────────┐
│ Transfer Funds                                     [×] │
├────────────────────────────────────────────────────────┤
│ Source Account: Alice Savings (ACC-1001)               │
│                                                        │
│ Destination Account Number                             │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ACC-1002                                           │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ Amount                                                 │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ₹   1,000.00                                       │ │
│ └────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│ [Cancel]                                    [Transfer] │
└────────────────────────────────────────────────────────┘
```

- **Backdrop:** `rgba(10, 11, 13, 0.45)`, backdrop blur 2px.
- **Container:** `surface-card`, radius `radius-lg` (16px), elevation `elevated`.
- **Max Width:** 480px (forms), 400px (confirmations).
- **Header:** Title (`title-md`) with 1px bottom `hairline` divider.
- **Body:** 20–24px padding.
- **Action Footer:** Right-aligned secondary and primary buttons, with 1px top `hairline` divider.
- **Accessibility:** Traps keyboard focus, closes on `Escape` key.

---

# 17. Toast & Alert Notifications

`alert-banner` / `toast-notification`

Used for feedback following financial commands or network operations.

### States

| State | Background | Border | Text | Icon |
|---|---|---|---|---|
| **Success** | `var(--surface-success-soft)` (`#ecfdf5`) | `#a7f3d0` | `var(--color-positive-text)` (`#047857`) | Checkmark circle |
| **Error** | `var(--surface-error-soft)` (`#fef2f2`) | `#fecaca` | `var(--color-negative)` (`#cf202f`) | Alert circle |
| **Warning** | `var(--surface-warning-soft)` (`#fffbeb`) | `#fde68a` | `var(--color-warning)` (`#b77900`) | Warning triangle |
| **Info** | `var(--surface-info-soft)` (`#eff6ff`) | `#bfdbfe` | `var(--color-info)` (`#0052ff`) | Info circle |

- Never rely on background color alone: always include a distinctive icon, title, and clear text message.
- Toasts appear in the top-right corner, auto-dismissing after 5 seconds (errors remain until dismissed).

---

# 18. Account Sub-Navigation (Tabs)

`account-tabs`

Used on the Account View to switch between financial perspectives:

```text
┌──────────────────────────────────────────────────────────┐
│ Overview   Transactions   Ledger   Events   Audit Trail  │
└──────────────────────────────────────────────────────────┘
```

### Styling
- Display: flex, gap 8px.
- Height: 36px.
- Item text: `14px`, weight `500`.
- **Default:** `color: var(--color-body); background: transparent;`
- **Hover:** `color: var(--color-ink); background: var(--surface-soft);`
- **Active:** `color: var(--color-primary); background: var(--color-primary-soft); font-weight: 600; border-radius: var(--radius-sm);`
- **Focus:** `outline: 2px solid var(--color-primary);`

---

# 19. Technical Identifier Badge

`identifier-badge`

Technical identifiers (UUIDs, reference numbers, account numbers, event IDs) require a clean treatment that enables copying without cluttering tables.

```text
┌───────────────┐
│ TXN-0010   📋 │
└───────────────┘
```

- Typography: `JetBrains Mono`, 13px, weight `400`.
- Background: `var(--surface-soft)`.
- Border: 1px solid `var(--border-hairline)`.
- Radius: `var(--radius-xs)` (4px).
- Padding: 2px 8px.
- Copy button: subtle hover-activated copy icon.

---

# 20. Forms & Controls

## 20.1 Text & Number Input

`text-input`

```css
height: 44px;
padding: 10px 14px;
border-radius: var(--radius-md);
border: 1px solid var(--border-hairline);
background: var(--surface-card);
font-size: 15px;
color: var(--color-ink);
```

Focus state:
```css
border-color: var(--color-primary);
box-shadow: 0 0 0 3px var(--color-primary-soft);
outline: none;
```

## 20.2 Money Input

`money-input`

- Currency prefix (`₹`) locked on left in muted text.
- Numerical monospace font for digits.
- Right-aligned or left-aligned with clear padding.
- Rejects negative signs (amounts are absolute positive numbers; transaction type dictates direction).

```text
Amount
┌──────────────────────────────────────┐
│ ₹                         1,000.00   │
└──────────────────────────────────────┘
```

## 20.3 Form Validation

Validation errors display:
- 1px red input border (`--color-negative`).
- Field-level error message directly below input in `--color-negative` with alert icon.
- Form cannot be submitted while invalid.

---

# 21. Pagination

`pagination-control`

Consumes `PagedResponse<T>` metadata (`page`, `size`, `totalPages`, `totalElements`).

```text
Showing 21–40 of 128 accounts

[< Previous]   Page 2 of 7   [Next >]
```

- Zero-based page parameter is translated to 1-based index for user display.
- Previous disabled on page 1.
- Next disabled on final page.
- Compact, unobtrusive footprint.

---

# 22. Dashboard (Supported Scope)

The dashboard presents data derived strictly from existing Backend v1.0 capabilities.

### Supported Metrics & Actions

Derived from `GET /accounts` pagination metadata (`totalElements`) using status filters:

```text
Dashboard
──────────────────────────────────────────────────────────────────────────

Total Accounts        Active Accounts       Frozen Accounts
124                   117                   5

──────────────────────────────────────────────────────────────────────────
Quick Actions
[+ Create Account]    [Find Account by Number]    [⇄ Initiate Transfer]
──────────────────────────────────────────────────────────────────────────
```

### Future Milestones (Requires Backend Endpoints)
The following metrics require dedicated backend aggregation endpoints and are deferred:
- *System-wide Total Transactions* (requires backend `/stats` or `/metrics` endpoint)
- *Global Recent Transactions Feed* (requires backend global `GET /transactions` endpoint)
- *System Total Deposits / Volume*

*Core Rule:* The frontend must never invent financial statistics or perform client-side polling across all accounts to calculate unexposed metrics.

---

# 23. Historical Balance Reconstruction

`historical-balance-panel`

Consumes `GET /accounts/{accountId}/audit/balance?asOf={timestamp}`.

Allows reconstructing an account's historical balance at any point in time:

```text
Reconstruct Balance As Of
┌──────────────────────────────────────┐
│ 10 Sep 2026, 12:00 UTC               │
└──────────────────────────────────────┘

Reconstructed Balance
₹ 7,500.00
Derived from 3 historical events up to selected timestamp
```

Clearly informs the user that historical balances are derived from event replay, not retrieved from a mutable history table.

---

# 24. Navigation Model

### Level 1: Global Navigation
- **Dashboard**
- **Accounts**

### Level 2: Account Context Navigation
When an account is selected:
- **Overview** (Account metadata, balance card, quick actions)
- **Transactions** (Chronological transaction metadata list)
- **Ledger** (Double-entry debit/credit ledger table)
- **Events** (Raw immutable event stream)
- **Audit Trail** (Full event replay with cumulative running balances)

---

# 25. Iconography

Icons are minimal, geometric, and functional:
- **Account / Institution:** Bank / building / vault icon (`account`)
- **Dashboard:** Grid / gauge icon
- **Deposit:** Arrow-down into tray (inflow)
- **Withdrawal:** Arrow-up out of tray (outflow)
- **Transfer:** Bidirectional exchange arrows
- **Ledger:** Structured document / columns icon
- **Events / Audit:** Clockwise replay / timeline node icon
- **Status Active:** Shield-check or solid circle
- **Status Frozen:** Snowflake or pause circle
- **Status Closed:** Slash circle

---

# 26. Responsive Behavior

| Viewport | Width | Behavior |
|---|---:|---|
| **Mobile** | `<640px` | Single column, top bar drawer, stacked cards, horizontal table scrolling |
| **Tablet** | `640–1024px` | Compressed sidebar, 2-column card layouts, compact tables |
| **Desktop** | `1024–1280px` | Full application shell, full tables |
| **Wide** | `>1280px` | Content capped at 1200px max width |

### Table Overflow Handling
On small viewports, tables never truncate or shrink financial values:
- Container uses `overflow-x: auto` with smooth scrolling.
- Sticky column header (`position: sticky; top: 0`).
- Sticky primary column (Date or Account Number) on left edge during horizontal scroll.

---

# 27. Accessibility Standards

Accessibility is a functional requirement for financial software:

1. **WCAG AA Contrast:** All readable text tokens meet or exceed 4.5:1 contrast against their background.
2. **Color-Independent Meaning:** Transaction direction, account status, and validation states always use explicit text and iconography in addition to color.
3. **Keyboard Navigable:** All buttons, tabs, inputs, and modals are fully operable via `Tab`, `Enter`, `Space`, and `Escape`.
4. **Visible Focus:** Focus rings use `2px solid var(--color-primary)` with subtle offset.
5. **Semantic HTML:** Native `<button>`, `<input>`, `<dialog>`, and `<table>` (`<th>`, `<td>`, `<caption>`) elements.

---

# 28. Financial UI Rules

1. **Never hide financial direction in color alone:** Always pair sign (`+` or `-`) with amounts.
2. **Never imply a balance is a directly editable field:** Balances are displayed as derived calculations.
3. **Immutable records are non-editable:** Events, ledger entries, and completed transactions never show edit controls.
4. **Backend remains authoritative:** Client validation assists the user, but all business invariants (funds eligibility, non-overdraft, double-entry equality) are enforced by backend responses.
5. **Precision over decoration:** If an animation or visual flourish obscures an amount, timestamp, or reference ID, remove it.

---

# 29. Do's and Don'ts

## Do
- Use primary blue strictly for actions and interactive states.
- Use tabular monospace numerals for all financial values.
- Render double-entry Debit and Credit columns with neutral typography.
- Keep table rows compact and dense.
- Maintain WCAG AA contrast on all readable text.
- Present cumulative running balances as derived projections.
- Rely on the backend as the single source of financial truth.

## Don't
- Don't color Debit columns red or Credit columns green in ledger tables.
- Don't treat withdrawals as destructive UI actions.
- Don't invent global transaction statistics on the dashboard that the backend does not expose.
- Don't assume `AccountResponse` contains a balance.
- Don't place edit or delete buttons on historical records.
- Don't use decorative drop shadows on table rows.
- Don't use crypto trading or marketing hero patterns.

---

# 30. Suggested CSS Token Mapping

```css
:root {
  /* Brand & Action */
  --color-primary: #0052ff;
  --color-primary-active: #003ecc;
  --color-primary-disabled: #a8b8cc;
  --color-primary-soft: #e8efff;

  /* Text (All WCAG AA Compliant) */
  --color-ink: #0a0b0d;           /* 18.8:1 contrast on white */
  --color-body: #404550;          /* 8.2:1 contrast on white */
  --color-body-strong: #0a0b0d;   /* 18.8:1 contrast on white */
  --color-muted: #595e68;         /* 5.1:1 contrast on white (WCAG AA) */
  --color-muted-soft: #8c919a;    /* 3.1:1 for borders/disabled */

  /* Surfaces */
  --surface-canvas: #ffffff;
  --surface-soft: #f7f8fa;
  --surface-card: #ffffff;
  --surface-strong: #eef0f3;
  --surface-dark: #0a0b0d;
  --surface-dark-elevated: #16181c;
  --surface-success-soft: #ecfdf5;
  --surface-error-soft: #fef2f2;
  --surface-warning-soft: #fffbeb;
  --surface-info-soft: #eff6ff;

  /* Borders */
  --border-hairline: #dee1e6;
  --border-hairline-soft: #eef0f3;

  /* Semantic States */
  --color-positive-text: #047857; /* 4.7:1 contrast on white (WCAG AA) */
  --color-positive: #05b169;      /* Badge fills / non-text indicators */
  --color-negative: #cf202f;      /* 4.6:1 contrast on white (WCAG AA) */
  --color-warning: #b77900;       /* 4.5:1 contrast on white (WCAG AA) */
  --color-info: #0052ff;

  /* Border Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 100px;
  --radius-full: 9999px;

  /* Spacing */
  --space-xxs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-base: 16px;
  --space-md: 20px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;

  /* Elevation */
  --shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.06);

  /* Fonts */
  --font-ui: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-mono: "JetBrains Mono", "Geist Mono", Consolas, monospace;
}
```

---

# 31. Design System Scope

This document is the **visual contract** for:
- colors and contrast compliance
- typography hierarchy and numerical font rules
- spacing and layout rhythm
- borders and elevation
- navigation structure (Dashboard, Accounts, Account sub-views)
- buttons and modal dialogs
- alert banners and toast notifications
- tables (transactions, ledger, events)
- audit trail timeline representation
- account cards and status badges
- financial value presentation
- accessibility standards

It does **not** define:
- REST API contracts (see `docs/API_GUIDELINES.md`)
- Backend business rules (see `docs/PRD.md`)
- Database schemas (see `docs/DATABASE_DESIGN.md`)
- Frontend application architecture or state management (belongs in `FRONTEND_ARCHITECTURE.md`)
- Project roadmaps (see `docs/PROJECT_ROADMAP.md`)

---

# 32. Implementation Principle

Before introducing a new visual pattern or ad-hoc style during frontend development, verify:
1. Does an existing design token or component already satisfy this?
2. Does it preserve accounting correctness (neutral debits/credits)?
3. Does it communicate that financial history is immutable?
4. Is it supported by an existing Backend v1.0 API?
5. Does it meet WCAG AA contrast standards?

**`docs/DESIGN.md` is the visual source of truth.**
